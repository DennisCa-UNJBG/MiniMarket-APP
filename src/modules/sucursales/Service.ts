import { getDb } from '../../lib/db';
import { logService } from '../../lib/logService';

export interface SucursalConfig {
  id?: number;
  sucursal_id: string;
  nombre_sucursal: string;
  api_url_central: string;
  ultima_sincronizacion?: string;
}

export const sucursalService = {
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
        'X-Sucursal-Key': sucursalCodigo
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error de conexión');
    }

    return true;
  },

  /**
   * Obtiene todas las sucursales registradas (Solo para Sede Principal)
   */
  async getAll(): Promise<any[]> {
    const db = await getDb();
    return await db.select('SELECT * FROM sucursales ORDER BY nombre ASC');
  },

  /**
   * Registra una nueva sucursal (Solo desde Sede Principal)
   */
  async create(sucursal: { codigo: string; nombre: string; direccion?: string }, usuarioId: number) {
    const db = await getDb();
    const result = await db.execute(
      'INSERT INTO sucursales (codigo, nombre, direccion) VALUES (?, ?, ?)',
      [sucursal.codigo, sucursal.nombre, sucursal.direccion || '']
    );

    const sucursalId = result.lastInsertId as number;

    await logService.register({
      usuario_id: usuarioId,
      accion: 'CREAR_SUCURSAL',
      tabla: 'sucursales',
      registro_id: sucursalId,
      detalles: `Nueva sucursal registrada: ${sucursal.nombre} (${sucursal.codigo})`
    });

    return true;
  },

  /**
   * Actualiza una sucursal existente
   */
  async update(id: number, sucursal: { codigo: string; nombre: string; direccion?: string }, usuarioId: number) {
    const db = await getDb();
    await Promise.all([
      db.execute(
        'UPDATE sucursales SET codigo = ?, nombre = ?, direccion = ? WHERE id = ?',
        [sucursal.codigo, sucursal.nombre, sucursal.direccion || '', id]
      ),
      logService.register({
        usuario_id: usuarioId,
        accion: 'EDITAR_SUCURSAL',
        tabla: 'sucursales',
        registro_id: id,
        detalles: `Datos actualizados para la sucursal: ${sucursal.nombre}`
      })
    ]);

    return true;
  },

  /**
   * Cambia el estado de una sucursal (activo/inactivo)
   */
  async toggleEstado(id: number, nuevoEstado: 'activo' | 'inactivo', usuarioId?: number) {
    const db = await getDb();

    // Obtener nombre de la sucursal para el detalle
    const sData = await db.select<any[]>('SELECT nombre FROM sucursales WHERE id = ?', [id]);
    const nombre = sData[0]?.nombre || 'ID:' + id;

    const promises: Promise<any>[] = [
      db.execute('UPDATE sucursales SET estado = ? WHERE id = ?', [nuevoEstado, id])
    ];

    if (usuarioId) {
      promises.push(
        logService.register({
          usuario_id: usuarioId,
          accion: 'ESTADO_SUCURSAL',
          tabla: 'sucursales',
          registro_id: id,
          detalles: `Sucursal "${nombre}" marcada como ${nuevoEstado.toUpperCase()}`
        })
      );
    }

    await Promise.all(promises);
    return true;
  }
};
