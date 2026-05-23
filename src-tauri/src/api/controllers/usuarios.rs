use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::{json, Value};
use sqlx::SqlitePool;
use crate::api::dtos::UsuarioCrearDto;

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

pub async fn crear_usuario(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<UsuarioCrearDto>,
) -> (StatusCode, Json<Value>) {
    let sucursal_id = headers.get("X-Sucursal-Key").and_then(|h| h.to_str().ok()).unwrap_or("");
    if sucursal_id.is_empty() {
        return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "Llave de sucursal requerida" })));
    }

    if payload.username.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre de usuario es requerido" })));
    }

    let user_existente = sqlx::query("SELECT id FROM usuarios WHERE LOWER(username) = LOWER(?)")
        .bind(&payload.username)
        .fetch_optional(&pool)
        .await
        .unwrap();

    if user_existente.is_some() {
        return (StatusCode::CONFLICT, Json(json!({ "error": "El nombre de usuario ya está registrado en la central" })));
    }

    let rol_row = sqlx::query("SELECT id FROM roles WHERE LOWER(nombre) = LOWER(?)")
        .bind(&payload.rol_nombre)
        .fetch_optional(&pool)
        .await
        .unwrap();

    let rol_id = match rol_row {
        Some(row) => {
            use sqlx::Row;
            row.get::<i32, _>("id")
        }
        None => {
            return (StatusCode::BAD_REQUEST, Json(json!({ "error": format!("El rol '{}' no existe en la central", payload.rol_nombre) })));
        }
    };

    let res = sqlx::query(
        "INSERT INTO usuarios (username, password_hash, nombre_completo, rol_id, sucursal_id, estado) \
         VALUES (?, ?, ?, ?, ?, 'activo')"
    )
    .bind(&payload.username)
    .bind(&payload.password_hash)
    .bind(&payload.nombre_completo)
    .bind(rol_id)
    .bind(&payload.sucursal_id)
    .execute(&pool)
    .await;

    match res {
        Ok(r) => {
            let user_id = r.last_insert_rowid();
            (
                StatusCode::CREATED,
                Json(json!({
                    "status": "ok",
                    "data": {
                        "id": user_id,
                        "username": payload.username,
                        "nombre_completo": payload.nombre_completo,
                        "rol_id": rol_id,
                        "sucursal_id": payload.sucursal_id,
                        "estado": "activo"
                    }
                })),
            )
        }
        Err(e) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("Error al guardar el usuario en la central: {}", e) })),
            )
        }
    }
}
