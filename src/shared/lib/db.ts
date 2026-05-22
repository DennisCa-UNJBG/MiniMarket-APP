import Database from '@tauri-apps/plugin-sql';

let dbInstance: Database | null = null;
let dbPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }
  
  if (!dbPromise) {
    // Tauri busca automáticamente en la carpeta de datos de la aplicación
    // y aplica las migraciones que definimos en Rust (lib.rs)
    dbPromise = Database.load('sqlite:inventario.db').then(db => {
      dbInstance = db;
      return db;
    });
  }
  
  return dbPromise;
}
