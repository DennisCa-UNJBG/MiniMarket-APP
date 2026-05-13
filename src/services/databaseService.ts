import { invoke } from '@tauri-apps/api/core';
import { getDb } from '../lib/db';

export const databaseService = {
  /**
   * Ejecuta una optimización completa de la base de datos (VACUUM)
   * Esto reduce el tamaño del archivo y mejora el rendimiento.
   */
  async optimize() {
    const db = await getDb();
    await db.execute('VACUUM');
    return true;
  },

  /**
   * Crea una copia de seguridad del archivo inventario.db
   */
  async backup() {
    const result = await invoke<string>('backup_database');
    return result;
  },

  /**
   * Obtiene información básica del archivo de base de datos
   */
  async getDbStats() {
    return await invoke<{ size: number; path: string }>('get_db_stats');
  },

  /**
   * Abre el explorador de archivos y selecciona el archivo dado
   */
  async reveal(path: string) {
    await invoke('reveal_in_explorer', { path });
  }
};
