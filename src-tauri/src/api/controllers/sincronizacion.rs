use axum::{
    extract::State,
    http::HeaderMap,
    Json,
};
use serde_json::json;
use sqlx::SqlitePool;
use crate::api::{ApiResult, db_error, validate_sucursal};
use crate::api::dtos::{SyncPayloadDto, StockPayloadDto, KardexPayloadDto, CajaPayloadDto, CompraPayloadDto, LogPayloadDto};

pub async fn sincronizar_ventas(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<SyncPayloadDto>,
) -> Result<ApiResult, ApiResult> {
    let sucursal_id = validate_sucursal(&headers, &pool).await?;

    if sucursal_id != payload.sucursal_id {
        return Ok((axum::http::StatusCode::FORBIDDEN, Json(json!({ "error": "Llave no coincide con sucursal" }))));
    }

    let mut procesadas = 0;
    for v in payload.ventas {
        // Verificar idempotencia: si ya existe la venta de esta sucursal con este id_local
        let existe = sqlx::query("SELECT id, estado FROM ventas WHERE sucursal_id = ? AND sucursal_local_id = ?")
            .bind(&payload.sucursal_id)
            .bind(v.id_local)
            .fetch_optional(&pool)
            .await
            .map_err(db_error)?;

        if let Some(row) = existe {
            use sqlx::Row;
            let db_estado: String = row.get("estado");
            if db_estado != v.estado {
                let id_central: i32 = row.get("id");
                sqlx::query("UPDATE ventas SET estado = ? WHERE id = ?")
                    .bind(&v.estado)
                    .bind(id_central)
                    .execute(&pool)
                    .await
                    .map_err(db_error)?;
            }
            procesadas += 1;
            continue;
        }

        let res = sqlx::query(
            "INSERT INTO ventas (usuario_id, fecha, total, sucursal_id, sucursal_local_id, estado, sincronizado) VALUES (?, ?, ?, ?, ?, ?, 1)"
        )
        .bind(v.usuario_id)
        .bind(&v.fecha)
        .bind(v.total)
        .bind(&payload.sucursal_id)
        .bind(v.id_local)
        .bind(&v.estado)
        .execute(&pool)
        .await;

        if let Ok(r) = res {
            let venta_id = r.last_insert_rowid();
            for d in v.detalles {
                let prod = sqlx::query("SELECT id FROM productos WHERE codigo_barras = ?")
                    .bind(&d.codigo_barras)
                    .fetch_optional(&pool)
                    .await
                    .map_err(db_error)?;

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

    Ok((axum::http::StatusCode::OK, Json(json!({ 
        "status": "ok", 
        "mensaje": format!("Sincronizadas {} ventas", procesadas) 
    }))))
}

pub async fn update_stock(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<StockPayloadDto>,
) -> Result<ApiResult, ApiResult> {
    let sucursal_id = validate_sucursal(&headers, &pool).await?;

    if sucursal_id != payload.sucursal_id {
        return Ok((axum::http::StatusCode::FORBIDDEN, Json(json!({ "error": "Llave no coincide" }))));
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

    Ok((axum::http::StatusCode::OK, Json(json!({ "status": "ok" }))))
}

pub async fn sincronizar_kardex(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<KardexPayloadDto>,
) -> Result<ApiResult, ApiResult> {
    let sucursal_id = validate_sucursal(&headers, &pool).await?;

    if sucursal_id != payload.sucursal_id {
        return Ok((axum::http::StatusCode::FORBIDDEN, Json(json!({ "error": "Llave no coincide" }))));
    }

    let mut procesados = 0;
    for m in payload.movimientos {
        // Verificar idempotencia: si ya existe el movimiento de esta sucursal con este id_local
        let existe = sqlx::query("SELECT id FROM kardex WHERE sucursal_id = ? AND sucursal_local_id = ?")
            .bind(&payload.sucursal_id)
            .bind(m.id_local)
            .fetch_optional(&pool)
            .await
            .map_err(db_error)?;

        if existe.is_some() {
            procesados += 1;
            continue;
        }

        // Buscar producto por código de barras
        let prod = sqlx::query("SELECT id FROM productos WHERE codigo_barras = ?")
            .bind(&m.producto_codigo_barras)
            .fetch_optional(&pool)
            .await
            .map_err(db_error)?;

        if let Some(p_row) = prod {
            use sqlx::Row;
            let p_id: i32 = p_row.get("id");
            let _ = sqlx::query(
                "INSERT INTO kardex (producto_id, usuario_id, fecha, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia, sucursal_id, sucursal_local_id, sincronizado) \
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)"
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
            .bind(m.id_local)
            .execute(&pool)
            .await;
            procesados += 1;
        }
    }

    Ok((axum::http::StatusCode::OK, Json(json!({ "status": "ok", "procesados": procesados }))))
}

pub async fn sincronizar_cajas(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<CajaPayloadDto>,
) -> Result<ApiResult, ApiResult> {
    let sucursal_id = validate_sucursal(&headers, &pool).await?;

    if sucursal_id != payload.sucursal_id {
        return Ok((axum::http::StatusCode::FORBIDDEN, Json(json!({ "error": "Llave no coincide con sucursal" }))));
    }

    let mut procesadas = 0;
    for c in payload.cajas {
        // Verificar idempotencia: si ya existe la caja de esta sucursal con este id_local
        let existe = sqlx::query("SELECT id FROM cajas WHERE sucursal_id = ? AND sucursal_local_id = ?")
            .bind(&payload.sucursal_id)
            .bind(c.id_local)
            .fetch_optional(&pool)
            .await
            .map_err(db_error)?;

        if existe.is_some() {
            procesadas += 1;
            continue;
        }

        let res = sqlx::query(
            "INSERT INTO cajas (usuario_id, monto_inicial, monto_final, monto_esperado, fecha_apertura, fecha_cierre, estado, sucursal_id, sucursal_local_id, sincronizado) \
             VALUES (?, ?, ?, ?, ?, ?, 'cerrada', ?, ?, 1)"
        )
        .bind(c.usuario_id)
        .bind(c.monto_inicial)
        .bind(c.monto_final)
        .bind(c.monto_esperado)
        .bind(&c.fecha_apertura)
        .bind(&c.fecha_cierre)
        .bind(&payload.sucursal_id)
        .bind(c.id_local)
        .execute(&pool)
        .await;

        if res.is_ok() {
            procesadas += 1;
        }
    }

    Ok((
        axum::http::StatusCode::OK,
        Json(json!({
            "status": "ok",
            "mensaje": format!("Sincronización de cajas exitosa: {} procesadas", procesadas),
            "procesadas": procesadas
        })),
    ))
}

pub async fn sincronizar_compras(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<CompraPayloadDto>,
) -> Result<ApiResult, ApiResult> {
    let sucursal_id = validate_sucursal(&headers, &pool).await?;

    if sucursal_id != payload.sucursal_id {
        return Ok((axum::http::StatusCode::FORBIDDEN, Json(json!({ "error": "Llave no coincide con sucursal" }))));
    }

    let mut procesadas = 0;
    for c in payload.compras {
        // Verificar idempotencia: si ya existe la compra de esta sucursal con este id_local
        let existe = sqlx::query("SELECT id, estado FROM compras_ingresos WHERE sucursal_id = ? AND sucursal_local_id = ?")
            .bind(&payload.sucursal_id)
            .bind(c.id_local)
            .fetch_optional(&pool)
            .await
            .map_err(db_error)?;

        if let Some(row) = existe {
            use sqlx::Row;
            let db_estado: String = row.get("estado");
            if db_estado != c.estado {
                let id_central: i32 = row.get("id");
                sqlx::query("UPDATE compras_ingresos SET estado = ? WHERE id = ?")
                    .bind(&c.estado)
                    .bind(id_central)
                    .execute(&pool)
                    .await
                    .map_err(db_error)?;
            }
            procesadas += 1;
            continue;
        }

        let res = sqlx::query(
            "INSERT INTO compras_ingresos (usuario_id, fecha, documento_referencia, total, sucursal_id, sucursal_local_id, metodo_pago, estado, sincronizado) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)"
        )
        .bind(c.usuario_id)
        .bind(&c.fecha)
        .bind(&c.documento_referencia)
        .bind(c.total)
        .bind(&payload.sucursal_id)
        .bind(c.id_local)
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
                    .map_err(db_error)?;

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

    Ok((
        axum::http::StatusCode::OK,
        Json(json!({
            "status": "ok",
            "mensaje": format!("Sincronización de compras exitosa: {} procesadas", procesadas),
            "procesadas": procesadas
        })),
    ))
}

pub async fn sincronizar_logs(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<LogPayloadDto>,
) -> Result<ApiResult, ApiResult> {
    let sucursal_id = validate_sucursal(&headers, &pool).await?;

    if sucursal_id != payload.sucursal_id {
        return Ok((axum::http::StatusCode::FORBIDDEN, Json(json!({ "error": "Llave no coincide con sucursal" }))));
    }

    let mut procesados = 0;
    for log in payload.logs {
        // Idempotencia: si ya existe el log de esta sucursal con este id_local, lo omitimos
        let existe = sqlx::query("SELECT id FROM logs WHERE sucursal_id = ? AND sucursal_local_id = ?")
            .bind(&payload.sucursal_id)
            .bind(log.id_local)
            .fetch_optional(&pool)
            .await
            .map_err(db_error)?;

        if existe.is_some() {
            procesados += 1;
            continue;
        }

        let res = sqlx::query(
            "INSERT INTO logs (usuario_id, sucursal_id, sucursal_local_id, accion, tabla, registro_id, detalles, sincronizado, created_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)"
        )
        .bind(log.usuario_id)
        .bind(&payload.sucursal_id)
        .bind(log.id_local)
        .bind(&log.accion)
        .bind(&log.tabla)
        .bind(log.registro_id)
        .bind(&log.detalles)
        .bind(&log.created_at)
        .execute(&pool)
        .await;

        if res.is_ok() {
            procesados += 1;
        }
    }

    Ok((
        axum::http::StatusCode::OK,
        Json(json!({
            "status": "ok",
            "mensaje": format!("{} logs de auditoría sincronizados", procesados),
            "procesados": procesados
        })),
    ))
}
