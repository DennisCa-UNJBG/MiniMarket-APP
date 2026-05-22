import { getDb } from '../../shared/lib/db';
import { systemConfigService } from '../configuracion/systemConfigService';
import { logService } from '../../shared/lib/logService';


export interface CompraDetalle {
  producto_id: number;
  cantidad: number;
  costo_unitario: number;
}

export interface CompraCabecera {
  usuario_id: number;
  documento_referencia: string;
  metodo_pago: 'EFECTIVO' | 'BANCO';
  items: CompraDetalle[];
}

export const inventarioService = {
  /**
   * Registra una compra completa con múltiples productos (Lote)
   */
  async registrarCompraCompleta(compra: CompraCabecera): Promise<{ compraId: number, alertas: string[] }> {
    const db = await getDb();
    const alertas: string[] = [];

    const totalCompra = compra.items.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);

    const config = await systemConfigService.getConfig();
    const sucursalId = config?.sucursal_id || 'LOCAL';

    // 1. Insertar Cabecera de Compra
    const resCabecera = await db.execute(
      `INSERT INTO compras_ingresos (usuario_id, documento_referencia, total, sucursal_id, metodo_pago) 
       VALUES (?, ?, ?, ?, ?)`,
      [compra.usuario_id, compra.documento_referencia, totalCompra, sucursalId, compra.metodo_pago || 'BANCO']
    );

    const compraId = resCabecera.lastInsertId as number;

    // 2. Procesar cada producto del lote
    await Promise.all(compra.items.map(async (item) => {
      // A. Obtener stock actual y precio de venta actual en paralelo
      const [pData, precioActual] = await Promise.all([
        db.select<any[]>('SELECT stock_actual, stock_minimo, nombre FROM productos WHERE id = ?', [item.producto_id]),
        db.select<any[]>('SELECT precio_venta FROM precios_historial WHERE producto_id = ? ORDER BY id DESC LIMIT 1', [item.producto_id])
      ]);

      if (pData.length === 0) throw new Error(`Producto ${item.producto_id} no encontrado`);
      const { stock_actual, stock_minimo, nombre } = pData[0];
      const nuevoStock = stock_actual + item.cantidad;
      const precioVenta = precioActual.length > 0 ? (precioActual[0].precio_venta || 0) : 0;

      // Verificar si sigue bajo stock mínimo después de la compra
      if (nuevoStock <= (stock_minimo || 0)) {
        alertas.push(nombre);
      }

      // B. Ejecutar todas las escrituras independientes en la base de datos en paralelo
      await Promise.all([
        db.execute(
          `INSERT INTO compras_detalle (compra_id, producto_id, cantidad, costo_unitario, subtotal) 
           VALUES (?, ?, ?, ?, ?)`,
          [compraId, item.producto_id, item.cantidad, item.costo_unitario, item.cantidad * item.costo_unitario]
        ),
        db.execute(
          `INSERT INTO kardex (producto_id, usuario_id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia, sucursal_id) 
           VALUES (?, ?, 'INGRESO', ?, ?, ?, ?, ?)`,
          [item.producto_id, compra.usuario_id, item.cantidad, nuevoStock, item.costo_unitario, `COMPRA #${compraId} (${compra.documento_referencia || 'S/R'})`, sucursalId]
        ),
        db.execute('UPDATE productos SET stock_actual = ? WHERE id = ?', [nuevoStock, item.producto_id]),
        (async () => {
          await db.execute('UPDATE precios_historial SET activo = 0 WHERE producto_id = ?', [item.producto_id]);
          await db.execute(
            `INSERT INTO precios_historial (producto_id, precio_compra, precio_venta, activo) 
             VALUES (?, ?, ?, 1)`,
            [item.producto_id, item.costo_unitario, precioVenta]
          );
        })()
      ]);
    }));

    // 3. Log de Auditoría
    await logService.register({
      usuario_id: compra.usuario_id,
      accion: 'REGISTRO_COMPRA',
      tabla: 'compras_ingresos',
      registro_id: compraId,
      detalles: `Ingreso de mercadería #${compraId} registrado (Doc: ${compra.documento_referencia || 'S/R'})`
    });

    return { compraId, alertas };
  },

  /**
   * Obtiene los últimos movimientos del kardex
   */
  async getMovimientos(limit = 50): Promise<any[]> {
    const [db, config] = await Promise.all([
      getDb(),
      systemConfigService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';

    return db.select(`
      SELECT k.*, p.nombre as producto_nombre, u.nombre_completo as usuario_nombre
      FROM kardex k
      JOIN productos p ON k.producto_id = p.id
      JOIN usuarios u ON k.usuario_id = u.id
      WHERE k.sucursal_id = ? OR k.sucursal_id IS NULL
      ORDER BY k.fecha DESC
      LIMIT ?
    `, [sucursalId, limit]);
  },

  /**
   * Obtiene los movimientos del kardex para un producto específico (Paginado)
   */
  async getMovimientosPorProducto(productoId: number, page = 1, pageSize = 10): Promise<{ data: any[], total: number }> {
    const [db, config] = await Promise.all([
      getDb(),
      systemConfigService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';
    const offset = (page - 1) * pageSize;

    // Obtener total de registros y datos paginados en paralelo
    const [totalRes, data] = await Promise.all([
      db.select<any[]>(
        'SELECT COUNT(*) as count FROM kardex WHERE producto_id = ? AND (sucursal_id = ? OR sucursal_id IS NULL)',
        [productoId, sucursalId]
      ),
      db.select<any[]>(`
        SELECT k.*, p.nombre as producto_nombre, u.nombre_completo as usuario_nombre
        FROM kardex k
        JOIN productos p ON k.producto_id = p.id
        JOIN usuarios u ON k.usuario_id = u.id
        WHERE k.producto_id = ? AND (k.sucursal_id = ? OR k.sucursal_id IS NULL)
        ORDER BY k.fecha DESC
        LIMIT ? OFFSET ?
      `, [productoId, sucursalId, pageSize, offset])
    ]);
    const total = totalRes[0]?.count || 0;

    return { data, total };
  },

  /**
   * Obtiene los movimientos realizados en el día actual (Paginado)
   */
  async getMovimientosDia(page = 1, pageSize = 10): Promise<{ data: any[], total: number }> {
    const [db, config] = await Promise.all([
      getDb(),
      systemConfigService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';
    const offset = (page - 1) * pageSize;

    // Obtener total de registros y datos paginados en paralelo
    const [totalRes, data] = await Promise.all([
      db.select<any[]>(
        "SELECT COUNT(*) as count FROM kardex WHERE date(fecha, 'localtime') = date('now', 'localtime') AND (sucursal_id = ? OR sucursal_id IS NULL)",
        [sucursalId]
      ),
      db.select<any[]>(`
        SELECT k.*, p.nombre as producto_nombre, u.nombre_completo as usuario_nombre
        FROM kardex k
        JOIN productos p ON k.producto_id = p.id
        JOIN usuarios u ON k.usuario_id = u.id
        WHERE date(k.fecha, 'localtime') = date('now', 'localtime')
        AND (k.sucursal_id = ? OR k.sucursal_id IS NULL)
        ORDER BY k.fecha DESC
        LIMIT ? OFFSET ?
      `, [sucursalId, pageSize, offset])
    ]);
    const total = totalRes[0]?.count || 0;

    return { data, total };
  },

  /**
   * Obtiene movimientos filtrados por producto y/o rango de fechas (Paginado)
   */
  async getMovimientosFiltrados(filters: { productoId?: number, fechaInicio?: string, fechaFin?: string }, page = 1, pageSize = 10): Promise<{ data: any[], total: number }> {
    const db = await getDb();
    const offset = (page - 1) * pageSize;

    let whereClause = " WHERE 1=1 ";
    const params: any[] = [];

    if (filters.productoId) {
      whereClause += " AND k.producto_id = ? ";
      params.push(filters.productoId);
    }

    if (filters.fechaInicio) {
      whereClause += " AND date(k.fecha, 'localtime') >= date(?) ";
      params.push(filters.fechaInicio);
    }

    if (filters.fechaFin) {
      whereClause += " AND date(k.fecha, 'localtime') <= date(?) ";
      params.push(filters.fechaFin);
    }

    // Obtener total y datos filtrados en paralelo
    const [totalRes, data] = await Promise.all([
      db.select<any[]>(`SELECT COUNT(*) as count FROM kardex k ${whereClause}`, params),
      db.select<any[]>(`
        SELECT k.*, p.nombre as producto_nombre, u.nombre_completo as usuario_nombre
        FROM kardex k
        JOIN productos p ON k.producto_id = p.id
        JOIN usuarios u ON k.usuario_id = u.id
        ${whereClause}
        ORDER BY k.fecha DESC
        LIMIT ? OFFSET ?
      `, [...params, pageSize, offset])
    ]);
    const total = totalRes[0]?.count || 0;

    return { data, total };
  },

  /**
   * Obtiene el historial de cabeceras de compras (Paginado)
   */
  async getCompras(page = 1, pageSize = 10): Promise<{ data: any[], total: number }> {
    const [db, config] = await Promise.all([
      getDb(),
      systemConfigService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';
    const offset = (page - 1) * pageSize;

    // Obtener total de registros y datos paginados en paralelo
    const [totalRes, data] = await Promise.all([
      db.select<any[]>(
        'SELECT COUNT(*) as count FROM compras_ingresos WHERE sucursal_id = ? OR sucursal_id IS NULL',
        [sucursalId]
      ),
      db.select<any[]>(`
        SELECT c.*, u.nombre_completo as usuario_nombre
        FROM compras_ingresos c
        JOIN usuarios u ON c.usuario_id = u.id
        WHERE c.sucursal_id = ? OR c.sucursal_id IS NULL
        ORDER BY c.fecha DESC
        LIMIT ? OFFSET ?
      `, [sucursalId, pageSize, offset])
    ]);
    const total = totalRes[0]?.count || 0;

    return { data, total };
  },

  /**
   * Obtiene el detalle de una compra específica
   */
  async getCompraDetalle(compraId: number): Promise<any[]> {
    const db = await getDb();
    return db.select(`
      SELECT d.*, p.nombre as producto_nombre, p.codigo_barras
      FROM compras_detalle d
      JOIN productos p ON d.producto_id = p.id
      WHERE d.compra_id = ?
    `, [compraId]);
  },

  /**
   * Anula una compra existente, revierte el stock y elimina movimientos del kardex
   */
  async anularCompra(compraId: number): Promise<void> {
    const db = await getDb();

    // 1. Obtener detalles de la compra para revertir stock
    const items = await db.select<any[]>('SELECT producto_id, cantidad FROM compras_detalle WHERE compra_id = ?', [compraId]);

    // 2. Revertir stock de cada producto
    await Promise.all(items.map(item =>
      db.execute(
        'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      )
    ));

    // 3. Eliminar registros del Kardex asociados a esta compra
    // Usamos el patrón "COMPRA #ID" que definimos en registrarCompraCompleta
    await db.execute(
      "DELETE FROM kardex WHERE referencia LIKE ?",
      [`COMPRA #${compraId} %`]
    );

    // 4. Marcar la compra como ANULADA
    await db.execute(
      "UPDATE compras_ingresos SET estado = 'anulado' WHERE id = ?",
      [compraId]
    );

    // 5. Registrar Log de Auditoría
    const session = await db.select<any[]>('SELECT usuario_id FROM compras_ingresos WHERE id = ?', [compraId]);
    const usuarioId = session[0]?.usuario_id || 1;

    await logService.register({
      usuario_id: usuarioId,
      accion: 'ANULACION_COMPRA',
      tabla: 'compras_ingresos',
      registro_id: compraId,
      detalles: `Anulación de compra #${compraId}. Stock revertido.`
    });
  },

  /**
   * Obtiene la cantidad de compras pendientes de sincronizar (no anuladas)
   */
  async getComprasPendientes(): Promise<number> {
    const db = await getDb();
    const result = await db.select<any[]>(
      "SELECT COUNT(*) as count FROM compras_ingresos WHERE (sincronizado = 0 OR sincronizado IS NULL) AND estado != 'anulado'"
    );
    return result.length > 0 ? result[0].count : 0;
  }
};
