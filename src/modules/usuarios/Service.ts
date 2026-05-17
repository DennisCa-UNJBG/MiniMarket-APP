import { getDb } from '../../lib/db';
import { authService } from '../login/Service';
import { logService } from '../../lib/logService';

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
  async create(user: any, adminId: number) {
    const [db, passwordHash] = await Promise.all([
      getDb(),
      authService.hashPassword(user.password)
    ]);
    
    const result = await db.execute(
      'INSERT INTO usuarios (username, password_hash, nombre_completo, rol_id, sucursal_id, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [user.username, passwordHash, user.nombre_completo, user.rol_id, user.sucursal_id || null, 'activo']
    );

    const userId = result.lastInsertId as number;

    await logService.register({
      usuario_id: adminId,
      accion: 'CREAR_USUARIO',
      tabla: 'usuarios',
      registro_id: userId,
      detalles: `Se creó el usuario "${user.username}" (${user.nombre_completo})`
    });

    return true;
  },

  /**
   * Cambia el estado de un usuario
   */
  async toggleEstado(id: number, currentEstado: string, adminId: number) {
    if (id === 1) {
      throw new Error('No se puede desactivar la cuenta de administrador principal.');
    }
    if (id === adminId) {
      throw new Error('No puedes desactivar tu propia cuenta.');
    }
    const db = await getDb();
    const nuevoEstado = currentEstado === 'activo' ? 'inactivo' : 'activo';
    
    // Obtener nombre del usuario afectado
    const uData = await db.select<any[]>('SELECT username FROM usuarios WHERE id = ?', [id]);
    const username = uData[0]?.username || 'ID:' + id;

    await db.execute('UPDATE usuarios SET estado = ? WHERE id = ?', [nuevoEstado, id]);

    await logService.register({
      usuario_id: adminId,
      accion: 'ESTADO_USUARIO',
      tabla: 'usuarios',
      registro_id: id,
      detalles: `Estado del usuario "${username}" cambiado a ${nuevoEstado.toUpperCase()}`
    });

    return true;
  },

  /**
   * Actualiza los datos de un usuario existente
   */
  async update(id: number, user: any, adminId: number) {
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

    await logService.register({
      usuario_id: adminId,
      accion: 'EDITAR_USUARIO',
      tabla: 'usuarios',
      registro_id: id,
      detalles: `Datos actualizados para el usuario: ${user.username || user.nombre_completo}`
    });

    return true;
  }
};
