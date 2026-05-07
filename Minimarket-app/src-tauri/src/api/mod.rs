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
        .with_state(pool)
}
