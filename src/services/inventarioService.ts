import { getDb } from '../lib/db';
import { sucursalService } from './sucursalService';
import { esRegistroEditable } from '../lib/dateUtils';

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
  async registrarCompraCompleta(compra: CompraCabecera): Promise<{ compraId: number, alertas: string[] }> {
    const db = await getDb();
    const alertas: string[] = [];
    
    const totalCompra = compra.items.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);

    const config = await sucursalService.getConfig();
    const sucursalId = config?.sucursal_id || 'LOCAL';

    // 1. Insertar Cabecera de Compra
    const resCabecera = await db.execute(
      `INSERT INTO compras_ingresos (usuario_id, documento_referencia, total, sucursal_id) 
       VALUES (?, ?, ?, ?)`,
      [compra.usuario_id, compra.documento_referencia, totalCompra, sucursalId]
    );
    
    const compraId = resCabecera.lastInsertId as number;

    // 2. Procesar cada producto del lote
    for (const item of compra.items) {
      // A. Insertar Detalle de Compra
      await db.execute(
        `INSERT INTO compras_detalle (compra_id, producto_id, cantidad, costo_unitario, subtotal) 
         VALUES (?, ?, ?, ?, ?)`,
        [compraId, item.producto_id, item.cantidad, item.costo_unitario, item.cantidad * item.costo_unitario]
      );

      // B. Obtener stock actual para el Kardex
      const pData = await db.select<any[]>('SELECT stock_actual, stock_minimo, nombre FROM productos WHERE id = ?', [item.producto_id]);
      const { stock_actual, stock_minimo, nombre } = pData[0];
      const nuevoStock = stock_actual + item.cantidad;

      // Verificar si sigue bajo stock mínimo después de la compra
      if (nuevoStock <= (stock_minimo || 0)) {
        alertas.push(nombre);
      }

      // C. Registrar en Kardex
      await db.execute(
        `INSERT INTO kardex (producto_id, usuario_id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia, sucursal_id) 
         VALUES (?, ?, 'INGRESO', ?, ?, ?, ?, ?)`,
        [item.producto_id, compra.usuario_id, item.cantidad, nuevoStock, item.costo_unitario, compra.documento_referencia || `COMPRA #${compraId}`, sucursalId]
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

    return { compraId, alertas };
  },

  /**
   * Obtiene los últimos movimientos del kardex
   */
  async getMovimientos(limit = 50): Promise<any[]> {
    const db = await getDb();
    const config = await sucursalService.getConfig();
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
   * Obtiene los movimientos del kardex para un producto específico
   */
  async getMovimientosPorProducto(productoId: number): Promise<any[]> {
    const db = await getDb();
    const config = await sucursalService.getConfig();
    const sucursalId = config?.sucursal_id || 'LOCAL';

    return db.select(`
      SELECT k.*, p.nombre as producto_nombre, u.nombre_completo as usuario_nombre
      FROM kardex k
      JOIN productos p ON k.producto_id = p.id
      JOIN usuarios u ON k.usuario_id = u.id
      WHERE k.producto_id = ? AND (k.sucursal_id = ? OR k.sucursal_id IS NULL)
      ORDER BY k.fecha DESC
    `, [productoId, sucursalId]);
  },

  /**
   * Obtiene todos los movimientos realizados en el día actual
   */
  async getMovimientosDia(): Promise<any[]> {
    const db = await getDb();
    const config = await sucursalService.getConfig();
    const sucursalId = config?.sucursal_id || 'LOCAL';

    return db.select(`
      SELECT k.*, p.nombre as producto_nombre, u.nombre_completo as usuario_nombre
      FROM kardex k
      JOIN productos p ON k.producto_id = p.id
      JOIN usuarios u ON k.usuario_id = u.id
      WHERE date(k.fecha, 'localtime') = date('now', 'localtime')
      AND (k.sucursal_id = ? OR k.sucursal_id IS NULL)
      ORDER BY k.fecha DESC
    `, [sucursalId]);
  },

  /**
   * Obtiene movimientos filtrados por producto y/o rango de fechas
   */
  async getMovimientosFiltrados(filters: { productoId?: number, fechaInicio?: string, fechaFin?: string }): Promise<any[]> {
    const db = await getDb();
    let query = `
      SELECT k.*, p.nombre as producto_nombre, u.nombre_completo as usuario_nombre
      FROM kardex k
      JOIN productos p ON k.producto_id = p.id
      JOIN usuarios u ON k.usuario_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.productoId) {
      query += " AND k.producto_id = ? ";
      params.push(filters.productoId);
    }

    if (filters.fechaInicio) {
      query += " AND date(k.fecha, 'localtime') >= date(?) ";
      params.push(filters.fechaInicio);
    }

    if (filters.fechaFin) {
      query += " AND date(k.fecha, 'localtime') <= date(?) ";
      params.push(filters.fechaFin);
    }

    query += " ORDER BY k.fecha DESC ";
    
    return db.select(query, params);
  },

  /**
   * Obtiene el historial de cabeceras de compras
   */
  async getCompras(limit = 50): Promise<any[]> {
    const db = await getDb();
    const config = await sucursalService.getConfig();
    const sucursalId = config?.sucursal_id || 'LOCAL';

    return db.select(`
      SELECT c.*, u.nombre_completo as usuario_nombre
      FROM compras_ingresos c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.sucursal_id = ? OR c.sucursal_id IS NULL
      ORDER BY c.fecha DESC
      LIMIT ?
    `, [sucursalId, limit]);
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
   * Actualiza una compra existente y ajusta el stock
   */
  async actualizarCompraCompleta(compraId: number, compra: CompraCabecera): Promise<{ compraId: number, alertas: string[] }> {
    const db = await getDb();
    const alertas: string[] = [];
    
    // 0. Verificar ventana de edición de 12 horas
    const compraActual = await db.select<any[]>('SELECT fecha FROM compras_ingresos WHERE id = ?', [compraId]);
    if (compraActual.length === 0) throw new Error("La compra no existe.");

    if (!esRegistroEditable(compraActual[0].fecha)) {
      throw new Error("No se puede editar: Esta compra fue creada hace más de 12 horas.");
    }

    // 1. Obtener datos antiguos para revertir (stock)
    const oldItems = await db.select<any[]>('SELECT producto_id, cantidad FROM compras_detalle WHERE compra_id = ?', [compraId]);
    
    // 1. Revertir stock (Silencioso)
    for (const item of oldItems) {
      await db.execute(
        'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
        [Number(item.cantidad), item.producto_id]
      );
    }

    // 2. Limpiar detalles antiguos
    await db.execute('DELETE FROM compras_detalle WHERE compra_id = ?', [compraId]);

    // 3. Actualizar Cabecera
    const totalCompra = compra.items.reduce((acc, item) => acc + (Number(item.cantidad) * Number(item.costo_unitario)), 0);
    await db.execute(
      `UPDATE compras_ingresos SET documento_referencia = ?, total = ?, usuario_id = ? WHERE id = ?`,
      [compra.documento_referencia, totalCompra, compra.usuario_id, compraId]
    );

    // 4. Insertar nuevos detalles y aplicar Ajuste Neto en Kardex
    for (const item of compra.items) {
      const cantidadNueva = Number(item.cantidad);
      const costoNuevo = Number(item.costo_unitario);

      await db.execute(
        `INSERT INTO compras_detalle (compra_id, producto_id, cantidad, costo_unitario, subtotal) 
         VALUES (?, ?, ?, ?, ?)`,
        [compraId, item.producto_id, cantidadNueva, costoNuevo, cantidadNueva * costoNuevo]
      );

      const pData = await db.select<any[]>('SELECT stock_actual, stock_minimo, nombre FROM productos WHERE id = ?', [item.producto_id]);
      const stockActualDB = Number(pData[0]?.stock_actual || 0);
      const stockMinimo = Number(pData[0]?.stock_minimo || 0);
      const nombreProd = pData[0]?.nombre || 'Producto';
      
      const nuevoStockFinal = stockActualDB + cantidadNueva;

      if (nuevoStockFinal <= stockMinimo) {
        alertas.push(nombreProd);
      }

      // Actualizar Stock en Productos
      await db.execute('UPDATE productos SET stock_actual = ? WHERE id = ?', [nuevoStockFinal, item.producto_id]);

      // Registro de Ajuste Neto en Kardex
      const oldItem = oldItems.find(oi => oi.producto_id === item.producto_id);
      const oldQty = oldItem ? Number(oldItem.cantidad) : 0;
      const diferencia = cantidadNueva - oldQty;

      if (diferencia !== 0) {
        const tipoMov = diferencia > 0 ? 'INGRESO' : 'SALIDA';
        const cantMov = Math.abs(diferencia);
        
        await db.execute(
          `INSERT INTO kardex (producto_id, usuario_id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [item.producto_id, compra.usuario_id, tipoMov, cantMov, nuevoStockFinal, costoNuevo, `EDICIÓN COMPRA #${compraId}`]
        );
      }
    }

    // 5. Manejar productos que fueron eliminados de la compra original
    for (const oldItem of oldItems) {
      const existsInNew = compra.items.some(ni => ni.producto_id === oldItem.producto_id);
      if (!existsInNew) {
        const pData = await db.select<any[]>('SELECT stock_actual FROM productos WHERE id = ?', [oldItem.producto_id]);
        const stockActualDB = Number(pData[0]?.stock_actual || 0);
        
        await db.execute(
          `INSERT INTO kardex (producto_id, usuario_id, tipo_movimiento, cantidad, saldo_posterior, costo_unitario, referencia) 
           VALUES (?, ?, 'SALIDA', ?, ?, 0, ?)`,
          [oldItem.producto_id, compra.usuario_id, Number(oldItem.cantidad), stockActualDB, `EDICIÓN COMPRA #${compraId}`]
        );
      }
    }

    // 6. Registrar Log de Auditoría
    await db.execute(
      `INSERT INTO logs (usuario_id, accion, tabla, registro_id, detalles) 
       VALUES (?, ?, ?, ?, ?)`,
      [compra.usuario_id, 'EDICION_COMPRA', 'compras_ingresos', compraId, `Edición de compra #${compraId}. Ref: ${compra.documento_referencia}`]
    );

    return { compraId, alertas };

    return { compraId, alertas };
  }
};
