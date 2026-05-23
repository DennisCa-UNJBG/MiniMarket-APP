import { getDb } from '../../shared/lib/db';
import { invoke } from '@tauri-apps/api/core';
import { systemConfigService } from '../configuracion/systemConfigService';
import { logService } from '../../shared/lib/logService';

export interface UnidadMedida {
  id: number;
  nombre: string;
  abreviatura: string;
  estado: 'activo' | 'inactivo';
}

export const unidadMedidaService = {
  async getAll(onlyActive = true): Promise<UnidadMedida[]> {
    const db = await getDb();
    const query = onlyActive
      ? "SELECT * FROM unidades_medida WHERE estado = 'activo' ORDER BY nombre ASC"
      : "SELECT * FROM unidades_medida ORDER BY nombre ASC";
    return await db.select<UnidadMedida[]>(query);
  },

  async create(nombre: string, abreviatura: string): Promise<void> {
    const db = await getDb();

    let isCentral = false;
    try {
      isCentral = await invoke<boolean>('is_server_running');
    } catch (e) {
      throw new Error('Error del sistema: No se pudo verificar si este equipo es la Sede Central. Reinicia la aplicación.');
    }

    if (isCentral) {
      // --- FLUJO DE SEDE CENTRAL (Acceso directo a BD) ---
      const unitExistente = await db.select<any[]>(
        'SELECT id FROM unidades_medida WHERE LOWER(nombre) = LOWER(?) OR LOWER(abreviatura) = LOWER(?)',
        [nombre, abreviatura]
      );
      if (unitExistente.length > 0) {
        throw new Error(`La unidad de medida o abreviatura "${nombre}" ya está registrada.`);
      }

      await db.execute(
        "INSERT INTO unidades_medida (nombre, abreviatura, estado) VALUES (?, ?, ?)",
        [nombre, abreviatura, 'activo']
      );
    } else {
      // --- FLUJO DE SUCURSAL (Llamada HTTP síncrona a la central) ---
      const config = await systemConfigService.getConfig();
      if (!config || !config.api_url_central || !config.sucursal_id) {
        throw new Error('Configuración de sucursal incompleta. Configure la conexión a la sede central.');
      }

      let response: Response;
      try {
        response = await fetch(`${config.api_url_central}/api/unidades-medida`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Sucursal-Key': config.sucursal_id
          },
          body: JSON.stringify({ nombre, abreviatura })
        });
      } catch (err) {
        throw new Error('No se pudo conectar con el servidor central. Verifique la conexión e intente nuevamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error al crear la unidad de medida en la central (código ${response.status}).`);
      }

      const responseData = await response.json();
      const newUnit = responseData.data;

      // Insertar localmente con el ID y datos retornados por la central
      await db.execute(
        'INSERT OR REPLACE INTO unidades_medida (id, nombre, abreviatura, estado) VALUES (?, ?, ?, ?)',
        [newUnit.id, newUnit.nombre, newUnit.abreviatura, newUnit.estado]
      );
    }
  },

  async update(id: number, nombre: string, abreviatura: string, usuarioId = 1): Promise<void> {
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
        "UPDATE unidades_medida SET nombre = ?, abreviatura = ? WHERE id = ?",
        [nombre, abreviatura, id]
      );
    } else {
      // --- FLUJO DE SUCURSAL ---
      const config = await systemConfigService.getConfig();
      if (!config || !config.api_url_central || !config.sucursal_id) {
        throw new Error('Configuración de sucursal incompleta. Configure la conexión a la sede central.');
      }

      let response: Response;
      try {
        response = await fetch(`${config.api_url_central}/api/unidades-medida`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Sucursal-Key': config.sucursal_id
          },
          body: JSON.stringify({ id, nombre, abreviatura })
        });
      } catch (err) {
        throw new Error('No se pudo conectar con el servidor central. Verifique la conexión e intente nuevamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error al actualizar la unidad de medida en la central (código ${response.status}).`);
      }

      // Actualizar localmente
      await db.execute(
        "UPDATE unidades_medida SET nombre = ?, abreviatura = ? WHERE id = ?",
        [nombre, abreviatura, id]
      );

      // Registrar log local
      await logService.register({
        usuario_id: usuarioId,
        accion: 'EDITAR_UNIDAD_MEDIDA',
        tabla: 'unidades_medida',
        registro_id: id,
        detalles: `Datos actualizados para la unidad de medida: ${nombre} (${abreviatura}, ID: ${id}) vía sede central`
      });
    }
  },

  async updateStatus(id: number, status: 'activo' | 'inactivo'): Promise<void> {
    const db = await getDb();
    await db.execute(
      "UPDATE unidades_medida SET estado = ? WHERE id = ?",
      [status, id]
    );
  }
};
