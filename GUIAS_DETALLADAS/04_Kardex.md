# 📜 Kardex de Inventario

El **Kardex** es el registro histórico e inmutable de todos los movimientos de tu mercadería. Es la herramienta definitiva para auditorías y para entender por qué el stock de un producto es el que es.

![Vista del Kardex](./imagenes/kardex.png)
*(Imagen sugerida: Tabla del Kardex mostrando ingresos y salidas con sus respectivos colores)*

---

## 🧭 Estructura del Movimiento

Cada fila en el Kardex representa un evento único y contiene:
*   **Fecha y Hora**: Cuándo ocurrió exactamente el movimiento.
*   **Tipo de Movimiento**:
    *   🟢 **INGRESO**: Entrada de productos (usualmente por una Compra).
    *   🔴 **SALIDA**: Venta de productos al cliente.
    *   🟠 **AJUSTE**: Cambios manuales realizados por administración.
*   **Concepto / Motivo**: Explica el origen (ej: "Venta #00015" o "Compra Factura F001").
*   **Cantidad**: El número de unidades que entraron (+) o salieron (-).
*   **Stock Resultante**: Cuánto quedó en el almacén **después** de ese movimiento específico.
*   **Usuario**: Quién fue el responsable de realizar la operación.

---

## 🛠️ Herramientas de Análisis

### 1. Filtrado por Producto
Esta es la función más potente. Puedes seleccionar un producto específico para ver su "hoja de vida".
*   Verás un **Resumen de Movimientos** con el total de entradas, total de salidas y el balance final.

### 2. Rango de Fechas
Puedes auditar qué pasó en un día específico, una semana o un mes completo.

### 3. Exportación a CSV
Puedes descargar los datos visualizados en un archivo Excel/CSV. Esto es útil para:
*   Contabilidad externa.
*   Análisis avanzado en hojas de cálculo.

---

## 🕵️ ¿Cómo detectar errores?

Si notas que falta mercadería:
1.  Busca el producto en el **Kardex**.
2.  Observa el **Stock Resultante** paso a paso.
3.  Identifica si hubo salidas que no coinciden con ventas reales o si se omitió registrar una compra.

---
> [!IMPORTANT]
> El Kardex es la "verdad absoluta" del sistema. Si el Kardex dice que hubo una salida por venta, es porque se emitió un ticket. Si no hay ticket y falta producto, se trata de una pérdida física no registrada.
