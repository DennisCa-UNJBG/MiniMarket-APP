import { getDb } from '../lib/db';
import { withDb } from '../lib/withDb';

export interface InventarioIngreso {
  id?: number;
  producto_id: number;
  usuario_id: number;
  cantidad: number;
  precio_compra: number;
  referencia?: string;
  fecha?: string;
}

export interface CompraDetalle {
  producto_id: number;
  cantidad: number;
  costo_unitario: number;
}

export interface CompraCabecera {
  usuario_id: number;
  documento_referencia: string;
  items: CompraDetalle[];
}

export const inventarioService = {
  /**
   * Registra una compra completa con múltiples productos (Lote)
   */
  async registrarCompraCompleta(compra: CompraCabecera): Promise<void> {
    return withDb(async () => {
      const db = await getDb();
      
      const totalCompra = compra.items.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);

      // 1. Insertar Cabecera de Compra
      const resCabecera = await db.execute(
        `INSERT INTO compras_ingresos (usuario_id, documento_referencia, total) 
         VALUES (?, ?, ?)`,
        [compra.usuario_id, compra.documento_referencia, totalCompra]
      );
      
      const compraId = resCabecera.lastInsertId;

      // 2. Procesar cada producto del lote
      for (const item of compra.items) {
        // A. Insertar Detalle de Compra
        await db.execute(
          `INSERT INTO compras_detalle (compra_id, producto_id, cantidad, costo_unitario, subtotal) 
           VALUES (?, ?, ?, ?, ?)`,
          [compraId, item.producto_id, item.cantidad, item.costo_unitario, item.cantidad * item.costo_unitario]
        );

        // B. Obtener stock actual para el Kardex
        const pData = await db.select<any[]>('SELECT stock_actual FROM productos WHERE id = ?', [item.producto_id]);
        const stockAnterior = pData[0]?.stock_actual || 0;
        const nuevoStock = stockAnterior + item.cantidad;

        // C. Registrar en Kardex
        await db.execute(
          `INSERT INTO kardex (producto_id, usuario_id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia) 
           VALUES (?, ?, 'INGRESO', ?, ?, ?, ?)`,
          [item.producto_id, compra.usuario_id, item.cantidad, nuevoStock, item.costo_unitario, compra.documento_referencia || `COMPRA #${compraId}`]
        );

        // D. Actualizar Stock en tabla Productos
        await db.execute('UPDATE productos SET stock_actual = ? WHERE id = ?', [nuevoStock, item.producto_id]);

        // E. Actualizar Historial de Precios (Desactivar anterior e insertar nuevo con nuevo costo)
        await db.execute('UPDATE precios_historial SET activo = 0 WHERE producto_id = ?', [item.producto_id]);
        
        const precioActual = await db.select<any[]>(
          'SELECT precio_venta FROM precios_historial WHERE producto_id = ? ORDER BY id DESC LIMIT 1',
          [item.producto_id]
        );
        const precioVenta = precioActual.length > 0 ? (precioActual[0].precio_venta || 0) : 0;

        await db.execute(
          `INSERT INTO precios_historial (producto_id, precio_compra, precio_venta, activo) 
           VALUES (?, ?, ?, 1)`,
          [item.producto_id, item.costo_unitario, precioVenta]
        );
      }
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
  },

  /**
   * Obtiene el historial de cabeceras de compras
   */
  async getCompras(limit = 50): Promise<any[]> {
    return withDb(async () => {
      const db = await getDb();
      return db.select(`
        SELECT c.*, u.nombre_completo as usuario_nombre
        FROM compras_ingresos c
        JOIN usuarios u ON c.usuario_id = u.id
        ORDER BY c.fecha DESC
        LIMIT ?
      `, [limit]);
    });
  },

  /**
   * Obtiene el detalle de una compra específica
   */
  async getCompraDetalle(compraId: number): Promise<any[]> {
    return withDb(async () => {
      const db = await getDb();
      return db.select(`
        SELECT d.*, p.nombre as producto_nombre, p.codigo_barras
        FROM compras_detalle d
        JOIN productos p ON d.producto_id = p.id
        WHERE d.compra_id = ?
      `, [compraId]);
    });
  },

  /**
   * Actualiza una compra existente y ajusta el stock
   */
  async actualizarCompraCompleta(compraId: number, compra: CompraCabecera): Promise<void> {
    return withDb(async () => {
      const db = await getDb();
      
      // 1. Obtener datos antiguos para revertir (stock y referencia)
      const oldCabecera = await db.select<any[]>('SELECT documento_referencia FROM compras_ingresos WHERE id = ?', [compraId]);
      const oldRef = oldCabecera[0]?.documento_referencia || `COMPRA #${compraId}`;
      
      const oldItems = await db.select<any[]>('SELECT producto_id, cantidad FROM compras_detalle WHERE compra_id = ?', [compraId]);
      
      for (const item of oldItems) {
        await db.execute('UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?', [item.cantidad, item.producto_id]);
      }

      // 2. Limpiar detalles antiguos y movimientos de kardex previos
      await db.execute('DELETE FROM compras_detalle WHERE compra_id = ?', [compraId]);
      await db.execute('DELETE FROM kardex WHERE referencia = ?', [oldRef]);

      // 3. Actualizar Cabecera
      const totalCompra = compra.items.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);
      await db.execute(
        `UPDATE compras_ingresos SET documento_referencia = ?, total = ?, usuario_id = ? WHERE id = ?`,
        [compra.documento_referencia, totalCompra, compra.usuario_id, compraId]
      );

      // 4. Insertar nuevos detalles, actualizar stock e insertar en Kardex
      for (const item of compra.items) {
        await db.execute(
          `INSERT INTO compras_detalle (compra_id, producto_id, cantidad, costo_unitario, subtotal) 
           VALUES (?, ?, ?, ?, ?)`,
          [compraId, item.producto_id, item.cantidad, item.costo_unitario, item.cantidad * item.costo_unitario]
        );

        const pData = await db.select<any[]>('SELECT stock_actual FROM productos WHERE id = ?', [item.producto_id]);
        const stockAnterior = pData[0]?.stock_actual || 0;
        const nuevoStock = stockAnterior + item.cantidad;

        // Actualizar Stock en Productos
        await db.execute('UPDATE productos SET stock_actual = ? WHERE id = ?', [nuevoStock, item.producto_id]);

        // Registrar nuevo movimiento en Kardex
        await db.execute(
          `INSERT INTO kardex (producto_id, usuario_id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia) 
           VALUES (?, ?, 'INGRESO', ?, ?, ?, ?)`,
          [item.producto_id, compra.usuario_id, item.cantidad, nuevoStock, item.costo_unitario, compra.documento_referencia || `COMPRA #${compraId}`]
        );
      }

      // 5. Registrar Log de Auditoría
      await db.execute(
        `INSERT INTO logs (usuario_id, accion, tabla, registro_id, detalles) 
         VALUES (?, ?, ?, ?, ?)`,
        [compra.usuario_id, 'EDICION_COMPRA', 'compras_ingresos', compraId, `Edición de compra. Ref anterior: ${oldRef}, Nueva ref: ${compra.documento_referencia}`]
      );
    });
  }
};
