import { getDb } from '../../shared/lib/db';
import { logService } from '../../shared/lib/logService';
import { invoke } from '@tauri-apps/api/core';
import { systemConfigService } from '../configuracion/systemConfigService';
import { encryptBranchCode } from '../sincronizacion/Service';

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

    let isCentral = false;
    try {
      isCentral = await invoke<boolean>('is_server_running');
    } catch (e) {
      throw new Error('Error del sistema: No se pudo verificar si este equipo es la Sede Central. Reinicia la aplicación.');
    }

    if (isCentral) {
      // --- FLUJO DE SEDE CENTRAL (Acceso directo a BD) ---
      const rolExistente = await db.select<any[]>(
        'SELECT id FROM roles WHERE LOWER(nombre) = LOWER(?)',
        [nombre]
      );
      if (rolExistente.length > 0) {
        throw new Error(`El rol "${nombre}" ya está registrado.`);
      }

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
    } else {
      // --- FLUJO DE SUCURSAL (Llamada HTTP síncrona a la central) ---
      const config = await systemConfigService.getConfig();
      if (!config || !config.api_url_central || !config.sucursal_id) {
        throw new Error('Configuración de sucursal incompleta. Configure la conexión a la sede central.');
      }

      let response: Response;
      try {
        response = await fetch(`${config.api_url_central}/api/roles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Sucursal-Key': encryptBranchCode(config.sucursal_id)
          },
          body: JSON.stringify({ nombre, descripcion, permisos })
        });
      } catch (err) {
        throw new Error('No se pudo conectar con el servidor central. Verifique la conexión e intente nuevamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error al crear el rol en la central (código ${response.status}).`);
      }

      const responseData = await response.json();
      const newRol = responseData.data;

      // Insertar localmente con el ID y datos retornados por la central
      await db.execute(
        'INSERT OR REPLACE INTO roles (id, nombre, descripcion, permisos, estado) VALUES (?, ?, ?, ?, ?)',
        [newRol.id, newRol.nombre, newRol.descripcion, newRol.permisos, newRol.estado]
      );

      await logService.register({
        usuario_id: adminId,
        accion: 'CREAR_ROL',
        tabla: 'roles',
        registro_id: newRol.id,
        detalles: `Se creó el rol "${nombre}" con ${permisos.length} permisos asignados vía sede central`
      });

      return true;
    }
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
