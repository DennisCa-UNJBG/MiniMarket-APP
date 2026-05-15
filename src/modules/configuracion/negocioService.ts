import { getDb } from '../../lib/db';

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
  },

  /**
   * Guarda o actualiza los datos del negocio
   */
  async save(datos: DatosNegocio) {
    const db = await getDb();
    const current = await this.get();

    if (current.id) {
      await db.execute(
        `UPDATE negocio SET 
          razon_social = ?, 
          ruc = ?, 
          direccion = ?, 
          telefono = ?, 
          email = ? 
        WHERE id = ?`,
        [datos.razon_social, datos.ruc, datos.direccion, datos.telefono, datos.email, current.id]
      );
    } else {
      await db.execute(
        `INSERT INTO negocio (razon_social, ruc, direccion, telefono, email) 
          VALUES (?, ?, ?, ?, ?)`,
        [datos.razon_social, datos.ruc, datos.direccion, datos.telefono, datos.email]
      );
    }
    return true;
  }
};
