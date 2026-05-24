import { getDb } from './db';

export interface LogEntry {
  usuario_id: number;
  accion: string;
  tabla: string;
  registro_id: number;
  detalles?: string;
}

let cachedSucursalId: string | null = null;

export const logService = {
  async register(log: LogEntry): Promise<void> {
    const db = await getDb();
    
    // Obtener sucursal_id de la configuración si existe y no está en caché
    if (cachedSucursalId === null) {
      try {
        const configRes = await db.select<any[]>('SELECT sucursal_id FROM configuracion LIMIT 1');
        if (configRes.length > 0) {
          cachedSucursalId = configRes[0].sucursal_id;
        }
      } catch (e) {
        // Ignorar si la tabla de configuración no existe o está vacía
      }
    }

    const sucursalId = cachedSucursalId;

    // Verificar si el usuario existe para evitar errores de clave foránea
    let usuarioExiste = false;
    try {
      const userRes = await db.select<any[]>('SELECT id FROM usuarios WHERE id = ?', [log.usuario_id]);
      usuarioExiste = userRes.length > 0;
    } catch (e) {
      console.error("Error al verificar existencia de usuario para el log:", e);
    }

    let finalUsuarioId = log.usuario_id;
    if (!usuarioExiste) {
      // Intentar obtener el primer usuario disponible de respaldo
      try {
        const firstUser = await db.select<any[]>('SELECT id FROM usuarios LIMIT 1');
        if (firstUser.length > 0) {
          finalUsuarioId = firstUser[0].id;
        } else {
          console.warn("No hay usuarios en la base de datos local. Se omite el log.");
          return;
        }
      } catch (e) {
        console.error("Error al obtener usuario de respaldo para el log:", e);
        return;
      }
    }

    await db.execute(
      `INSERT INTO logs (usuario_id, sucursal_id, accion, tabla, registro_id, detalles) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [finalUsuarioId, sucursalId, log.accion, log.tabla, log.registro_id, log.detalles || null]
    );
  },

  async getAll(limit = 100): Promise<any[]> {
    const db = await getDb();
    return db.select(
      `SELECT l.id, l.usuario_id, l.sucursal_id, l.accion, l.tabla, l.registro_id, l.detalles, l.sincronizado, l.created_at as fecha,
              u.nombre_completo as usuario_nombre 
       FROM logs l
       JOIN usuarios u ON l.usuario_id = u.id
       ORDER BY l.created_at DESC
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
        `SELECT l.id, l.usuario_id, l.sucursal_id, l.accion, l.tabla, l.registro_id, l.detalles, l.sincronizado, l.created_at as fecha,
                u.nombre_completo as usuario_nombre 
         FROM logs l
         JOIN usuarios u ON l.usuario_id = u.id
         ${whereClause}
         ORDER BY l.created_at DESC
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
  },

  async getLogsPendientes(): Promise<number> {
    const db = await getDb();
    const res = await db.select<any[]>('SELECT COUNT(*) as count FROM logs WHERE sincronizado = 0');
    return res[0]?.count || 0;
  }
};
