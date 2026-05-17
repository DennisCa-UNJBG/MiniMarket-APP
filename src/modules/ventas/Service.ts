import { getDb } from '../../lib/db';
import { sucursalService } from '../sucursales/Service';
import { logService } from '../../lib/logService';

interface VentaItem {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

interface VentaData {
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
  async registrarVenta(venta: VentaData): Promise<{ ventaId: number, alertas: string[], vuelto: number }> {
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

    await Promise.all(venta.items.map(async (item) => {
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
        `INSERT INTO kardex (producto_id, usuario_id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia, sucursal_id) 
         VALUES (?, ?, 'SALIDA', ?, ?, ?, ?, ?)`,
        [
          item.producto_id, 
          venta.usuario_id, 
          item.cantidad, 
          nuevoStock, 
          item.precio_unitario, 
          `VENTA #${ventaId} (${venta.metodo_pago})`,
          sucursalId
        ]
      );
    }));

    // 5. Log de Auditoría
    await logService.register({
      usuario_id: venta.usuario_id,
      accion: 'REGISTRO_VENTA',
      tabla: 'ventas',
      registro_id: ventaId,
      detalles: `Venta #${ventaId} registrada por un total de S/ ${venta.total.toFixed(2)} (${venta.metodo_pago})`
    });

    return { ventaId, alertas, vuelto: venta.vuelto };
  },

  /**
   * Obtiene el historial de ventas con paginación
   */
  async getVentas(page = 1, pageSize = 10): Promise<{ data: any[], total: number }> {
    const [db, config] = await Promise.all([
      getDb(),
      sucursalService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';
    const offset = (page - 1) * pageSize;

    // Obtener total de registros y datos paginados en paralelo
    const [totalRes, data] = await Promise.all([
      db.select<any[]>(
        'SELECT COUNT(*) as count FROM ventas WHERE sucursal_id = ? OR sucursal_id IS NULL',
        [sucursalId]
      ),
      db.select<any[]>(`
        SELECT 
          v.*, 
          u.nombre_completo as usuario_nombre,
          (SELECT COUNT(*) FROM ventas_detalle WHERE venta_id = v.id) as items_count
        FROM ventas v
        JOIN usuarios u ON v.usuario_id = u.id
        WHERE v.sucursal_id = ? OR v.sucursal_id IS NULL
        ORDER BY v.fecha DESC
        LIMIT ? OFFSET ?
      `, [sucursalId, pageSize, offset])
    ]);
    const total = totalRes[0]?.count || 0;

    return { data, total };
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
   * Obtiene un resumen detallado de las ventas y gastos filtrado por fecha
   */
  async getResumenHoy(desde?: string): Promise<{ total: number, total_efectivo: number, total_digital: number, total_gastos_efectivo: number, count: number }> {
    const [db, config] = await Promise.all([
      getDb(),
      sucursalService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';

    // Si no hay fecha 'desde', usamos el inicio del día actual
    const fechaFiltro = desde ? desde : "date('now', 'start of day')";
    const isTimestamp = desde ? true : false;

    // Obtener ventas y gastos en paralelo
    const [ventas, gastos] = await Promise.all([
      db.select<any[]>(`
        SELECT 
          COALESCE(SUM(total), 0) as total,
          COALESCE(SUM(CASE WHEN metodo_pago = 'EFECTIVO' THEN total ELSE 0 END), 0) as total_efectivo,
          COALESCE(SUM(CASE WHEN metodo_pago = 'TARJETA' THEN total ELSE 0 END), 0) as total_digital,
          COUNT(*) as count
        FROM ventas
        WHERE ${isTimestamp ? "fecha >= ?" : "date(fecha, 'localtime') >= " + fechaFiltro}
        AND estado != 'anulado'
        AND (sucursal_id = ? OR sucursal_id IS NULL)
      `, isTimestamp ? [desde, sucursalId] : [sucursalId]),
      db.select<any[]>(`
        SELECT COALESCE(SUM(total), 0) as total_gastos
        FROM compras_ingresos
        WHERE ${isTimestamp ? "fecha >= ?" : "date(fecha, 'localtime') >= " + fechaFiltro}
        AND metodo_pago = 'EFECTIVO'
        AND estado != 'anulado'
        AND (sucursal_id = ? OR sucursal_id IS NULL)
      `, isTimestamp ? [desde, sucursalId] : [sucursalId])
    ]);

    return {
      ...ventas[0],
      total_gastos_efectivo: gastos[0]?.total_gastos || 0
    };
  },

  /**
   * Obtiene el resumen de ventas entre dos fechas (rango exacto por día)
   * Permite comparar hoy vs ayer para calcular crecimiento real
   */
  async getResumenRango(fechaInicio: string, fechaFin: string): Promise<{ total: number, count: number }> {
    const [db, config] = await Promise.all([
      getDb(),
      sucursalService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';

    const result = await db.select<any[]>(`
      SELECT 
        COALESCE(SUM(total), 0) as total,
        COUNT(*) as count
      FROM ventas
      WHERE date(fecha, 'localtime') >= date(?)
        AND date(fecha, 'localtime') <= date(?)
        AND estado != 'anulado'
        AND (sucursal_id = ? OR sucursal_id IS NULL)
    `, [fechaInicio, fechaFin, sucursalId]);

    return { total: result[0]?.total || 0, count: result[0]?.count || 0 };
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
    await Promise.all(items.map(item =>
      db.execute(
        'UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      )
    ));

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
