import { getDb } from '../../shared/lib/db';
import { logService } from '../../shared/lib/logService';
import { systemConfigService } from '../configuracion/systemConfigService';

export interface Caja {
  id: number;
  usuario_id: number;
  monto_inicial: number;
  monto_final?: number;
  monto_esperado?: number;
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
    const [db, config] = await Promise.all([
      getDb(),
      systemConfigService.getConfig()
    ]);
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
   * Cierra la caja registrando el monto final y el esperado
   */
  async cerrarCaja(cajaId: number, usuarioId: number, montoFinal: number, montoEsperado: number): Promise<void> {
    const db = await getDb();

    await Promise.all([
      db.execute(
        `UPDATE cajas 
         SET monto_final = ?, monto_esperado = ?, fecha_cierre = CURRENT_TIMESTAMP, estado = 'cerrada' 
         WHERE id = ?`,
        [montoFinal, montoEsperado, cajaId]
      ),
      logService.register({
        usuario_id: usuarioId,
        accion: 'CIERRE_CAJA',
        tabla: 'cajas',
        registro_id: cajaId,
        detalles: `Caja cerrada con monto final de S/ ${montoFinal.toFixed(2)} (Esperado: S/ ${montoEsperado.toFixed(2)})`
      })
    ]);
  },

  /**
   * Obtiene la caja abierta actualmente (si existe)
   */
  async getCajaAbierta(): Promise<Caja | null> {
    const [db, config] = await Promise.all([
      getDb(),
      systemConfigService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';

    const result = await db.select<Caja[]>(
      `SELECT * FROM cajas WHERE estado = 'abierta' AND sucursal_id = ? ORDER BY id DESC LIMIT 1`,
      [sucursalId]
    );

    return result.length > 0 ? result[0] : null;
  },

  /**
   * Obtiene el historial de cierres de caja con cálculos dinámicos y persistencia de monto esperado
   */
  async getHistorial(limit = 50): Promise<any[]> {
    const db = await getDb();
    return db.select(
      `SELECT 
        c.*, 
        u.nombre_completo as usuario_nombre,
        COALESCE(
          NULLIF(c.monto_esperado, 0),
          c.monto_inicial + 
          (
            SELECT COALESCE(SUM(v.total), 0)
            FROM ventas v
            WHERE v.fecha >= c.fecha_apertura 
              AND (c.fecha_cierre IS NULL OR v.fecha <= c.fecha_cierre)
              AND v.metodo_pago = 'EFECTIVO'
              AND v.estado != 'anulado'
              AND (v.sucursal_id = c.sucursal_id OR v.sucursal_id IS NULL)
          ) - 
          (
            SELECT COALESCE(SUM(ci.total), 0)
            FROM compras_ingresos ci
            WHERE ci.fecha >= c.fecha_apertura 
              AND (c.fecha_cierre IS NULL OR ci.fecha <= c.fecha_cierre)
              AND ci.metodo_pago = 'EFECTIVO'
              AND ci.estado != 'anulado'
              AND (ci.sucursal_id = c.sucursal_id OR ci.sucursal_id IS NULL)
          )
        ) as total_monto_esperado
       FROM cajas c
       JOIN usuarios u ON c.usuario_id = u.id
       ORDER BY c.fecha_apertura DESC
       LIMIT ?`,
      [limit]
    );
  }
};


