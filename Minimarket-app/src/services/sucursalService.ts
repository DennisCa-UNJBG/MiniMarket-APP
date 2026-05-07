import { getDb } from '../lib/db';

export interface SucursalConfig {
  id?: number;
  sucursal_id: string;
  nombre_sucursal: string;
  api_url_central: string;
}

export const sucursalService = {
  /**
   * Obtiene la configuración de la sucursal actual
   */
  async getConfig(): Promise<SucursalConfig | null> {
    try {
      const db = await getDb();
      const results = await db.select<SucursalConfig[]>(
        'SELECT * FROM configuracion LIMIT 1'
      );
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error al obtener config sucursal:', error);
      return null;
    }
  },

  /**
   * Guarda o actualiza la configuración
   */
  async saveConfig(config: SucursalConfig) {
    try {
      const db = await getDb();
      const existing = await this.getConfig();

      if (existing) {
        await db.execute(
          'UPDATE configuracion SET sucursal_id = $1, nombre_sucursal = $2, api_url_central = $3 WHERE id = $4',
          [config.sucursal_id, config.nombre_sucursal, config.api_url_central, existing.id]
        );
      } else {
        await db.execute(
          'INSERT INTO configuracion (sucursal_id, nombre_sucursal, api_url_central) VALUES ($1, $2, $3)',
          [config.sucursal_id, config.nombre_sucursal, config.api_url_central]
        );
      }
      return true;
    } catch (error) {
      console.error('Error al guardar config sucursal:', error);
      throw error;
    }
  },

  /**
   * Simula una prueba de conexión a la sede central
   */
  async testConnection(url: string, sucursalCodigo: string) {
    try {
      const response = await fetch(`${url}/api/productos`, {
        method: 'GET',
        headers: {
          'X-Sucursal-Key': sucursalCodigo
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error de conexión');
      }

      return true;
    } catch (error: any) {
      throw new Error(error.message || 'No se pudo establecer conexión con la sede central.');
    }
  },

  /**
   * Obtiene todas las sucursales registradas (Solo para Sede Principal)
   */
  async getAll(): Promise<any[]> {
    try {
      const db = await getDb();
      return await db.select('SELECT * FROM sucursales ORDER BY nombre ASC');
    } catch (error) {
      console.error('Error al obtener sucursales:', error);
      return [];
    }
  },

  /**
   * Registra una nueva sucursal (Solo desde Sede Principal)
   */
  async create(sucursal: { codigo: string; nombre: string; direccion?: string }) {
    try {
      const db = await getDb();
      await db.execute(
        'INSERT INTO sucursales (codigo, nombre, direccion) VALUES ($1, $2, $3)',
        [sucursal.codigo, sucursal.nombre, sucursal.direccion || '']
      );
      return true;
    } catch (error) {
      console.error('Error al crear sucursal:', error);
      throw error;
    }
  },

  /**
   * Actualiza una sucursal existente
   */
  async update(id: number, sucursal: { codigo: string; nombre: string; direccion?: string }) {
    try {
      const db = await getDb();
      await db.execute(
        'UPDATE sucursales SET codigo = $1, nombre = $2, direccion = $3 WHERE id = $4',
        [sucursal.codigo, sucursal.nombre, sucursal.direccion || '', id]
      );
      return true;
    } catch (error) {
      console.error('Error al actualizar sucursal:', error);
      throw error;
    }
  },

  /**
   * Elimina una sucursal
   */
  async delete(id: number) {
    try {
      const db = await getDb();
      await db.execute('DELETE FROM sucursales WHERE id = $1', [id]);
      return true;
    } catch (error) {
      console.error('Error al eliminar sucursal:', error);
      throw error;
    }
  }
};
