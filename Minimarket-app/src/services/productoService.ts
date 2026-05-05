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
  async getAll(onlyActive = true): Promise<Product[]> {
    return withDb(async () => {
      const db = await getDb();
      let query = `
        SELECT 
          p.*, 
          c.nombre as categoria_nombre,
          ph.precio_compra,
          ph.precio_venta
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN precios_historial ph ON p.id = ph.producto_id AND ph.activo = 1
      `;

      if (onlyActive) {
        query += " WHERE p.estado = 'activo' ";
      }

      query += " ORDER BY p.estado ASC, p.nombre ASC";
      
      const result = await db.select<Product[]>(query);
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
  },

  async update(id: number, product: Omit<Product, 'id' | 'estado' | 'stock_actual'>): Promise<void> {
    return withDb(async () => {
      const db = await getDb();
      await db.execute(
        `UPDATE productos 
         SET nombre = ?, categoria_id = ?, unidad_medida = ?, stock_minimo = ?
         WHERE id = ?`,
        [product.nombre, product.categoria_id, product.unidad_medida, product.stock_minimo, id]
      );

      if (product.precio_venta !== undefined) {
        // Desactivar precios anteriores para este producto
        await db.execute(
          'UPDATE precios_historial SET activo = 0 WHERE producto_id = ?',
          [id]
        );
        // Insertar el nuevo precio como activo
        await db.execute(
          `INSERT INTO precios_historial (producto_id, precio_compra, precio_venta, activo) 
           VALUES (?, 0, ?, 1)`,
          [id, product.precio_venta]
        );
      }
    });
  },

  async getLastCode(): Promise<string | null> {
    return withDb(async () => {
      const db = await getDb();
      const result = await db.select<{ codigo_barras: string }[]>(
        'SELECT codigo_barras FROM productos ORDER BY id DESC LIMIT 1'
      );
      return result.length > 0 ? result[0].codigo_barras : null;
    });
  }
};
