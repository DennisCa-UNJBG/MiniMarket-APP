import { getDb } from '../lib/db';
import { AuthError, ConnectionError } from '../lib/errors';
import bcrypt from 'bcryptjs';

export interface UserData {
  id: number;
  username: string;
  nombre_completo: string;
  rol_id: number;
  permisos: string[];
}

export const authService = {
  /**
   * Genera un hash seguro para una contraseña. Útil para crear nuevos usuarios.
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  /**
   * Valida las credenciales del usuario contra la base de datos local SQLite.
   * Lanza un error si las credenciales son inválidas o el usuario está inactivo.
   */
  async login(username: string, passwordPlain: string): Promise<UserData> {
    let result: any[];
    try {
      const db = await getDb();
      // Buscamos al usuario solo por nombre de usuario para obtener su hash
      result = await db.select(
        "SELECT u.*, r.permisos FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.username = $1 AND u.estado = 'activo'",
        [username]
      );
    } catch (e) {
      throw new ConnectionError();
    }

    if (result && result.length > 0) {
      const user = result[0];
      
      // Comparamos la contraseña ingresada con el hash de la base de datos
      const isPasswordValid = await bcrypt.compare(passwordPlain, user.password_hash);
      
      if (!isPasswordValid) {
        throw new AuthError();
      }

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
