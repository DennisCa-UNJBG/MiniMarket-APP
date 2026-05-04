import { getDb } from '../lib/db';
import { AuthError, ConnectionError } from '../lib/errors';

export interface UserData {
  id: number;
  username: string;
  nombre_completo: string;
  rol_id: number;
  permisos: string[];
}

export const authService = {
  /**
   * Valida las credenciales del usuario contra la base de datos local SQLite.
   * Lanza un error si las credenciales son inválidas o el usuario está inactivo.
   */
  async login(username: string, passwordHash: string): Promise<UserData> {
    let result: any[];
    try {
      const db = await getDb();
      result = await db.select(
        "SELECT u.*, r.permisos FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.username = $1 AND u.password_hash = $2 AND u.estado = 'activo'",
        [username, passwordHash]
      );
    } catch (e) {
      throw new ConnectionError();
    }

    if (result && result.length > 0) {
      const user = result[0];
      let parsedPermisos: string[] = [];
      
      try {
        parsedPermisos = typeof user.permisos === 'string' ? JSON.parse(user.permisos) : user.permisos;
      } catch (e) {
        console.error("Error al analizar permisos del usuario:", e);
      }
      
      return {
        id: user.id,
        username: user.username,
        nombre_completo: user.nombre_completo,
        rol_id: user.rol_id,
        permisos: parsedPermisos
      };
    }

    throw new AuthError();
  }
};
