# 🖥️ Punto de Venta (POS)

El **Punto de Venta** es la interfaz diseñada para la atención rápida al cliente. Está optimizada para ser utilizada con un escáner de códigos de barras o mediante búsqueda táctil/teclado.

![Vista del Punto de Venta](./imagenes/pos.png)
*(Imagen sugerida: Interfaz dividida con el catálogo a la izquierda y el ticket a la derecha)*

---

## 🏛️ Anatomía de la Pantalla

### 1. Catálogo de Productos (Izquierda)
Aquí puedes ver todos tus productos disponibles:
*   **Buscador Superior**: La herramienta más usada. Escribe el nombre o **escanea el código de barras** del producto. Si el cursor está aquí, el producto se agregará automáticamente al carrito.
*   **Filtro por Categorías**: Botones rápidos para ver solo "Bebidas", "Lácteos", etc.
*   **Tarjetas de Producto**: Muestran el precio y el stock actual. Si un producto está en rojo o dice "Agotado", el sistema no permitirá venderlo para evitar descuadres.

### 2. Ticket Actual (Derecha)
Es el resumen de lo que el cliente está comprando:
*   **Ajuste de Cantidades**: Usa los botones **[+]** y **[-]** para cambiar la cantidad o eliminar un ítem.
*   **Totales**: Cálculo automático de Subtotal, IGV y el Total a pagar.

---

## 💸 Proceso de Cobro (Paso a Paso)

1.  **Agrega los productos**: Escanéalos o búscalos en el catálogo.
2.  **Haz clic en "Cobrar"**: Aparecerá una ventana modal de pago.
3.  **Selecciona el Método**: Elige entre **Efectivo** o **Tarjeta/Yape**.
4.  **Ingresa el Monto Recibido**: Escribe cuánto te está entregando el cliente (ej. un billete de S/ 50.00).
5.  **Verifica el Vuelto**: El sistema te dirá exactamente cuánto dinero debes devolver.
6.  **Confirmar Pago**: Se registrará la venta, se descontará el stock y se generará la boleta.

---

## 🚀 Atajos y Tips para Cajeros

*   **Búsqueda Rápida**: Presiona la barra de búsqueda y empieza a escribir. No necesitas usar el mouse para agregar productos si usas los resultados de búsqueda.
*   **Stock en Vivo**: Si intentas agregar un producto sin stock, el sistema te avisará. Esto evita prometerle al cliente algo que no tienes.
*   **Cajero Responsable**: El nombre del cajero aparece en la parte superior. Asegúrate de que sea tu nombre para que tus ventas se registren correctamente a tu cuenta.

---
> [!CAUTION]
> Asegúrate de que el total a cobrar sea el correcto antes de presionar "Confirmar Pago". Una vez confirmada, la venta ya no se puede modificar desde esta pantalla (deberás ir al historial de ventas para anularla si es necesario).
