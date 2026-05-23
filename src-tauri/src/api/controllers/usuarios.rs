use axum::{
    extract::State,
    http::HeaderMap,
    Json,
};
use serde_json::json;
use sqlx::SqlitePool;
use crate::api::{ApiResult, db_error, validate_sucursal};
use crate::api::dtos::UsuarioCrearDto;

fn encrypt_password_hash(hash: &str, username: &str) -> String {
    let binding = "MiniMarket-Secure-Sync-Key-2026".to_string();
    let base_key_str = crate::SYNC_KEY.get().unwrap_or(&binding);
    let base_key = base_key_str.as_bytes();
    let mut user_key = Vec::new();
    for (i, &b) in base_key.iter().enumerate() {
        let u_byte = username.as_bytes().get(i % username.len()).cloned().unwrap_or(0);
        user_key.push(b ^ u_byte);
    }
    
    let encrypted: Vec<u8> = hash.as_bytes().iter().enumerate()
        .map(|(i, &b)| b ^ user_key[i % user_key.len()])
        .collect();
        
    encrypted.iter().map(|b| format!("{:02x}", b)).collect()
}

pub async fn get_usuarios(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
) -> Result<ApiResult, ApiResult> {
    let _sucursal_id = validate_sucursal(&headers, &pool).await?;

    let usuarios = sqlx::query(
        "SELECT id, username, password_hash, nombre_completo, rol_id, estado FROM usuarios"
    )
    .fetch_all(&pool)
    .await
    .map_err(db_error)?;

    let mut data = Vec::new();
    for u in usuarios {
        use sqlx::Row;
        let username = u.get::<String, _>("username");
        let raw_hash = u.get::<String, _>("password_hash");
        let encrypted_hash = encrypt_password_hash(&raw_hash, &username);

        data.push(json!({
            "id": u.get::<i32, _>("id"),
            "username": username,
            "password_hash": encrypted_hash,
            "nombre_completo": u.get::<String, _>("nombre_completo"),
            "rol_id": u.get::<i32, _>("rol_id"),
            "estado": u.get::<String, _>("estado"),
        }));
    }

    Ok((axum::http::StatusCode::OK, Json(json!({ "status": "ok", "data": data }))))
}

pub async fn crear_usuario(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<UsuarioCrearDto>,
) -> Result<ApiResult, ApiResult> {
    let _sucursal_id = validate_sucursal(&headers, &pool).await?;

    if payload.username.trim().is_empty() {
        return Ok((axum::http::StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre de usuario es requerido" }))));
    }

    let user_existente = sqlx::query("SELECT id FROM usuarios WHERE LOWER(username) = LOWER(?)")
        .bind(&payload.username)
        .fetch_optional(&pool)
        .await
        .map_err(db_error)?;

    if user_existente.is_some() {
        return Ok((axum::http::StatusCode::CONFLICT, Json(json!({ "error": "El nombre de usuario ya está registrado en la central" }))));
    }

    let rol_row = sqlx::query("SELECT id FROM roles WHERE LOWER(nombre) = LOWER(?)")
        .bind(&payload.rol_nombre)
        .fetch_optional(&pool)
        .await
        .map_err(db_error)?;

    let rol_id = match rol_row {
        Some(row) => {
            use sqlx::Row;
            row.get::<i32, _>("id")
        }
        None => {
            return Ok((axum::http::StatusCode::BAD_REQUEST, Json(json!({ "error": format!("El rol '{}' no existe en la central", payload.rol_nombre) }))));
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
            Ok((
                axum::http::StatusCode::CREATED,
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
            ))
        }
        Err(e) => Err(db_error(e)),
    }
}
