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
   │──── PUSH logs de auditoría ────────────►│
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

> ℹ️ **Nota:** El endpoint `POST /api/logs-sync` **sí forma parte del flujo de sincronización principal**. Los logs de auditoría son enviados desde cada sucursal a la sede central para centralizar el historial de acciones de todas las sedes.

---

## Autenticación

Todos los endpoints requieren el header:
```
X-Sucursal-Key: <codigo_sucursal_cifrado_hex>
```

> ⚠️ **Seguridad — Cifrado del Header:** El código de sucursal **NO viaja en texto plano**. La sucursal aplica un cifrado simétrico XOR antes de enviarlo y la central lo descifra antes de validarlo.

**Algoritmo de cifrado (TypeScript — sucursal):**
```typescript
// Archivo: src/shared/lib/syncUtils.ts (exportado también desde sincronizacion/Service.ts)
export function encryptBranchCode(code: string): string {
  const baseKey = import.meta.env.VITE_SYNC_KEY || "MiniMarket-Secure-Sync-Key-2026";
  const encryptedBytes = [...code].map((char, i) => {
    return char.charCodeAt(0) ^ baseKey.charCodeAt(i % baseKey.length);
  });
  return encryptedBytes.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Descifrado en la central (Rust):**
```rust
// src-tauri/src/api/mod.rs
fn decrypt_branch_code(hex: &str) -> Result<String, ()> {
  let base_key = b"MiniMarket-Secure-Sync-Key-2026";
  // Decodificar hex → bytes → XOR con base_key → String
}
```

La clave de sincronización está configurada en `tauri.conf.json → plugins.sync.key`.
Si el código descifrado no existe en la tabla `sucursales` con `estado = 'activo'` → `401 Unauthorized`.

---

## Puerto del Servidor Central

El servidor HTTP de la central escucha en el puerto configurado en `tauri.conf.json`:

```json
// src-tauri/tauri.conf.json
{
  "plugins": {
    "sync": {
      "key": "MiniMarket-Secure-Sync-Key-2026",
      "port": 8080
    }
  }
}
```

Si el campo `port` no existe, se usa `8080` como valor por defecto. Las sucursales apuntan a `http://<IP_CENTRAL>:<PUERTO>`.

---

## Timeouts en Peticiones HTTP

Todas las llamadas desde la sucursal hacia la central usan el helper `fetchWithTimeout` (timeout por defecto: **15 segundos**):

```typescript
// src/shared/lib/fetch.ts
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 15000, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  // ...
}
```

Si el servidor no responde en 15 segundos, se lanza un error de timeout y la sincronización se aborta.

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

**Headers:** `X-Sucursal-Key` (cifrado XOR en hex)

**Respuesta 200:**
```json
{
  "ok": true,
  "data": [
    {
      "codigo_barras": "7750095131003",
      "nombre": "Arroz Extra Superiora 1kg",
      "categoria": "Abarrotes",
      "unidad_nombre": "Kilogramo",
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
  u.nombre   AS unidad_nombre,
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

La sucursal aplica los productos en una **transacción única** para mayor rendimiento y atomicidad:

1. Pre-carga `catMap` y `unitMap` (Maps indexados para lookups O(1))
2. Inserta categorías y unidades faltantes secuencialmente
3. Hace upsert de cada producto por `codigo_barras`

```sql
-- Upsert por codigo_barras (nunca por id)
SELECT id FROM productos WHERE codigo_barras = ?;
-- Si existe: UPDATE, si no: INSERT
UPDATE productos SET nombre = ?, categoria_id = ?, unidad_id = ?, stock_minimo = ? WHERE id = ?;
-- O bien:
INSERT INTO productos (codigo_barras, nombre, categoria_id, unidad_id, stock_minimo, estado)
VALUES (?, ?, ?, ?, ?, ?);
```

---

### GET /api/usuarios

Descarga la lista de usuarios activos.

> ⚠️ **Seguridad — Contraseñas en tránsito:** El campo `password_hash` (hash bcrypt) viaja **cifrado con XOR por usuario**, usando una clave derivada de `baseKey + username`. La sucursal recibe el hex cifrado y lo descifra localmente antes de almacenarlo.

**Respuesta 200:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 3,
      "username": "cajero1",
      "password_hash": "<hex_cifrado_xor>",
      "nombre_completo": "Juan Pérez",
      "rol_id": 2,
      "rol_nombre": "Cajero",
      "sucursal_id": "SUC001",
      "estado": "activo"
    }
  ]
}
```

**Cómo aplica la sucursal los cambios (resolución de conflictos):**

La sucursal usa lógica de tres vías para evitar conflictos de ID/username:

```typescript
// Para cada usuario de la central:
const userByUsername = await db.select('SELECT id FROM usuarios WHERE username = ?', [u.username]);
const userById      = await db.select('SELECT username FROM usuarios WHERE id = ?', [u.id]);

if (userByUsername.length > 0) {
  // Username coincide → actualizar todos los campos (incluyendo ID central)
  await db.execute('UPDATE usuarios SET id=?, password_hash=?, ... WHERE username=?', [...]);
} else if (userById.length > 0) {
  // ID ya existe con otro username → renombrar username y actualizar datos
  await db.execute('UPDATE usuarios SET username=?, password_hash=?, ... WHERE id=?', [...]);
} else {
  // No existe → insertar limpiamente con el ID de la central
  await db.execute('INSERT INTO usuarios (id, username, password_hash, ...) VALUES (?, ?, ?, ...)', [...]);
}
```

Todo dentro de una **transacción SQLite** (`BEGIN TRANSACTION / COMMIT / ROLLBACK`).

---

### GET /api/roles

Descarga los roles y sus permisos.

**Respuesta 200:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 2,
      "nombre": "Cajero",
      "descripcion": "Realiza ventas y visualiza productos",
      "permisos": "[\"pos\", \"ventas\", \"productos\"]",
      "estado": "activo"
    }
  ]
}
```

**Cómo aplica la sucursal:**

Upsert por `id` dentro de transacción:
```sql
-- Si existe por ID: UPDATE
UPDATE roles SET nombre=?, descripcion=?, permisos=?, estado=? WHERE id=?;
-- Si no: INSERT con el ID de la central
INSERT INTO roles (id, nombre, descripcion, permisos, estado) VALUES (?, ?, ?, ?, ?);
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
    { "id": 1, "nombre": "Kilogramo", "abreviatura": "KG", "estado": "activo" }
  ]
}
```

**Cómo aplica la sucursal:**

Upsert por `id` dentro de transacción:
```sql
UPDATE unidades_medida SET nombre=?, abreviatura=?, estado=? WHERE id=?;
-- o INSERT con el ID de la central
INSERT INTO unidades_medida (id, nombre, abreviatura, estado) VALUES (?, ?, ?, ?);
```

---

## ENDPOINTS DE PUSH (Sucursal → Central)

---

### POST /api/sincronizar — Ventas

Envía las ventas pendientes (`sincronizado = 0`).

**Headers:** `X-Sucursal-Key` (cifrado XOR), `Content-Type: application/json`

**Body:**
```json
{
  "sucursal_id": "SUC001",
  "ventas": [
    {
      "id_local": 45,
      "fecha": "2025-05-20T10:30:00",
      "total": 150.50,
      "usuario_id": 3,
      "metodo_pago": "EFECTIVO",
      "estado": "completado",
      "detalles": [
        {
          "codigo_barras": "7750095131003",
          "cantidad": 3,
          "precio_unitario": 50.00,
          "subtotal": 150.00
        }
      ]
    }
  ]
}
```

> ℹ️ **Nota:** Los campos `cliente_dni_ruc`, `igv`, `igv_porcentaje`, `monto_pagado` y `vuelto` se omiten si no están disponibles. Solo se envían los campos mínimos requeridos.

**Lógica en la central (idempotencia):**
```sql
-- Antes de insertar, verificar si ya existe por (sucursal_id + id_local)
SELECT id FROM ventas WHERE sucursal_id = ? AND sucursal_local_id = ?;
-- Si no existe: INSERT
-- Si ya existe: verificar si el estado cambió (p.ej. anulación) y UPDATE si difiere
```

**Respuesta 200:**
```json
{ "ok": true, "procesadas": 3, "duplicadas": 0 }
```

**Marcado local tras éxito:**
```sql
UPDATE ventas SET sincronizado = 1 WHERE id = ?;
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
      "id_local": 12,
      "producto_codigo_barras": "7750095131003",
      "usuario_id": 3,
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
   ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
      "id_local": 8,
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

Envía sesiones de caja cerradas (`estado = 'cerrada' AND sincronizado = 0`).

**Body:**
```json
{
  "sucursal_id": "SUC001",
  "cajas": [
    {
      "id_local": 3,
      "usuario_id": 3,
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

Envía los registros de auditoría pendientes (`sincronizado = 0`) en **orden cronológico** (`ORDER BY created_at ASC`).

**Headers:** `X-Sucursal-Key` (cifrado XOR), `Content-Type: application/json`

**Body:**
```json
{
  "sucursal_id": "SUC001",
  "logs": [
    {
      "id_local": 88,
      "usuario_id": 3,
      "accion": "REGISTRO_VENTA",
      "tabla": "ventas",
      "registro_id": 45,
      "detalles": "Venta #00045 registrada por S/ 150.50",
      "created_at": "2025-05-20T10:30:00"
    }
  ]
}
```

**Lógica en la central (idempotencia):**
```sql
-- Verificar si ya existe el log por (sucursal_id + id_local)
SELECT id FROM logs WHERE sucursal_id = ? AND sucursal_local_id = ?;
-- Si no existe: INSERT preservando el created_at original
INSERT INTO logs (usuario_id, sucursal_id, sucursal_local_id, accion, tabla, registro_id, detalles, sincronizado, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?);
```

> ℹ️ **Clave de idempotencia:** `sucursal_id + sucursal_local_id` (ID local del log en la sucursal).  
> Esto requiere la columna `sucursal_local_id` en la tabla `logs`. La **migración v2** la agrega en BD existentes.

**Respuesta 200:**
```json
{ "status": "ok", "mensaje": "88 logs de auditoría sincronizados", "procesados": 88 }
```

**Marcado local tras éxito:**
```sql
UPDATE logs SET sincronizado = 1 WHERE id = ?;
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

## Orden de sincronización (syncAllData)

El método `syncAllData()` ejecuta todas las operaciones de forma **secuencial y estricta**, no en paralelo. Esto es intencional para evitar bloqueos de escritura en SQLite local (`SQLITE_BUSY`).

```
FASE 1 — PUSH (en orden, si uno falla se aborta todo):
  1. pushSales()          → POST /api/sincronizar
  2. pushKardex()         → POST /api/kardex-sync
  3. pushCajas()          → POST /api/cajas-sync
  4. pushCompras()        → POST /api/compras-sync
  5. pushLogs()           → POST /api/logs-sync
  6. pushStockLevels()    → POST /api/stock-update  (siempre al final)

FASE 2 — PULL (en orden, dependencias de integridad referencial):
  1. pullProducts()       → GET /api/productos       (incluye categorías/unidades faltantes)
  2. pullUsers()          → GET /api/usuarios
  3. pullRoles()          → GET /api/roles
  4. pullUnidadesMedida() → GET /api/unidades-medida
```

> El orden del PULL importa porque los productos dependen de categorías y unidades.
> Si se insertan en orden incorrecto, los `categoria_id` y `unidad_id` podrían no existir aún.

> ⚠️ **Nota sobre transacciones:** Cada método de pull ejecuta sus operaciones de escritura SQLite dentro de un bloque `BEGIN TRANSACTION / COMMIT / ROLLBACK` para garantizar atomicidad y rendimiento en inserciones por lotes.

---

## ENDPOINTS DE CREACIÓN (Sucursal solicita → Central crea)

---

### POST /api/productos

Crea un nuevo producto en la central de manera síncrona.

**Headers:** `X-Sucursal-Key` (cifrado XOR), `Content-Type: application/json`

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
   - El header X-Sucursal-Key se cifra con XOR antes de enviarse.
4. La Central procesa la solicitud:
     - Descifra el header X-Sucursal-Key y valida la sucursal en BD.
     - Valida la integridad y unicidad de los datos.
     - Si los datos son válidos, los inserta en su BD local y genera el ID canónico.
     - Retorna el registro completo con estado de éxito (201 Created).
     - Si no son válidos (ej. código duplicado), retorna un error (400 Bad Request o 409 Conflict).
5. La Sucursal recibe la respuesta:
     - Si la creación fue exitosa (ok: true):
         * Inserta/Actualiza de inmediato el registro en su base de datos local.
         * Muestra mensaje de éxito y actualiza la pantalla.
     - Si hubo un error en la Central (ok: false):
         * Muestra el mensaje de error devuelto por la central al usuario en la UI.
```

---

## Tabla de responsabilidades

| Tabla | Dueño de los datos | Dirección | Conflict resolution |
|---|---|---|---|
| `ventas`, `ventas_detalle` | Sucursal | PUSH | Idempotencia por `sucursal_id + id_local`; actualiza estado si cambia (anulación) |
| `compras_ingresos`, `compras_detalle` | Sucursal | PUSH | Idempotencia por `sucursal_id + id_local` |
| `kardex` | Sucursal | PUSH | `INSERT OR IGNORE` por `sucursal_id + id_local` |
| `cajas` | Sucursal | PUSH | `INSERT OR IGNORE` por `sucursal_id + id_local` |
| `logs` | Sucursal | PUSH | `INSERT OR IGNORE` por `sucursal_id + sucursal_local_id`; preserva `created_at` original |
| `sucursales_stock` | Central (alimentada por sucursales) | PUSH | Última lectura reemplaza anterior |
| `productos`, `precios_historial` | **Central** | PULL + CREAR | Upsert por `codigo_barras` dentro de transacción (síncrono online) |
| `usuarios` | **Central** | PULL + CREAR | Resolución por username → ID → INSERT (síncrono online, contraseñas cifradas en tránsito) |
| `roles` | **Central** | PULL + CREAR | Upsert por `id` dentro de transacción (síncrono online) |
| `categorias` | **Central** | PULL + CREAR | Upsert por `nombre` dentro de transacción (síncrono online) |
| `unidades_medida` | **Central** | PULL + CREAR | Upsert por `id` dentro de transacción; índice por abreviatura para O(1) |

---

## Manejo de errores y reintentos

| Escenario | Comportamiento |
|---|---|
| Red cortada antes de confirmar (PUSH) | La sucursal NO marca `sincronizado = 1` → reintenta en la próxima sync |
| Timeout de 15s (PUSH / PULL) | `fetchWithTimeout` lanza error → sync abortada, se muestra mensaje al usuario |
| Central devuelve error 5xx (PUSH) | La sucursal lanza excepción → sync abortada (secuencial estricto) |
| Registro duplicado en central (PUSH) | Idempotencia: se detecta y omite → `procesadas: N, duplicadas: M` |
| Producto desconocido en central (PUSH) | La central ignora ese ítem e informa en el campo `errores` de la respuesta |
| Sucursal con clave inválida (General) | `401 Unauthorized` → la sucursal muestra error de conexión |
| Sin red al crear maestro (CREAR) | Petición síncrona falla inmediatamente. La sucursal aborta y muestra error offline. |
| Error de validación/duplicado (CREAR) | Central retorna `400 Bad Request` o `409 Conflict`. Sucursal aborta y muestra error en UI. |
| Error en PUSH durante syncAllData | El error se propaga inmediatamente y se abortan todos los PULL subsiguientes |

---

## Campos que NO viajan por ID numérico

Los IDs auto-increment locales no son globales. En todos los payloads se usan **claves de negocio**:

| Entidad | Clave de negocio usada en payload |
|---|---|
| Producto | `codigo_barras` |
| Usuario | `username` (en CREAR); upsert por `id` central en PULL |
| Rol | `nombre` (en CREAR); upsert por `id` central en PULL |
| Categoría | `nombre` |
| Unidad de medida | `abreviatura` (en CREAR); upsert por `id` central en PULL |
| Cliente | `dni_ruc` |
| Venta/Compra/Caja/Kardex | `id_local` + `sucursal_id` (para idempotencia) |
