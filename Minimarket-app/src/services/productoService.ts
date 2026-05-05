import { getDb } from '../lib/db';
import { withDb } from '../lib/withDb';

export interface Product {
  id: number;
  codigo_barras: string;
  nombre: string;
  categoria_id: number;
  categoria_nombre?: string;
  unidad_medida: string;
  stock_minimo: number;
  stock_actual: number;
  estado: string;
  precio_compra?: number;
  precio_venta?: number;
}

export const productoService = {
  async getAll(): Promise<Product[]> {
    return withDb(async () => {
      const db = await getDb();
      const result = await db.select<Product[]>(`
        SELECT 
          p.*, 
          c.nombre as categoria_nombre,
          ph.precio_compra,
          ph.precio_venta
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN precios_historial ph ON p.id = ph.producto_id AND ph.activo = 1
        WHERE p.estado = 'activo'
      `);
      return result;
    });
  },

  async create(product: Omit<Product, 'id' | 'estado'>): Promise<void> {
    return withDb(async () => {
      const db = await getDb();
      const result = await db.execute(
        `INSERT INTO productos (codigo_barras, nombre, categoria_id, unidad_medida, stock_minimo, stock_actual) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          product.codigo_barras,
          product.nombre,
          product.categoria_id,
          product.unidad_medida,
          product.stock_minimo,
          product.stock_actual
        ]
      );

      // Si se proporcionaron precios, registrarlos en el historial
      if (product.precio_compra !== undefined && product.precio_venta !== undefined) {
        await db.execute(
          `INSERT INTO precios_historial (producto_id, precio_compra, precio_venta, activo) 
           VALUES (?, ?, ?, 1)`,
          [result.lastInsertId, product.precio_compra, product.precio_venta]
        );
      }
    });
  },

  async updateStatus(id: number, estado: 'activo' | 'inactivo'): Promise<void> {
    return withDb(async () => {
      const db = await getDb();
      await db.execute(
        'UPDATE productos SET estado = ? WHERE id = ?',
        [estado, id]
      );
    });
  }
};
