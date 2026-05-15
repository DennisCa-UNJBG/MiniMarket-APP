import { getDb } from '../../lib/db';
import { sucursalService } from '../sucursales/Service';
import { logService } from '../../lib/logService';

export interface VentaItem {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

export interface VentaData {
  usuario_id: number;
  total: number;
  igv: number;
  metodo_pago: string;
  monto_pagado: number;
  vuelto: number;
  igv_porcentaje: number;
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
  async registrarVenta(venta: VentaData): Promise<{ ventaId: number, alertas: string[] }> {
    const db = await getDb();
    const alertas: string[] = [];
    
    // 1. Obtener ID de sucursal local
    const config = await sucursalService.getConfig();
    const sucursalId = config?.sucursal_id || 'LOCAL';

    // 2. Insertar Cabecera
    const resVenta = await db.execute(
      `INSERT INTO ventas (usuario_id, total, igv, igv_porcentaje, metodo_pago, monto_pagado, vuelto, sucursal_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [venta.usuario_id, venta.total, venta.igv || 0, venta.igv_porcentaje || 0, venta.metodo_pago, venta.monto_pagado, venta.vuelto, sucursalId]
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
      const pData = await db.select<any[]>('SELECT stock_actual, stock_minimo, nombre FROM productos WHERE id = ?', [item.producto_id]);
      if (pData.length === 0) throw new Error(`Producto ${item.producto_id} no encontrado`);
      
      const { stock_actual, stock_minimo, nombre } = pData[0];
      const nuevoStock = stock_actual - item.cantidad;

      // Verificar alerta de stock
      if (nuevoStock <= (stock_minimo || 0)) {
        alertas.push(nombre);
      }

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
          `VENTA #${ventaId} (${venta.metodo_pago})`
        ]
      );
    }

    return { ventaId, alertas };
  },

  /**
   * Obtiene el historial de ventas con cantidad de items
   */
  async getVentas(limit = 50): Promise<any[]> {
    const db = await getDb();
    const config = await sucursalService.getConfig();
    const sucursalId = config?.sucursal_id || 'LOCAL';

    return db.select(`
      SELECT 
        v.*, 
        u.nombre_completo as usuario_nombre,
        (SELECT COUNT(*) FROM ventas_detalle WHERE venta_id = v.id) as items_count
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.sucursal_id = ? OR v.sucursal_id IS NULL
      ORDER BY v.fecha DESC
      LIMIT ?
    `, [sucursalId, limit]);
  },

  /**
   * Obtiene los detalles de una venta específica
   */
  async getVentaDetalles(ventaId: number): Promise<any[]> {
    const db = await getDb();
    return db.select(`
      SELECT vd.*, p.nombre as producto_nombre, p.unidad_medida
    FROM ventas_detalle vd
    JOIN productos p ON vd.producto_id = p.id
    WHERE vd.venta_id = ?
    `, [ventaId]);
  },

  /**
   * Obtiene un resumen de las ventas de hoy
   */
  async getResumenHoy(): Promise<{ total: number, count: number }> {
    const db = await getDb();
    const config = await sucursalService.getConfig();
    const sucursalId = config?.sucursal_id || 'LOCAL';

    const result = await db.select<any[]>(`
      SELECT 
        COALESCE(SUM(total), 0) as total,
        COUNT(*) as count
      FROM ventas
      WHERE date(fecha, 'localtime') = date('now', 'localtime')
      AND (sucursal_id = ? OR sucursal_id IS NULL)
    `, [sucursalId]);
    return result[0];
  },

  /**
   * Obtiene la cantidad de ventas que aún no han sido sincronizadas
   */
  async getVentasPendientes(): Promise<number> {
    const db = await getDb();
    const res = await db.select<any[]>('SELECT count(*) as count FROM ventas WHERE sincronizado = 0');
    return res[0].count;
  },

  /**
   * Anula una venta existente, revierte el stock y elimina movimientos del kardex
   */
  async anularVenta(ventaId: number): Promise<void> {
    const db = await getDb();
    
    // 1. Obtener detalles para revertir stock
    const items = await db.select<any[]>('SELECT producto_id, cantidad FROM ventas_detalle WHERE venta_id = ?', [ventaId]);
    
    // 2. Revertir stock de cada producto
    for (const item of items) {
      await db.execute(
        'UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );
    }

    // 3. Eliminar registros del Kardex asociados
    await db.execute(
      "DELETE FROM kardex WHERE referencia LIKE ?",
      [`VENTA #${ventaId} %`]
    );

    // 4. Marcar como ANULADA
    await db.execute(
      "UPDATE ventas SET estado = 'anulado' WHERE id = ?",
      [ventaId]
    );

    // 5. Log de auditoría
    const session = await db.select<any[]>('SELECT usuario_id FROM ventas WHERE id = ?', [ventaId]);
    const usuarioId = session[0]?.usuario_id || 1;

    await logService.register({
      usuario_id: usuarioId,
      accion: 'ANULACION_VENTA',
      tabla: 'ventas',
      registro_id: ventaId,
      detalles: `Venta #${ventaId} anulada. Stock revertido.`
    });
  }
};
