import { invoke } from '@tauri-apps/api/core';

export const perudevsService = {
  async saveKey(key: string): Promise<void> {
    await invoke('save_perudevs_key', { key });
  },

  async hasKey(): Promise<boolean> {
    return await invoke<boolean>('has_perudevs_key');
  },

  async queryDocument(document: string): Promise<{ nombre: string }> {
    const rawRes = await invoke<string>('query_perudevs_document', { document });
    const data = JSON.parse(rawRes);

    if (data.estado === false || data.success === false) {
      throw new Error(data.mensaje || data.message || 'No se encontraron resultados.');
    }

    // Extracción de nombre robusta de la respuesta JSON
    const nombre = 
      data.resultado?.nombre_completo ||
      data.resultado?.razon_social ||
      data.resultado?.nombre_o_razon_social ||
      data.data?.nombre_completo ||
      data.data?.razon_social ||
      data.data?.nombre_o_razon_social ||
      data.nombre_completo ||
      data.razon_social ||
      (data.resultado?.nombres 
        ? `${data.resultado.nombres} ${data.resultado.apellido_paterno || ''} ${data.resultado.apellido_materno || ''}`.trim()
        : '') ||
      (data.data?.nombres 
        ? `${data.data.nombres} ${data.data.apellido_paterno || ''} ${data.data.apellido_materno || ''}`.trim()
        : '');

    if (!nombre) {
      throw new Error('No se pudo determinar el nombre del titular en la respuesta de la API.');
    }

    return { nombre };
  }
};
