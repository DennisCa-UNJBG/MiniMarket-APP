# Base de Datos del Sistema de Inventario

Esta carpeta contiene el esquema inicial (`schema.sql`) y los scripts necesarios para generar la base de datos local SQLite (`inventario.db`) de la aplicación.

## ¿Cómo generar el archivo `inventario.db`?

Para generar la base de datos usando el ecosistema de JavaScript (Node.js / npm), primero debes asegurarte de instalar la librería necesaria y luego ejecutar el script `init_db.js`.

Ejecuta en tu terminal:
```bash
npm install
node init_db.js
```

---

## ⚠️ ¡PASO MUY IMPORTANTE! (Mover a Tauri)

Una vez que hayas ejecutado cualquiera de los scripts anteriores, se generará un nuevo archivo llamado **`inventario.db`** en esta misma carpeta. 

Dado que nuestra aplicación está empaquetada con Tauri, **DEBES MOVER ESTE ARCHIVO MANUALMENTE** para que el backend de Rust lo pueda leer y empaquetar correctamente.

Sigue estos pasos:
1. Corta el archivo generado `inventario.db`.
2. Ve a la ruta del proyecto principal: `Minimarket-app/src-tauri/`
3. Si no existe, crea una nueva carpeta llamada **`database`**.
4. Pega el archivo `inventario.db` dentro de esa carpeta.

La ruta final del archivo debe ser exactamente esta:
`Minimarket-app/src-tauri/database/inventario.db`

De esta forma, la aplicación de escritorio tendrá acceso directo a las tablas iniciales que creamos en el esquema.
