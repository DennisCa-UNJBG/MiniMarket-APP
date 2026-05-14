import { getDb } from '../lib/db';
import { sucursalService } from './sucursalService';
import { esRegistroEditable } from '../lib/dateUtils';
import { logService } from '../lib/logService';

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

    // 1. Obtener items anteriores para revertir stock
    const oldItems = await db.select<any[]>(
      'SELECT producto_id, cantidad FROM ventas_detalle WHERE venta_id = ?',
      [ventaId]
    );

    // 1. Actualizar Stock Físico (Silencioso)
    for (const item of oldItems) {
      await db.execute(
        'UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?', 
        [Number(item.cantidad), item.producto_id]
      );
    }

    // 2. Actualizar Cabecera
    await db.execute(
      `UPDATE ventas SET total = ?, igv = ?, igv_porcentaje = ?, metodo_pago = ?, monto_pagado = ?, vuelto = ? WHERE id = ?`,
      [venta.total, venta.igv || 0, venta.igv_porcentaje || 0, venta.metodo_pago, venta.monto_pagado, venta.vuelto, ventaId]
    );

    // 3. Validar Stock Final antes de proceder
    for (const item of venta.items) {
      const pData = await db.select<any[]>('SELECT stock_actual, nombre FROM productos WHERE id = ?', [item.producto_id]);
      if (pData.length === 0) throw new Error(`Producto ${item.producto_id} no encontrado`);
      
      const { stock_actual, nombre } = pData[0];
      const oldQty = oldItems.find(oi => oi.producto_id === item.producto_id)?.cantidad || 0;
      
      // El stock disponible real para esta edición es lo que hay en estante + lo que ya estaba en esta venta
      const stockDisponibleReal = stock_actual + oldQty;

      if (item.cantidad > stockDisponibleReal) {
        throw new Error(`Stock insuficiente para "${nombre}". Disponible: ${stockDisponibleReal}, Solicitado: ${item.cantidad}`);
      }
    }

    // 4. Borrar detalles antiguos e insertar nuevos
    await db.execute('DELETE FROM ventas_detalle WHERE venta_id = ?', [ventaId]);

    for (const item of venta.items) {
      const cantidadNueva = Number(item.cantidad);
      const precioUnitario = Number(item.precio_unitario);
      const subtotal = cantidadNueva * precioUnitario;
      
      await db.execute(
        `INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
         VALUES (?, ?, ?, ?, ?)`,
        [ventaId, item.producto_id, cantidadNueva, precioUnitario, subtotal]
      );

      // 5. Aplicar Ajuste en Stock y Kardex
      const pData = await db.select<any[]>('SELECT stock_actual, nombre FROM productos WHERE id = ?', [item.producto_id]);
      const stockActualDB = Number(pData[0]?.stock_actual || 0);
      const stockDespues = stockActualDB - cantidadNueva;

      await db.execute('UPDATE productos SET stock_actual = ? WHERE id = ?', [stockDespues, item.producto_id]);

      // 6. Registro de Ajuste Neto en Kardex
      const oldItem = oldItems.find(oi => oi.producto_id === item.producto_id);
      const oldQty = oldItem ? Number(oldItem.cantidad) : 0;
      const diferencia = cantidadNueva - oldQty;

      if (diferencia !== 0) {
        const tipoMov = diferencia > 0 ? 'SALIDA' : 'ENTRADA';
        const cantMov = Math.abs(diferencia);
        
        await db.execute(
          `INSERT INTO kardex (producto_id, usuario_id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [item.producto_id, usuarioId, tipoMov, cantMov, stockDespues, precioUnitario, `EDICIÓN VENTA #${ventaId}`]
        );
      }
    }

    // 7. Manejar productos que fueron eliminados de la venta
    for (const oldItem of oldItems) {
      const existsInNew = venta.items.some(ni => ni.producto_id === oldItem.producto_id);
      if (!existsInNew) {
        const pData = await db.select<any[]>('SELECT stock_actual FROM productos WHERE id = ?', [oldItem.producto_id]);
        const stockActual = pData[0]?.stock_actual || 0;
        
        await db.execute(
          `INSERT INTO kardex (producto_id, usuario_id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia) 
           VALUES (?, ?, 'ENTRADA', ?, ?, 0, ?)`,
          [oldItem.producto_id, usuarioId, oldItem.cantidad, stockActual, `EDICIÓN VENTA #${ventaId}`]
        );
      }
    }

    // 5. Registrar Log de Auditoría
    try {
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
