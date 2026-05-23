use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use sqlx::SqlitePool;
use crate::api::dtos::{CategoriaCrearDto, CategoriaEditarDto};

pub async fn crear_categoria(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<CategoriaCrearDto>,
) -> (StatusCode, Json<Value>) {
    let sucursal_id = headers.get("X-Sucursal-Key").and_then(|h| h.to_str().ok()).unwrap_or("");
    if sucursal_id.is_empty() {
        return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "Llave de sucursal requerida" })));
    }

    if payload.nombre.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre de la categoría es requerido" })));
    }

    let cat_existente = sqlx::query("SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?)")
        .bind(&payload.nombre)
        .fetch_optional(&pool)
        .await
        .unwrap();

    if cat_existente.is_some() {
        return (StatusCode::CONFLICT, Json(json!({ "error": "La categoría ya existe en la central" })));
    }

    let res = sqlx::query("INSERT INTO categorias (nombre, color, estado) VALUES (?, ?, 'activo')")
        .bind(&payload.nombre)
        .bind(&payload.color)
        .execute(&pool)
        .await;

    match res {
        Ok(r) => {
            let cat_id = r.last_insert_rowid();
            (
                StatusCode::CREATED,
                Json(json!({
                    "status": "ok",
                    "data": {
                        "id": cat_id,
                        "nombre": payload.nombre,
                        "color": payload.color,
                        "estado": "activo"
                    }
                })),
            )
        }
        Err(e) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("Error al guardar la categoría en la central: {}", e) })),
            )
        }
    }
}

pub async fn verificar_editar_categoria(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<CategoriaEditarDto>,
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
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre de la categoría es requerido" })));
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
                (StatusCode::NOT_FOUND, Json(json!({ "error": "Categoría no encontrada en el servidor central" })))
            } else {
                (
                    StatusCode::OK,
                    Json(json!({
                        "status": "ok",
                        "mensaje": "Categoría actualizada exitosamente en la sede central"
                    })),
                )
            }
        }
        Err(e) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("Error al actualizar la categoría en la central: {}", e) })),
            )
        }
    }
}
