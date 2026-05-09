# 📦 Gestión de Productos

El módulo de **Productos** es el corazón de tu inventario. Aquí es donde defines qué vendes, a qué precio y cómo se clasifica.

![Vista de Productos](./imagenes/productos.png)
*(Imagen sugerida: Captura de la pestaña Productos con la lista de artículos)*

---

## 📑 Pestañas del Módulo

Esta vista se divide en tres secciones fundamentales:

### 1. Pestaña de Productos
Es el listado maestro de tus artículos.
*   **Búsqueda**: Filtra instantáneamente por nombre o código de barras.
*   **Nuevo Producto**: Botón para registrar un nuevo ítem. El sistema genera automáticamente un código correlativo (ej. `PROD-0005`).
*   **Editar**: Permite modificar precios, nombres o categorías.
*   **Desactivar**: Si dejas de vender un producto, puedes desactivarlo. El sistema lo ocultará del POS pero mantendrá su historial.

### 2. Pestaña de Categorías
Organiza tu catálogo (ej. Lácteos, Limpieza, Bebidas).
*   **Colores**: Puedes asignar un color único a cada categoría para identificarla visualmente en el Punto de Venta.
*   **Contador**: Muestra cuántos productos pertenecen a cada categoría.

### 3. Pestaña de Unidades de Medida
Define cómo cuantificas tus productos (ej. Kilogramos, Unidades, Litros, Paquetes).
*   Es esencial para que el stock se muestre correctamente (ej. "50 KG" vs "50 Unidades").

---

## 📝 Paso a Paso: Registrar un Nuevo Producto

1.  Ve a la pestaña **Productos** y haz clic en **"+ Nuevo producto"**.
2.  **Unidad de Medida**: Empieza escribiendo la unidad (ej. "Kilo") y selecciónala de la lista desplegable.
3.  **Nombre**: Ingresa el nombre comercial (ej. "Arroz Costeño Extra 1kg").
4.  **Categoría**: Selecciona la categoría correspondiente.
5.  **Precio de Venta**: Ingresa el precio al que lo venderás al público.
6.  **Stock Mínimo**: ¡Importante! Define cuántas unidades deben quedar para que el sistema te envíe una alerta de reposición.
7.  Haz clic en **"Guardar producto"**.

---

## 🔄 Reactivación de Productos
Si desactivaste un producto por error o ha vuelto a estar disponible, desplázate hasta el final de la tabla de productos. Verás una sección llamada **"Productos desactivados"** donde puedes hacer clic en **"Reactivar"**.

---
> [!IMPORTANT]
> El **Código de Barras** es generado automáticamente por el sistema si no lo ingresas, pero te recomendamos usar el código real del producto si dispones de un lector láser para agilizar las ventas.
