import Database from '@tauri-apps/plugin-sql';
import { resourceDir, join } from '@tauri-apps/api/path';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    // Obtiene la ruta absoluta a la carpeta de recursos de la app (src-tauri/database/ en dev)
    const resourcePath = await resourceDir();
    const dbPath = await join(resourcePath, 'database', 'inventario.db');
    dbInstance = await Database.load(`sqlite:${dbPath}`);
  }
  return dbInstance;
}
