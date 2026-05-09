# 🚛 Gestión de Compras

El módulo de **Compras** es donde registras el ingreso de mercadería de tus proveedores. Es fundamental para mantener tu inventario actualizado y conocer tu inversión real.

![Vista de Compras](./imagenes/compras.png)
*(Imagen sugerida: Formulario de registro de compra masiva con lista de productos)*

---

## 🏗️ Registro de Compras por Lote

A diferencia de una venta, una compra suele involucrar muchos productos diferentes de un solo proveedor. El sistema te permite registrar todo en un solo "Lote".

### Pasos para registrar una compra:

1.  **Datos del Documento**:
    *   Ingresa el **N° de Documento** (Boleta o Factura del proveedor). Esto te servirá para referencias futuras.
    *   **IGV**: Si la factura incluye impuestos, activa el interruptor de IGV para que los cálculos sean exactos.
2.  **Agregar Productos**:
    *   Busca el producto en el campo **"PRODUCTO"**.
    *   Ingresa la **CANTIDAD** que estás recibiendo.
    *   Ingresa el **COSTO U.** (cuánto te costó cada unidad). El sistema recordará este costo para tus reportes de utilidad.
    *   Presiona el botón **[+]** para agregarlo a la lista del lote.
3.  **Verificación Final**:
    *   Revisa la tabla inferior para asegurarte de que las cantidades y costos sean correctos.
    *   Puedes editar o eliminar ítems de la lista antes de finalizar.
4.  **Completar Registro**: Haz clic en el botón grande **"Completar Registro"**.

---

## ⚡ ¿Qué sucede al guardar una compra?

Cuando finalizas el registro, el sistema realiza tres acciones automáticas:
1.  **Aumenta el Stock**: Las unidades se suman inmediatamente al inventario.
2.  **Genera un Movimiento**: Se crea un registro de tipo "INGRESO" en el **Kardex**.
3.  **Actualiza Costos**: El "Último Costo" del producto se actualiza con el valor ingresado, lo cual es vital para saber cuánto dinero realmente estás ganando en cada venta posterior.

---

## 🔍 Consulta de Compras Pasadas

En la pantalla principal de este módulo verás el historial de todas las compras realizadas.
*   **Tarjetas Resumen**: Muestran el total de compras realizadas y la inversión total acumulada.
*   **Ver Detalle**: Puedes abrir cualquier compra pasada para ver exactamente qué productos entraron en esa fecha y a qué costo.

---
> [!NOTE]
> Registrar tus compras no solo sirve para el inventario, sino para tener un control financiero de tu negocio. ¡No omitas ninguna compra para que tus reportes de ganancias sean reales!
