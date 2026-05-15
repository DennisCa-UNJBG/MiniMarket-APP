import { getDb } from '../../lib/db';
import { logService } from '../../lib/logService';
import { sucursalService } from '../sucursales/Service';

export interface Caja {
  id: number;
  usuario_id: number;
  monto_inicial: number;
  monto_final?: number;
  fecha_apertura: string;
  fecha_cierre?: string;
  estado: 'abierta' | 'cerrada';
  sucursal_id?: string;
}

export const cajaService = {
  /**
   * Abre la caja para el turno actual
   */
  async abrirCaja(usuarioId: number, montoInicial: number): Promise<number> {
    const db = await getDb();
    const config = await sucursalService.getConfig();
    const sucursalId = config?.sucursal_id || 'LOCAL';

    const result = await db.execute(
      `INSERT INTO cajas (usuario_id, monto_inicial, sucursal_id, estado) 
       VALUES (?, ?, ?, 'abierta')`,
      [usuarioId, montoInicial, sucursalId]
    );

    const cajaId = result.lastInsertId as number;

    // Registrar Log
    await logService.register({
      usuario_id: usuarioId,
      accion: 'APERTURA_CAJA',
      tabla: 'cajas',
      registro_id: cajaId,
      detalles: `Caja abierta con monto inicial de S/ ${montoInicial.toFixed(2)}`
    });

    return cajaId;
  },

  /**
   * Cierra la caja registrando el monto final
   */
  async cerrarCaja(cajaId: number, usuarioId: number, montoFinal: number): Promise<void> {
    const db = await getDb();
    
    await db.execute(
      `UPDATE cajas 
       SET monto_final = ?, fecha_cierre = CURRENT_TIMESTAMP, estado = 'cerrada' 
       WHERE id = ?`,
      [montoFinal, cajaId]
    );

    // Registrar Log
    await logService.register({
      usuario_id: usuarioId,
      accion: 'CIERRE_CAJA',
      tabla: 'cajas',
      registro_id: cajaId,
      detalles: `Caja cerrada con monto final de S/ ${montoFinal.toFixed(2)}`
    });
  },

  /**
   * Obtiene la caja abierta actualmente (si existe)
   */
  async getCajaAbierta(): Promise<Caja | null> {
    const db = await getDb();
    const config = await sucursalService.getConfig();
    const sucursalId = config?.sucursal_id || 'LOCAL';

    const result = await db.select<Caja[]>(
      `SELECT * FROM cajas WHERE estado = 'abierta' AND sucursal_id = ? ORDER BY id DESC LIMIT 1`,
      [sucursalId]
    );

    return result.length > 0 ? result[0] : null;
  },

  /**
   * Obtiene el historial de cierres de caja
   */
  async getHistorial(limit = 50): Promise<any[]> {
    const db = await getDb();
    return db.select(
      `SELECT c.*, u.nombre_completo as usuario_nombre 
       FROM cajas c
       JOIN usuarios u ON c.usuario_id = u.id
       ORDER BY c.fecha_apertura DESC
       LIMIT ?`,
      [limit]
    );
  }
};
