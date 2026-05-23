use axum::{
    extract::State,
    http::HeaderMap,
    Json,
};
use serde_json::json;
use sqlx::SqlitePool;
use crate::api::{ApiResult, db_error, validate_sucursal};
use crate::api::dtos::{ProductoCrearDto, ProductoEditarDto};

pub async fn get_productos(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
) -> Result<ApiResult, ApiResult> {
    let _sucursal_id = validate_sucursal(&headers, &pool).await?;

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
    .map_err(db_error)?;

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

    Ok((axum::http::StatusCode::OK, Json(json!({ 
        "status": "ok", 
        "count": data.len(),
        "data": data 
    }))))
}

pub async fn verificar_crear_producto(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<ProductoCrearDto>,
) -> Result<ApiResult, ApiResult> {
    let _sucursal_id = validate_sucursal(&headers, &pool).await?;

    // Validar que el nombre no esté vacío
    if payload.nombre.trim().is_empty() {
        return Ok((axum::http::StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre del producto es requerido" }))));
    }

    let categoria_id = payload.categoria_id;
    let unidad_id_central = payload.unidad_id;

    let mut retries = 0;
    let mut codigo_barras;
    let res;

    loop {
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
        .map_err(db_error)?;

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
        codigo_barras = format!("PROD-{:04}", siguiente_num);

        // Insertar el producto en la central
        let insert_res = sqlx::query(
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

        match insert_res {
            Err(sqlx::Error::Database(err)) => {
                if err.is_unique_violation() {
                    retries += 1;
                    if retries > 5 {
                        return Err((
                            axum::http::StatusCode::CONFLICT,
                            Json(json!({ "error": "No se pudo generar un código de barras único después de varios intentos" }))
                        ));
                    }
                    continue;
                } else {
                    res = Err(sqlx::Error::Database(err));
                    break;
                }
            }
            other => {
                res = other;
                break;
            }
        }
    }

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

            Ok((
                axum::http::StatusCode::CREATED,
                Json(json!({
                    "status": "ok",
                    "id": prod_id,
                    "codigo_barras": codigo_barras,
                    "nombre": payload.nombre,
                    "mensaje": "Producto creado exitosamente en la sede central"
                })),
            ))
        }
        Err(e) => Err(db_error(e)),
    }
}

pub async fn verificar_editar_producto(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<ProductoEditarDto>,
) -> Result<ApiResult, ApiResult> {
    let _sucursal_id = validate_sucursal(&headers, &pool).await?;

    // Buscar producto por código de barras
    let prod = sqlx::query("SELECT id FROM productos WHERE codigo_barras = ?")
        .bind(&payload.codigo_barras)
        .fetch_optional(&pool)
        .await
        .map_err(db_error)?;

    let producto_id = match prod {
        Some(row) => {
            use sqlx::Row;
            row.get::<i32, _>("id")
        }
        None => {
            return Ok((axum::http::StatusCode::NOT_FOUND, Json(json!({ "error": "Producto no encontrado en el servidor central" }))));
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
    .map_err(db_error)?;

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
        return Err(db_error(e));
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

    Ok((
        axum::http::StatusCode::OK,
        Json(json!({
            "status": "ok",
            "mensaje": "Producto actualizado exitosamente en la sede central"
        })),
    ))
}
