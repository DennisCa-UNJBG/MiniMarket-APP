use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use sqlx::SqlitePool;
use crate::api::dtos::{ProductoCrearDto, ProductoEditarDto};

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
        "SELECT p.codigo_barras, p.nombre, p.stock_minimo, 
                c.nombre as categoria_nombre,
                u.nombre as unidad_nombre, u.abreviatura as unidad_abreviatura,
                ph.precio_venta, ph.precio_compra
         FROM productos p 
         LEFT JOIN categorias c ON p.categoria_id = c.id 
         LEFT JOIN unidades_medida u ON p.unidad_id = u.id
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
            "unidad_nombre": p.get::<Option<String>, _>("unidad_nombre"),
            "unidad_abreviatura": p.get::<Option<String>, _>("unidad_abreviatura"),
            "unidad_medida": p.get::<Option<String>, _>("unidad_abreviatura"),
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

    let categoria_id = payload.categoria_id;
    let unidad_id_central = payload.unidad_id;

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

pub async fn verificar_editar_producto(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<ProductoEditarDto>,
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

    // Buscar producto por código de barras
    let prod = sqlx::query("SELECT id FROM productos WHERE codigo_barras = ?")
        .bind(&payload.codigo_barras)
        .fetch_optional(&pool)
        .await
        .unwrap();

    let producto_id = match prod {
        Some(row) => {
            use sqlx::Row;
            row.get::<i32, _>("id")
        }
        None => {
            return (StatusCode::NOT_FOUND, Json(json!({ "error": "Producto no encontrado en el servidor central" })));
        }
    };

    let categoria_id = payload.categoria_id;
    let unidad_id_central = payload.unidad_id;

    // Obtener precios anteriores para ver si cambiaron
    let old_price = sqlx::query(
        "SELECT precio_venta, precio_compra FROM precios_historial WHERE producto_id = ? AND activo = 1"
    )
    .bind(producto_id)
    .fetch_optional(&pool)
    .await
    .unwrap();

    let mut old_venta = 0.0;
    let mut old_compra = 0.0;
    if let Some(row) = old_price {
        use sqlx::Row;
        old_venta = row.get::<f64, _>("precio_venta");
        old_compra = row.get::<f64, _>("precio_compra");
    }

    // Actualizar el producto en la central
    let res = sqlx::query(
        "UPDATE productos SET nombre = ?, categoria_id = ?, unidad_id = ?, stock_minimo = ? \
         WHERE id = ?"
    )
    .bind(&payload.nombre)
    .bind(categoria_id)
    .bind(unidad_id_central)
    .bind(payload.stock_minimo)
    .bind(producto_id)
    .execute(&pool)
    .await;

    if let Err(e) = res {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Error al actualizar producto en la central: {}", e) })));
    }

    // Actualizar precios si variaron
    if payload.precio_venta != old_venta || payload.precio_compra != old_compra {
        // Desactivar precios anteriores
        let _ = sqlx::query("UPDATE precios_historial SET activo = 0 WHERE producto_id = ?")
            .bind(producto_id)
            .execute(&pool)
            .await;
        // Insertar nuevo precio
        let _ = sqlx::query(
            "INSERT INTO precios_historial (producto_id, precio_compra, precio_venta, activo) \
             VALUES (?, ?, ?, 1)"
        )
        .bind(producto_id)
        .bind(payload.precio_compra)
        .bind(payload.precio_venta)
        .execute(&pool)
        .await;
    }

    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "mensaje": "Producto actualizado exitosamente en la sede central"
        })),
    )
}
