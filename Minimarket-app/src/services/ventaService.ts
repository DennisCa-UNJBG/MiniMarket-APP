import { getDb } from '../lib/db';
import { withDb } from '../lib/withDb';

export interface VentaItem {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

export interface VentaData {
  usuario_id: number;
  total: number;
  metodo_pago: string;
  items: VentaItem[];
  cliente_id?: number;
}

export const ventaService = {
  /**
   * Registra una venta completa:
   * 1. Inserta la cabecera (ventas)
   * 2. Inserta los detalles (ventas_detalle)
   * 3. Actualiza el stock de los productos
   * 4. Registra los movimientos en el Kardex
   */
  async registrarVenta(venta: VentaData): Promise<number> {
    return withDb(async () => {
      const db = await getDb();
      
      // 1. Insertar Cabecera
      const resVenta = await db.execute(
        `INSERT INTO ventas (usuario_id, total, metodo_pago) VALUES (?, ?, ?)`,
        [venta.usuario_id, venta.total, venta.metodo_pago]
      );
      
      const ventaId = resVenta.lastInsertId as number;

      for (const item of venta.items) {
        const subtotal = item.cantidad * item.precio_unitario;
        
        // 2. Insertar Detalle
        await db.execute(
          `INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
           VALUES (?, ?, ?, ?, ?)`,
          [ventaId, item.producto_id, item.cantidad, item.precio_unitario, subtotal]
        );

        // 3. Actualizar Stock y Obtener stock posterior
        const pData = await db.select<any[]>('SELECT stock_actual, nombre FROM productos WHERE id = ?', [item.producto_id]);
        if (pData.length === 0) throw new Error(`Producto ${item.producto_id} no encontrado`);
        
        const stockAnterior = pData[0].stock_actual;
        const nuevoStock = stockAnterior - item.cantidad;

        await db.execute('UPDATE productos SET stock_actual = ? WHERE id = ?', [nuevoStock, item.producto_id]);

        // 4. Registrar en Kardex
        await db.execute(
          `INSERT INTO kardex (producto_id, usuario_id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia) 
           VALUES (?, ?, 'SALIDA', ?, ?, ?, ?)`,
          [
            item.producto_id, 
            venta.usuario_id, 
            item.cantidad, 
            nuevoStock, 
            item.precio_unitario, 
            `VENTA #${ventaId}`
          ]
        );
      }

      return ventaId;
    });
  },

  /**
   * Obtiene el historial de ventas
   */
  async getVentas(limit = 50): Promise<any[]> {
    return withDb(async () => {
      const db = await getDb();
      return db.select(`
        SELECT v.*, u.nombre_completo as usuario_nombre
        FROM ventas v
        JOIN usuarios u ON v.usuario_id = u.id
        ORDER BY v.fecha DESC
        LIMIT ?
      `, [limit]);
    });
  }
};
