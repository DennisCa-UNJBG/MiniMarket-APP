# 🔐 Control de Usuarios y Seguridad

El módulo de **Usuarios** es vital para proteger la integridad de tu información. Aquí defines quién tiene permiso para entrar al sistema y qué acciones puede realizar.

![Vista de Usuarios](./imagenes/usuarios.png)
*(Imagen sugerida: Tabla de usuarios con sus roles y estados activos/inactivos)*

---

## 👤 Perfiles y Roles

El sistema maneja diferentes niveles de acceso para asegurar que cada empleado solo vea lo que necesita:

1.  **Administrador**: Tiene acceso total a todas las vistas, incluyendo configuración, reportes financieros y eliminación de datos.
2.  **Cajero / Vendedor**: Tiene acceso limitado principalmente al Punto de Venta, Inventario y sus propias ventas. No puede modificar configuraciones globales ni ver reportes de rentabilidad avanzada.

---

## ➕ Registro de un Nuevo Usuario

1.  Haz clic en **"Nuevo Usuario"**.
2.  **Usuario (Username)**: El nombre corto para iniciar sesión (ej. `jdoe`).
3.  **Contraseña**: Define una clave segura de al menos 4 caracteres.
4.  **Nombre Completo**: Para que aparezca en los tickets y reportes.
5.  **Rol**: Selecciona si será Administrador o Cajero.
6.  **Sede de Trabajo**: Si manejas múltiples locales, selecciona a cuál pertenece este empleado.

---

## 🛡️ Gestión de Estados

Si un empleado deja de trabajar en tu negocio, **no lo elimines**. En su lugar, cambia su estado a **INACTIVO** haciendo clic sobre su etiqueta de estado en la tabla.
*   **¿Por qué?**: Esto impide que el usuario entre al sistema, pero mantiene su nombre en el historial de ventas y compras pasadas para fines de auditoría.

---

## 🔑 Cambio de Contraseña

Puedes editar cualquier usuario en cualquier momento para actualizar su información o restablecer su contraseña si la olvidó.
*   Solo los administradores pueden cambiar las contraseñas de otros usuarios.
*   Cada usuario puede cambiar su propia contraseña desde la vista de **Configuración**.

---
> [!IMPORTANT]
> Nunca compartas tu cuenta de Administrador con el personal de ventas. Cada cajero debe tener su propio usuario para que, en caso de un descuadre en caja, sepas exactamente quién realizó las operaciones.
