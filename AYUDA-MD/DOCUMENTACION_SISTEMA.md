# Documentación del Sistema de Inventario - Minimarket

Este documento describe el estado actual, las funciones de cada vista y las áreas de mejora identificadas en el sistema.

## 1. Estado de las Vistas

| Vista | Estado | Descripción |
| :--- | :--- | :--- |
| **Dashboard** | ✅ Real | Resumen general con KPIs reales de ventas diarias/semanales, alertas de stock bajo y gráficos financieros conectados a la base de datos local. |
| **Caja / POS** | ✅ Real | Punto de venta funcional con validación de stock físico, asociación de clientes y generación automática de movimientos de Kardex. Control de arqueos y sesiones de caja. |
| **Inventario** | ✅ Real | Monitoreo del stock físico en tiempo real desde la base de datos con alertas de stock bajo (semáforo). Vista de solo lectura. |
| **Kardex** | ✅ Real | Auditoría y trazabilidad completa de los movimientos de entrada y salida física con filtros avanzados (fechas, producto, tipo) y exportación a Excel. |
| **Productos** | ✅ Real | Gestión del catálogo maestro (CRUD), categorías asociadas con colores, unidades de medida e historial de precios de compra/venta. |
| **Ventas** | ✅ Real | Historial interactivo de ventas locales, detalles de boleta física, método de pago, anulación de transacciones y reversión automática de stock. |
| **Compras** | ✅ Real | Registro de ingresos de mercadería por lote, actualización automática de costos promedio unitarios y asociación a facturas/boletas. |
| **Clientes** | ✅ Real | Base de datos local de clientes con búsqueda y autocompletado automático vía API externa para DNI/RUC. |
| **Sincronización**| ✅ Real | Módulo de comunicación bidireccional en segundo plano con la Sede Central (envío de ventas, compras, kardex, cajas; recepción de productos, usuarios). |
| **Sucursales** | ✅ Real | Vista exclusiva de la Sede Central para monitorizar el estado de sincronización, stock local, ventas, compras y arqueos de caja históricos de cada sucursal. |
| **Configuración**| ✅ Real | Ajustes esenciales de operación local, ID de la sucursal y URL del servidor de la Sede Central. |

---

## 2. Descripción de Funciones por Módulo

### 📦 Gestión de Productos (`Productos.tsx`)
- **Propósito**: Administrar el catálogo maestro del minimarket.
- **Funciones**:
    - Creación y edición de productos con códigos autogenerados.
    - Gestión de categorías con códigos de colores personalizados.
    - Historial de precios (mantiene trazabilidad de cambios en precio de compra y venta).
    - Asignación de unidades de medida estándar.

### 📊 Control de Inventario (`Inventario.tsx`)
- **Propósito**: Monitoreo en tiempo real del estado físico del almacén.
- **Funciones**:
    - Visualización de stock actual y unidades de medida.
    - Semáforo de stock: En stock (Verde), Bajo Stock (Ámbar), Agotado (Rojo).
    - Filtros de búsqueda rápida.
- **Nota**: Esta vista es de **solo lectura** para asegurar la integridad de los movimientos.

### 🚚 Compras e Ingresos (`Compras.tsx`)
- **Propósito**: Abastecimiento de mercadería y registro de costos.
- **Funciones**:
    - Registro de entrada de productos por lote (afecta stock actual de múltiples ítems en una transacción).
    - Actualización automática del costo promedio de los productos.
    - Registro de documentos de referencia (Facturas/Boletas) para auditoría.

### 💻 Caja / Punto de Venta (POS) (`Caja.tsx` / `POS.tsx`)
- **Propósito**: Registrar ventas rápidas al cliente final y controlar el flujo de dinero local.
- **Funciones**:
    - Apertura y cierre de caja controlando el monto inicial, monto esperado y monto final (arqueo de caja).
    - Validación del stock físico disponible antes de agregar productos al carrito.
    - Selección rápida de clientes y autocompletado por API de DNI/RUC.
    - Generación inmediata de registro en la tabla `ventas` e inserción del movimiento correspondiente en `kardex`.

### 🔄 Sincronización de Datos (`SyncActionsCard.tsx` / `Service.ts`)
- **Propósito**: Conexión bidireccional entre las bases de datos locales SQLite de las sucursales y la base de datos de la Sede Central.
- **Flujo de Datos**:
    - **Sede Central -> Sucursal (Pull)**: Catálogo unificado de productos (precios recomendados), usuarios autorizados y unidades de medida.
    - **Sucursal -> Sede Central (Push)**: Ventas de la sucursal, compras y facturas locales de proveedores, movimientos registrados en Kardex, niveles de stock calculados y sesiones de caja cerradas.

### 🏢 Monitoreo de Sucursales (`Sucursales.tsx`)
- **Propósito**: Permitir que el administrador de la Sede Central supervise la operación remota de cada local.
- **Funciones**:
    - Monitoreo del estado de conexión y última sincronización de cada sucursal.
    - Detalle interactivo para visualizar desde la central el stock local de la sucursal, sus ventas históricas, ingresos de compras y auditoría de Kardex.
    - Visualización completa de los registros de control y arqueos de caja (`cajas`) de cada sucursal para evitar descuadres o fraudes.

---

## 3. Análisis de Mejoras y Redundancias

### 🔍 Redundancias Resueltas
1.  **Inventario vs Kardex**: Separados con éxito. `Inventario` muestra el stock consolidado actual en formato ágil, mientras que `Kardex` sirve como bitácora detallada (auditoría forense de entradas, salidas y ajustes de stock).
2.  **Compras vs Ingreso Individual**: Implementado el registro de compras en lotes utilizando documentos de referencia del proveedor.

### 🛠️ Cosas a Mejorar / Errores Potenciales
1.  **Cola de Sincronización Automática**: Implementar un servicio persistente (worker) en Rust que intente retransmitir datos cuando el internet falle de forma transparente, en lugar de depender únicamente de la acción manual en la UI.
2.  **Reportes Avanzados**: Incorporar visualizaciones gráficas locales (gráficos de barra/pie) del rendimiento de ventas por categoría y productos más vendidos.
3.  **Seguridad y Sesiones**: Restringir el cambio manual de la URL del servidor central y del ID de sucursal en el panel de configuración local únicamente a usuarios con rol de Administrador.

---
*Documento actualizado y validado en producción - 2026-05-21*
