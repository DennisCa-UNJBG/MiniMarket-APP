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
        .route("/api/productos", get(controllers::get_productos).post(controllers::verificar_crear_producto))
        .route("/api/usuarios", get(controllers::get_usuarios).post(controllers::crear_usuario))
        .route("/api/sincronizar", post(controllers::sincronizar_ventas))
        .route("/api/stock-update", post(controllers::update_stock))
        .route("/api/kardex-sync", post(controllers::sincronizar_kardex))
        .route("/api/cajas-sync", post(controllers::sincronizar_cajas))
        .route("/api/compras-sync", post(controllers::sincronizar_compras))
        .route("/api/categorias", post(controllers::crear_categoria))
        .route("/api/unidades-medida", get(controllers::get_unidades_medida).post(controllers::crear_unidad_medida))
        .route("/api/roles", get(controllers::get_roles).post(controllers::crear_rol))
        // Endpoint legacy para retrocompatibilidad
        .route("/api/productos/crear-desde-sucursal", post(controllers::verificar_crear_producto))
        .with_state(pool)
}
