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
  },

  async getPaginated(
    page: number,
    pageSize: number,
    search = '',
    accion = 'TODOS'
  ): Promise<{ data: any[]; total: number }> {
    const db = await getDb();
    const offset = (page - 1) * pageSize;

    let whereClause = " WHERE 1=1 ";
    const params: any[] = [];

    if (accion && accion !== 'TODOS') {
      whereClause += " AND l.accion = ? ";
      params.push(accion);
    }

    if (search && search.trim() !== '') {
      const searchParam = `%${search}%`;
      whereClause += " AND (l.detalles LIKE ? OR u.nombre_completo LIKE ? OR l.accion LIKE ?) ";
      params.push(searchParam, searchParam, searchParam);
    }

    // Obtener total y registros en paralelo para óptimo desempeño
    const [totalRes, data] = await Promise.all([
      db.select<any[]>(
        `SELECT COUNT(*) as count 
         FROM logs l
         JOIN usuarios u ON l.usuario_id = u.id
         ${whereClause}`,
        params
      ),
      db.select<any[]>(
        `SELECT l.*, u.nombre_completo as usuario_nombre 
         FROM logs l
         JOIN usuarios u ON l.usuario_id = u.id
         ${whereClause}
         ORDER BY l.fecha DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      )
    ]);

    const total = totalRes[0]?.count || 0;
    return { data, total };
  },

  async getAccionesUnicas(): Promise<string[]> {
    const db = await getDb();
    const result = await db.select<any[]>('SELECT DISTINCT accion FROM logs ORDER BY accion ASC');
    return result.map(r => r.accion);
  }
};
