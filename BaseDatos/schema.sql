-- schema.sql
-- Base de Datos para el Sistema de Inventario (SQLite)

-- 1. Configuracion
CREATE TABLE IF NOT EXISTS configuracion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sucursal_id TEXT NOT NULL,
    nombre_sucursal TEXT NOT NULL,
    api_url_central TEXT NOT NULL
);

-- 2. Roles
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    permisos TEXT -- Almacenado como JSON, ej: '["crear_venta", "ver_reportes"]'
);

-- 3. Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    rol_id INTEGER NOT NULL,
    estado TEXT DEFAULT 'activo', -- 'activo' o 'inactivo'
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- 4. Categorias
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
);

-- 5. Productos
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_barras TEXT UNIQUE,
    nombre TEXT NOT NULL,
    categoria_id INTEGER,
    unidad_medida TEXT,
    stock_minimo REAL DEFAULT 0,
    stock_actual REAL DEFAULT 0,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- 6. Historial de Precios
CREATE TABLE IF NOT EXISTS precios_historial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    precio_compra REAL NOT NULL,
    precio_venta REAL NOT NULL,
    fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_fin DATETIME,
    activo INTEGER DEFAULT 1, -- 1=activo, 0=inactivo
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- 7. Compras e Ingresos
CREATE TABLE IF NOT EXISTS compras_ingresos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    documento_referencia TEXT,
    total REAL NOT NULL,
    sincronizado INTEGER DEFAULT 0, -- 0=No, 1=Sí
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 8. Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total REAL NOT NULL,
    sincronizado INTEGER DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 9. Detalles de Venta
CREATE TABLE IF NOT EXISTS ventas_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad REAL NOT NULL,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- 10. Kardex (Movimientos)
CREATE TABLE IF NOT EXISTS kardex (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento TEXT NOT NULL, -- 'INGRESO', 'SALIDA', 'AJUSTE'
    cantidad REAL NOT NULL,
    saldo_posterior REAL NOT NULL,
    costo_unitario REAL NOT NULL,
    referencia TEXT, -- ID de venta, ID de compra o nota de ajuste
    sincronizado INTEGER DEFAULT 0,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 11. Boletas
CREATE TABLE IF NOT EXISTS boletas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL UNIQUE,
    serie TEXT NOT NULL,
    numero_correlativo TEXT NOT NULL,
    ruta_pdf TEXT,
    sincronizado INTEGER DEFAULT 0,
    FOREIGN KEY (venta_id) REFERENCES ventas(id)
);

-- =========================================================
-- DATOS POR DEFECTO PARA INICIALIZAR EL SISTEMA
-- =========================================================

-- Insertar roles básicos
INSERT OR IGNORE INTO roles (id, nombre, descripcion, permisos) VALUES 
(1, 'Administrador', 'Acceso total al sistema', '["*"]'),
(2, 'Cajero', 'Realiza ventas y visualiza productos', '["pos", "ver_productos", "ver_boletas"]'),
(3, 'Almacén', 'Gestiona inventario, compras y kardex', '["ingresar_compra", "ver_kardex", "editar_producto"]');

-- Insertar un usuario administrador inicial 
-- (Nota: la contraseña "admin" deberá ser reemplazada por un hash en producción)
INSERT OR IGNORE INTO usuarios (id, username, password_hash, nombre_completo, rol_id, estado) VALUES
(1, 'admin', 'admin', 'Administrador del Sistema', 1, 'activo');
