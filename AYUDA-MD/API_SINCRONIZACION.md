# API de Sincronización Multi-Sede

## Visión General

El sistema usa tres tipos de operaciones:

- **PUSH** → la sucursal envía sus transacciones a la central
- **PULL** → la sucursal pide el catálogo actualizado a la central
- **CREAR** → la sucursal solicita de manera síncrona que la central cree un registro maestro (requiere estar online)

> ⚠ **Regla fundamental:** Solo la Sede Central puede crear registros en las tablas
> `productos`, `categorias`, `unidades_medida`, `usuarios` y `roles`.
> Las sucursales **no pueden crear estos registros de forma local ni trabajar en modo offline** para estos puntos; dependen de una conexión activa con la Sede Central para solicitar su creación y guardar de inmediato el resultado en su base de datos local.

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

### POST /api/productos

Crea un nuevo producto en la central de manera síncrona.

**Headers:** `X-Sucursal-Key`, `Content-Type: application/json`

**Body:**
```json
{
  "codigo_barras": "7750095131004",
  "nombre": "Leche Gloria 1L",
  "categoria_nombre": "Lácteos",
  "unidad_abreviatura": "LT",
  "stock_minimo": 5,
  "precio_compra": 4.50,
  "precio_venta": 6.00
}
```

**Lógica en la central:**
```sql
INSERT INTO productos (codigo_barras, nombre, categoria_id, unidad_id, stock_minimo, estado)
VALUES (
  ?,
  ?,
  (SELECT id FROM categorias     WHERE nombre    = ?),
  (SELECT id FROM unidades_medida WHERE abreviatura = ?),
  ?, 'activo'
);
-- Luego insertar precio en precios_historial con activo = 1 y asociarlo al producto creado
```

**Respuesta 201 Created:**
```json
{
  "ok": true,
  "data": {
    "id": 45,
    "codigo_barras": "7750095131004",
    "nombre": "Leche Gloria 1L",
    "categoria_id": 3,
    "unidad_id": 2,
    "stock_minimo": 5.0,
    "estado": "activo",
    "precio_compra": 4.50,
    "precio_venta": 6.00
  }
}
```

---

### POST /api/categorias

Crea una nueva categoría.

**Body:**
```json
{
  "nombre": "Congelados",
  "color": "#3b82f6"
}
```

**Respuesta 201 Created:**
```json
{
  "ok": true,
  "data": {
    "id": 8,
    "nombre": "Congelados",
    "color": "#3b82f6",
    "estado": "activo"
  }
}
```

---

### POST /api/unidades-medida

Crea una nueva unidad de medida.

**Body:**
```json
{
  "nombre": "Gramo",
  "abreviatura": "GR"
}
```

**Respuesta 201 Created:**
```json
{
  "ok": true,
  "data": {
    "id": 6,
    "nombre": "Gramo",
    "abreviatura": "GR",
    "estado": "activo"
  }
}
```

---

### POST /api/usuarios

Crea un nuevo usuario en el sistema.

**Body:**
```json
{
  "username": "cajero3",
  "password": "contraseña_en_texto",
  "nombre_completo": "Carlos Quispe",
  "rol_nombre": "Cajero",
  "sucursal_id": "SUC001"
}
```

**Respuesta 201 Created:**
```json
{
  "ok": true,
  "data": {
    "id": 12,
    "username": "cajero3",
    "nombre_completo": "Carlos Quispe",
    "rol_id": 2,
    "sucursal_id": "SUC001",
    "estado": "activo"
  }
}
```

---

### POST /api/roles

Crea un nuevo rol con permisos específicos.

**Body:**
```json
{
  "nombre": "Supervisor",
  "descripcion": "Supervisión de operaciones",
  "permisos": ["ventas", "reportes", "kardex", "inventario"]
}
```

**Respuesta 201 Created:**
```json
{
  "ok": true,
  "data": {
    "id": 4,
    "nombre": "Supervisor",
    "descripcion": "Supervisión de operaciones",
    "permisos": "[\"ventas\",\"reportes\",\"kardex\",\"inventario\"]",
    "estado": "activo"
  }
}
```

---

## Flujo de Creación Síncrono (Online Only)

Las creaciones de registros maestros están prohibidas en modo offline para evitar inconsistencias de datos.

```
1. El usuario intenta crear un registro maestro (ej. Producto) desde la UI de la Sucursal.
2. La Sucursal verifica si tiene conexión activa a la Sede Central.
     - Si NO hay conexión:
         * Bloquea la acción en la interfaz.
         * Muestra un mensaje: "Operación no disponible en modo offline. Debe conectarse a la Sede Central."
     - Si SÍ hay conexión:
         * Procede al paso 3.
3. La Sucursal envía una solicitud HTTP POST síncrona al endpoint de la Sede Central (ej. POST /api/productos).
4. La Central procesa la solicitud:
     - Valida la integridad y unicidad de los datos.
     - Si los datos son válidos, los inserta en su BD local y genera el ID canónico.
     - Retorna el registro completo con estado de éxito (201 Created).
     - Si no son válidos (ej. código duplicado), retorna un error (400 Bad Request o 409 Conflict).
5. La Sucursal recibe la respuesta:
     - Si la creación fue exitosa (ok: true):
         * Inserta/Actualiza de inmediato el registro en su base de datos local (ej. INSERT OR REPLACE INTO productos).
         * Muestra mensaje de éxito y actualiza la pantalla.
     - Si hubo un error en la Central (ok: false):
         * Muestra el mensaje de error devuelto por la central al usuario en la UI.
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
| `productos`, `precios_historial` | **Central** | PULL + CREAR | Central siempre gana — `INSERT OR REPLACE` (síncrono online) |
| `usuarios` | **Central** | PULL + CREAR | Central siempre gana — upsert por username (síncrono online) |
| `roles` | **Central** | PULL + CREAR | Central siempre gana — upsert por nombre (síncrono online) |
| `categorias` | **Central** | PULL + CREAR | Central siempre gana — upsert por nombre (síncrono online) |
| `unidades_medida` | **Central** | PULL + CREAR | Central siempre gana — upsert por abreviatura (síncrono online) |

---

## Manejo de errores y reintentos

| Escenario | Comportamiento |
|---|---|
| Red cortada antes de confirmar (PUSH) | La sucursal NO marca `sincronizado = 1` → reintenta en la próxima sync |
| Central devuelve error 5xx (PUSH) | La sucursal registra el error en `sync_log` y reintenta |
| Registro duplicado en central (PUSH) | `INSERT OR IGNORE` → la central lo ignora silenciosamente, devuelve `duplicadas: N` |
| Producto desconocido en central (PUSH) | La central ignora ese ítem y lo incluye en el campo `errores` de la respuesta |
| Sucursal con clave inválida (General) | `401 Unauthorized` → la sucursal muestra error de conexión |
| Sin red al crear maestro (CREAR) | Petición síncrona falla inmediatamente. La sucursal aborta y muestra error offline. |
| Error de validación/duplicado (CREAR) | Central retorna `400 Bad Request` o `409 Conflict`. Sucursal aborta y muestra error en UI. |

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
