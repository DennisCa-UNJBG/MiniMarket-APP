// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs;
use tauri::{AppHandle, Manager};
use serde_json::json;

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
        // ... (tus migraciones existentes se mantienen igual)
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
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:inventario.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![greet, get_db_stats, backup_database, reveal_in_explorer])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
