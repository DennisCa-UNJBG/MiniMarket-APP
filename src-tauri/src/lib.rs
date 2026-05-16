mod api;

use std::fs;
use tauri::{AppHandle, Manager, State};
use serde_json::json;
use std::sync::Arc;
use tokio::sync::Mutex;
// use axum::Router; // Eliminado por ser innecesario tras la refactorización
use tower_http::cors::CorsLayer;
use local_ip_address::local_ip;

// Estado para controlar el servidor
struct ServerState {
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
    is_running: Mutex<bool>,
}

#[tauri::command]
async fn get_local_ip() -> Result<String, String> {
    local_ip()
        .map(|ip| ip.to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn toggle_server(app_handle: AppHandle, state: State<'_, Arc<ServerState>>, active: bool) -> Result<bool, String> {
    let mut is_running = state.is_running.lock().await;
    let mut shutdown_tx = state.shutdown_tx.lock().await;

    if active && !*is_running {
        // Iniciar servidor
        let (tx, rx) = tokio::sync::oneshot::channel::<()>();
        *shutdown_tx = Some(tx);
        *is_running = true;

        let app_handle_clone = app_handle.clone();
        
        tokio::spawn(async move {
            let app_dir = app_handle_clone.path().app_data_dir().unwrap();
            let db_path = format!("sqlite:{}", app_dir.join("inventario.db").to_string_lossy());
            
            // Conexión a la DB para el servidor Axum
            let pool = sqlx::SqlitePool::connect(&db_path).await.unwrap();

            let app = api::create_router(pool)
                .layer(CorsLayer::permissive());

            let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
            
            axum::serve(listener, app)
                .with_graceful_shutdown(async {
                    rx.await.ok();
                })
                .await
                .unwrap();
        });

        Ok(true)
    } else if !active && *is_running {
        // Detener servidor
        if let Some(tx) = shutdown_tx.take() {
            let _ = tx.send(());
        }
        *is_running = false;
        Ok(false)
    } else {
        Ok(*is_running)
    }
}

#[tauri::command]
async fn is_server_running(state: State<'_, Arc<ServerState>>) -> Result<bool, String> {
    Ok(*state.is_running.lock().await)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_db_stats(app_handle: AppHandle) -> Result<serde_json::Value, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("inventario.db");
    
    if db_path.exists() {
        let metadata = fs::metadata(&db_path).map_err(|e| e.to_string())?;
        Ok(json!({
            "size": metadata.len(),
            "path": db_path.to_string_lossy().to_string()
        }))
    } else {
        Ok(json!({
            "size": 0,
            "path": "Base de datos no encontrada"
        }))
    }
}

#[tauri::command]
async fn backup_database(app_handle: AppHandle) -> Result<String, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("inventario.db");
    
    if !db_path.exists() {
        return Err("No hay base de datos para respaldar".to_string());
    }

    let backup_dir = app_dir.join("backups");
    fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();
        
    let backup_path = backup_dir.join(format!("backup_inventario_{}.db", now));
    fs::copy(&db_path, &backup_path).map_err(|e| e.to_string())?;

    Ok(backup_path.to_string_lossy().to_string())
}

#[tauri::command]
async fn reveal_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        // El argumento /select, permite marcar el archivo específico en la carpeta
        Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(())
    }
}

use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "initial_schema",
            sql: include_str!("../database/schema.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_compras_detalle",
            sql: "CREATE TABLE IF NOT EXISTS compras_detalle (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    compra_id INTEGER NOT NULL,
                    producto_id INTEGER NOT NULL,
                    cantidad REAL NOT NULL,
                    costo_unitario REAL NOT NULL,
                    subtotal REAL NOT NULL,
                    FOREIGN KEY (compra_id) REFERENCES compras_ingresos (id) ON DELETE CASCADE,
                    FOREIGN KEY (producto_id) REFERENCES productos (id)
                  );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_logs_table",
            sql: "CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    usuario_id INTEGER NOT NULL,
                    accion TEXT NOT NULL,
                    tabla TEXT NOT NULL,
                    registro_id INTEGER NOT NULL,
                    detalles TEXT,
                    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
                  );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_metodo_pago_to_ventas",
            sql: "ALTER TABLE ventas ADD COLUMN metodo_pago TEXT DEFAULT 'EFECTIVO';",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add_pago_vuelto_to_ventas",
            sql: "ALTER TABLE ventas ADD COLUMN monto_pagado REAL DEFAULT 0;
                  ALTER TABLE ventas ADD COLUMN vuelto REAL DEFAULT 0;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "multi_sede_support",
            sql: "CREATE TABLE IF NOT EXISTS sucursales (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    codigo TEXT NOT NULL UNIQUE,
                    nombre TEXT NOT NULL,
                    direccion TEXT,
                    ip_ultima_conexion TEXT,
                    ultima_sincronizacion DATETIME,
                    estado TEXT DEFAULT 'activo'
                  );
                  ALTER TABLE ventas ADD COLUMN sucursal_id TEXT;
                  ALTER TABLE compras_ingresos ADD COLUMN sucursal_id TEXT;
                  ALTER TABLE kardex ADD COLUMN sucursal_id TEXT;
                  ALTER TABLE boletas ADD COLUMN sucursal_id TEXT;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "add_sucursal_to_users",
            sql: "ALTER TABLE usuarios ADD COLUMN sucursal_id TEXT;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "add_sucursales_stock_table",
            sql: "CREATE TABLE IF NOT EXISTS sucursales_stock (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sucursal_id TEXT NOT NULL,
                    codigo_barras TEXT NOT NULL,
                    stock REAL NOT NULL,
                    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(sucursal_id, codigo_barras)
                  );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "add_negocio_table",
            sql: "CREATE TABLE IF NOT EXISTS negocio (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    razon_social TEXT NOT NULL,
                    ruc TEXT NOT NULL,
                    direccion TEXT,
                    telefono TEXT,
                    email TEXT,
                    logo_path TEXT
                  );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "create_unidades_medida_table",
            sql: "CREATE TABLE IF NOT EXISTS unidades_medida (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL UNIQUE,
                    abreviatura TEXT NOT NULL UNIQUE,
                    estado TEXT DEFAULT 'activo'
                  );
                  INSERT OR IGNORE INTO unidades_medida (nombre, abreviatura) VALUES 
                  ('Unidad', 'UND'),
                  ('Kilogramo', 'KG'),
                  ('Litro', 'LT'),
                  ('Caja', 'CJ'),
                  ('Paquete', 'PQT');
                  ALTER TABLE productos ADD COLUMN unidad_id INTEGER REFERENCES unidades_medida(id);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 11,
            description: "create_cajas_table",
            sql: "CREATE TABLE IF NOT EXISTS cajas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    usuario_id INTEGER NOT NULL,
                    monto_inicial REAL NOT NULL,
                    monto_final REAL,
                    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    fecha_cierre TIMESTAMP,
                    estado TEXT DEFAULT 'abierta',
                    sucursal_id TEXT,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
                  );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 12,
            description: "add_igv_to_ventas",
            sql: "ALTER TABLE ventas ADD COLUMN igv REAL DEFAULT 0;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 13,
            description: "add_igv_porcentaje_to_ventas",
            sql: "ALTER TABLE ventas ADD COLUMN igv_porcentaje REAL DEFAULT 0;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 14,
            description: "add_estado_to_compras",
            sql: "ALTER TABLE compras_ingresos ADD COLUMN estado TEXT DEFAULT 'completado';",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 15,
            description: "add_estado_to_ventas",
            sql: "ALTER TABLE ventas ADD COLUMN estado TEXT DEFAULT 'completado';",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 16,
            description: "add_metodo_pago_to_compras",
            sql: "ALTER TABLE compras_ingresos ADD COLUMN metodo_pago TEXT DEFAULT 'BANCO';",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Arc::new(ServerState {
            shutdown_tx: Mutex::new(None),
            is_running: Mutex::new(false),
        }))
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:inventario.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            greet, 
            get_db_stats, 
            backup_database, 
            reveal_in_explorer,
            get_local_ip,
            toggle_server,
            is_server_running
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
