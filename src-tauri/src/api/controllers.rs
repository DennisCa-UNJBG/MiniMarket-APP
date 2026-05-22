use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use sqlx::SqlitePool;
use crate::api::dtos::{SyncPayloadDto, StockPayloadDto, KardexPayloadDto, ProductoCrearDto, CajaPayloadDto, CompraPayloadDto};

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

    // Validar que el nombre no esté vacío
    if payload.nombre.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre del producto es requerido" })));
    }

    // Generar código de barras secuencial en la central
    // Formato: PROD-XXXX (mismo formato que usa la sede central en el frontend)
    // Buscar el último código PROD- y extraer su número para incrementar
    let ultimo_cod = sqlx::query(
        "SELECT codigo_barras FROM productos \
         WHERE codigo_barras LIKE 'PROD-%' \
         ORDER BY CAST(SUBSTR(codigo_barras, 6) AS INTEGER) DESC \
         LIMIT 1"
    )
    .fetch_optional(&pool)
    .await
    .unwrap();

    let siguiente_num = if let Some(row) = ultimo_cod {
        use sqlx::Row;
        let last: String = row.get("codigo_barras");
        // Extraer la parte numérica después de "PROD-"
        let num_str = last.trim_start_matches("PROD-");
        num_str.parse::<u64>().unwrap_or(0) + 1
    } else {
        1
    };

    // Formatear con ceros a la izquierda (mínimo 4 dígitos)
    let codigo_barras = format!("PROD-{:04}", siguiente_num);

    // Resolver o crear categoría por nombre
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
                // Crear categoría si no existe en la central
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

    // Resolver o crear unidad de medida por nombre/abreviatura
    let mut unidad_id_central: Option<i32> = None;
    if let Some(u_nombre) = &payload.unidad_nombre {
        if !u_nombre.trim().is_empty() {
            // Buscar primero por nombre exacto (case-insensitive)
            let u_res = sqlx::query(
                "SELECT id FROM unidades_medida WHERE LOWER(nombre) = LOWER(?) OR LOWER(abreviatura) = LOWER(?)"
            )
            .bind(u_nombre)
            .bind(payload.unidad_abreviatura.as_deref().unwrap_or(u_nombre))
            .fetch_optional(&pool)
            .await
            .unwrap();

            if let Some(u_row) = u_res {
                use sqlx::Row;
                unidad_id_central = Some(u_row.get("id"));
            } else {
                // Crear unidad de medida si no existe en la central
                let abrev = payload.unidad_abreviatura.as_deref().unwrap_or(u_nombre);
                let ins_u = sqlx::query(
                    "INSERT INTO unidades_medida (nombre, abreviatura) VALUES (?, ?)"
                )
                .bind(u_nombre)
                .bind(abrev)
                .execute(&pool)
                .await;
                if let Ok(r) = ins_u {
                    unidad_id_central = Some(r.last_insert_rowid() as i32);
                }
            }
        }
    }

    // Insertar el producto en la central
    let res = sqlx::query(
        "INSERT INTO productos (codigo_barras, nombre, categoria_id, unidad_id, stock_minimo, estado) \
         VALUES (?, ?, ?, ?, ?, 'activo')"
    )
    .bind(&codigo_barras)
    .bind(&payload.nombre)
    .bind(categoria_id)
    .bind(unidad_id_central)
    .bind(payload.stock_minimo)
    .execute(&pool)
    .await;

    match res {
        Ok(r) => {
            let prod_id = r.last_insert_rowid();

            // Insertar precio inicial si aplica
            if payload.precio_venta > 0.0 || payload.precio_compra > 0.0 {
                let _ = sqlx::query(
                    "INSERT INTO precios_historial (producto_id, precio_compra, precio_venta, activo) \
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
                    "codigo_barras": codigo_barras,
                    "nombre": payload.nombre,
                    "mensaje": "Producto creado exitosamente en la sede central"
                })),
            )
        }
        Err(e) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("Error al guardar producto en la central: {}", e) })),
            )
        }
    }
}

pub async fn sincronizar_cajas(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<CajaPayloadDto>,
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
        return (StatusCode::FORBIDDEN, Json(json!({ "error": "Sucursal no autorizada o inactiva" })));
    }

    let mut procesadas = 0;
    for c in payload.cajas {
        let res = sqlx::query(
            "INSERT INTO cajas (usuario_id, monto_inicial, monto_final, monto_esperado, fecha_apertura, fecha_cierre, estado, sucursal_id, sincronizado) 
             VALUES (?, ?, ?, ?, ?, ?, 'cerrada', ?, 1)"
        )
        .bind(c.usuario_id)
        .bind(c.monto_inicial)
        .bind(c.monto_final)
        .bind(c.monto_esperado)
        .bind(&c.fecha_apertura)
        .bind(&c.fecha_cierre)
        .bind(&payload.sucursal_id)
        .execute(&pool)
        .await;

        if res.is_ok() {
            procesadas += 1;
        }
    }

    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "mensaje": format!("Sincronización de cajas exitosa: {} procesadas", procesadas),
            "procesadas": procesadas
        })),
    )
}

pub async fn sincronizar_compras(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<CompraPayloadDto>,
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
        return (StatusCode::FORBIDDEN, Json(json!({ "error": "Sucursal no autorizada o inactiva" })));
    }

    let mut procesadas = 0;
    for c in payload.compras {
        let res = sqlx::query(
            "INSERT INTO compras_ingresos (usuario_id, fecha, documento_referencia, total, sucursal_id, metodo_pago, estado, sincronizado) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
        )
        .bind(c.usuario_id)
        .bind(&c.fecha)
        .bind(&c.documento_referencia)
        .bind(c.total)
        .bind(&payload.sucursal_id)
        .bind(&c.metodo_pago)
        .bind(&c.estado)
        .execute(&pool)
        .await;

        if let Ok(r) = res {
            let compra_id = r.last_insert_rowid();
            for d in c.detalles {
                let prod = sqlx::query("SELECT id FROM productos WHERE codigo_barras = ?")
                    .bind(&d.codigo_barras)
                    .fetch_optional(&pool)
                    .await
                    .unwrap();

                if let Some(p_row) = prod {
                    use sqlx::Row;
                    let p_id: i32 = p_row.get("id");
                    let _ = sqlx::query(
                        "INSERT INTO compras_detalle (compra_id, producto_id, cantidad, costo_unitario, subtotal) VALUES (?, ?, ?, ?, ?)"
                    )
                    .bind(compra_id)
                    .bind(p_id)
                    .bind(d.cantidad)
                    .bind(d.costo_unitario)
                    .bind(d.subtotal)
                    .execute(&pool)
                    .await;
                }
            }
            procesadas += 1;
        }
    }

    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "mensaje": format!("Sincronización de compras exitosa: {} procesadas", procesadas),
            "procesadas": procesadas
        })),
    )
}
