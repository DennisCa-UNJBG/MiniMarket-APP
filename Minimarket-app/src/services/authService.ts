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
        "SELECT u.*, r.permisos FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.username = ? AND u.estado = 'activo'",
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
      
      const userData = {
        id: user.id,
        username: user.username,
        nombre_completo: user.nombre_completo,
        rol_id: user.rol_id,
        permisos: parsedPermisos
      };

      // REGISTRO DE LOG: Inicio de sesión
      try {
        const { logService } = await import('../lib/logService');
        await logService.register({
          usuario_id: user.id,
          accion: 'LOGIN',
          tabla: 'usuarios',
          registro_id: user.id,
          detalles: `El usuario ${user.username} ha iniciado sesión.`
        });
      } catch (logError) {
        console.error("Error al registrar log de login:", logError);
      }

      return userData;
    }


    throw new AuthError();
  },

  /**
   * Actualiza la contraseña del usuario de forma directa
   */
  async updatePassword(userId: number, newPasswordPlain: string): Promise<boolean> {
    const db = await getDb();
    const newHash = await this.hashPassword(newPasswordPlain);
    await db.execute("UPDATE usuarios SET password_hash = ? WHERE id = ?", [newHash, userId]);
    return true;
  }
};
