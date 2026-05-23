use axum::{
    extract::State,
    http::HeaderMap,
    Json,
};
use serde_json::json;
use sqlx::SqlitePool;
use crate::api::{ApiResult, db_error, validate_sucursal};
use crate::api::dtos::{CategoriaCrearDto, CategoriaEditarDto};

pub async fn crear_categoria(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<CategoriaCrearDto>,
) -> Result<ApiResult, ApiResult> {
    let _sucursal_id = validate_sucursal(&headers, &pool).await?;

    if payload.nombre.trim().is_empty() {
        return Ok((axum::http::StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre de la categoría es requerido" }))));
    }

    let cat_existente = sqlx::query("SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?)")
        .bind(&payload.nombre)
        .fetch_optional(&pool)
        .await
        .map_err(db_error)?;

    if cat_existente.is_some() {
        return Ok((axum::http::StatusCode::CONFLICT, Json(json!({ "error": "La categoría ya existe en la central" }))));
    }

    let res = sqlx::query("INSERT INTO categorias (nombre, color, estado) VALUES (?, ?, 'activo')")
        .bind(&payload.nombre)
        .bind(&payload.color)
        .execute(&pool)
        .await;

    match res {
        Ok(r) => {
            let cat_id = r.last_insert_rowid();
            Ok((
                axum::http::StatusCode::CREATED,
                Json(json!({
                    "status": "ok",
                    "data": {
                        "id": cat_id,
                        "nombre": payload.nombre,
                        "color": payload.color,
                        "estado": "activo"
                    }
                })),
            ))
        }
        Err(e) => Err(db_error(e)),
    }
}

pub async fn verificar_editar_categoria(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<CategoriaEditarDto>,
) -> Result<ApiResult, ApiResult> {
    let _sucursal_id = validate_sucursal(&headers, &pool).await?;

    // Validar que el nombre no esté vacío
    if payload.nombre.trim().is_empty() {
        return Ok((axum::http::StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre de la categoría es requerido" }))));
    }

    // Actualizar categoría en la central
    let res = sqlx::query("UPDATE categorias SET nombre = ?, color = ? WHERE id = ?")
        .bind(&payload.nombre)
        .bind(&payload.color)
        .bind(payload.id)
        .execute(&pool)
        .await;

    match res {
        Ok(r) => {
            if r.rows_affected() == 0 {
                Ok((axum::http::StatusCode::NOT_FOUND, Json(json!({ "error": "Categoría no encontrada en el servidor central" }))))
            } else {
                Ok((
                    axum::http::StatusCode::OK,
                    Json(json!({
                        "status": "ok",
                        "mensaje": "Categoría actualizada exitosamente en la sede central"
                    })),
                ))
            }
        }
        Err(e) => Err(db_error(e)),
    }
}
