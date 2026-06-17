use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{AppHandle, Manager};
use chrono::{Utc};

fn get_supabase_config(app_handle: &AppHandle) -> Result<(String, String), String> {
    let config = app_handle.config();
    let plugins = &config.plugins.0;
    
    let supabase = plugins.get("supabase")
        .ok_or("Configuración de Supabase no encontrada en tauri.conf.json")?;
    
    let url = supabase.get("url").and_then(|v| v.as_str())
        .ok_or("Falta la URL de Supabase")?;
    let key = supabase.get("anon_key").and_then(|v| v.as_str())
        .ok_or("Falta la Anon Key de Supabase")?;
    
    Ok((url.to_string(), key.to_string()))
}
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LicenseRecord {
    pub id: Option<String>,
    pub license_key: String,
    pub cliente: Option<String>,
    pub hardware_id: Option<String>,
    pub fecha_expiracion: String, // YYYY-MM-DD
    pub activa: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LocalLicenseCache {
    pub license_key: String,
    pub last_verified: String,
    pub fecha_expiracion: String,
}

pub fn get_machine_id() -> String {
    machine_uid::get().unwrap_or_else(|_| "UNKNOWN_MACHINE".to_string())
}

#[tauri::command]
pub async fn verify_license(app_handle: AppHandle, key: String) -> Result<bool, String> {
    let machine_id = get_machine_id();
    let client = Client::new();
    
    let (supabase_url, supabase_key) = get_supabase_config(&app_handle)?;
    
    // Consultar a Supabase
    let url = format!("{}?license_key=eq.{}&select=*", supabase_url, key);
    let response = client.get(&url)
        .header("apikey", &supabase_key)
        .header("Authorization", format!("Bearer {}", supabase_key))
        .send()
        .await
        .map_err(|e| format!("Error de conexión: {}", e))?;

    if !response.status().is_success() {
        return Err("Error al comunicarse con el servidor de licencias.".to_string());
    }

    let records: Vec<LicenseRecord> = response.json().await.map_err(|_| "Error procesando respuesta del servidor".to_string())?;

    if records.is_empty() {
        return Err("La clave de licencia no existe o es incorrecta.".to_string());
    }

    let record = records[0].clone();

    if !record.activa {
        return Err("Esta licencia ha sido suspendida por el administrador.".to_string());
    }

    // Verificar hardware ID (bloqueo por PC)
    if let Some(ref hw_id) = record.hardware_id {
        if !hw_id.is_empty() && hw_id != &machine_id {
            return Err("Esta licencia ya está en uso en otra computadora.".to_string());
        }
    } else {
        // Asignar hardware_id al activarse por primera vez
        let patch_url = format!("{}?license_key=eq.{}", supabase_url, key);
        let _ = client.patch(&patch_url)
            .header("apikey", &supabase_key)
            .header("Authorization", format!("Bearer {}", supabase_key))
            .header("Content-Profile", "public")
            .header("Content-Type", "application/json")
            .json(&serde_json::json!({ "hardware_id": machine_id }))
            .send()
            .await;
    }

    // Verificar fecha de expiración
    let exp_date = chrono::DateTime::parse_from_rfc3339(&format!("{}T23:59:59Z", record.fecha_expiracion))
        .map_err(|_| "Formato de fecha inválido en el servidor".to_string())?;
    
    if Utc::now() > exp_date.with_timezone(&Utc) {
        return Err("La licencia ha expirado. Contacte a soporte para renovar.".to_string());
    }

    // Guardar caché local
    let cache = LocalLicenseCache {
        license_key: key.clone(),
        last_verified: Utc::now().to_rfc3339(),
        fecha_expiracion: record.fecha_expiracion.clone(),
    };
    
    save_cache(&app_handle, &cache)?;

    Ok(true)
}

#[tauri::command]
pub async fn check_local_license(app_handle: AppHandle) -> Result<String, String> {
    let cache = load_cache(&app_handle).ok_or("No hay licencia guardada")?;
    
    // Verificar si expiró globalmente
    let exp_date = chrono::DateTime::parse_from_rfc3339(&format!("{}T23:59:59Z", cache.fecha_expiracion))
        .map_err(|_| "Formato de fecha inválido en caché")?;
        
    if Utc::now() > exp_date.with_timezone(&Utc) {
        return Err("La licencia ha expirado localmente.".to_string());
    }
    
    Ok(cache.license_key)
}

fn save_cache(app_handle: &AppHandle, cache: &LocalLicenseCache) -> Result<(), String> {
    if let Ok(app_dir) = app_handle.path().app_data_dir() {
        let _ = fs::create_dir_all(&app_dir);
        let path = app_dir.join("license.dat");
        let json = serde_json::to_string(cache).unwrap();
        // Cifrado simple en Base64 para ocultarlo a simple vista (no alta seguridad, pero evita edición casual)
        use base64::{Engine as _, engine::general_purpose};
        let encoded: String = general_purpose::STANDARD.encode(json);
        let _ = fs::write(path, encoded);
        return Ok(());
    }
    Err("No se pudo guardar la licencia local".to_string())
}

fn load_cache(app_handle: &AppHandle) -> Option<LocalLicenseCache> {
    let path = app_handle.path().app_data_dir().ok()?.join("license.dat");
    let content = fs::read_to_string(path).ok()?;
    use base64::{Engine as _, engine::general_purpose};
    let decoded = general_purpose::STANDARD.decode(content).ok()?;
    let json = String::from_utf8(decoded).ok()?;
    serde_json::from_str(&json).ok()
}

#[tauri::command]
pub async fn get_hardware_id() -> Result<String, String> {
    Ok(get_machine_id())
}

#[tauri::command]
pub async fn clear_license(app_handle: AppHandle) -> Result<(), String> {
    if let Ok(path) = app_handle.path().app_data_dir().map(|d| d.join("license.dat")) {
        let _ = fs::remove_file(path);
    }
    Ok(())
}
