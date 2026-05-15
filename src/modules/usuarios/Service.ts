import { getDb } from '../../lib/db';
import { authService } from '../login/Service';

export interface User {
  id?: number;
  username: string;
  password_hash?: string;
  nombre_completo: string;
  rol_id: number;
  sucursal_id?: string;
  estado: string;
}

export const userService = {
  /**
   * Obtiene todos los usuarios con sus roles y sedes
   */
  async getAll(): Promise<any[]> {
    const db = await getDb();
    return await db.select(`
      SELECT u.id, u.username, u.nombre_completo, u.rol_id, u.sucursal_id, u.estado, 
              r.nombre as rol_nombre, s.nombre as sucursal_nombre
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN sucursales s ON u.sucursal_id = s.codigo
      ORDER BY u.id DESC
    `);
  },

  /**
   * Obtiene todos los roles disponibles
   */
  async getRoles(): Promise<any[]> {
    const db = await getDb();
    return await db.select('SELECT id, nombre FROM roles');
  },

  /**
   * Crea un nuevo usuario
   */
  async create(user: any) {
    const db = await getDb();
    const passwordHash = await authService.hashPassword(user.password);
    
    await db.execute(
      'INSERT INTO usuarios (username, password_hash, nombre_completo, rol_id, sucursal_id, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [user.username, passwordHash, user.nombre_completo, user.rol_id, user.sucursal_id || null, 'activo']
    );
    return true;
  },

  /**
   * Cambia el estado de un usuario
   */
  async toggleEstado(id: number, currentEstado: string) {
    const db = await getDb();
    const nuevoEstado = currentEstado === 'activo' ? 'inactivo' : 'activo';
    await db.execute('UPDATE usuarios SET estado = ? WHERE id = ?', [nuevoEstado, id]);
    return true;
  },

  /**
   * Actualiza los datos de un usuario existente
   */
  async update(id: number, user: any) {
    const db = await getDb();
    
    // Si hay contraseña nueva, la hasheamos, si no, mantenemos la anterior
    if (user.password && user.password.trim() !== '') {
      const passwordHash = await authService.hashPassword(user.password);
      await db.execute(
        'UPDATE usuarios SET nombre_completo = ?, rol_id = ?, sucursal_id = ?, password_hash = ? WHERE id = ?',
        [user.nombre_completo, user.rol_id, user.sucursal_id || null, passwordHash, id]
      );
    } else {
      await db.execute(
        'UPDATE usuarios SET nombre_completo = ?, rol_id = ?, sucursal_id = ? WHERE id = ?',
        [user.nombre_completo, user.rol_id, user.sucursal_id || null, id]
      );
    }
    return true;
  }
};
