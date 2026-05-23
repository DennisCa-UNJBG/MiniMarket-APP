import { getDb } from '../../shared/lib/db';
import { logService } from '../../shared/lib/logService';

export const sucursalService = {

  /**
   * Obtiene todas las sucursales registradas (Solo para Sede Principal)
   */
  async getAll(): Promise<any[]> {
    const db = await getDb();
    return await db.select('SELECT * FROM sucursales ORDER BY nombre ASC');
  },

  /**
   * Registra una nueva sucursal (Solo desde Sede Principal)
   */
  async create(sucursal: { codigo: string; nombre: string; direccion?: string }, usuarioId: number) {
    const db = await getDb();
    const result = await db.execute(
      'INSERT INTO sucursales (codigo, nombre, direccion) VALUES (?, ?, ?)',
      [sucursal.codigo, sucursal.nombre, sucursal.direccion || '']
    );

    const sucursalId = result.lastInsertId as number;

    await logService.register({
      usuario_id: usuarioId,
      accion: 'CREAR_SUCURSAL',
      tabla: 'sucursales',
      registro_id: sucursalId,
      detalles: `Nueva sucursal registrada: ${sucursal.nombre} (${sucursal.codigo})`
    });

    return true;
  },

  /**
   * Actualiza una sucursal existente
   */
  async update(id: number, sucursal: { codigo: string; nombre: string; direccion?: string }, usuarioId: number) {
    const db = await getDb();
    await Promise.all([
      db.execute(
        'UPDATE sucursales SET codigo = ?, nombre = ?, direccion = ? WHERE id = ?',
        [sucursal.codigo, sucursal.nombre, sucursal.direccion || '', id]
      ),
      logService.register({
        usuario_id: usuarioId,
        accion: 'EDITAR_SUCURSAL',
        tabla: 'sucursales',
        registro_id: id,
        detalles: `Datos actualizados para la sucursal: ${sucursal.nombre}`
      })
    ]);

    return true;
  },

  /**
   * Cambia el estado de una sucursal (activo/inactivo)
   */
  async toggleEstado(id: number, nuevoEstado: 'activo' | 'inactivo', usuarioId?: number) {
    const db = await getDb();

    // Obtener nombre de la sucursal para el detalle
    const sData = await db.select<any[]>('SELECT nombre FROM sucursales WHERE id = ?', [id]);
    const nombre = sData[0]?.nombre || 'ID:' + id;

    const promises: Promise<any>[] = [
      db.execute('UPDATE sucursales SET estado = ? WHERE id = ?', [nuevoEstado, id])
    ];

    if (usuarioId) {
      promises.push(
        logService.register({
          usuario_id: usuarioId,
          accion: 'ESTADO_SUCURSAL',
          tabla: 'sucursales',
          registro_id: id,
          detalles: `Sucursal "${nombre}" marcada como ${nuevoEstado.toUpperCase()}`
        })
      );
    }

    await Promise.all(promises);
    return true;
  },

  /**
   * Obtiene el stock de los productos para una sucursal específica
   */
  async getSucursalStock(sucursalId: string): Promise<any[]> {
    const db = await getDb();
    return await db.select(
      `SELECT ss.id, ss.codigo_barras, ss.stock, ss.ultima_actualizacion,
              p.nombre as producto_nombre, u.abreviatura as unidad_medida, p.stock_minimo,
              c.nombre as categoria_nombre
       FROM sucursales_stock ss
       LEFT JOIN productos p ON ss.codigo_barras = p.codigo_barras
       LEFT JOIN unidades_medida u ON p.unidad_id = u.id
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE ss.sucursal_id = ?
       ORDER BY p.nombre ASC`,
      [sucursalId]
    );
  },

  /**
   * Obtiene el historial de ventas de una sucursal específica
   */
  async getSucursalVentas(sucursalId: string): Promise<any[]> {
    const db = await getDb();
    return await db.select(
      `SELECT v.id, v.fecha, v.total, v.metodo_pago, v.estado, v.igv, v.igv_porcentaje, v.monto_pagado, v.vuelto,
              u.nombre_completo as usuario_nombre,
              cl.nombre as cliente_nombre, cl.dni_ruc as cliente_dni_ruc
       FROM ventas v
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       LEFT JOIN clientes cl ON v.cliente_id = cl.id
       WHERE v.sucursal_id = ?
       ORDER BY v.fecha DESC`,
      [sucursalId]
    );
  },

  /**
   * Obtiene el historial de movimientos de kardex de una sucursal específica
   */
  async getSucursalKardex(sucursalId: string): Promise<any[]> {
    const db = await getDb();
    return await db.select(
      `SELECT k.id, k.fecha, k.tipo_movimiento, k.cantidad, k.saldo_posterior, k.costo_unitario, k.referencia,
              p.nombre as producto_nombre,
              u.nombre_completo as usuario_nombre
       FROM kardex k
       LEFT JOIN productos p ON k.producto_id = p.id
       LEFT JOIN usuarios u ON k.usuario_id = u.id
       WHERE k.sucursal_id = ?
       ORDER BY k.fecha DESC`,
      [sucursalId]
    );
  },

  /**
   * Obtiene los detalles de una venta específica (boleta)
   */
  async getVentaDetalles(ventaId: number): Promise<any[]> {
    const db = await getDb();
    return await db.select(
      `SELECT vd.id, vd.cantidad, vd.precio_unitario, vd.subtotal,
              p.nombre as producto_nombre, u.abreviatura as unidad_medida
       FROM ventas_detalle vd
       LEFT JOIN productos p ON vd.producto_id = p.id
       LEFT JOIN unidades_medida u ON p.unidad_id = u.id
       WHERE vd.venta_id = ?`,
      [ventaId]
    );
  },

  /**
   * Realiza un ajuste manual al stock de un producto en una sucursal
   */
  async adjustStock(sucursalId: string, codigoBarras: string, nuevoStock: number, usuarioId: number): Promise<boolean> {
    const db = await getDb();

    // Obtener nombre del producto para el log
    const pData = await db.select<any[]>('SELECT nombre FROM productos WHERE codigo_barras = ?', [codigoBarras]);
    const productoNombre = pData[0]?.nombre || codigoBarras;

    // Actualizar o insertar el stock
    await db.execute(
      `INSERT INTO sucursales_stock (sucursal_id, codigo_barras, stock, ultima_actualizacion)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(sucursal_id, codigo_barras) DO UPDATE SET
          stock = excluded.stock,
          ultima_actualizacion = CURRENT_TIMESTAMP`,
      [sucursalId, codigoBarras, nuevoStock]
    );

    // Registrar en los logs
    await logService.register({
      usuario_id: usuarioId,
      accion: 'AJUSTE_STOCK_SUCURSAL',
      tabla: 'sucursales_stock',
      registro_id: 0,
      detalles: `Ajuste manual de stock en sucursal "${sucursalId}" para el producto "${productoNombre}" (${codigoBarras}) a: ${nuevoStock}`
    });

    return true;
  },

  /**
   * Obtiene las compras asociadas a una sucursal específica
   */
  async getSucursalCompras(sucursalId: string): Promise<any[]> {
    const db = await getDb();
    return await db.select(
      `SELECT ci.id, ci.fecha, ci.documento_referencia, ci.total, ci.metodo_pago, ci.estado, ci.sincronizado,
              u.nombre_completo as usuario_nombre
       FROM compras_ingresos ci
       LEFT JOIN usuarios u ON ci.usuario_id = u.id
       WHERE ci.sucursal_id = ?
       ORDER BY ci.fecha DESC`,
      [sucursalId]
    );
  },

  /**
   * Obtiene los detalles de una compra específica
   */
  async getCompraDetalles(compraId: number): Promise<any[]> {
    const db = await getDb();
    return await db.select(
      `SELECT cd.id, cd.cantidad, cd.costo_unitario, cd.subtotal,
              p.nombre as producto_nombre, u.abreviatura as unidad_medida
       FROM compras_detalle cd
       LEFT JOIN productos p ON cd.producto_id = p.id
       LEFT JOIN unidades_medida u ON p.unidad_id = u.id
       WHERE cd.compra_id = ?`,
      [compraId]
    );
  },

  /**
   * Obtiene las sesiones de caja asociadas a una sucursal específica
   */
  async getSucursalCajas(sucursalId: string): Promise<any[]> {
    const db = await getDb();
    return await db.select(
      `SELECT c.id, c.monto_inicial, c.monto_final, c.monto_esperado, c.fecha_apertura, c.fecha_cierre, c.estado,
              u.nombre_completo as usuario_nombre
       FROM cajas c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.sucursal_id = ?
       ORDER BY c.fecha_apertura DESC`,
      [sucursalId]
    );
  },

  /**
   * Obtiene las métricas agregadas financieras de una sucursal por rango de fechas
   */
  async getSucursalReporteFinanzas(sucursalId: string, desde: string, hasta: string): Promise<any> {
    const db = await getDb();
    const desdeStr = `${desde} 00:00:00`;
    const hastaStr = `${hasta} 23:59:59`;

    const [ventasRes, comprasRes, prodRes] = await Promise.all([
      db.select<any[]>(
        `SELECT COALESCE(SUM(total), 0) as total_ventas, COUNT(*) as cant_ventas 
         FROM ventas 
         WHERE sucursal_id = ? AND estado != 'anulado' AND fecha >= ? AND fecha <= ?`,
        [sucursalId, desdeStr, hastaStr]
      ),
      db.select<any[]>(
        `SELECT COALESCE(SUM(total), 0) as total_compras, COUNT(*) as cant_compras 
         FROM compras_ingresos 
         WHERE sucursal_id = ? AND estado != 'anulado' AND fecha >= ? AND fecha <= ?`,
        [sucursalId, desdeStr, hastaStr]
      ),
      db.select<any[]>(
        `SELECT COALESCE(SUM(vd.cantidad), 0) as total_productos
         FROM ventas_detalle vd
         JOIN ventas v ON vd.venta_id = v.id
         WHERE v.sucursal_id = ? AND v.estado != 'anulado' AND v.fecha >= ? AND v.fecha <= ?`,
        [sucursalId, desdeStr, hastaStr]
      )
    ]);

    return {
      total_ventas: ventasRes[0]?.total_ventas || 0,
      cant_ventas: ventasRes[0]?.cant_ventas || 0,
      total_compras: comprasRes[0]?.total_compras || 0,
      cant_compras: comprasRes[0]?.cant_compras || 0,
      total_productos: prodRes[0]?.total_productos || 0
    };
  },

  /**
   * Obtiene las ventas diarias para graficar
   */
  async getSucursalReporteVentasDiarias(sucursalId: string, desde: string, hasta: string): Promise<any[]> {
    const db = await getDb();
    const desdeStr = `${desde} 00:00:00`;
    const hastaStr = `${hasta} 23:59:59`;

    return await db.select(
      `SELECT DATE(fecha) as dia, SUM(total) as total
       FROM ventas
       WHERE sucursal_id = ? AND estado != 'anulado' AND fecha >= ? AND fecha <= ?
       GROUP BY dia
       ORDER BY dia ASC`,
      [sucursalId, desdeStr, hastaStr]
    );
  },

  /**
   * Obtiene el Top 5 de productos más vendidos en una sucursal por rango de fechas
   */
  async getSucursalReporteProductosMasVendidos(sucursalId: string, desde: string, hasta: string): Promise<any[]> {
    const db = await getDb();
    const desdeStr = `${desde} 00:00:00`;
    const hastaStr = `${hasta} 23:59:59`;

    return await db.select(
      `SELECT p.nombre as producto_nombre, u.abreviatura as unidad_medida,
              SUM(vd.cantidad) as total_cantidad,
              SUM(vd.subtotal) as total_recaudado
       FROM ventas_detalle vd
       JOIN ventas v ON vd.venta_id = v.id
       JOIN productos p ON vd.producto_id = p.id
       LEFT JOIN unidades_medida u ON p.unidad_id = u.id
       WHERE v.sucursal_id = ? AND v.estado != 'anulado' AND v.fecha >= ? AND v.fecha <= ?
       GROUP BY p.id
       ORDER BY total_cantidad DESC
       LIMIT 5`,
      [sucursalId, desdeStr, hastaStr]
    );
  }
};
