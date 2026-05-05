# Documentación del Sistema de Inventario - Minimarket

Este documento describe el estado actual, las funciones de cada vista y las áreas de mejora identificadas en el sistema.

## 1. Estado de las Vistas

| Vista | Estado | Descripción |
| :--- | :--- | :--- |
| **Dashboard** | 🟠 Estático | Resumen general. Actualmente usa datos de ejemplo. |
| **Caja / POS** | 🟠 Parcial | Interfaz de venta funcional pero usa catálogo estático (no DB). |
| **Inventario** | ✅ Real | Monitoreo de stock actual desde la DB. Alertas de stock bajo. |
| **Kardex** | 🔴 Pendiente | Historial técnico de movimientos. Requiere implementación de UI. |
| **Productos** | ✅ Real | Gestión completa de catálogo (CRUD), categorías y precios. |
| **Ventas** | 🟠 Estático | Historial de ventas realizadas. Usa datos de ejemplo. |
| **Compras** | ✅ Real | Registro de ingresos de mercadería y actualización de stock/costos. |
| **Clientes** | 🟠 Estático | Listado de clientes. Usa datos de ejemplo. |
| **Reportes** | 🟠 Estático | Gráficos y reportes de rendimiento. |
| **Configuración**| 🟠 Estático | Ajustes del sistema y sucursal. |

---

## 2. Descripción de Funciones por Módulo

### 📦 Gestión de Productos (`Productos.tsx`)
- **Propósito**: Administrar el catálogo maestro del minimarket.
- **Funciones**:
    - Creación/Edición de productos con códigos autogenerados.
    - Gestión de categorías con colores personalizados.
    - Historial de precios (mantiene trazabilidad de cambios en precio de venta).
    - Selector de categorías con búsqueda predictiva.

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
    - Registro de entrada de productos (afecta stock actual).
    - Actualización automática del **Costo Unitario** (Precio de Compra).
    - Registro de documentos de referencia (Facturas/Boletas).
    - Historial de inversiones realizadas.

---

## 3. Análisis de Mejoras y Redundancias

### 🔍 Redundancias Identificadas
1.  **Inventario vs Kardex**: Actualmente parecen similares. 
    - *Mejora*: `Inventario` debe quedar como tablero de control (niveles) y `Kardex` como auditoría (quién, cuándo y por qué se movió cada unidad).
2.  **Compras vs Ingreso Individual**: El sistema actual registra compras "producto por producto". 
    - *Mejora*: Implementar "Compras por Lote" donde una sola factura pueda contener múltiples productos.

### 🛠️ Cosas a Mejorar / Errores Potenciales
1.  **Hardcoding de Usuario**: El sistema actualmente asume `usuario_id: 1` (Admin) para todos los registros. Se debe integrar con el sistema de sesiones real.
2.  **Validación de Stock en POS**: La vista de `NuevaVenta` no está validando si hay stock real en la DB antes de permitir la venta.
3.  **Refactorización de `Productos.tsx`**: El archivo es demasiado grande (>500 líneas). Se recomienda extraer componentes como `CategorySelect` y los modales a archivos independientes.
4.  **Integridad Referencial**: Al eliminar una categoría, se debe manejar qué pasa con los productos asociados (actualmente la DB podría impedir la eliminación o dejar productos huérfanos).

### 🚀 Próximos Pasos Sugeridos
1.  **Implementar Kardex Real**: Conectar la vista de Kardex con el `inventarioService.getMovimientos()`.
2.  **Conectar POS a la DB**: Hacer que `NuevaVenta.tsx` cargue productos reales y reste stock al finalizar la venta.
3.  **Módulo de Proveedores**: Crear una tabla de proveedores para que en `Compras` se pueda seleccionar quién vendió la mercadería en lugar de usar un campo de texto libre.

---
*Documento generado automáticamente por Antigravity AI - 2026-05-05*
