import { getDb } from '../../shared/lib/db';
import { logService } from '../../shared/lib/logService';
import { encryptBranchCode } from '../sincronizacion/Service';

export interface SucursalConfig {
  id?: number;
  sucursal_id: string;
  nombre_sucursal: string;
  api_url_central: string;
  ultima_sincronizacion?: string;
}

export const systemConfigService = {
  /**
   * Obtiene la configuración de la sucursal actual
   */
  async getConfig(): Promise<SucursalConfig | null> {
    const db = await getDb();
    const results = await db.select<SucursalConfig[]>(
      'SELECT * FROM configuracion LIMIT 1'
    );
    return results.length > 0 ? results[0] : null;
  },

  /**
   * Guarda o actualiza la configuración
   */
  async saveConfig(config: SucursalConfig, usuarioId: number) {
    const [db, existing] = await Promise.all([
      getDb(),
      this.getConfig()
    ]);

    if (existing) {
      await db.execute(
        'UPDATE configuracion SET sucursal_id = ?, nombre_sucursal = ?, api_url_central = ? WHERE id = ?',
        [config.sucursal_id, config.nombre_sucursal, config.api_url_central, existing.id]
      );
    } else {
      await db.execute(
        'INSERT INTO configuracion (sucursal_id, nombre_sucursal, api_url_central) VALUES (?, ?, ?)',
        [config.sucursal_id, config.nombre_sucursal, config.api_url_central]
      );
    }

    // Registrar Log
    await logService.register({
      usuario_id: usuarioId,
      accion: 'CONFIG_SISTEMA',
      tabla: 'configuracion',
      registro_id: existing?.id || 1,
      detalles: `Configuración del sistema actualizada: ${config.nombre_sucursal}`
    });

    return true;
  },

  /**
   * Simula una prueba de conexión a la sede central
   */
  async testConnection(url: string, sucursalCodigo: string) {
    const response = await fetch(`${url}/api/productos`, {
      method: 'GET',
      headers: {
        'X-Sucursal-Key': encryptBranchCode(sucursalCodigo)
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error de conexión');
    }

    return true;
  }
};
