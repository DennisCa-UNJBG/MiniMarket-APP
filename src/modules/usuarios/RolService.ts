import { getDb } from '../../lib/db';
import { logService } from '../../lib/logService';

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  permisos: string[];
  estado: string;
  usuarios_count?: number;
}

export const rolService = {
  /**
   * Obtiene todos los roles disponibles y la cantidad de usuarios vinculados a cada uno
   */
  async getAll(): Promise<Rol[]> {
    const db = await getDb();
    const rows = await db.select<any[]>(`
      SELECT r.id, r.nombre, r.descripcion, r.permisos, COALESCE(r.estado, 'activo') as estado,
             (SELECT COUNT(*) FROM usuarios u WHERE u.rol_id = r.id) as usuarios_count
      FROM roles r
      ORDER BY r.id ASC
    `);

    return rows.map(row => {
      let permisosArray: string[] = [];
      try {
        if (row.permisos) {
          permisosArray = JSON.parse(row.permisos);
        }
      } catch (e) {
        console.error('Error parseando permisos de rol:', row.id);
      }
      return {
        ...row,
        permisos: permisosArray
      };
    });
  },

  /**
   * Obtiene la cantidad de usuarios vinculados a un rol específico
   */
  async getUsersCount(id: number): Promise<number> {
    const db = await getDb();
    const result = await db.select<any[]>('SELECT COUNT(*) as count FROM usuarios WHERE rol_id = ?', [id]);
    return result[0]?.count || 0;
  },

  /**
   * Crea un nuevo rol
   */
  async create(nombre: string, descripcion: string, permisos: string[], adminId: number) {
    const db = await getDb();
    const permisosJson = JSON.stringify(permisos);

    const result = await db.execute(
      'INSERT INTO roles (nombre, descripcion, permisos, estado) VALUES (?, ?, ?, ?)',
      [nombre, descripcion, permisosJson, 'activo']
    );

    const rolId = result.lastInsertId as number;

    await logService.register({
      usuario_id: adminId,
      accion: 'CREAR_ROL',
      tabla: 'roles',
      registro_id: rolId,
      detalles: `Se creó el rol "${nombre}" con ${permisos.length} permisos asignados.`
    });

    return true;
  },

  /**
   * Actualiza un rol existente
   */
  async update(id: number, nombre: string, descripcion: string, permisos: string[], adminId: number) {
    const db = await getDb();
    const permisosJson = JSON.stringify(permisos);

    await db.execute(
      'UPDATE roles SET nombre = ?, descripcion = ?, permisos = ? WHERE id = ?',
      [nombre, descripcion, permisosJson, id]
    );

    await logService.register({
      usuario_id: adminId,
      accion: 'EDITAR_ROL',
      tabla: 'roles',
      registro_id: id,
      detalles: `Se editaron los detalles o permisos del rol "${nombre}".`
    });

    return true;
  },

  /**
   * Activa o desactiva un rol, verificando que no tenga usuarios vinculados en caso de desactivar
   */
  async toggleEstado(id: number, currentEstado: string, adminId: number) {
    const db = await getDb();
    const nuevoEstado = currentEstado === 'activo' ? 'inactivo' : 'activo';

    // Si vamos a desactivarlo, verificamos que ningún usuario lo tenga asignado
    if (nuevoEstado === 'inactivo') {
      const usersCount = await this.getUsersCount(id);
      if (usersCount > 0) {
        throw new Error(`No se puede desactivar este rol porque tiene ${usersCount} usuario(s) asignado(s).`);
      }
    }

    const rData = await db.select<any[]>('SELECT nombre FROM roles WHERE id = ?', [id]);
    const nombre = rData[0]?.nombre || 'ID:' + id;

    await db.execute('UPDATE roles SET estado = ? WHERE id = ?', [nuevoEstado, id]);

    await logService.register({
      usuario_id: adminId,
      accion: 'ESTADO_ROL',
      tabla: 'roles',
      registro_id: id,
      detalles: `Estado del rol "${nombre}" cambiado a ${nuevoEstado.toUpperCase()}`
    });

    return true;
  }
};
