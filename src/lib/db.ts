import Database from '@tauri-apps/plugin-sql';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    // Tauri busca automáticamente en la carpeta de datos de la aplicación
    // y aplica las migraciones que definimos en Rust (lib.rs)
    dbInstance = await Database.load('sqlite:inventario.db');
  }
  return dbInstance;
}
