const fs = require('fs');
const path = require('path');

// Requerimos la librería sqlite3
const sqlite3 = require('sqlite3').verbose();

// Rutas a los archivos
const schemaPath = path.join(__dirname, 'schema.sql');
const dbPath = path.join(__dirname, '../Minimarket-app/src-tauri/database/inventario.db');

console.log("Iniciando la creación de la base de datos con Node/npm...");

try {
    // Si existe el archivo, lo eliminamos para asegurar una creación limpia
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log("Archivo previo eliminado.");
    }

    // Leemos el archivo SQL
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Conectamos a la base de datos (se crea automáticamente)
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error("Error al conectar con SQLite:", err.message);
            return;
        }

        console.log("Conectado a SQLite. Ejecutando schema...");
        
        // Ejecutamos el script completo
        db.exec(schema, (err) => {
            if (err) {
                console.error("Error ejecutando el schema SQL:", err.message);
            } else {
                console.log(`¡Éxito! Base de datos creada en: ${dbPath}`);
            }
            
            // Cerramos la conexión
            db.close((err) => {
                if (err) console.error("Error al cerrar la DB:", err.message);
                else console.log("Conexión cerrada.");
            });
        });
    });

} catch (error) {
    console.error("Error general:", error);
}
