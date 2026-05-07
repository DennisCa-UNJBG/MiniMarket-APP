import { getDb } from '../lib/db';

export interface DatosNegocio {
  id?: number;
  razon_social: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  logo_path?: string;
}

export const negocioService = {
  /**
   * Obtiene los datos del negocio
   */
  async get(): Promise<DatosNegocio> {
    try {
      const db = await getDb();
      const results = await db.select<DatosNegocio[]>(
        'SELECT * FROM negocio ORDER BY id DESC LIMIT 1'
      );
      
      if (results.length > 0) {
        return results[0];
      }

      // Valores por defecto si no hay nada
      return {
        razon_social: '',
        ruc: '',
        direccion: '',
        telefono: '',
        email: ''
      };
    } catch (error) {
      console.error('Error al obtener datos del negocio:', error);
      throw error;
    }
  },

  /**
   * Guarda o actualiza los datos del negocio
   */
  async save(datos: DatosNegocio) {
    try {
      const db = await getDb();
      const current = await this.get();

      if (current.id) {
        await db.execute(
          `UPDATE negocio SET 
            razon_social = $1, 
            ruc = $2, 
            direccion = $3, 
            telefono = $4, 
            email = $5 
          WHERE id = $6`,
          [datos.razon_social, datos.ruc, datos.direccion, datos.telefono, datos.email, current.id]
        );
      } else {
        await db.execute(
          `INSERT INTO negocio (razon_social, ruc, direccion, telefono, email) 
           VALUES ($1, $2, $3, $4, $5)`,
          [datos.razon_social, datos.ruc, datos.direccion, datos.telefono, datos.email]
        );
      }
      return true;
    } catch (error) {
      console.error('Error al guardar datos del negocio:', error);
      throw error;
    }
  }
};
