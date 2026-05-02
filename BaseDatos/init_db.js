const fs = require('fs');
const path = require('path');

// Requerimos la librería sqlite3
const sqlite3 = require('sqlite3').verbose();

// Rutas a los archivos
const schemaPath = path.join(__dirname, 'schema.sql');
const dbPath = path.join(__dirname, 'inventario.db');

console.log("Iniciando la creación de la base de datos con Node/npm...");

try {
    // Leemos el archivo SQL
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Conectamos a la base de datos (se crea automáticamente)
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error("Error al conectar con SQLite:", err.message);
            return;
        }

        // Ejecutamos el script completo
        db.exec(schema, (err) => {
            if (err) {
                console.error("Error ejecutando el schema SQL:", err.message);
            } else {
                console.log(`¡Éxito! Base de datos creada en: ${dbPath}`);
            }
            
            // Cerramos la conexión
            db.close();
        });
    });

} catch (error) {
    console.error("Error general:", error);
}
