use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use sqlx::SqlitePool;
use crate::api::dtos::RolCrearDto;

pub async fn crear_rol(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<RolCrearDto>,
) -> (StatusCode, Json<Value>) {
    let sucursal_id = headers.get("X-Sucursal-Key").and_then(|h| h.to_str().ok()).unwrap_or("");
    if sucursal_id.is_empty() {
        return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "Llave de sucursal requerida" })));
    }

    if payload.nombre.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre del rol es requerido" })));
    }

    let rol_existente = sqlx::query("SELECT id FROM roles WHERE LOWER(nombre) = LOWER(?)")
        .bind(&payload.nombre)
        .fetch_optional(&pool)
        .await
        .unwrap();

    if rol_existente.is_some() {
        return (StatusCode::CONFLICT, Json(json!({ "error": "El rol ya existe en la central" })));
    }

    let permisos_json = serde_json::to_string(&payload.permisos).unwrap_or_else(|_| "[]".to_string());

    let res = sqlx::query("INSERT INTO roles (nombre, descripcion, permisos, estado) VALUES (?, ?, ?, 'activo')")
        .bind(&payload.nombre)
        .bind(&payload.descripcion)
        .bind(&permisos_json)
        .execute(&pool)
        .await;

    match res {
        Ok(r) => {
            let rol_id = r.last_insert_rowid();
            (
                StatusCode::CREATED,
                Json(json!({
                    "status": "ok",
                    "data": {
                        "id": rol_id,
                        "nombre": payload.nombre,
                        "descripcion": payload.descripcion,
                        "permisos": permisos_json,
                        "estado": "activo"
                    }
                })),
            )
        }
        Err(e) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("Error al guardar el rol en la central: {}", e) })),
            )
        }
    }
}

pub async fn get_roles(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
) -> (StatusCode, Json<Value>) {
    let sucursal_id = headers.get("X-Sucursal-Key")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    if sucursal_id.is_empty() {
        return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "Llave de sucursal requerida" })));
    }

    let roles = sqlx::query("SELECT id, nombre, descripcion, permisos, estado FROM roles")
        .fetch_all(&pool)
        .await
        .unwrap();

    let mut data = Vec::new();
    for r in roles {
        use sqlx::Row;
        data.push(json!({
            "id": r.get::<i32, _>("id"),
            "nombre": r.get::<String, _>("nombre"),
            "descripcion": r.get::<Option<String>, _>("descripcion"),
            "permisos": r.get::<Option<String>, _>("permisos"),
            "estado": r.get::<String, _>("estado"),
        }));
    }

    (StatusCode::OK, Json(json!({ "status": "ok", "data": data })))
}
