import { getDb } from '../../shared/lib/db';

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
    await db.execute(
      "INSERT INTO unidades_medida (nombre, abreviatura) VALUES (?, ?)",
      [nombre, abreviatura]
    );
  },

  async update(id: number, nombre: string, abreviatura: string): Promise<void> {
    const db = await getDb();
    await db.execute(
      "UPDATE unidades_medida SET nombre = ?, abreviatura = ? WHERE id = ?",
      [nombre, abreviatura, id]
    );
  },

  async updateStatus(id: number, status: 'activo' | 'inactivo'): Promise<void> {
    const db = await getDb();
    await db.execute(
      "UPDATE unidades_medida SET estado = ? WHERE id = ?",
      [status, id]
    );
  }
};
