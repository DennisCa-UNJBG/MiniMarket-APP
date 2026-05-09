# ☁️ Sincronización Multi-Sede

El panel de **Sincronización** es el centro de mando para conectar múltiples locales. Permite que toda la información fluya desde las sucursales hacia la Sede Central y viceversa.

![Vista de Sincronización](./imagenes/sincronizacion.png)
*(Imagen sugerida: Panel de sincronización mostrando el estado del servidor central)*

---

## 🏛️ Modo Sede Central (Servidor)

Si esta computadora es la principal (donde el dueño monitorea todo):
1.  **Iniciar Servidor**: Haz clic en el botón azul. La computadora empezará a transmitir datos.
2.  **IP Local**: El sistema te mostrará un número (ej. `192.168.1.15`). Este es el "número telefónico" al que las otras sucursales deben llamar.
3.  **Sucursales Conectadas**: Verás una lista en tiempo real de qué locales están conectados y cuándo fue la última vez que enviaron datos.

---

## 🏬 Modo Sucursal (Local)

Si esta computadora está en una tienda secundaria:
1.  **Configuración Previa**: Asegúrate de haber puesto la URL de la Central en el módulo de **Configuración**.
2.  **Ventas Pendientes**: El sistema te dirá cuántas ventas has realizado que aún no han sido enviadas a la central.
3.  **Sincronizar Ahora**: Al presionar este botón, el sistema realizará cuatro tareas:
    *   **Envía Ventas**: Sube tus tickets realizados.
    *   **Envía Kardex**: Sube el historial de movimientos.
    *   **Envía Stock**: Informa cuánta mercadería te queda.
    *   **Descarga Catálogo**: Baja nuevos productos o cambios de precios creados en la central.

---

## 🔄 Flujo de Trabajo Recomendado

### Para el Administrador (Sede Central):
*   Mantén el servidor activo durante todo el horario de atención para recibir actualizaciones constantes.
*   Crea nuevos productos o cambia precios aquí; las sucursales los descargarán automáticamente.

### Para el Cajero (Sucursal):
*   Realiza una sincronización al abrir la tienda para tener los precios actualizados.
*   Realiza otra sincronización al cerrar la tienda para asegurar que todas tus ventas del día queden respaldadas en la nube/servidor central.

---
> [!NOTE]
> Si no tienes internet o la red local falla, **puedes seguir vendiendo normalmente**. El sistema guardará todo y lo enviará automáticamente la próxima vez que logres conectar con el servidor. ¡Tu negocio nunca se detiene!
