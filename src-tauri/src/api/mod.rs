pub mod controllers;
pub mod dtos;

use axum::{
    http::{HeaderMap, StatusCode},
    routing::{get, post},
    Json, Router,
};
use serde_json::{json, Value};
use sqlx::SqlitePool;

/// Tipo de retorno estándar para todos los handlers de la API.
pub type ApiResult = (StatusCode, Json<Value>);

/// Convierte un error de SQLx (o serde_json) en una respuesta HTTP 500 estándar.
pub fn db_error(e: impl std::fmt::Display) -> ApiResult {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(json!({ "error": format!("Error interno del servidor: {}", e) })),
    )
}

/// Extrae y valida la llave de sucursal del header X-Sucursal-Key.
/// Si el header no existe o está vacío retorna UNAUTHORIZED directamente.
pub fn extract_sucursal_key(headers: &HeaderMap) -> Result<&str, ApiResult> {
    headers
        .get("X-Sucursal-Key")
        .and_then(|h| h.to_str().ok())
        .filter(|s| !s.is_empty())
        .ok_or_else(|| (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Llave de sucursal requerida" })),
        ))
}

fn decrypt_branch_code(encrypted_hex: &str) -> Option<String> {
    let binding = "MiniMarket-Secure-Sync-Key-2026".to_string();
    let base_key_str = crate::SYNC_KEY.get().unwrap_or(&binding);
    let base_key = base_key_str.as_bytes();
    
    // Decodificar hex a bytes
    let mut encrypted_bytes = Vec::new();
    let mut chars = encrypted_hex.chars();
    while let (Some(c1), Some(c2)) = (chars.next(), chars.next()) {
        let hex_pair = format!("{}{}", c1, c2);
        if let Ok(byte) = u8::from_str_radix(&hex_pair, 16) {
            encrypted_bytes.push(byte);
        } else {
            return None;
        }
    }
    
    // Descifrar con XOR
    let decrypted: Vec<u8> = encrypted_bytes.iter().enumerate()
        .map(|(i, &b)| b ^ base_key[i % base_key.len()])
        .collect();
        
    String::from_utf8(decrypted).ok()
}

/// Valida la sucursal descifrando el header X-Sucursal-Key y consultando la DB.
/// Retorna el código de la sucursal si es válida y está activa.
pub async fn validate_sucursal(
    headers: &HeaderMap,
    pool: &sqlx::SqlitePool,
) -> Result<String, ApiResult> {
    let encrypted_hex = extract_sucursal_key(headers)?;
    
    let sucursal_codigo = decrypt_branch_code(encrypted_hex).ok_or_else(|| (
        StatusCode::BAD_REQUEST,
        Json(json!({ "error": "Firma de sucursal inválida o corrupta" })),
    ))?;

    let row = sqlx::query("SELECT id FROM sucursales WHERE codigo = ? AND estado = 'activo'")
        .bind(&sucursal_codigo)
        .fetch_optional(pool)
        .await
        .map_err(db_error)?;

    match row {
        Some(_) => Ok(sucursal_codigo),
        None => Err((
            StatusCode::FORBIDDEN,
            Json(json!({ "error": "Sucursal no autorizada o inactiva" })),
        )),
    }
}

pub fn create_router(pool: SqlitePool) -> Router {
    Router::new()
        .route("/", get(|| async { "Servidor Sede Central Activo" }))
        .route(
            "/api/productos",
            get(controllers::get_productos)
                .post(controllers::verificar_crear_producto)
                .put(controllers::verificar_editar_producto),
        )
        .route(
            "/api/usuarios",
            get(controllers::get_usuarios).post(controllers::crear_usuario),
        )
        .route("/api/sincronizar", post(controllers::sincronizar_ventas))
        .route("/api/stock-update", post(controllers::update_stock))
        .route("/api/kardex-sync", post(controllers::sincronizar_kardex))
        .route("/api/cajas-sync", post(controllers::sincronizar_cajas))
        .route("/api/compras-sync", post(controllers::sincronizar_compras))
        .route(
            "/api/categorias",
            post(controllers::crear_categoria).put(controllers::verificar_editar_categoria),
        )
        .route(
            "/api/unidades-medida",
            get(controllers::get_unidades_medida)
                .post(controllers::crear_unidad_medida)
                .put(controllers::verificar_editar_unidad_medida),
        )
        .route(
            "/api/roles",
            get(controllers::get_roles).post(controllers::crear_rol),
        )
        .with_state(pool)
}
