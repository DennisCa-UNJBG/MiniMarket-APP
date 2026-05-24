-- SchemaDB.sql
-- Base de Datos para Sistema de Inventario Multi-Sede (SQLite)
--
-- FIXES APLICADOS:
--   [FIX-01] Orden de tablas corregido → se eliminan las forward references
--   [FIX-02] Eliminada columna redundante unidad_medida TEXT de productos
--   [FIX-03] api_url_central pasa a nullable (la Sede Central no tiene URL central)
--   [FIX-04] UNIQUE(serie, numero_correlativo) agregado a boletas
--   [FIX-05] FKs reales agregadas a sucursales_stock
--   [FIX-06] Triggers para mantener clientes.compras y clientes.total_gastado
--            ⚠ REQUIERE eliminar las actualizaciones manuales equivalentes en el código
--   [FIX-07] updated_at eliminado de logs (tabla de auditoría es inmutable)
--   [FIX-08] sucursal_id agregado a logs (para rastrear el origen en sincronización)
--   [FIX-09] CHECK constraints en tipo_movimiento, estado, metodo_pago y montos
--   [FIX-10] idx_logs_fecha corregido: logs(fecha) → logs(created_at)
--   [FIX-11] Índices faltantes añadidos (sucursal, precios, kardex.referencia, sincronizado)
--   [FIX-12] Patrón singleton en configuracion y negocio (columna singleton UNIQUE)
--
-- SINCRONIZACIÓN MULTI-SEDE AÑADIDA:
--   [SYNC-01] configuracion: ultimo_sync_push / ultimo_sync_pull para control de cursor
--   [SYNC-02] sync_log: historial de cada operación de sincronización (push/pull)
--   [SYNC-03] sync_cursors: en la Sede Central, registra el cursor de cada sucursal
--             para saber qué registros maestros ya le fueron enviados

-- =========================================================
-- ORDEN CORRECTO: las tablas referenciadas se declaran primero [FIX-01]
-- =========================================================

-- 1. Unidades de Medida  (antes que productos, que la referencia)
CREATE TABLE IF NOT EXISTS unidades_medida (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    abreviatura TEXT NOT NULL UNIQUE,
    estado TEXT DEFAULT 'activo' CHECK (
        estado IN ('activo', 'inactivo')
    ), -- [FIX-09]
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roles  (antes que usuarios, que los referencia)
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    permisos TEXT, -- JSON: ej. ["ventas","productos"]
    estado TEXT DEFAULT 'activo' CHECK (
        estado IN ('activo', 'inactivo')
    ), -- [FIX-09]
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Configuracion  [FIX-03][FIX-12][SYNC-01]
--    Tabla singleton: solo puede existir UNA fila por instalación.
--    La columna `singleton` con UNIQUE CHECK(singleton=1) lo garantiza.
--    Uso: INSERT OR REPLACE INTO configuracion (singleton, ...) VALUES (1, ...)
CREATE TABLE IF NOT EXISTS configuracion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    singleton INTEGER DEFAULT 1 UNIQUE CHECK (singleton = 1), -- [FIX-12] una sola fila
    sucursal_id TEXT NOT NULL,
    nombre_sucursal TEXT NOT NULL,
    api_url_central TEXT, -- [FIX-03] NULL en Sede Central
    ultimo_sync_push DATETIME, -- [SYNC-01] última vez que enviamos datos
    ultimo_sync_pull DATETIME, -- [SYNC-01] última vez que recibimos datos
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Categorias
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    color TEXT,
    estado TEXT DEFAULT 'activo' CHECK (
        estado IN ('activo', 'inactivo')
    ), -- [FIX-09]
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Clientes  (antes que ventas, que la referencia) [FIX-01]
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    dni_ruc TEXT UNIQUE,
    telefono TEXT,
    email TEXT,
    compras INTEGER DEFAULT 0, -- mantenido por trigger [FIX-06]
    total_gastado REAL DEFAULT 0.0, -- mantenido por trigger [FIX-06]
    estado TEXT DEFAULT 'activo' CHECK (
        estado IN ('activo', 'inactivo')
    ), -- [FIX-09]
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Usuarios  (antes que ventas, compras, kardex, cajas y logs)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    rol_id INTEGER NOT NULL,
    estado TEXT DEFAULT 'activo' CHECK (
        estado IN ('activo', 'inactivo')
    ), -- [FIX-09]
    sucursal_id TEXT,
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles (id)
);

-- 7. Productos  [FIX-02]
--    Se elimina columna unidad_medida TEXT (legada).
--    La única referencia a unidades es unidad_id → unidades_medida(id)
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_barras TEXT UNIQUE,
    nombre TEXT NOT NULL,
    categoria_id INTEGER,
    unidad_id INTEGER, -- [FIX-02] única columna de unidad
    stock_minimo REAL DEFAULT 0 CHECK (stock_minimo >= 0), -- [FIX-09]
    stock_actual REAL DEFAULT 0,
    estado TEXT DEFAULT 'activo' CHECK (
        estado IN ('activo', 'inactivo')
    ),
    sincronizado INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias (id),
    FOREIGN KEY (unidad_id) REFERENCES unidades_medida (id) -- [FIX-02] FK explícita
);

-- 8. Historial de Precios
CREATE TABLE IF NOT EXISTS precios_historial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    precio_compra REAL NOT NULL CHECK (precio_compra >= 0), -- [FIX-09]
    precio_venta REAL NOT NULL CHECK (precio_venta >= 0), -- [FIX-09]
    fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_fin DATETIME,
    activo INTEGER DEFAULT 1 CHECK (activo IN (0, 1)), -- [FIX-09]
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos (id)
);

-- 9. Compras e Ingresos
CREATE TABLE IF NOT EXISTS compras_ingresos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    documento_referencia TEXT,
    total REAL NOT NULL CHECK (total >= 0), -- [FIX-09]
    sucursal_id TEXT,
    estado TEXT DEFAULT 'completado' CHECK (
        estado IN ('completado', 'anulado')
    ), -- [FIX-09]
    metodo_pago TEXT DEFAULT 'BANCO' CHECK (
        metodo_pago IN (
            'EFECTIVO',
            'BANCO',
            'TARJETA',
            'TRANSFERENCIA'
        )
    ), -- [FIX-09]
    sucursal_local_id INTEGER, -- [IDEM] ID local de la sucursal para detectar duplicados
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

-- 10. Detalle de Compras
CREATE TABLE IF NOT EXISTS compras_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    compra_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad REAL NOT NULL CHECK (cantidad > 0), -- [FIX-09]
    costo_unitario REAL NOT NULL CHECK (costo_unitario >= 0), -- [FIX-09]
    subtotal REAL NOT NULL CHECK (subtotal >= 0), -- [FIX-09]
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compra_id) REFERENCES compras_ingresos (id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos (id)
);

-- 11. Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total REAL NOT NULL CHECK (total >= 0), -- [FIX-09]
    metodo_pago TEXT DEFAULT 'EFECTIVO' CHECK (
        metodo_pago IN (
            'EFECTIVO',
            'TARJETA',
            'TRANSFERENCIA'
        )
    ), -- [FIX-09]
    monto_pagado REAL DEFAULT 0 CHECK (monto_pagado >= 0), -- [FIX-09]
    vuelto REAL DEFAULT 0 CHECK (vuelto >= 0), -- [FIX-09]
    sucursal_id TEXT,
    igv REAL DEFAULT 0 CHECK (igv >= 0),
    igv_porcentaje REAL DEFAULT 0 CHECK (
        igv_porcentaje >= 0
        AND igv_porcentaje <= 100
    ),
    estado TEXT DEFAULT 'completado' CHECK (
        estado IN ('completado', 'anulado')
    ), -- [FIX-09]
    cliente_id INTEGER,
    sucursal_local_id INTEGER, -- [IDEM] ID local de la sucursal para detectar duplicados
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    FOREIGN KEY (cliente_id) REFERENCES clientes (id) -- [FIX-01] ya no es forward reference
);

-- 12. Detalles de Venta
CREATE TABLE IF NOT EXISTS ventas_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad REAL NOT NULL CHECK (cantidad > 0), -- [FIX-09]
    precio_unitario REAL NOT NULL CHECK (precio_unitario >= 0), -- [FIX-09]
    subtotal REAL NOT NULL CHECK (subtotal >= 0), -- [FIX-09]
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas (id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos (id)
);

-- 13. Kardex (Movimientos de Inventario)
CREATE TABLE IF NOT EXISTS kardex (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento TEXT NOT NULL CHECK (
        tipo_movimiento IN ('INGRESO', 'SALIDA', 'AJUSTE')
    ), -- [FIX-09]
    cantidad REAL NOT NULL CHECK (cantidad > 0), -- [FIX-09]
    saldo_posterior REAL NOT NULL CHECK (saldo_posterior >= 0), -- [FIX-09]
    costo_unitario REAL NOT NULL CHECK (costo_unitario >= 0), -- [FIX-09]
    referencia TEXT, -- ej. "VENTA #00012", "COMPRA #00003", "AJUSTE: nota"
    sucursal_id TEXT,
    sucursal_local_id INTEGER, -- [IDEM] ID local de la sucursal para detectar duplicados
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos (id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

-- 14. Boletas  [FIX-04]
CREATE TABLE IF NOT EXISTS boletas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL UNIQUE,
    serie TEXT NOT NULL,
    numero_correlativo TEXT NOT NULL,
    ruta_pdf TEXT,
    sucursal_id TEXT,
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas (id),
    UNIQUE (serie, numero_correlativo) -- [FIX-04] evita duplicados de numeración
);

-- 15. Logs de Auditoría  [FIX-07][FIX-08]
CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    sucursal_id TEXT, -- [FIX-08] origen del log; útil al sincronizar a la central
    sucursal_local_id INTEGER, -- [IDEM] ID local de la sucursal para detectar duplicados
    accion TEXT NOT NULL,
    tabla TEXT NOT NULL,
    registro_id INTEGER NOT NULL,
    detalles TEXT,
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- [FIX-07] updated_at eliminado: los logs son inmutables por definición
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

-- 16. Sucursales
CREATE TABLE IF NOT EXISTS sucursales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    direccion TEXT,
    ip_ultima_conexion TEXT,
    ultima_sincronizacion DATETIME,
    estado TEXT DEFAULT 'activo' CHECK (
        estado IN ('activo', 'inactivo')
    ), -- [FIX-09]
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Stock por Sucursal  [FIX-05]
--     Tabla poblada principalmente en la Sede Central al recibir el inventario de las sucursales.
--     Las FKs aseguran que no existan entradas huérfanas.
CREATE TABLE IF NOT EXISTS sucursales_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sucursal_id TEXT NOT NULL,
    codigo_barras TEXT NOT NULL,
    stock REAL NOT NULL DEFAULT 0 CHECK (stock >= 0), -- [FIX-09]
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (sucursal_id, codigo_barras),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales (codigo), -- [FIX-05]
    FOREIGN KEY (codigo_barras) REFERENCES productos (codigo_barras) -- [FIX-05]
);

-- 18. Negocio  [FIX-12]
--     Singleton: solo puede existir UNA fila por instalación.
CREATE TABLE IF NOT EXISTS negocio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    singleton INTEGER DEFAULT 1 UNIQUE CHECK (singleton = 1), -- [FIX-12]
    razon_social TEXT NOT NULL,
    ruc TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    logo_path TEXT,
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. Cajas
CREATE TABLE IF NOT EXISTS cajas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    monto_inicial REAL NOT NULL CHECK (monto_inicial >= 0), -- [FIX-09]
    monto_final REAL CHECK (monto_final >= 0), -- [FIX-09]
    monto_esperado REAL DEFAULT 0 CHECK (monto_esperado >= 0), -- [FIX-09]
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    estado TEXT DEFAULT 'abierta' CHECK (
        estado IN ('abierta', 'cerrada')
    ), -- [FIX-09]
    sucursal_id TEXT,
    sucursal_local_id INTEGER, -- [IDEM] ID local de la sucursal para detectar duplicados
    sincronizado INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

-- =========================================================
-- TABLAS DE SINCRONIZACIÓN  [SYNC-02][SYNC-03]
-- =========================================================

-- sync_log: historial de cada operación de sincronización  [SYNC-02]
--   Existe en TODAS las instalaciones (sucursales y sede central).
--   Registra qué se envió (PUSH) o qué se recibió (PULL), cuándo y con qué resultado.
CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sucursal_id TEXT NOT NULL, -- quién inició o destino de la operación
    direccion TEXT NOT NULL CHECK (direccion IN ('PUSH', 'PULL')),
    tabla TEXT NOT NULL, -- tabla afectada
    registros_procesados INTEGER DEFAULT 0,
    registros_error INTEGER DEFAULT 0,
    estado TEXT NOT NULL CHECK (
        estado IN (
            'pendiente',
            'completado',
            'error'
        )
    ),
    error_detalle TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- sync_cursors: cursor de sincronización por sucursal × tabla  [SYNC-03]
--   Solo tiene datos en la SEDE CENTRAL.
--   Registra "hasta qué punto" se le han enviado los registros maestros a cada sucursal.
--   Permite responder: "dame todo lo modificado después de este cursor para la sucursal X".
CREATE TABLE IF NOT EXISTS sync_cursors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sucursal_id TEXT NOT NULL, -- código de la sucursal destino
    tabla TEXT NOT NULL, -- tabla maestra: productos, usuarios, roles, etc.
    ultimo_id INTEGER DEFAULT 0, -- último id de esa tabla enviado a la sucursal
    ultimo_updated_at DATETIME, -- última fecha updated_at enviada (para detectar cambios)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (sucursal_id, tabla),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales (codigo)
);

-- =========================================================
-- TRIGGERS  [FIX-06]
-- Mantienen sincronizados los contadores desnormalizados de clientes.
-- ⚠ IMPORTANTE: si se activan estos triggers, ELIMINAR del código de la app
--   las instrucciones manuales equivalentes (UPDATE clientes SET compras = ...).
--   De lo contrario los contadores se incrementarán DOS veces.
-- =========================================================

-- Incrementar al registrar una venta completada con cliente
CREATE TRIGGER IF NOT EXISTS trg_cliente_venta_insert
AFTER INSERT ON ventas
WHEN NEW.cliente_id IS NOT NULL AND NEW.estado = 'completado'
BEGIN
    UPDATE clientes
    SET compras       = compras + 1,
        total_gastado = total_gastado + NEW.total,
        updated_at    = CURRENT_TIMESTAMP
    WHERE id = NEW.cliente_id;
END;

-- Decrementar al anular una venta con cliente
CREATE TRIGGER IF NOT EXISTS trg_cliente_venta_anular
AFTER UPDATE ON ventas
WHEN NEW.estado = 'anulado'
 AND OLD.estado != 'anulado'
 AND NEW.cliente_id IS NOT NULL
BEGIN
    UPDATE clientes
    SET compras       = MAX(0,   compras - 1),
        total_gastado = MAX(0.0, total_gastado - OLD.total),
        updated_at    = CURRENT_TIMESTAMP
    WHERE id = NEW.cliente_id;
END;

-- =========================================================
-- ÍNDICES  [FIX-10][FIX-11]
-- =========================================================

-- Kardex
CREATE INDEX IF NOT EXISTS idx_kardex_producto_fecha ON kardex (producto_id, fecha);

CREATE INDEX IF NOT EXISTS idx_kardex_sucursal_fecha ON kardex (sucursal_id, fecha);

CREATE INDEX IF NOT EXISTS idx_kardex_referencia ON kardex (referencia);
-- [FIX-11] anulaciones
CREATE INDEX IF NOT EXISTS idx_kardex_sincronizado ON kardex (sincronizado);
-- [FIX-11] push pendiente

-- Ventas
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas (fecha);

CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas (cliente_id);

CREATE INDEX IF NOT EXISTS idx_ventas_sucursal_fecha ON ventas (sucursal_id, fecha);
-- [FIX-11] multi-sede
CREATE INDEX IF NOT EXISTS idx_ventas_sincronizado ON ventas (sincronizado);
-- [FIX-11] push pendiente

-- Ventas Detalle
CREATE INDEX IF NOT EXISTS idx_ventas_detalle_venta ON ventas_detalle (venta_id);

CREATE INDEX IF NOT EXISTS idx_ventas_detalle_producto ON ventas_detalle (producto_id);

-- Compras
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras_ingresos (fecha);

CREATE INDEX IF NOT EXISTS idx_compras_sucursal_fecha ON compras_ingresos (sucursal_id, fecha);
-- [FIX-11]
CREATE INDEX IF NOT EXISTS idx_compras_sincronizado ON compras_ingresos (sincronizado);
-- [FIX-11]

-- Productos
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (categoria_id);
-- [FIX-11]
CREATE INDEX IF NOT EXISTS idx_productos_sincronizado ON productos (sincronizado);
-- [FIX-11]

-- Precios (consulta frecuente: precio actual de un producto)
CREATE INDEX IF NOT EXISTS idx_precios_producto_activo ON precios_historial (producto_id, activo);
-- [FIX-11]

-- Logs
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs (usuario_id);

CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs (created_at);
-- [FIX-10] columna correcta
CREATE INDEX IF NOT EXISTS idx_logs_sincronizado ON logs (sincronizado);
-- [FIX-11]

-- Sync
CREATE INDEX IF NOT EXISTS idx_sync_log_sucursal ON sync_log (sucursal_id, created_at);
-- [SYNC-02]

-- Idempotencia: evitar duplicados cuando una sucursal reenvía datos [IDEM]
CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_origen ON ventas (
    sucursal_id,
    sucursal_local_id
)
WHERE
    sucursal_id IS NOT NULL
    AND sucursal_local_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_compras_origen ON compras_ingresos (
    sucursal_id,
    sucursal_local_id
)
WHERE
    sucursal_id IS NOT NULL
    AND sucursal_local_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_kardex_origen ON kardex (
    sucursal_id,
    sucursal_local_id
)
WHERE
    sucursal_id IS NOT NULL
    AND sucursal_local_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cajas_origen ON cajas (
    sucursal_id,
    sucursal_local_id
)
WHERE
    sucursal_id IS NOT NULL
    AND sucursal_local_id IS NOT NULL;

-- =========================================================
-- DATOS POR DEFECTO
-- =========================================================

INSERT
    OR IGNORE INTO roles (
        id,
        nombre,
        descripcion,
        permisos
    )
VALUES (
        1,
        'Administrador',
        'Acceso total al sistema',
        '["*"]'
    ),
    (
        2,
        'Cajero',
        'Realiza ventas y visualiza productos',
        '["pos", "ventas", "productos", "clientes", "reportes"]'
    ),
    (
        3,
        'Almacén',
        'Gestiona inventario, compras y kardex',
        '["inventario", "productos", "compras", "kardex", "reportes"]'
    );

-- Usuario administrador inicial — contraseña: admin
INSERT
    OR IGNORE INTO usuarios (
        id,
        username,
        password_hash,
        nombre_completo,
        rol_id,
        estado
    )
VALUES (
        1,
        'admin',
        '$2b$10$lA3xmVfn7iicVDiAf.nQU.UdPoeQBG6bvS0Kv2DJm9QM7l6tYpthG',
        'Administrador del Sistema',
        1,
        'activo'
    );

INSERT
    OR IGNORE INTO categorias (nombre, color)
VALUES ('Abarrotes', '#f59e0b'),
    ('Bebidas', '#0ea5e9'),
    ('Lácteos', '#60a5fa'),
    ('Limpieza', '#10b981');

INSERT
    OR IGNORE INTO unidades_medida (nombre, abreviatura)
VALUES ('Unidad', 'UND'),
    ('Kilogramo', 'KG'),
    ('Litro', 'LT'),
    ('Caja', 'CJ'),
    ('Paquete', 'PQT');