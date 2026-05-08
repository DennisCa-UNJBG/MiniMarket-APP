import { getDb } from './db';

export interface LogEntry {
  usuario_id: number;
  accion: string;
  tabla: string;
  registro_id: number;
  detalles?: string;
}

export const logService = {
  async register(log: LogEntry): Promise<void> {
    const db = await getDb();
    await db.execute(
      `INSERT INTO logs (usuario_id, accion, tabla, registro_id, detalles) 
       VALUES (?, ?, ?, ?, ?)`,
      [log.usuario_id, log.accion, log.tabla, log.registro_id, log.detalles || null]
    );
  },

  async getAll(limit = 100): Promise<any[]> {
    const db = await getDb();
    return db.select(
      `SELECT l.*, u.nombre_completo as usuario_nombre 
       FROM logs l
       JOIN usuarios u ON l.usuario_id = u.id
       ORDER BY l.fecha DESC
       LIMIT ?`,
      [limit]
    );
  }
};
