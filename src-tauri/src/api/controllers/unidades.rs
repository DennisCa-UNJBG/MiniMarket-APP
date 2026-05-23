use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use sqlx::SqlitePool;
use crate::api::dtos::{UnidadMedidaCrearDto, UnidadMedidaEditarDto};

pub async fn get_unidades_medida(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
) -> (StatusCode, Json<Value>) {
    let sucursal_id = headers.get("X-Sucursal-Key")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    if sucursal_id.is_empty() {
        return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "Llave de sucursal requerida" })));
    }

    let unidades = sqlx::query("SELECT id, nombre, abreviatura, estado FROM unidades_medida")
        .fetch_all(&pool)
        .await
        .unwrap();

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

    (StatusCode::OK, Json(json!({ "status": "ok", "data": data })))
}

pub async fn crear_unidad_medida(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<UnidadMedidaCrearDto>,
) -> (StatusCode, Json<Value>) {
    let sucursal_id = headers.get("X-Sucursal-Key").and_then(|h| h.to_str().ok()).unwrap_or("");
    if sucursal_id.is_empty() {
        return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "Llave de sucursal requerida" })));
    }

    if payload.nombre.trim().is_empty() || payload.abreviatura.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre y la abreviatura son requeridos" })));
    }

    let unit_existente = sqlx::query("SELECT id FROM unidades_medida WHERE LOWER(nombre) = LOWER(?) OR LOWER(abreviatura) = LOWER(?)")
        .bind(&payload.nombre)
        .bind(&payload.abreviatura)
        .fetch_optional(&pool)
        .await
        .unwrap();

    if unit_existente.is_some() {
        return (StatusCode::CONFLICT, Json(json!({ "error": "La unidad de medida o abreviatura ya existe en la central" })));
    }

    let res = sqlx::query("INSERT INTO unidades_medida (nombre, abreviatura, estado) VALUES (?, ?, 'activo')")
        .bind(&payload.nombre)
        .bind(&payload.abreviatura)
        .execute(&pool)
        .await;

    match res {
        Ok(r) => {
            let unit_id = r.last_insert_rowid();
            (
                StatusCode::CREATED,
                Json(json!({
                    "status": "ok",
                    "data": {
                        "id": unit_id,
                        "nombre": payload.nombre,
                        "abreviatura": payload.abreviatura,
                        "estado": "activo"
                    }
                })),
            )
        }
        Err(e) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("Error al guardar la unidad de medida en la central: {}", e) })),
            )
        }
    }
}

pub async fn verificar_editar_unidad_medida(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<UnidadMedidaEditarDto>,
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

    // Validar que el nombre y abreviatura no estén vacíos
    if payload.nombre.trim().is_empty() || payload.abreviatura.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre y abreviatura son requeridos" })));
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
                (StatusCode::NOT_FOUND, Json(json!({ "error": "Unidad de medida no encontrada en el servidor central" })))
            } else {
                (
                    StatusCode::OK,
                    Json(json!({
                        "status": "ok",
                        "mensaje": "Unidad de medida actualizada exitosamente en la sede central"
                    })),
                )
            }
        }
        Err(e) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("Error al actualizar la unidad de medida en la central: {}", e) })),
            )
        }
    }
}
