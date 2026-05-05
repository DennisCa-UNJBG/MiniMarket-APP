import { getDb } from '../lib/db';
import { withDb } from '../lib/withDb';
import { productoService } from './productoService';

export interface InventarioIngreso {
  id?: number;
  producto_id: number;
  usuario_id: number;
  cantidad: number;
  precio_compra: number;
  referencia?: string;
  fecha?: string;
}

export const inventarioService = {
  /**
   * Registra un nuevo ingreso de mercadería
   */
  async registrarIngreso(ingreso: InventarioIngreso): Promise<void> {
    return withDb(async () => {
      const db = await getDb();
      
      // 1. Obtener el stock actual del producto
      const producto = await db.select<any[]>(
        'SELECT stock_actual FROM productos WHERE id = ?',
        [ingreso.producto_id]
      );
      
      if (producto.length === 0) throw new Error('Producto no encontrado');
      
      const stockAnterior = producto[0].stock_actual || 0;
      const nuevoStock = stockAnterior + ingreso.cantidad;

      // 2. Registrar en la tabla de compras_ingresos (Cabecera simplificada por ahora)
      const resIngreso = await db.execute(
        `INSERT INTO compras_ingresos (usuario_id, documento_referencia, total) 
         VALUES (?, ?, ?)`,
        [ingreso.usuario_id, ingreso.referencia || '', ingreso.cantidad * ingreso.precio_compra]
      );

      // 3. Registrar en el Kardex (Movimiento)
      await db.execute(
        `INSERT INTO kardex (producto_id, usuario_id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia) 
         VALUES (?, ?, 'INGRESO', ?, ?, ?, ?)`,
        [
          ingreso.producto_id, 
          ingreso.usuario_id, 
          ingreso.cantidad, 
          nuevoStock, 
          ingreso.precio_compra, 
          ingreso.referencia || `INGRESO #${resIngreso.lastInsertId}`
        ]
      );

      // 4. Actualizar el stock actual en la tabla productos
      await db.execute(
        'UPDATE productos SET stock_actual = ? WHERE id = ?',
        [nuevoStock, ingreso.producto_id]
      );

      // 5. Actualizar el precio de compra en el historial de precios
      // Primero desactivamos el precio anterior
      await db.execute(
        'UPDATE precios_historial SET activo = 0 WHERE producto_id = ?',
        [ingreso.producto_id]
      );
      
      // Insertamos el nuevo registro con el precio de compra actualizado
      // Nota: Mantenemos el precio de venta actual si existe
      const precioActual = await db.select<any[]>(
        'SELECT precio_venta FROM precios_historial WHERE producto_id = ? ORDER BY id DESC LIMIT 1',
        [ingreso.producto_id]
      );
      const precioVenta = precioActual.length > 0 ? precioActual[0].precio_venta : 0;

      await db.execute(
        `INSERT INTO precios_historial (producto_id, precio_compra, precio_venta, activo) 
         VALUES (?, ?, ?, 1)`,
        [ingreso.producto_id, ingreso.precio_compra, precioVenta]
      );
    });
  },

  /**
   * Obtiene los últimos movimientos del kardex
   */
  async getMovimientos(limit = 50): Promise<any[]> {
    return withDb(async () => {
      const db = await getDb();
      return db.select(`
        SELECT k.*, p.nombre as producto_nombre, u.nombre_completo as usuario_nombre
        FROM kardex k
        JOIN productos p ON k.producto_id = p.id
        JOIN usuarios u ON k.usuario_id = u.id
        ORDER BY k.fecha DESC
        LIMIT ?
      `, [limit]);
    });
  }
};
