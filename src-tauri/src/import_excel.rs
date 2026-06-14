// src-tauri/src/import_excel.rs
//
// Comando Tauri: import_productos_excel
// ─────────────────────────────────────
// Lee un archivo .xlsx con el formato:
//   Col A: Nombre del producto
//   Col B: Categoría
//   Col C: Unidad de medida (nombre)
//   Col D: Stock inicial
//   Col E: Precio de compra
//   Col F: Precio de venta
//
// Por cada hoja del libro:
//   1. Inserta categorías y unidades (INSERT OR IGNORE).
//   2. Inserta productos nuevos (ignorados si ya existen por nombre).
//   3. Inserta precio en precios_historial para cada producto nuevo.
//   4. Crea un registro en compras_ingresos con el total de la hoja.
//   5. Crea un compras_detalle por cada producto nuevo.
//   6. Crea un kardex INGRESO por cada producto nuevo.
//
// La hoja "TODOS" (resumen global) se omite para evitar duplicados.
// Todo el proceso corre dentro de una única transacción SQLite.

use calamine::{open_workbook_auto, Data, Reader};
use serde::Serialize;
use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};

// ─── DTOs públicos ────────────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
pub struct CompraResumen {
    pub hoja:       String,
    pub compra_id:  i64,
    pub productos:  u32,
    pub total:      f64,
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub insertados:      u32,
    pub ignorados:       u32,
    pub errores:         u32,
    pub compras:         Vec<CompraResumen>,
    pub detalle_errores: Vec<String>,
}

// ─── Estructuras internas ─────────────────────────────────────────────────────

struct ExcelRow {
    nombre:        String,
    categoria:     String,
    unidad:        String,
    stock:         f64,
    precio_compra: f64,
    precio_venta:  f64,
}

/// Producto recién insertado (solo los NUEVOS, ignorados no se incluyen en compras)
struct NuevoProducto {
    id:            i64,
    nombre:        String,
    stock:         f64,
    precio_compra: f64,
}

// ─── Comando principal ────────────────────────────────────────────────────────

#[tauri::command]
pub async fn import_productos_excel(
    app_handle: AppHandle,
    file_path: String,
) -> Result<ImportResult, String> {
    // 1. Conectar a la BD
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("No se pudo obtener directorio de datos: {}", e))?;

    let db_path = app_dir.join("inventario.db");
    if !db_path.exists() {
        return Err("La base de datos no existe. Inicia la aplicación normalmente primero.".to_string());
    }

    let pool = sqlx::sqlite::SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(
            sqlx::sqlite::SqliteConnectOptions::new()
                .filename(&db_path)
                .create_if_missing(false),
        )
        .await
        .map_err(|e| format!("Error al conectar a la base de datos: {}", e))?;

    // 2. Parsear el Excel por hojas
    let sheets = parse_excel_by_sheets(&file_path)?;

    if sheets.is_empty() {
        return Ok(ImportResult {
            insertados: 0, ignorados: 0, errores: 0,
            compras: vec![],
            detalle_errores: vec!["El archivo Excel no contiene hojas con datos.".to_string()],
        });
    }

    // 3. Ejecutar importación
    let result = run_import(&pool, sheets).await?;

    pool.close().await;
    Ok(result)
}

// ─── Parser: devuelve una lista de (nombre_hoja, filas) ──────────────────────

fn parse_excel_by_sheets(path: &str) -> Result<Vec<(String, Vec<ExcelRow>)>, String> {
    let mut workbook = open_workbook_auto(path)
        .map_err(|e| format!("No se pudo abrir el archivo Excel: {}", e))?;

    let sheet_names = workbook.sheet_names().to_vec();
    if sheet_names.is_empty() {
        return Err("El archivo Excel no tiene hojas.".to_string());
    }

    let mut result: Vec<(String, Vec<ExcelRow>)> = Vec::new();

    for sheet_name in &sheet_names {
        // Omitir la hoja resumen global para evitar duplicar todas las compras
        if sheet_name.to_uppercase() == "TODOS" {
            continue;
        }

        let sheet = match workbook.worksheet_range(sheet_name) {
            Ok(s)  => s,
            Err(e) => {
                eprintln!("[import_excel] Hoja '{}' omitida: {}", sheet_name, e);
                continue;
            }
        };

        let mut rows: Vec<ExcelRow> = Vec::new();

        for (row_idx, row) in sheet.rows().enumerate() {
            if row_idx == 0 { continue; } // encabezado
            if row.len() < 6 { continue; }

            let nombre        = cell_to_string(&row[0]).trim().to_string();
            let categoria     = cell_to_string(&row[1]).trim().to_string();
            let unidad        = cell_to_string(&row[2]).trim().to_string();
            let stock         = cell_to_f64(&row[3]);
            let precio_compra = round2(cell_to_f64(&row[4]));
            let precio_venta  = round2(cell_to_f64(&row[5]));

            if nombre.is_empty() { continue; }

            rows.push(ExcelRow { nombre, categoria, unidad, stock, precio_compra, precio_venta });
        }

        if !rows.is_empty() {
            result.push((sheet_name.clone(), rows));
        }
    }

    Ok(result)
}

// ─── Conversores de celdas ────────────────────────────────────────────────────

fn cell_to_string(cell: &Data) -> String {
    match cell {
        Data::String(s) => s.clone(),
        Data::Float(f)  => f.to_string(),
        Data::Int(i)    => i.to_string(),
        Data::Bool(b)   => b.to_string(),
        _               => String::new(),
    }
}

fn cell_to_f64(cell: &Data) -> f64 {
    match cell {
        Data::Float(f)  => *f,
        Data::Int(i)    => *i as f64,
        Data::String(s) => s.parse::<f64>().unwrap_or(0.0),
        _               => 0.0,
    }
}

fn round2(v: f64) -> f64 { (v * 100.0).round() / 100.0 }

// ─── Importador ───────────────────────────────────────────────────────────────

async fn run_import(
    pool: &SqlitePool,
    sheets: Vec<(String, Vec<ExcelRow>)>,
) -> Result<ImportResult, String> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| format!("No se pudo iniciar la transacción: {}", e))?;

    let mut insertados:      u32 = 0;
    let mut ignorados:       u32 = 0;
    let mut errores:         u32 = 0;
    let mut detalle_errores: Vec<String> = Vec::new();
    let mut compras:         Vec<CompraResumen> = Vec::new();

    for (sheet_name, rows) in sheets {
        let mut nuevos_en_hoja: Vec<NuevoProducto> = Vec::new();

        // ── Procesar cada fila de la hoja ─────────────────────────────────────
        for row in rows {
            // a) Categoría
            let cat_nombre = if row.categoria.is_empty() {
                "PRODUCTOS".to_string()
            } else {
                row.categoria.to_uppercase()
            };

            sqlx::query(
                "INSERT OR IGNORE INTO categorias (nombre, color, estado) VALUES (?, '#888888', 'activo')"
            )
            .bind(&cat_nombre)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Error categoría '{}': {}", cat_nombre, e))?;

            let cat_id: i64 = sqlx::query_scalar(
                "SELECT id FROM categorias WHERE nombre = ?"
            )
            .bind(&cat_nombre)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| format!("Categoría '{}' no encontrada: {}", cat_nombre, e))?;

            // b) Unidad de medida
            let unidad_nombre = if row.unidad.is_empty() {
                "Unidad".to_string()
            } else {
                let mut chars = row.unidad.chars();
                match chars.next() {
                    None    => String::new(),
                    Some(c) => c.to_uppercase().to_string() + chars.as_str(),
                }
            };
            let abreviatura = nombre_a_abreviatura(&unidad_nombre);

            sqlx::query(
                "INSERT OR IGNORE INTO unidades_medida (nombre, abreviatura, estado) VALUES (?, ?, 'activo')"
            )
            .bind(&unidad_nombre)
            .bind(&abreviatura)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Error unidad '{}': {}", unidad_nombre, e))?;

            let unidad_id: i64 = sqlx::query_scalar(
                "SELECT id FROM unidades_medida WHERE nombre = ?"
            )
            .bind(&unidad_nombre)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| format!("Unidad '{}' no encontrada: {}", unidad_nombre, e))?;

            // c) ¿Producto ya existe?
            let count: i64 = sqlx::query_scalar(
                "SELECT COUNT(*) FROM productos WHERE UPPER(nombre) = UPPER(?)"
            )
            .bind(&row.nombre)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| format!("Error verificando '{}': {}", row.nombre, e))?;

            if count > 0 {
                ignorados += 1;
                continue;
            }

            // d) Generar código de barras PROD-XXXX
            let max_num: i64 = sqlx::query_scalar(
                "SELECT COALESCE(MAX(CAST(SUBSTR(codigo_barras, 6) AS INTEGER)), 0) \
                 FROM productos WHERE codigo_barras LIKE 'PROD-%'"
            )
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| format!("Error código: {}", e))?;

            let codigo_barras = format!("PROD-{:04}", max_num + 1);

            // e) Insertar producto
            let producto_id = match sqlx::query(
                "INSERT INTO productos \
                 (codigo_barras, nombre, categoria_id, unidad_id, stock_minimo, stock_actual, estado, sincronizado) \
                 VALUES (?, ?, ?, ?, 12, ?, 'activo', 1)"
            )
            .bind(&codigo_barras)
            .bind(&row.nombre)
            .bind(cat_id)
            .bind(unidad_id)
            .bind(row.stock)
            .execute(&mut *tx)
            .await
            {
                Ok(r)  => r.last_insert_rowid(),
                Err(e) => {
                    errores += 1;
                    detalle_errores.push(format!("'{}': {}", row.nombre, e));
                    continue;
                }
            };

            // f) Precio histórico
            if row.precio_compra > 0.0 || row.precio_venta > 0.0 {
                sqlx::query(
                    "INSERT INTO precios_historial (producto_id, precio_compra, precio_venta, activo) VALUES (?, ?, ?, 1)"
                )
                .bind(producto_id)
                .bind(row.precio_compra)
                .bind(row.precio_venta)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Error precio '{}': {}", row.nombre, e))?;
            }

            insertados += 1;

            // Solo incluir en la compra si tiene stock > 0.
            // compras_detalle y kardex tienen CHECK (cantidad > 0) — stock=0 violaría la restricción.
            if row.stock > 0.0 {
                nuevos_en_hoja.push(NuevoProducto {
                    id:            producto_id,
                    nombre:        row.nombre,
                    stock:         row.stock,
                    precio_compra: row.precio_compra,
                });
            }
        }

        // ── Crear compra para esta hoja (solo si hubo productos nuevos) ────────
        if !nuevos_en_hoja.is_empty() {
            let total_hoja: f64 = round2(
                nuevos_en_hoja.iter()
                    .map(|p| p.stock * p.precio_compra)
                    .sum()
            );

            let doc_ref = format!("IMPORTACIÓN INICIAL - {}", sheet_name.to_uppercase());

            // Compra cabecera
            let compra_id = sqlx::query(
                "INSERT INTO compras_ingresos \
                 (usuario_id, documento_referencia, total, estado, metodo_pago, sincronizado) \
                 VALUES (1, ?, ?, 'completado', 'BANCO', 1)"
            )
            .bind(&doc_ref)
            .bind(total_hoja)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Error creando compra para hoja '{}': {}", sheet_name, e))?
            .last_insert_rowid();

            for prod in &nuevos_en_hoja {
                let subtotal = round2(prod.stock * prod.precio_compra);

                // Detalle de compra
                sqlx::query(
                    "INSERT INTO compras_detalle \
                     (compra_id, producto_id, cantidad, costo_unitario, subtotal, sincronizado) \
                     VALUES (?, ?, ?, ?, ?, 1)"
                )
                .bind(compra_id)
                .bind(prod.id)
                .bind(prod.stock)
                .bind(prod.precio_compra)
                .bind(subtotal)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Error detalle compra '{}': {}", prod.nombre, e))?;

                // Kardex INGRESO
                let referencia = format!("COMPRA #{:05}", compra_id);
                sqlx::query(
                    "INSERT INTO kardex \
                     (producto_id, usuario_id, tipo_movimiento, cantidad, saldo_posterior, \
                      costo_unitario, referencia, sincronizado) \
                     VALUES (?, 1, 'INGRESO', ?, ?, ?, ?, 1)"
                )
                .bind(prod.id)
                .bind(prod.stock)
                .bind(prod.stock)          // saldo_posterior = stock inicial
                .bind(prod.precio_compra)
                .bind(&referencia)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Error kardex '{}': {}", prod.nombre, e))?;
            }

            compras.push(CompraResumen {
                hoja:      sheet_name.clone(),
                compra_id,
                productos: nuevos_en_hoja.len() as u32,
                total:     total_hoja,
            });
        }
    }

    tx.commit()
        .await
        .map_err(|e| format!("Error al confirmar la transacción: {}", e))?;

    Ok(ImportResult { insertados, ignorados, errores, compras, detalle_errores })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn nombre_a_abreviatura(nombre: &str) -> String {
    match nombre.to_lowercase().as_str() {
        "unidad"    => "UND".to_string(),
        "kilogramo" => "KG".to_string(),
        "litro"     => "LT".to_string(),
        "gramo"     => "GR".to_string(),
        "mililitro" => "ML".to_string(),
        "paquete"   => "PQT".to_string(),
        "caja"      => "CJ".to_string(),
        "bolsa"     => "BLS".to_string(),
        "docena"    => "DOC".to_string(),
        "lata"      => "LAT".to_string(),
        _ => nombre.to_uppercase().chars().take(3).collect(),
    }
}
