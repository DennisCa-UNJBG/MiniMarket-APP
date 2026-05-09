# 📋 Control de Inventario

La vista de **Inventario** es tu herramienta principal para la supervisión física de tu almacén. A diferencia de la gestión de productos (donde defines las características), aquí te enfocas en las **cantidades**.

![Vista de Inventario](./imagenes/inventario.png)
*(Imagen sugerida: Tabla de inventario mostrando stocks bajos resaltados en ámbar)*

---

## 📈 Indicadores de Estado

En la parte superior verás un resumen rápido del estado de salud de tu stock:
*   **Total Productos**: Cuántos tipos de productos manejas.
*   **Stock Bajo**: Cantidad de productos cuya existencia es menor al "Stock Mínimo" configurado. Estos requieren tu atención inmediata.
*   **Sin Stock**: Productos con saldo cero o negativo.

---

## 🔍 Exploración y Filtrado

1.  **Buscador**: Puedes buscar productos específicos por nombre o código de barras.
2.  **Alertas Visuales**: 
    *   Si un producto tiene **Stock Bajo**, aparecerá un icono de advertencia (⚠️) al lado de la cantidad.
    *   Si un producto está **Sin Stock**, la fila se mostrará en rojo para indicar una falta crítica.
3.  **Estado Detallado**: Cada fila indica claramente si el producto está "En stock", "Stock bajo" o "Sin stock" mediante etiquetas de colores.

---

## 💡 ¿Cuándo usar esta vista?

*   **Auditoría de Pasillo**: Lleva tu laptop o tablet por la tienda y compara el stock que muestra el sistema con lo que ves en los estantes.
*   **Planificación de Pedidos**: Antes de contactar a un proveedor, filtra por "Stock Bajo" para saber qué productos necesitas pedir.
*   **Verificación de Precios**: Puedes ver rápidamente el "Último Costo" (precio de compra) de cada producto para asegurarte de que tu margen de ganancia sigue siendo correcto.

---
> [!NOTE]
> Recuerda que el stock se actualiza automáticamente: disminuye con cada **Venta** y aumenta con cada **Compra** registrada. No necesitas modificarlo manualmente aquí.
