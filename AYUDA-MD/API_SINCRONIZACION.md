# API de Sincronización Multi-Sede

## Visión General

El sistema usa tres tipos de operaciones:

- **PUSH** → la sucursal envía sus transacciones a la central
- **PULL** → la sucursal pide el catálogo actualizado a la central
- **CREAR** → la sucursal solicita que la central cree un registro maestro

> ⚠ **Regla fundamental:** Solo la Sede Central puede crear registros en las tablas
> `productos`, `categorias`, `unidades_medida`, `usuarios` y `roles`.
> Las sucursales **no insertan directamente** en esas tablas — envían una solicitud
> a la central y aplican el resultado que reciben.

```
SUCURSAL                               SEDE CENTRAL
   │                                         │
   │──── PUSH ventas ───────────────────────►│
   │──── PUSH compras ──────────────────────►│
   │──── PUSH kardex ───────────────────────►│
   │──── PUSH cajas ────────────────────────►│
   │──── PUSH logs ─────────────────────────►│
   │──── PUSH inventario (stock) ───────────►│
   │                                         │
   │──── SOLICITAR crear producto ──────────►│ (central crea, asigna ID, responde)
   │──── SOLICITAR crear categoria ─────────►│
   │──── SOLICITAR crear unidad ────────────►│
   │──── SOLICITAR crear usuario ───────────►│
   │──── SOLICITAR crear rol ───────────────►│
   │                                         │
   │◄─── PULL productos + precios ──────────│
   │◄─── PULL usuarios ─────────────────────│
   │◄─── PULL roles ────────────────────────│
   │◄─── PULL categorias ───────────────────│
   │◄─── PULL unidades_medida ──────────────│
```

---

## Autenticación

Todos los endpoints requieren el header:
```
X-Sucursal-Key: <codigo_sucursal>
```
La central valida que el código existe en la tabla `sucursales` y tiene `estado = 'activo'`.  
Si no es válido → `401 Unauthorized`.

---

## Convención de respuestas

```json
// Éxito
{ "ok": true, "data": { ... } }

// Error
{ "ok": false, "error": "Descripción del problema" }
```

---

## ENDPOINTS DE PULL (Central → Sucursal)

---

### GET /api/productos

Descarga el catálogo de productos con su precio activo.

**Headers:** `X-Sucursal-Key`

**Respuesta 200:**
```json
{
  "ok": true,
  "data": [
    {
      "codigo_barras": "7750095131003",
      "nombre": "Arroz Extra Superiora 1kg",
      "categoria": "Abarrotes",
      "unidad_abreviatura": "KG",
      "stock_minimo": 10,
      "estado": "activo",
      "precio_compra": 30.00,
      "precio_venta": 50.00
    }
  ]
}
```

**Lógica en la central:**
```sql
SELECT
  p.codigo_barras,
  p.nombre,
  c.nombre   AS categoria,
  u.abreviatura AS unidad_abreviatura,
  p.stock_minimo,
  p.estado,
  ph.precio_compra,
  ph.precio_venta
FROM productos p
LEFT JOIN categorias     c  ON p.categoria_id = c.id
LEFT JOIN unidades_medida u ON p.unidad_id    = u.id
LEFT JOIN precios_historial ph ON ph.producto_id = p.id AND ph.activo = 1
WHERE p.estado = 'activo'
```

**Cómo aplica la sucursal los cambios:**
```sql
-- Upsert por codigo_barras (nunca por id)
INSERT INTO productos (codigo_barras, nombre, categoria_id, unidad_id, stock_minimo, estado)
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT(codigo_barras) DO UPDATE SET
  nombre       = excluded.nombre,
  categoria_id = excluded.categoria_id,
  unidad_id    = excluded.unidad_id,
  stock_minimo = excluded.stock_minimo,
  estado       = excluded.estado,
  updated_at   = CURRENT_TIMESTAMP;
```

---

### GET /api/usuarios

Descarga la lista de usuarios activos.  
⚠ **No se envía `password_hash`** — las contraseñas solo se sincronizan a través de un endpoint dedicado o bien se manda el hash sin exponerlo en texto plano.

**Respuesta 200:**
```json
{
  "ok": true,
  "data": [
    {
      "username": "cajero1",
      "password_hash": "$2b$10$...",
      "nombre_completo": "Juan Pérez",
      "rol_nombre": "Cajero",
      "sucursal_id": "SUC001",
      "estado": "activo"
    }
  ]
}
```

**Cómo aplica la sucursal los cambios:**
```sql
-- Upsert por username (nunca por id)
INSERT INTO usuarios (username, password_hash, nombre_completo, rol_id, sucursal_id, estado)
VALUES (?, ?, ?, (SELECT id FROM roles WHERE nombre = ?), ?, ?)
ON CONFLICT(username) DO UPDATE SET
  password_hash   = excluded.password_hash,
  nombre_completo = excluded.nombre_completo,
  rol_id          = excluded.rol_id,
  sucursal_id     = excluded.sucursal_id,
  estado          = excluded.estado,
  updated_at      = CURRENT_TIMESTAMP;
```

---

### GET /api/roles

Descarga los roles y sus permisos.

**Respuesta 200:**
```json
{
  "ok": true,
  "data": [
    {
      "nombre": "Cajero",
      "descripcion": "Realiza ventas y visualiza productos",
      "permisos": "[\"pos\", \"ventas\", \"productos\"]",
      "estado": "activo"
    }
  ]
}
```

**Cómo aplica la sucursal:**
```sql
INSERT INTO roles (nombre, descripcion, permisos, estado)
VALUES (?, ?, ?, ?)
ON CONFLICT(nombre) DO UPDATE SET
  descripcion = excluded.descripcion,
  permisos    = excluded.permisos,
  estado      = excluded.estado,
  updated_at  = CURRENT_TIMESTAMP;
```

---

### GET /api/categorias

Descarga las categorías de productos.

**Respuesta 200:**
```json
{
  "ok": true,
  "data": [
    { "nombre": "Abarrotes", "color": "#f59e0b", "estado": "activo" }
  ]
}
```

---

### GET /api/unidades-medida

Descarga las unidades de medida.

**Respuesta 200:**
```json
{
  "ok": true,
  "data": [
    { "nombre": "Kilogramo", "abreviatura": "KG", "estado": "activo" }
  ]
}
```

---

## ENDPOINTS DE PUSH (Sucursal → Central)

---

### POST /api/sincronizar — Ventas

Envía las ventas pendientes (`sincronizado = 0`).

**Headers:** `X-Sucursal-Key`, `Content-Type: application/json`

**Body:**
```json
{
  "sucursal_id": "SUC001",
  "ventas": [
    {
      "local_id": 45,
      "fecha": "2025-05-20T10:30:00",
      "total": 150.50,
      "metodo_pago": "EFECTIVO",
      "monto_pagado": 200.00,
      "vuelto": 49.50,
      "igv": 23.00,
      "igv_porcentaje": 18.0,
      "estado": "completado",
      "usuario_username": "cajero1",
      "cliente_dni_ruc": "12345678",
      "detalles": [
        {
          "producto_codigo_barras": "7750095131003",
          "cantidad": 3,
          "precio_unitario": 50.00,
          "subtotal": 150.00
        }
      ]
    }
  ]
}
```

**Lógica en la central (idempotencia):**
```sql
-- Insertar solo si no existe ya esta combinación (sucursal_id + local_id)
INSERT OR IGNORE INTO ventas
  (usuario_id, fecha, total, metodo_pago, monto_pagado, vuelto,
   sucursal_id, igv, igv_porcentaje, estado, cliente_id, sucursal_local_id)
VALUES
  ((SELECT id FROM usuarios WHERE username = ?),
   ?, ?, ?, ?, ?, ?, ?, ?, ?,
   (SELECT id FROM clientes WHERE dni_ruc = ?),
   ?);
-- Si ya existía (OR IGNORE), no se crea duplicado.
```

**Respuesta 200:**
```json
{ "ok": true, "procesadas": 3, "duplicadas": 0 }
```

---

### POST /api/kardex-sync — Kardex

Envía movimientos de inventario pendientes.

**Body:**
```json
{
  "sucursal_id": "SUC001",
  "movimientos": [
    {
      "local_id": 12,
      "producto_codigo_barras": "7750095131003",
      "usuario_username": "cajero1",
      "fecha": "2025-05-20T10:30:00",
      "tipo_movimiento": "SALIDA",
      "cantidad": 3,
      "saldo_posterior": 47,
      "costo_unitario": 30.00,
      "referencia": "VENTA #00045"
    }
  ]
}
```

**Lógica en la central:**
```sql
INSERT OR IGNORE INTO kardex
  (producto_id, usuario_id, fecha, tipo_movimiento, cantidad,
   saldo_posterior, costo_unitario, referencia, sucursal_id, sucursal_local_id)
VALUES
  ((SELECT id FROM productos WHERE codigo_barras = ?),
   (SELECT id FROM usuarios  WHERE username = ?),
   ?, ?, ?, ?, ?, ?, ?, ?);
```

---

### POST /api/compras-sync — Compras

Envía compras/ingresos de mercadería pendientes.

**Body:**
```json
{
  "sucursal_id": "SUC001",
  "compras": [
    {
      "local_id": 8,
      "fecha": "2025-05-20T09:00:00",
      "total": 500.00,
      "metodo_pago": "BANCO",
      "documento_referencia": "FAC-001-00123",
      "estado": "completado",
      "usuario_username": "admin",
      "detalles": [
        {
          "producto_codigo_barras": "7750095131003",
          "cantidad": 20,
          "costo_unitario": 25.00,
          "subtotal": 500.00
        }
      ]
    }
  ]
}
```

---

### POST /api/cajas-sync — Caja

Envía sesiones de caja cerradas.

**Body:**
```json
{
  "sucursal_id": "SUC001",
  "cajas": [
    {
      "local_id": 3,
      "usuario_username": "cajero1",
      "monto_inicial": 200.00,
      "monto_final": 850.00,
      "monto_esperado": 860.50,
      "fecha_apertura": "2025-05-20T08:00:00",
      "fecha_cierre": "2025-05-20T20:00:00"
    }
  ]
}
```

---

### POST /api/logs-sync — Logs de Auditoría

Envía los registros de auditoría pendientes.

**Body:**
```json
{
  "sucursal_id": "SUC001",
  "logs": [
    {
      "usuario_username": "cajero1",
      "accion": "REGISTRO_VENTA",
      "tabla": "ventas",
      "registro_id": 45,
      "detalles": "Venta #00045 registrada por S/ 150.50",
      "created_at": "2025-05-20T10:30:00"
    }
  ]
}
```

---

### POST /api/stock-update — Inventario

Envía el nivel de stock actual de todos los productos.  
La central actualiza `sucursales_stock` para tener una foto del inventario de cada sede.

**Body:**
```json
{
  "sucursal_id": "SUC001",
  "inventario": [
    { "codigo_barras": "7750095131003", "stock_actual": 47 },
    { "codigo_barras": "7891234567890", "stock_actual": 12 }
  ]
}
```

**Lógica en la central:**
```sql
INSERT INTO sucursales_stock (sucursal_id, codigo_barras, stock, ultima_actualizacion)
VALUES (?, ?, ?, CURRENT_TIMESTAMP)
ON CONFLICT(sucursal_id, codigo_barras) DO UPDATE SET
  stock                = excluded.stock,
  ultima_actualizacion = CURRENT_TIMESTAMP,
  updated_at           = CURRENT_TIMESTAMP;
```

---

## Orden recomendado de sincronización

```
Al hacer PUSH (sucursal envía a central):
  1. POST /api/sincronizar      (ventas)
  2. POST /api/kardex-sync      (kardex)
  3. POST /api/compras-sync     (compras)
  4. POST /api/cajas-sync       (cajas)
  5. POST /api/logs-sync        (logs)
  6. POST /api/stock-update     (inventario — siempre al final)

Al hacer PULL (sucursal pide a central):
  1. GET  /api/roles            (base para usuarios)
  2. GET  /api/categorias       (base para productos)
  3. GET  /api/unidades-medida  (base para productos)
  4. GET  /api/usuarios         (depende de roles)
  5. GET  /api/productos        (depende de categorias + unidades)
```

> El orden del PULL importa porque los productos dependen de categorías y unidades.  
> Si se insertan en orden incorrecto, los `categoria_id` y `unidad_id` podrían no existir aún.

---

## ENDPOINTS DE CREACIÓN (Sucursal solicita → Central crea)

---

### POST /api/solicitudes-creacion

Endpoint principal de creación. La sucursal envía un lote de solicitudes (sin ID).
La central crea cada registro, asigna el ID canónico y responde con los registros completos.
La sucursal aplica el resultado localmente con `INSERT OR REPLACE` y actualiza `solicitudes_creacion`.

**Headers:** `X-Sucursal-Key`, `Content-Type: application/json`

**Body:**
```json
{
  "sucursal_id": "SUC001",
  "solicitudes": [
    {
      "tabla": "productos",
      "datos": {
        "codigo_barras": "7750095131004",
        "nombre": "Leche Gloria 1L",
        "categoria_nombre": "Lácteos",
        "unidad_abreviatura": "LT",
        "stock_minimo": 5,
        "precio_compra": 4.50,
        "precio_venta": 6.00
      }
    },
    {
      "tabla": "categorias",
      "datos": {
        "nombre": "Congelados",
        "color": "#3b82f6"
      }
    },
    {
      "tabla": "unidades_medida",
      "datos": {
        "nombre": "Gramo",
        "abreviatura": "GR"
      }
    },
    {
      "tabla": "usuarios",
      "datos": {
        "username": "cajero3",
        "password": "contraseña_en_texto",
        "nombre_completo": "Carlos Quispe",
        "rol_nombre": "Cajero",
        "sucursal_id": "SUC001"
      }
    },
    {
      "tabla": "roles",
      "datos": {
        "nombre": "Supervisor",
        "descripcion": "Supervisión de operaciones",
        "permisos": ["ventas", "reportes", "kardex", "inventario"]
      }
    }
  ]
}
```

**Lógica en la central por cada solicitud:**

```sql
-- Para 'productos':
INSERT INTO productos (codigo_barras, nombre, categoria_id, unidad_id, stock_minimo, estado)
VALUES (
  ?,
  ?,
  (SELECT id FROM categorias     WHERE nombre    = ?),
  (SELECT id FROM unidades_medida WHERE abreviatura = ?),
  ?, 'activo'
);
-- Luego insertar precio en precios_historial con activo = 1

-- Para 'categorias':
INSERT INTO categorias (nombre, color) VALUES (?, ?);

-- Para 'unidades_medida':
INSERT INTO unidades_medida (nombre, abreviatura) VALUES (?, ?);

-- Para 'usuarios':
INSERT INTO usuarios (username, password_hash, nombre_completo, rol_id, sucursal_id, estado)
VALUES (?, hash(?), ?, (SELECT id FROM roles WHERE nombre = ?), ?, 'activo');

-- Para 'roles':
INSERT INTO roles (nombre, descripcion, permisos) VALUES (?, ?, json(?));
```

**Respuesta 200:**
```json
{
  "ok": true,
  "resultados": [
    {
      "tabla": "productos",
      "estado": "creado",
      "datos": {
        "id": 45,
        "codigo_barras": "7750095131004",
        "nombre": "Leche Gloria 1L",
        "categoria_nombre": "Lácteos",
        "unidad_abreviatura": "LT",
        "stock_minimo": 5,
        "precio_compra": 4.50,
        "precio_venta": 6.00,
        "estado": "activo"
      }
    },
    {
      "tabla": "categorias",
      "estado": "creado",
      "datos": { "id": 8, "nombre": "Congelados", "color": "#3b82f6" }
    },
    {
      "tabla": "unidades_medida",
      "estado": "rechazado",
      "mensaje": "Ya existe una unidad con la abreviatura 'GR'"
    },
    {
      "tabla": "usuarios",
      "estado": "creado",
      "datos": {
        "id": 12,
        "username": "cajero3",
        "nombre_completo": "Carlos Quispe",
        "rol_nombre": "Cajero"
      }
    },
    {
      "tabla": "roles",
      "estado": "creado",
      "datos": { "id": 4, "nombre": "Supervisor" }
    }
  ]
}
```

**Cómo aplica la sucursal cada resultado:**
```sql
-- Para cada item con estado = 'creado':
-- 1. INSERT OR REPLACE con el registro completo devuelto por la central
-- 2. Actualizar solicitudes_creacion:
UPDATE solicitudes_creacion
SET estado            = 'completada',
    respuesta_id      = ?,   -- id canónico de la central
    respuesta_json    = ?,   -- JSON completo del registro creado
    respuesta_mensaje = 'Creado correctamente',
    sincronizado      = 1,
    updated_at        = CURRENT_TIMESTAMP
WHERE id = ?;

-- Para cada item con estado = 'rechazado':
UPDATE solicitudes_creacion
SET estado            = 'rechazada',
    respuesta_mensaje = ?,   -- mensaje de error de la central
    sincronizado      = 1,
    updated_at        = CURRENT_TIMESTAMP
WHERE id = ?;
```

---

### Flujo completo con soporte offline

Cuando la sucursal no tiene conexión:

```
1. El usuario crea un producto desde la UI de la sucursal
2. La sucursal inserta en solicitudes_creacion:
     tabla       = 'productos'
     datos_json  = '{...datos del producto...}'
     estado      = 'pendiente'
     sincronizado = 0
   (NO inserta en la tabla productos aún)

3. La UI muestra el producto como "pendiente de confirmación central"

4. Cuando hay conexión, la sucursal envía todas las solicitudes pendientes:
     SELECT * FROM solicitudes_creacion WHERE sincronizado = 0
     → POST /api/solicitudes-creacion

5. La central crea los registros y responde

6. La sucursal aplica los resultados:
     - Si 'creado': INSERT OR REPLACE en la tabla correspondiente
     - Si 'rechazado': mostrar error al usuario
     - Actualizar solicitudes_creacion.estado y sincronizado = 1
```

---

## Tabla de responsabilidades

| Tabla | Dueño de los datos | Dirección | Conflict resolution |
|---|---|---|---|
| `ventas`, `ventas_detalle` | Sucursal | PUSH | Central nunca modifica — acepta todo |
| `compras_ingresos`, `compras_detalle` | Sucursal | PUSH | Central nunca modifica — acepta todo |
| `kardex` | Sucursal | PUSH | Central nunca modifica — acepta todo |
| `cajas` | Sucursal | PUSH | Central nunca modifica — acepta todo |
| `logs` | Sucursal | PUSH | Central nunca modifica — acepta todo |
| `sucursales_stock` | Central (alimentada por sucursales) | PUSH | Última lectura reemplaza anterior |
| `productos`, `precios_historial` | **Central** | PULL + CREAR | Central siempre gana — `INSERT OR REPLACE` |
| `usuarios` | **Central** | PULL + CREAR | Central siempre gana — upsert por username |
| `roles` | **Central** | PULL + CREAR | Central siempre gana — upsert por nombre |
| `categorias` | **Central** | PULL + CREAR | Central siempre gana — upsert por nombre |
| `unidades_medida` | **Central** | PULL + CREAR | Central siempre gana — upsert por abreviatura |
| `solicitudes_creacion` | Sucursal (local) | CREAR | Solo existe en sucursales — la central no la necesita |

---

## Manejo de errores y reintentos

| Escenario | Comportamiento |
|---|---|
| Red cortada antes de confirmar | La sucursal NO marca `sincronizado = 1` → reintenta en la próxima sync |
| Central devuelve error 5xx | La sucursal registra el error en `sync_log` y reintenta |
| Registro duplicado en central | `INSERT OR IGNORE` → la central lo ignora silenciosamente, devuelve `duplicadas: N` |
| Producto desconocido en central | La central ignora ese ítem y lo incluye en el campo `errores` de la respuesta |
| Sucursal con clave inválida | `401 Unauthorized` → la sucursal muestra error de conexión |

---

## Campos que NO viajan por ID numérico

Los IDs auto-increment locales no son globales. En todos los payloads se usan **claves de negocio**:

| Entidad | Clave de negocio usada en payload |
|---|---|
| Producto | `codigo_barras` |
| Usuario | `username` |
| Rol | `nombre` |
| Categoría | `nombre` |
| Unidad de medida | `abreviatura` |
| Cliente | `dni_ruc` |
| Venta/Compra/Caja/Kardex | `local_id` + `sucursal_id` (para idempotencia) |
