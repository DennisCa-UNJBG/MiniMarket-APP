use axum::{
    extract::State,
    http::HeaderMap,
    Json,
};
use serde_json::json;
use sqlx::SqlitePool;
use crate::api::{ApiResult, db_error, validate_sucursal};
use crate::api::dtos::{UnidadMedidaCrearDto, UnidadMedidaEditarDto};

pub async fn get_unidades_medida(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
) -> Result<ApiResult, ApiResult> {
    let _sucursal_id = validate_sucursal(&headers, &pool).await?;

    let unidades = sqlx::query("SELECT id, nombre, abreviatura, estado FROM unidades_medida")
        .fetch_all(&pool)
        .await
        .map_err(db_error)?;

    let mut data = Vec::new();
    for u in unidades {
        use sqlx::Row;
        data.push(json!({
            "id": u.get::<i32, _>("id"),
            "nombre": u.get::<String, _>("nombre"),
            "abreviatura": u.get::<String, _>("abreviatura"),
            "estado": u.get::<String, _>("estado"),
        }));
    }

    Ok((axum::http::StatusCode::OK, Json(json!({ "status": "ok", "data": data }))))
}

pub async fn crear_unidad_medida(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<UnidadMedidaCrearDto>,
) -> Result<ApiResult, ApiResult> {
    let _sucursal_id = validate_sucursal(&headers, &pool).await?;

    if payload.nombre.trim().is_empty() || payload.abreviatura.trim().is_empty() {
        return Ok((axum::http::StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre y la abreviatura son requeridos" }))));
    }

    let unit_existente = sqlx::query("SELECT id FROM unidades_medida WHERE LOWER(nombre) = LOWER(?) OR LOWER(abreviatura) = LOWER(?)")
        .bind(&payload.nombre)
        .bind(&payload.abreviatura)
        .fetch_optional(&pool)
        .await
        .map_err(db_error)?;

    if unit_existente.is_some() {
        return Ok((axum::http::StatusCode::CONFLICT, Json(json!({ "error": "La unidad de medida o abreviatura ya existe en la central" }))));
    }

    let res = sqlx::query("INSERT INTO unidades_medida (nombre, abreviatura, estado) VALUES (?, ?, 'activo')")
        .bind(&payload.nombre)
        .bind(&payload.abreviatura)
        .execute(&pool)
        .await;

    match res {
        Ok(r) => {
            let unit_id = r.last_insert_rowid();
            Ok((
                axum::http::StatusCode::CREATED,
                Json(json!({
                    "status": "ok",
                    "data": {
                        "id": unit_id,
                        "nombre": payload.nombre,
                        "abreviatura": payload.abreviatura,
                        "estado": "activo"
                    }
                })),
            ))
        }
        Err(e) => Err(db_error(e)),
    }
}

pub async fn verificar_editar_unidad_medida(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<UnidadMedidaEditarDto>,
) -> Result<ApiResult, ApiResult> {
    let _sucursal_id = validate_sucursal(&headers, &pool).await?;

    // Validar que el nombre y abreviatura no estén vacíos
    if payload.nombre.trim().is_empty() || payload.abreviatura.trim().is_empty() {
        return Ok((axum::http::StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre y abreviatura son requeridos" }))));
    }

    // Actualizar unidad de medida en la central
    let res = sqlx::query("UPDATE unidades_medida SET nombre = ?, abreviatura = ? WHERE id = ?")
        .bind(&payload.nombre)
        .bind(&payload.abreviatura)
        .bind(payload.id)
        .execute(&pool)
        .await;

    match res {
        Ok(r) => {
            if r.rows_affected() == 0 {
                Ok((axum::http::StatusCode::NOT_FOUND, Json(json!({ "error": "Unidad de medida no encontrada en el servidor central" }))))
            } else {
                Ok((
                    axum::http::StatusCode::OK,
                    Json(json!({
                        "status": "ok",
                        "mensaje": "Unidad de medida actualizada exitosamente en la sede central"
                    })),
                ))
            }
        }
        Err(e) => Err(db_error(e)),
    }
}
