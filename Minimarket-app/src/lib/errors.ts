// ============================================================
// Catálogo de errores de dominio del Sistema de Inventario
// Cada error representa una condición de negocio específica.
// El componente usa `instanceof` para decidir qué mostrar al usuario.
// ============================================================

// ── Infraestructura ───────────────────────────────────────────────────────────

/** La base de datos no pudo ser contactada (plugin SQL, ruta incorrecta, etc.) */
export class ConnectionError extends Error {
  constructor(message = 'No se pudo conectar a la base de datos') {
    super(message);
    this.name = 'ConnectionError';
  }
}

// ── Autenticación ─────────────────────────────────────────────────────────────

/** Usuario o contraseña incorrectos, o cuenta inactiva */
export class AuthError extends Error {
  constructor(message = 'Credenciales inválidas o usuario inactivo') {
    super(message);
    this.name = 'AuthError';
  }
}

// ── Inventario / Productos ────────────────────────────────────────────────────

/** Se intentó vender más unidades de las disponibles en stock */
export class StockInsuficienteError extends Error {
  constructor(public productoNombre: string, public stockActual: number) {
    super(`Stock insuficiente para "${productoNombre}". Disponible: ${stockActual}`);
    this.name = 'StockInsuficienteError';
  }
}

/** Se intentó registrar un producto con un código de barras ya existente */
export class CodigoBarrasDuplicadoError extends Error {
  constructor(public codigo: string) {
    super(`El código de barras "${codigo}" ya está registrado.`);
    this.name = 'CodigoBarrasDuplicadoError';
  }
}

// ── Ventas ────────────────────────────────────────────────────────────────────

/** El carrito de venta está vacío al intentar procesar el cobro */
export class CarritoVacioError extends Error {
  constructor() {
    super('No hay productos en el carrito para procesar la venta.');
    this.name = 'CarritoVacioError';
  }
}

/** El monto pagado es insuficiente para cubrir el total de la venta */
export class PagoInsuficienteError extends Error {
  constructor(public total: number, public pagado: number) {
    super(`Pago insuficiente. Total: S/ ${total.toFixed(2)}, Pagado: S/ ${pagado.toFixed(2)}`);
    this.name = 'PagoInsuficienteError';
  }
}

// ── Validación general ────────────────────────────────────────────────────────

/** Un campo requerido no fue proporcionado o tiene un formato inválido */
export class ValidationError extends Error {
  constructor(public campo: string, message?: string) {
    super(message ?? `El campo "${campo}" no es válido.`);
    this.name = 'ValidationError';
  }
}
