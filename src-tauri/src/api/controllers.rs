use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use sqlx::SqlitePool;
use crate::api::dtos::{SyncPayloadDto, StockPayloadDto, KardexPayloadDto, ProductoCrearDto};

pub async fn get_productos(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
) -> (StatusCode, Json<Value>) {
    let sucursal_id = headers.get("X-Sucursal-Key")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    if sucursal_id.is_empty() {
        return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "Código de sucursal requerido" })));
    }

    let row = sqlx::query("SELECT id FROM sucursales WHERE codigo = ? AND estado = 'activo'")
        .bind(sucursal_id)
        .fetch_optional(&pool)
        .await
        .unwrap();

    if row.is_none() {
        return (StatusCode::FORBIDDEN, Json(json!({ "error": "Sucursal no autorizada o código inválido" })));
    }

    let productos = sqlx::query(
        "SELECT p.codigo_barras, p.nombre, p.unidad_medida, p.stock_minimo, 
                c.nombre as categoria_nombre, ph.precio_venta, ph.precio_compra
         FROM productos p 
         LEFT JOIN categorias c ON p.categoria_id = c.id 
         LEFT JOIN precios_historial ph ON p.id = ph.producto_id AND ph.activo = 1
         WHERE p.estado = 'activo'"
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    let mut data = Vec::new();
    for p in productos {
        use sqlx::Row;
        data.push(json!({
            "codigo_barras": p.get::<Option<String>, _>("codigo_barras"),
            "nombre": p.get::<String, _>("nombre"),
            "unidad_medida": p.get::<Option<String>, _>("unidad_medida"),
            "stock_minimo": p.get::<f64, _>("stock_minimo"),
            "categoria": p.get::<Option<String>, _>("categoria_nombre"),
            "precio_venta": p.get::<Option<f64>, _>("precio_venta"),
            "precio_compra": p.get::<Option<f64>, _>("precio_compra"),
        }));
    }

    (StatusCode::OK, Json(json!({ 
        "status": "ok", 
        "count": data.len(),
        "data": data 
    })))
}

pub async fn get_usuarios(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
) -> (StatusCode, Json<Value>) {
    let sucursal_id = headers.get("X-Sucursal-Key")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    if sucursal_id.is_empty() {
        return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "Llave requerida" })));
    }

    let usuarios = sqlx::query(
        "SELECT id, username, password_hash, nombre_completo, rol_id, estado FROM usuarios"
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    let mut data = Vec::new();
    for u in usuarios {
        use sqlx::Row;
        data.push(json!({
            "id": u.get::<i32, _>("id"),
            "username": u.get::<String, _>("username"),
            "password_hash": u.get::<String, _>("password_hash"),
            "nombre_completo": u.get::<String, _>("nombre_completo"),
            "rol_id": u.get::<i32, _>("rol_id"),
            "estado": u.get::<String, _>("estado"),
        }));
    }

    (StatusCode::OK, Json(json!({ "status": "ok", "data": data })))
}

pub async fn sincronizar_ventas(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<SyncPayloadDto>,
) -> (StatusCode, Json<Value>) {
    let auth_key = headers.get("X-Sucursal-Key")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    if auth_key != payload.sucursal_id {
        return (StatusCode::FORBIDDEN, Json(json!({ "error": "Llave no coincide con sucursal" })));
    }

    let sucursal = sqlx::query("SELECT id FROM sucursales WHERE codigo = ? AND estado = 'activo'")
        .bind(&payload.sucursal_id)
        .fetch_optional(&pool)
        .await
        .unwrap();

    if sucursal.is_none() {
        return (StatusCode::FORBIDDEN, Json(json!({ "error": "Sucursal no autorizada" })));
    }

    let mut procesadas = 0;
    for v in payload.ventas {
        let res = sqlx::query(
            "INSERT INTO ventas (usuario_id, fecha, total, sucursal_id, sincronizado) VALUES (?, ?, ?, ?, 1)"
        )
        .bind(v.usuario_id)
        .bind(&v.fecha)
        .bind(v.total)
        .bind(&payload.sucursal_id)
        .execute(&pool)
        .await;

        if let Ok(r) = res {
            let venta_id = r.last_insert_rowid();
            for d in v.detalles {
                let prod = sqlx::query("SELECT id FROM productos WHERE codigo_barras = ?")
                    .bind(&d.codigo_barras)
                    .fetch_optional(&pool)
                    .await
                    .unwrap();

                if let Some(p_row) = prod {
                    use sqlx::Row;
                    let p_id: i32 = p_row.get("id");
                    let _ = sqlx::query(
                        "INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)"
                    )
                    .bind(venta_id)
                    .bind(p_id)
                    .bind(d.cantidad)
                    .bind(d.precio_unitario)
                    .bind(d.subtotal)
                    .execute(&pool)
                    .await;
                }
            }
            procesadas += 1;
        }
    }

    let _ = sqlx::query("UPDATE sucursales SET ultima_sincronizacion = CURRENT_TIMESTAMP WHERE codigo = ?")
        .bind(&payload.sucursal_id)
        .execute(&pool)
        .await;

    (StatusCode::OK, Json(json!({ 
        "status": "ok", 
        "mensaje": format!("Sincronizadas {} ventas", procesadas) 
    })))
}

pub async fn update_stock(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<StockPayloadDto>,
) -> (StatusCode, Json<Value>) {
    let auth_key = headers.get("X-Sucursal-Key")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    if auth_key != payload.sucursal_id {
        return (StatusCode::FORBIDDEN, Json(json!({ "error": "Llave no coincide" })));
    }

    // 1. Persistir el stock de cada producto reportado
    for item in payload.inventario {
        let _ = sqlx::query(
            "INSERT INTO sucursales_stock (sucursal_id, codigo_barras, stock, ultima_actualizacion) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(sucursal_id, codigo_barras) DO UPDATE SET 
                stock = excluded.stock, 
                ultima_actualizacion = CURRENT_TIMESTAMP"
        )
        .bind(&payload.sucursal_id)
        .bind(&item.codigo_barras)
        .bind(item.stock_actual)
        .execute(&pool)
        .await;
    }

    // 2. Actualizar metadatos de la sucursal
    let _ = sqlx::query("UPDATE sucursales SET ultima_sincronizacion = CURRENT_TIMESTAMP WHERE codigo = ?")
        .bind(&payload.sucursal_id)
        .execute(&pool)
        .await;

    (StatusCode::OK, Json(json!({ "status": "ok" })))
}

pub async fn sincronizar_kardex(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<KardexPayloadDto>,
) -> (StatusCode, Json<Value>) {
    let auth_key = headers.get("X-Sucursal-Key").and_then(|h| h.to_str().ok()).unwrap_or("");
    if auth_key != payload.sucursal_id {
        return (StatusCode::FORBIDDEN, Json(json!({ "error": "Llave no coincide" })));
    }

    let mut procesados = 0;
    for m in payload.movimientos {
        // Buscar producto por código de barras
        let prod = sqlx::query("SELECT id FROM productos WHERE codigo_barras = ?")
            .bind(&m.producto_codigo_barras)
            .fetch_optional(&pool)
            .await
            .unwrap();

        if let Some(p_row) = prod {
            use sqlx::Row;
            let p_id: i32 = p_row.get("id");
            let _ = sqlx::query(
                "INSERT INTO kardex (producto_id, usuario_id, fecha, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia, sucursal_id, sincronizado) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)"
            )
            .bind(p_id)
            .bind(m.usuario_id)
            .bind(&m.fecha)
            .bind(&m.tipo_movimiento)
            .bind(m.cantidad)
            .bind(m.saldo_posterior)
            .bind(m.costo_unitario)
            .bind(&m.referencia)
            .bind(&payload.sucursal_id)
            .execute(&pool)
            .await;
            procesados += 1;
        }
    }

    (StatusCode::OK, Json(json!({ "status": "ok", "procesados": procesados })))
}

pub async fn verificar_crear_producto(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<ProductoCrearDto>,
) -> (StatusCode, Json<Value>) {
    let sucursal_id = headers.get("X-Sucursal-Key")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    if sucursal_id.is_empty() {
        return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "Llave de sucursal requerida" })));
    }

    // Validar sucursal activa
    let sucursal = sqlx::query("SELECT id FROM sucursales WHERE codigo = ? AND estado = 'activo'")
        .bind(sucursal_id)
        .fetch_optional(&pool)
        .await
        .unwrap();

    if sucursal.is_none() {
        return (StatusCode::FORBIDDEN, Json(json!({ "error": "Sucursal no autorizada o inactiva" })));
    }

    // Verificar si ya existe el código de barras
    let prod_existente = sqlx::query("SELECT nombre FROM productos WHERE codigo_barras = ?")
        .bind(&payload.codigo_barras)
        .fetch_optional(&pool)
        .await
        .unwrap();

    if let Some(row) = prod_existente {
        use sqlx::Row;
        let nombre_existente: String = row.get("nombre");
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "El código de barras ya está registrado en la central",
                "producto": {
                    "nombre": nombre_existente
                }
            })),
        );
    }

    // Resolver categoría en la central
    let mut categoria_id: Option<i32> = None;
    if let Some(cat_nombre) = &payload.categoria_nombre {
        if !cat_nombre.trim().is_empty() {
            let cat_res = sqlx::query("SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?)")
                .bind(cat_nombre)
                .fetch_optional(&pool)
                .await
                .unwrap();

            if let Some(cat_row) = cat_res {
                use sqlx::Row;
                categoria_id = Some(cat_row.get("id"));
            } else {
                // Crear categoría si no existe
                let ins_cat = sqlx::query("INSERT INTO categorias (nombre, color) VALUES (?, '#6366f1')")
                    .bind(cat_nombre)
                    .execute(&pool)
                    .await;
                if let Ok(r) = ins_cat {
                    categoria_id = Some(r.last_insert_rowid() as i32);
                }
            }
        }
    }

    // Resolver unidad de medida si viene como unidad_id
    // Nota: Aunque payload tenga unidad_id, en la central podemos guardar el nombre o abreviatura
    let mut unidad_txt: Option<String> = None;
    if let Some(uid) = payload.unidad_id {
        let u_res = sqlx::query("SELECT abreviatura FROM unidades_medida WHERE id = ?")
            .bind(uid)
            .fetch_optional(&pool)
            .await
            .unwrap();
        if let Some(u_row) = u_res {
            use sqlx::Row;
            unidad_txt = Some(u_row.get("abreviatura"));
        }
    }

    // Insertar producto
    let res = sqlx::query(
        "INSERT INTO productos (codigo_barras, nombre, categoria_id, unidad_medida, stock_minimo, estado) 
         VALUES (?, ?, ?, ?, ?, 'activo')"
    )
    .bind(&payload.codigo_barras)
    .bind(&payload.nombre)
    .bind(categoria_id)
    .bind(unidad_txt)
    .bind(payload.stock_minimo)
    .execute(&pool)
    .await;

    match res {
        Ok(r) => {
            let prod_id = r.last_insert_rowid();

            // Insertar precio inicial si aplica
            if payload.precio_venta > 0.0 || payload.precio_compra > 0.0 {
                let _ = sqlx::query(
                    "INSERT INTO precios_historial (producto_id, precio_compra, precio_venta, activo) 
                     VALUES (?, ?, ?, 1)"
                )
                .bind(prod_id)
                .bind(payload.precio_compra)
                .bind(payload.precio_venta)
                .execute(&pool)
                .await;
            }

            (
                StatusCode::CREATED,
                Json(json!({
                    "status": "ok",
                    "id": prod_id,
                    "codigo_barras": payload.codigo_barras,
                    "nombre": payload.nombre
                })),
            )
        }
        Err(e) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("Error al guardar producto: {}", e) })),
            )
        }
    }
}
