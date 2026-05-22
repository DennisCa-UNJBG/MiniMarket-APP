pub mod dtos;
pub mod controllers;

use axum::{
    routing::{get, post},
    Router,
};
use sqlx::SqlitePool;

pub fn create_router(pool: SqlitePool) -> Router {
    Router::new()
        .route("/", get(|| async { "Servidor Sede Central Activo" }))
        .route("/api/productos", get(controllers::get_productos))
        .route("/api/usuarios", get(controllers::get_usuarios))
        .route("/api/sincronizar", post(controllers::sincronizar_ventas))
        .route("/api/stock-update", post(controllers::update_stock))
        .route("/api/kardex-sync", post(controllers::sincronizar_kardex))
        .route("/api/cajas-sync", post(controllers::sincronizar_cajas))
        .route("/api/productos/verificar-crear", post(controllers::verificar_crear_producto))
        .with_state(pool)
}
