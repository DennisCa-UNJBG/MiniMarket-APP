import { getDb } from '../lib/db';
import { sucursalService } from './sucursalService';
import { esRegistroEditable } from '../lib/dateUtils';

export interface VentaItem {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

export interface VentaData {
  usuario_id: number;
  total: number;
  metodo_pago: string;
  monto_pagado: number;
  vuelto: number;
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
      `INSERT INTO ventas (usuario_id, total, metodo_pago, monto_pagado, vuelto, sucursal_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [venta.usuario_id, venta.total, venta.metodo_pago, venta.monto_pagado, venta.vuelto, sucursalId]
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
          `VENTA #${ventaId}`
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
   * Actualiza una venta ya emitida:
   * 1. Revierte el stock de los items anteriores.
   * 2. Actualiza la cabecera.
   * 3. Borra items anteriores e inserta los nuevos.
   * 4. Descuenta el nuevo stock.
   * 5. Registra el Log de auditoría.
   */
  async actualizarVenta(ventaId: number, venta: VentaData, usuarioId: number): Promise<void> {
    const db = await getDb();

    // 0. Verificar si el registro aún es editable (ventana de 12 horas)
    const ventaActual = await db.select<any[]>('SELECT fecha FROM ventas WHERE id = ?', [ventaId]);
    if (ventaActual.length === 0) throw new Error("La venta no existe.");

    if (!esRegistroEditable(ventaActual[0].fecha)) {
      throw new Error("No se puede editar: Esta venta fue creada hace más de 12 horas.");
    }

    // 0. Obtener items anteriores para revertir stock
    const oldItems = await db.select<any[]>(
      'SELECT producto_id, cantidad FROM ventas_detalle WHERE venta_id = ?',
      [ventaId]
    );

    // 1. Revertir stock
    for (const item of oldItems) {
      await db.execute(
        'UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );
    }

    // 2. Actualizar Cabecera
    await db.execute(
      `UPDATE ventas SET total = ?, metodo_pago = ?, monto_pagado = ?, vuelto = ? WHERE id = ?`,
      [venta.total, venta.metodo_pago, venta.monto_pagado, venta.vuelto, ventaId]
    );

    // 3. Borrar detalles antiguos e insertar nuevos
    await db.execute('DELETE FROM ventas_detalle WHERE venta_id = ?', [ventaId]);

    for (const item of venta.items) {
      const subtotal = item.cantidad * item.precio_unitario;
      await db.execute(
        `INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
         VALUES (?, ?, ?, ?, ?)`,
        [ventaId, item.producto_id, item.cantidad, item.precio_unitario, subtotal]
      );

      // 4. Descontar nuevo stock
      await db.execute(
        'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );
    }

    // 5. Registrar Log de Auditoría
    try {
      const { logService } = await import('../lib/logService');
      await logService.register({
        usuario_id: usuarioId,
        accion: 'EDICION_VENTA',
        tabla: 'ventas',
        registro_id: ventaId,
        detalles: `Venta #${ventaId} editada. Nuevo total: S/ ${venta.total.toFixed(2)}. Items actualizados.`
      });
    } catch (e) {
      console.error("Error al registrar log de edición de venta:", e);
    }
  }
};
