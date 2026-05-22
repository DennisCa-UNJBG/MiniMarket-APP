# Sistema de Control de Inventario para Minimarket (Versión Tauri)

Este documento describe el plan de implementación para el sistema de inventario con soporte para sucursales individuales, sincronización a sede central, control de Kardex, historial de precios y emisión de boletas en PDF, **empaquetado usando Tauri** para un rendimiento óptimo y bajo consumo de recursos.

## Resumen del Proyecto
El objetivo es desarrollar una aplicación de escritorio ultraligera y rápida. El sistema permitirá:
1. Operar el punto de venta (POS) y la gestión de inventario localmente con un consumo de RAM mínimo (gracias a Tauri).
2. Sincronizar transacciones a una API Central en segundo plano.
3. Mantener un control riguroso del inventario mediante un **Kardex**.
4. Mantener un **Historial de Precios**.
5. Emitir y gestionar boletas en formato PDF.

## Arquitectura Propuesta

**Stack Tecnológico:**
*   **Frontend:** Vite + React + Vanilla CSS (Diseño premium y dinámico).
*   **Backend (Core):** Rust (manejado por Tauri).
*   **Base de Datos Local:** SQLite integrado a través del plugin oficial `tauri-plugin-sql`.
*   **Generación de Boletas:** Librería frontend (como `jspdf`) combinada con comandos de Tauri para guardar silenciosamente el PDF en el disco.
*   **Sincronización:** Una función preparada en el frontend que hará peticiones `fetch` enviando JSON a tu URL configurada.

## Estructura de Base de Datos (SQLite)

1.  **`configuracion`**: `id`, `sucursal_id`, `nombre_sucursal`, `api_url_central`.
2.  **`roles`**: `id`, `nombre` (ej. Administrador, Cajero, Almacén), `descripcion`, `permisos` (JSON con accesos, ej: `["crear_venta", "editar_producto"]`), `estado`.
3.  **`usuarios`**: `id`, `username`, `password_hash`, `nombre_completo`, `rol_id`, `estado`, `sucursal_id`.
4.  **`categorias`**: `id`, `nombre`, `color`.
5.  **`productos`**: `id`, `codigo_barras`, `nombre`, `categoria_id`, `unidad_medida`, `unidad_id` (referencia a `unidades_medida`), `stock_minimo`, `stock_actual`, `estado`, `sincronizado`.
6.  **`precios_historial`**: `id`, `producto_id`, `precio_compra`, `precio_venta`, `fecha_inicio`, `fecha_fin`, `activo`.
7.  **`kardex`**: `id`, `producto_id`, `usuario_id`, `fecha`, `tipo_movimiento` (INGRESO, SALIDA, AJUSTE), `cantidad`, `saldo_posterior`, `costo_unitario`, `referencia`, `sucursal_id`, `sincronizado`.
8.  **`compras_ingresos`**: `id`, `usuario_id`, `fecha`, `documento_referencia`, `total`, `sucursal_id`, `metodo_pago`, `estado`, `sincronizado`.
9.  **`ventas`**: `id`, `usuario_id`, `fecha`, `total`, `metodo_pago`, `monto_pagado`, `vuelto`, `sucursal_id`, `estado`, `igv`, `igv_porcentaje`, `cliente_id`, `sincronizado`.
10. **`ventas_detalle`**: `id`, `venta_id`, `producto_id`, `cantidad`, `precio_unitario`, `subtotal`.
11. **`boletas`**: `id`, `venta_id`, `serie`, `numero_correlativo`, `ruta_pdf`, `sucursal_id`, `sincronizado`.
12. **`sucursales`**: `id`, `codigo`, `nombre`, `direccion`, `ip_ultima_conexion`, `ultima_sincronizacion`, `estado`.
13. **`sucursales_stock`**: `id`, `sucursal_id`, `codigo_barras`, `stock`, `ultima_actualizacion`.
14. **`cajas`**: `id`, `usuario_id`, `monto_inicial`, `monto_final`, `fecha_apertura`, `fecha_cierre`, `estado`, `sucursal_id`, `monto_esperado`, `sincronizado`.
15. **`clientes`**: `id`, `nombre`, `dni_ruc`, `telefono`, `email`, `compras`, `total_gastado`, `estado`.
16. **`negocio`**: `id`, `razon_social`, `ruc`, `direccion`, `telefono`, `email`, `logo_path`.
17. **`unidades_medida`**: `id`, `nombre`, `abreviatura`, `estado`.

## Proceso de Desarrollo (Comandos Manuales)

### 1. Inicialización del Proyecto
Como solicitaste ejecutar los comandos manualmente, te proporcionaré los comandos para inicializar un proyecto de Tauri con React y Vite:
*   Crear el proyecto: `npm create tauri-app@latest`
*   Instalar dependencias clave: `react-router-dom`, `lucide-react`, `@tauri-apps/plugin-sql`.

### 2. Configuración del Backend en Rust (`src-tauri`)
*   **`src-tauri/Cargo.toml`**: Añadir el plugin de SQLite.
*   **`src-tauri/src/main.rs`**: Configurar la inicialización de la base de datos y scripts de creación de tablas al abrir la app.

### 3. Desarrollo del Frontend (`src`)
*   **Layout & Estilos:** Interfaz rápida adaptada a pantallas de POS.
*   **Pantallas:** Dashboard, Punto de Venta (POS), Gestor de Productos, Kardex y Reportes.
*   **Capa de Servicios:** Archivos `api.js` o `db.js` que envolverán las llamadas al plugin SQL de Tauri para interactuar con SQLite limpiamente desde React.

## Estado Actual del Desarrollo (Hitos de Implementación)

El sistema ha evolucionado de un prototipo estático a una aplicación de producción completamente funcional. A continuación, se resume el estado de los componentes implementados:

1. **Base de Datos SQLite (17 Tablas Activas):**
   - Configurada localmente en SQLite a través del plugin de Tauri.
   - Incluye el esquema completo con soporte para sucursales (`sucursales`, `sucursales_stock`), control detallado de cajas (`cajas`), clientes (`clientes`), historial de precios (`precios_historial`), facturación y auditorías (`kardex`).

2. **Módulo de Caja y Punto de Venta (POS):**
   - Validación automática de stock antes del registro de productos.
   - Asociación dinámica de clientes y consumo de API externa de DNI/RUC.
   - Gestión integral de flujo de efectivo local a través de aperturas, arqueos y cierres de caja.

3. **Sincronización Bidireccional (`syncService`):**
   - **Pull (Central -> Sucursal):** Descarga de productos maestros actualizados, usuarios del sistema y configuraciones globales.
   - **Push (Sucursal -> Central):** Sincronización robusta de ventas y sus detalles, compras locales por lote, movimientos detallados de Kardex, arqueos de caja cerrados y estadísticas de stock actual.

4. **Kardex e Inventario Real:**
   - Separación exitosa de propósitos: Inventario opera como tablero de consulta rápida del estado actual, y Kardex mantiene una auditoría estricta de movimientos históricos.
   - Implementación de filtros rápidos e interactivos y exportación de reportes a Excel.

5. **Módulo Administrativo de Sucursales (Para Sede Central):**
   - Visualización y supervisión detallada en tiempo real de cada sucursal física.
   - Acceso remoto a registros de stock de la sucursal, historial de ventas, compras e historial de arqueos de caja para auditorías.

---
*Plan de proyecto actualizado y sincronizado con el desarrollo activo - 2026-05-21*
