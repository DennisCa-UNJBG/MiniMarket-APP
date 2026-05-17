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
