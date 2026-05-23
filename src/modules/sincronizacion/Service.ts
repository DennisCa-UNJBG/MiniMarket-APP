import { systemConfigService } from '../configuracion/systemConfigService';
import { getDb } from '../../shared/lib/db';

export const syncService = {
  /**
   * Descarga productos desde la sede central y los sincroniza localmente
   */
  async pullProducts() {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    // 1. Obtener datos de la central
    const response = await fetch(`${config.api_url_central}/api/productos`, {
      method: 'GET',
      headers: {
        'X-Sucursal-Key': config.sucursal_id
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al descargar productos');
    }

    const [{ data: productosCentral }, db] = await Promise.all([
      response.json(),
      getDb()
    ]);

    let actualizados = 0;
    let creados = 0;

    // 1. Obtener categorías y unidades únicas de los productos de la central
    const uniqueCats = Array.from(new Set(productosCentral.flatMap((p: any) => p.categoria ? [p.categoria] : []))) as string[];
    
    // Obtener unidades únicas (mapeadas por nombre en minúsculas)
    const uniqueUnitsMap = new Map<string, { nombre: string, abreviatura: string }>();
    for (const p of productosCentral) {
      if (p.unidad_nombre) {
        const key = p.unidad_nombre.toLowerCase();
        if (!uniqueUnitsMap.has(key)) {
          uniqueUnitsMap.set(key, {
            nombre: p.unidad_nombre,
            abreviatura: p.unidad_abreviatura || p.unidad_medida || p.unidad_nombre.substring(0, 3).toUpperCase()
          });
        }
      }
    }

    // 2. Pre-cargar todas las categorías y unidades existentes
    const [catList, unitList] = await Promise.all([
      db.select<any[]>('SELECT id, nombre FROM categorias'),
      db.select<any[]>('SELECT id, nombre, abreviatura FROM unidades_medida')
    ]);

    const catMap = new Map<string, number>(catList.map(c => [c.nombre.toLowerCase(), c.id]));
    const unitMap = new Map<string, number>(unitList.map(u => [u.nombre.toLowerCase(), u.id]));

    // 3. Crear las categorías que falten en paralelo
    await Promise.all(uniqueCats.map(async (catName) => {
      const catNorm = catName.toLowerCase();
      if (!catMap.has(catNorm)) {
        const insCat = await db.execute('INSERT INTO categorias (nombre, color) VALUES (?, ?)', [catName, '#6366f1']);
        const newId = insCat.lastInsertId ?? null;
        if (newId) {
          catMap.set(catNorm, newId);
        }
      }
    }));

    // Crear las unidades de medida que falten en paralelo
    await Promise.all(Array.from(uniqueUnitsMap.values()).map(async (unit) => {
      const unitNorm = unit.nombre.toLowerCase();
      if (!unitMap.has(unitNorm)) {
        const abrevNorm = unit.abreviatura.toLowerCase();
        const existingByAbrev = unitList.find(u => u.abreviatura.toLowerCase() === abrevNorm);
        if (existingByAbrev) {
          unitMap.set(unitNorm, existingByAbrev.id);
          return;
        }

        const insUnit = await db.execute('INSERT INTO unidades_medida (nombre, abreviatura) VALUES (?, ?)', [unit.nombre, unit.abreviatura]);
        const newId = insUnit.lastInsertId ?? null;
        if (newId) {
          unitMap.set(unitNorm, newId);
        }
      }
    }));

    // 4. Procesar todos los productos en paralelo de forma segura
    await Promise.all(productosCentral.map(async (p: any) => {
      const categoriaId = p.categoria ? (catMap.get(p.categoria.toLowerCase()) ?? null) : null;
      const unidadId = p.unidad_nombre ? (unitMap.get(p.unidad_nombre.toLowerCase()) ?? null) : null;

      // Upsert Producto
      const prodRes = await db.select<any[]>('SELECT id FROM productos WHERE codigo_barras = ?', [p.codigo_barras]);

      let productoId: number;
      if (prodRes.length > 0) {
        productoId = prodRes[0].id;
        await db.execute(
          'UPDATE productos SET nombre = ?, categoria_id = ?, unidad_id = ?, stock_minimo = ? WHERE id = ?',
          [p.nombre, categoriaId, unidadId, p.stock_minimo, productoId]
        );
        actualizados++;
      } else {
        const insProd = await db.execute(
          'INSERT INTO productos (codigo_barras, nombre, categoria_id, unidad_id, stock_minimo) VALUES (?, ?, ?, ?, ?)',
          [p.codigo_barras, p.nombre, categoriaId, unidadId, p.stock_minimo]
        );
        productoId = insProd.lastInsertId as number;
        creados++;
      }

      // Actualizar Precios (Solo si vienen de la central)
      if (p.precio_venta !== null && p.precio_compra !== null) {
        // Desactivar precios anteriores
        await db.execute('UPDATE precios_historial SET activo = 0 WHERE producto_id = ?', [productoId]);
        // Insertar nuevo precio
        await db.execute(
          'INSERT INTO precios_historial (producto_id, precio_compra, precio_venta, activo) VALUES (?, ?, ?, 1)',
          [productoId, p.precio_compra, p.precio_venta]
        );
      }
    }));

    return { creados, actualizados };
  },

  /**
   * Descarga usuarios desde la sede central
   */
  async pullUsers() {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const response = await fetch(`${config.api_url_central}/api/usuarios`, {
      method: 'GET',
      headers: { 'X-Sucursal-Key': config.sucursal_id }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al descargar usuarios');
    }

    const [{ data: usuariosCentral }, db] = await Promise.all([
      response.json(),
      getDb()
    ]);

    let actualizados = 0;
    let creados = 0;

    await Promise.all(usuariosCentral.map(async (u: any) => {
      const userRes = await db.select<any[]>('SELECT id FROM usuarios WHERE username = ?', [u.username]);

      if (userRes.length > 0) {
        await db.execute(
          'UPDATE usuarios SET password_hash = ?, nombre_completo = ?, rol_id = ?, estado = ? WHERE username = ?',
          [u.password_hash, u.nombre_completo, u.rol_id, u.estado, u.username]
        );
        actualizados++;
      } else {
        await db.execute(
          'INSERT INTO usuarios (id, username, password_hash, nombre_completo, rol_id, estado) VALUES (?, ?, ?, ?, ?, ?)',
          [u.id, u.username, u.password_hash, u.nombre_completo, u.rol_id, u.estado]
        );
        creados++;
      }
    }));

    return { creados, actualizados };
  },

  /**
   * Envía las ventas locales no sincronizadas a la sede central
   */
  async pushSales() {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const db = await getDb();

    // 1. Obtener ventas pendientes
    const ventasPendientes = await db.select<any[]>(
      'SELECT * FROM ventas WHERE sincronizado = 0'
    );

    if (ventasPendientes.length === 0) return { enviadas: 0 };

    const payloadVentas = await Promise.all(ventasPendientes.map(async (v) => {
      // 2. Obtener detalles de cada venta con código de barras
      const detalles = await db.select<any[]>(
        `SELECT vd.*, p.codigo_barras 
         FROM ventas_detalle vd 
         JOIN productos p ON vd.producto_id = p.id 
         WHERE vd.venta_id = ?`,
        [v.id]
      );

      return {
        fecha: v.fecha,
        total: v.total,
        usuario_id: v.usuario_id,
        metodo_pago: v.metodo_pago || 'EFECTIVO',
        detalles: detalles.map(d => ({
          codigo_barras: d.codigo_barras,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal: d.subtotal
        }))
      };
    }));

    // 3. Enviar a la central
    const response = await fetch(`${config.api_url_central}/api/sincronizar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sucursal-Key': config.sucursal_id
      },
      body: JSON.stringify({
        sucursal_id: config.sucursal_id,
        ventas: payloadVentas
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al enviar ventas');
    }

    // 4. Marcar como sincronizadas localmente
    await Promise.all(ventasPendientes.map(v =>
      db.execute('UPDATE ventas SET sincronizado = 1 WHERE id = ?', [v.id])
    ));

    return { enviadas: ventasPendientes.length };
  },

  /**
   * Envía los niveles de stock actual de todos los productos a la central
   */
  async pushStockLevels() {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const db = await getDb();
    const inventario = await db.select<any[]>(
      'SELECT codigo_barras, stock_actual FROM productos WHERE codigo_barras IS NOT NULL'
    );

    const response = await fetch(`${config.api_url_central}/api/stock-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sucursal-Key': config.sucursal_id
      },
      body: JSON.stringify({
        sucursal_id: config.sucursal_id,
        inventario: inventario.map(i => ({
          codigo_barras: i.codigo_barras,
          stock_actual: i.stock_actual
        }))
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar stock global');
    }

    return { total: inventario.length };
  },

  /**
   * Envía los movimientos de kardex locales no sincronizados a la central
   */
  async pushKardex() {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const db = await getDb();
    const movimientos = await db.select<any[]>(
      `SELECT k.*, p.codigo_barras as producto_codigo_barras 
       FROM kardex k 
       JOIN productos p ON k.producto_id = p.id 
       WHERE k.sincronizado = 0`
    );

    if (movimientos.length === 0) return { enviadas: 0 };

    const response = await fetch(`${config.api_url_central}/api/kardex-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sucursal-Key': config.sucursal_id
      },
      body: JSON.stringify({
        sucursal_id: config.sucursal_id,
        movimientos: movimientos.map(m => ({
          producto_codigo_barras: m.producto_codigo_barras,
          usuario_id: m.usuario_id,
          fecha: m.fecha,
          tipo_movimiento: m.tipo_movimiento,
          cantidad: m.cantidad,
          saldo_posterior: m.saldo_posterior,
          costo_unitario: m.costo_unitario,
          referencia: m.referencia
        }))
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al sincronizar movimientos');
    }

    // Marcar como sincronizados
    await Promise.all(movimientos.map(m =>
      db.execute('UPDATE kardex SET sincronizado = 1 WHERE id = ?', [m.id])
    ));

    return { enviadas: movimientos.length };
  },

  /**
   * Envía los registros de caja locales cerrados y no sincronizados a la central
   */
  async pushCajas() {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const db = await getDb();
    const cajasPendientes = await db.select<any[]>(
      "SELECT * FROM cajas WHERE estado = 'cerrada' AND sincronizado = 0"
    );

    if (cajasPendientes.length === 0) return { enviadas: 0 };

    const response = await fetch(`${config.api_url_central}/api/cajas-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sucursal-Key': config.sucursal_id
      },
      body: JSON.stringify({
        sucursal_id: config.sucursal_id,
        cajas: cajasPendientes.map(c => ({
          id_local: c.id,
          usuario_id: c.usuario_id,
          monto_inicial: c.monto_inicial,
          monto_final: c.monto_final,
          monto_esperado: c.monto_esperado,
          fecha_apertura: c.fecha_apertura,
          fecha_cierre: c.fecha_cierre
        }))
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al enviar registros de caja');
    }

    // Marcar como sincronizados localmente
    await Promise.all(cajasPendientes.map(c =>
      db.execute('UPDATE cajas SET sincronizado = 1 WHERE id = ?', [c.id])
    ));

    return { enviadas: cajasPendientes.length };
  },

  /**
   * Envía las compras locales no sincronizadas a la sede central
   */
  async pushCompras() {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const db = await getDb();

    // 1. Obtener compras pendientes
    const comprasPendientes = await db.select<any[]>(
      "SELECT * FROM compras_ingresos WHERE (sincronizado = 0 OR sincronizado IS NULL) AND estado != 'anulado'"
    );

    if (comprasPendientes.length === 0) return { enviadas: 0 };

    const payloadCompras = await Promise.all(comprasPendientes.map(async (c) => {
      // 2. Obtener detalles de cada compra con código de barras del producto
      const detalles = await db.select<any[]>(
        `SELECT cd.*, p.codigo_barras 
         FROM compras_detalle cd 
         JOIN productos p ON cd.producto_id = p.id 
         WHERE cd.compra_id = ?`,
        [c.id]
      );

      return {
        fecha: c.fecha,
        total: c.total,
        usuario_id: c.usuario_id,
        documento_referencia: c.documento_referencia,
        metodo_pago: c.metodo_pago || 'BANCO',
        estado: c.estado || 'completado',
        detalles: detalles.map(d => ({
          codigo_barras: d.codigo_barras,
          cantidad: d.cantidad,
          costo_unitario: d.costo_unitario,
          subtotal: d.subtotal
        }))
      };
    }));

    // 3. Enviar a la central
    const response = await fetch(`${config.api_url_central}/api/compras-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sucursal-Key': config.sucursal_id
      },
      body: JSON.stringify({
        sucursal_id: config.sucursal_id,
        compras: payloadCompras
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al enviar compras');
    }

    // 4. Marcar como sincronizadas localmente
    await Promise.all(comprasPendientes.map(c =>
      db.execute('UPDATE compras_ingresos SET sincronizado = 1 WHERE id = ?', [c.id])
    ));

    return { enviadas: comprasPendientes.length };
  },

  /**
   * Descarga roles desde la sede central
   */
  async pullRoles() {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const response = await fetch(`${config.api_url_central}/api/roles`, {
      method: 'GET',
      headers: { 'X-Sucursal-Key': config.sucursal_id }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al descargar roles');
    }

    const [{ data: rolesCentral }, db] = await Promise.all([
      response.json(),
      getDb()
    ]);

    let actualizados = 0;
    let creados = 0;

    await Promise.all(rolesCentral.map(async (r: any) => {
      const rolRes = await db.select<any[]>('SELECT id FROM roles WHERE id = ?', [r.id]);

      if (rolRes.length > 0) {
        await db.execute(
          'UPDATE roles SET nombre = ?, descripcion = ?, permisos = ?, estado = ? WHERE id = ?',
          [r.nombre, r.descripcion, r.permisos, r.estado, r.id]
        );
        actualizados++;
      } else {
        await db.execute(
          'INSERT INTO roles (id, nombre, descripcion, permisos, estado) VALUES (?, ?, ?, ?, ?)',
          [r.id, r.nombre, r.descripcion, r.permisos, r.estado]
        );
        creados++;
      }
    }));

    return { creados, actualizados };
  },

  /**
   * Descarga unidades de medida desde la sede central
   */
  async pullUnidadesMedida() {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const response = await fetch(`${config.api_url_central}/api/unidades-medida`, {
      method: 'GET',
      headers: { 'X-Sucursal-Key': config.sucursal_id }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al descargar unidades de medida');
    }

    const [{ data: unidadesCentral }, db] = await Promise.all([
      response.json(),
      getDb()
    ]);

    let actualizados = 0;
    let creados = 0;

    await Promise.all(unidadesCentral.map(async (u: any) => {
      const unitRes = await db.select<any[]>('SELECT id FROM unidades_medida WHERE id = ?', [u.id]);

      if (unitRes.length > 0) {
        await db.execute(
          'UPDATE unidades_medida SET nombre = ?, abreviatura = ?, estado = ? WHERE id = ?',
          [u.nombre, u.abreviatura, u.estado, u.id]
        );
        actualizados++;
      } else {
        await db.execute(
          'INSERT INTO unidades_medida (id, nombre, abreviatura, estado) VALUES (?, ?, ?, ?)',
          [u.id, u.nombre, u.abreviatura, u.estado]
        );
        creados++;
      }
    }));

    return { creados, actualizados };
  }
};
