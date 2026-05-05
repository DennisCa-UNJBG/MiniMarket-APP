import { getDb } from '../lib/db';
import { withDb } from '../lib/withDb';

export interface Category {
  id: number;
  nombre: string;
  color: string;
  estado: string;
  productCount?: number;
}

export const categoriaService = {
  async getAll(onlyActive = true): Promise<Category[]> {
    return withDb(async () => {
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
    });
  },

  async create(nombre: string, color: string): Promise<void> {
    return withDb(async () => {
      const db = await getDb();
      await db.execute(
        'INSERT INTO categorias (nombre, color) VALUES (?, ?)',
        [nombre, color]
      );
    });
  },

  async updateStatus(id: number, estado: 'activo' | 'inactivo'): Promise<void> {
    return withDb(async () => {
      const db = await getDb();
      await db.execute(
        'UPDATE categorias SET estado = ? WHERE id = ?',
        [estado, id]
      );
    });
  }
};
