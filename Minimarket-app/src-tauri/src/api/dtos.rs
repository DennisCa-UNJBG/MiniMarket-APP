use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct VentaSyncDto {
    pub fecha: String,
    pub total: f64,
    pub usuario_id: i32,
    pub metodo_pago: String,
    pub detalles: Vec<DetalleSyncDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DetalleSyncDto {
    pub codigo_barras: String,
    pub cantidad: f64,
    pub precio_unitario: f64,
    pub subtotal: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StockSyncDto {
    pub codigo_barras: String,
    pub stock_actual: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StockPayloadDto {
    pub sucursal_id: String,
    pub inventario: Vec<StockSyncDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncPayloadDto {
    pub sucursal_id: String,
    pub ventas: Vec<VentaSyncDto>,
}
