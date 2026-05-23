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

#[derive(Debug, Serialize, Deserialize)]
pub struct KardexSyncDto {
    pub producto_codigo_barras: String,
    pub usuario_id: i32,
    pub fecha: String,
    pub tipo_movimiento: String,
    pub cantidad: f64,
    pub saldo_posterior: f64,
    pub costo_unitario: f64,
    pub referencia: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KardexPayloadDto {
    pub sucursal_id: String,
    pub movimientos: Vec<KardexSyncDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductoCrearDto {
    // La sucursal NO envía código de barras; la central lo genera.
    pub nombre: String,
    pub categoria_nombre: Option<String>,
    // Se envía nombre/abreviatura de la unidad (no el ID local)
    pub unidad_nombre: Option<String>,
    pub unidad_abreviatura: Option<String>,
    pub stock_minimo: f64,
    pub precio_compra: f64,
    pub precio_venta: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CajaSyncDto {
    pub id_local: i32,
    pub usuario_id: i32,
    pub monto_inicial: f64,
    pub monto_final: Option<f64>,
    pub monto_esperado: Option<f64>,
    pub fecha_apertura: String,
    pub fecha_cierre: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CajaPayloadDto {
    pub sucursal_id: String,
    pub cajas: Vec<CajaSyncDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CompraDetalleSyncDto {
    pub codigo_barras: String,
    pub cantidad: f64,
    pub costo_unitario: f64,
    pub subtotal: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CompraSyncDto {
    pub fecha: String,
    pub total: f64,
    pub usuario_id: i32,
    pub documento_referencia: Option<String>,
    pub metodo_pago: String,
    pub estado: String,
    pub detalles: Vec<CompraDetalleSyncDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CompraPayloadDto {
    pub sucursal_id: String,
    pub compras: Vec<CompraSyncDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoriaCrearDto {
    pub nombre: String,
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UnidadMedidaCrearDto {
    pub nombre: String,
    pub abreviatura: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UsuarioCrearDto {
    pub username: String,
    pub password_hash: String,
    pub nombre_completo: String,
    pub rol_nombre: String,
    pub sucursal_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RolCrearDto {
    pub nombre: String,
    pub descripcion: Option<String>,
    pub permisos: Vec<String>,
}
