import { getDb } from '../../shared/lib/db';
import { invoke } from '@tauri-apps/api/core';
import { systemConfigService } from '../configuracion/systemConfigService';
import { logService } from '../../shared/lib/logService';
import { encryptBranchCode } from '../sincronizacion/Service';

export interface Category {
  id: number;
  nombre: string;
  color: string;
  estado: string;
  productCount?: number;
}

export const categoriaService = {
  async getAll(onlyActive = true): Promise<Category[]> {
    const db = await getDb();
    let query = `
      SELECT c.*, COUNT(p.id) as productCount 
      FROM categorias c 
      LEFT JOIN productos p ON c.id = p.categoria_id AND p.estado = 'activo'
    `;

    if (onlyActive) {
      query += " WHERE c.estado = 'activo' ";
    }

    query += " GROUP BY c.id ORDER BY c.estado ASC, c.nombre ASC";
    const result = await db.select<Category[]>(query);
    return result;
  },

  async create(nombre: string, color: string): Promise<void> {
    const db = await getDb();

    let isCentral = false;
    try {
      isCentral = await invoke<boolean>('is_server_running');
    } catch (e) {
      throw new Error('Error del sistema: No se pudo verificar si este equipo es la Sede Central. Reinicia la aplicación.');
    }

    if (isCentral) {
      // --- FLUJO DE SEDE CENTRAL (Acceso directo a BD) ---
      const catExistente = await db.select<any[]>(
        'SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?)',
        [nombre]
      );
      if (catExistente.length > 0) {
        throw new Error(`La categoría "${nombre}" ya está registrada.`);
      }

      await db.execute(
        'INSERT INTO categorias (nombre, color, estado) VALUES (?, ?, ?)',
        [nombre, color, 'activo']
      );
    } else {
      // --- FLUJO DE SUCURSAL (Llamada HTTP síncrona a la central) ---
      const config = await systemConfigService.getConfig();
      if (!config || !config.api_url_central || !config.sucursal_id) {
        throw new Error('Configuración de sucursal incompleta. Configure la conexión a la sede central.');
      }

      let response: Response;
      try {
        response = await fetch(`${config.api_url_central}/api/categorias`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Sucursal-Key': encryptBranchCode(config.sucursal_id)
          },
          body: JSON.stringify({ nombre, color })
        });
      } catch (err) {
        throw new Error('No se pudo conectar con el servidor central. Verifique la conexión e intente nuevamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error al crear la categoría en la central (código ${response.status}).`);
      }

      const responseData = await response.json();
      const newCat = responseData.data;

      // Insertar localmente con el ID y datos retornados por la central
      await db.execute(
        'INSERT OR REPLACE INTO categorias (id, nombre, color, estado) VALUES (?, ?, ?, ?)',
        [newCat.id, newCat.nombre, newCat.color, newCat.estado]
      );
    }
  },

  async updateStatus(id: number, estado: 'activo' | 'inactivo'): Promise<void> {
    const db = await getDb();
    await db.execute(
      'UPDATE categorias SET estado = ? WHERE id = ?',
      [estado, id]
    );
  },

  async update(id: number, nombre: string, color: string, usuarioId = 1): Promise<void> {
    const db = await getDb();

    let isCentral = false;
    try {
      isCentral = await invoke<boolean>('is_server_running');
    } catch (e) {
      throw new Error('Error del sistema: No se pudo verificar si este equipo es la Sede Central. Reinicia la aplicación.');
    }

    if (isCentral) {
      // --- FLUJO DE SEDE CENTRAL ---
      await db.execute(
        'UPDATE categorias SET nombre = ?, color = ? WHERE id = ?',
        [nombre, color, id]
      );
    } else {
      // --- FLUJO DE SUCURSAL ---
      const config = await systemConfigService.getConfig();
      if (!config || !config.api_url_central || !config.sucursal_id) {
        throw new Error('Configuración de sucursal incompleta. Configure la conexión a la sede central.');
      }

      let response: Response;
      try {
        response = await fetch(`${config.api_url_central}/api/categorias`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Sucursal-Key': encryptBranchCode(config.sucursal_id)
          },
          body: JSON.stringify({ id, nombre, color })
        });
      } catch (err) {
        throw new Error('No se pudo conectar con el servidor central. Verifique la conexión e intente nuevamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error al actualizar la categoría en la central (código ${response.status}).`);
      }

      // Actualizar localmente
      await db.execute(
        'UPDATE categorias SET nombre = ?, color = ? WHERE id = ?',
        [nombre, color, id]
      );

      // Registrar log local
      await logService.register({
        usuario_id: usuarioId,
        accion: 'EDITAR_CATEGORIA',
        tabla: 'categorias',
        registro_id: id,
        detalles: `Datos actualizados para la categoría: ${nombre} (ID: ${id}) vía sede central`
      });
    }
  }
};
