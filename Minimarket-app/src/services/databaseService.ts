import { invoke } from '@tauri-apps/api/core';
import { getDb } from '../lib/db';

export const databaseService = {
  /**
   * Ejecuta una optimización completa de la base de datos (VACUUM)
   * Esto reduce el tamaño del archivo y mejora el rendimiento.
   */
  async optimize() {
    try {
      const db = await getDb();
      await db.execute('VACUUM');
      return true;
    } catch (error) {
      console.error('Error al optimizar BD:', error);
      throw error;
    }
  },

  /**
   * Crea una copia de seguridad del archivo inventario.db
   */
  async backup() {
    try {
      const result = await invoke<string>('backup_database');
      return result;
    } catch (error) {
      console.error('Error al respaldar BD:', error);
      throw error;
    }
  },

  /**
   * Obtiene información básica del archivo de base de datos
   */
  async getDbStats() {
    try {
      const stats = await invoke<{ size: number; path: string }>('get_db_stats');
      return stats;
    } catch (error) {
      return { size: 0, path: 'No disponible' };
    }
  },

  /**
   * Abre el explorador de archivos y selecciona el archivo dado
   */
  async reveal(path: string) {
    try {
      await invoke('reveal_in_explorer', { path });
    } catch (error) {
      console.error('Error al abrir explorador:', error);
    }
  }
};
