use axum::{
    extract::State,
    http::HeaderMap,
    Json,
};
use serde_json::json;
use sqlx::SqlitePool;
use crate::api::{ApiResult, db_error, validate_sucursal};
use crate::api::dtos::RolCrearDto;

pub async fn crear_rol(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
    Json(payload): Json<RolCrearDto>,
) -> Result<ApiResult, ApiResult> {
    let _sucursal_id = validate_sucursal(&headers, &pool).await?;

    if payload.nombre.trim().is_empty() {
        return Ok((axum::http::StatusCode::BAD_REQUEST, Json(json!({ "error": "El nombre del rol es requerido" }))));
    }

    let rol_existente = sqlx::query("SELECT id FROM roles WHERE LOWER(nombre) = LOWER(?)")
        .bind(&payload.nombre)
        .fetch_optional(&pool)
        .await
        .map_err(db_error)?;

    if rol_existente.is_some() {
        return Ok((axum::http::StatusCode::CONFLICT, Json(json!({ "error": "El rol ya existe en la central" }))));
    }

    let permisos_json = serde_json::to_string(&payload.permisos).map_err(db_error)?;

    let res = sqlx::query("INSERT INTO roles (nombre, descripcion, permisos, estado) VALUES (?, ?, ?, 'activo')")
        .bind(&payload.nombre)
        .bind(&payload.descripcion)
        .bind(&permisos_json)
        .execute(&pool)
        .await;

    match res {
        Ok(r) => {
            let rol_id = r.last_insert_rowid();
            Ok((
                axum::http::StatusCode::CREATED,
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
            ))
        }
        Err(e) => Err(db_error(e)),
    }
}

pub async fn get_roles(
    headers: HeaderMap,
    State(pool): State<SqlitePool>,
) -> Result<ApiResult, ApiResult> {
    let _sucursal_id = validate_sucursal(&headers, &pool).await?;

    let roles = sqlx::query("SELECT id, nombre, descripcion, permisos, estado FROM roles")
        .fetch_all(&pool)
        .await
        .map_err(db_error)?;

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

    Ok((axum::http::StatusCode::OK, Json(json!({ "status": "ok", "data": data }))))
}
