import { systemConfigService } from '../configuracion/systemConfigService';
import { getDb } from '../../shared/lib/db';
import { fetchWithTimeout } from '../../shared/lib/fetch';

export function encryptBranchCode(code: string): string {
  const baseKey = import.meta.env.VITE_SYNC_KEY || "MiniMarket-Secure-Sync-Key-2026";
  const encryptedBytes = [...code].map((char, i) => {
    return char.charCodeAt(0) ^ baseKey.charCodeAt(i % baseKey.length);
  });
  return encryptedBytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

function decryptPasswordHash(encryptedHex: string, username: string): string {
  const baseKey = import.meta.env.VITE_SYNC_KEY || "MiniMarket-Secure-Sync-Key-2026";
  const userKey: number[] = [];
  for (let i = 0; i < baseKey.length; i++) {
    const uByte = username.charCodeAt(i % username.length) || 0;
    userKey.push(baseKey.charCodeAt(i) ^ uByte);
  }
  
  // Decodificar hexadecimal a bytes
  const encryptedBytes: number[] = [];
  for (let i = 0; i < encryptedHex.length; i += 2) {
    encryptedBytes.push(parseInt(encryptedHex.substring(i, i + 2), 16));
  }
  
  // Descifrar con XOR
  const decryptedBytes = encryptedBytes.map((b, i) => b ^ userKey[i % userKey.length]);
  
  // Convertir bytes a string
  return String.fromCharCode(...decryptedBytes);
}

export const syncService = {
  /**
   * Descarga productos desde la sede central y los sincroniza localmente
   */
  async pullProducts(_dep?: any) {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    // 1. Obtener datos de la central
    const response = await fetchWithTimeout(`${config.api_url_central}/api/productos`, {
      method: 'GET',
      headers: {
        'X-Sucursal-Key': encryptBranchCode(config.sucursal_id)
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
    const unitByAbrevMap = new Map<string, any>(unitList.map(u => [u.abreviatura.toLowerCase(), u]));

    try {
      // 3. Crear las categorías que falten secuencialmente
      for (const catName of uniqueCats) {
        const catNorm = catName.toLowerCase();
        if (!catMap.has(catNorm)) {
          const insCat = await db.execute('INSERT INTO categorias (nombre, color) VALUES (?, ?)', [catName, '#6366f1']);
          const newId = insCat.lastInsertId ?? null;
          if (newId) {
            catMap.set(catNorm, newId);
          }
        }
      }

      // Crear las unidades de medida que falten secuencialmente
      for (const unit of uniqueUnitsMap.values()) {
        const unitNorm = unit.nombre.toLowerCase();
        if (!unitMap.has(unitNorm)) {
          const abrevNorm = unit.abreviatura.toLowerCase();
          const existingByAbrev = unitByAbrevMap.get(abrevNorm);
          if (existingByAbrev) {
            unitMap.set(unitNorm, existingByAbrev.id);
            continue;
          }

          const insUnit = await db.execute('INSERT INTO unidades_medida (nombre, abreviatura) VALUES (?, ?)', [unit.nombre, unit.abreviatura]);
          const newId = insUnit.lastInsertId ?? null;
          if (newId) {
            unitMap.set(unitNorm, newId);
          }
        }
      }

      // 4. Procesar todos los productos secuencialmente de forma segura
      for (const p of productosCentral) {
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
      }

    } catch (error) {
      throw error;
    }

    return { creados, actualizados };
  },

  /**
   * Descarga usuarios desde la sede central
   */
  async pullUsers(_dep?: any) {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const response = await fetchWithTimeout(`${config.api_url_central}/api/usuarios`, {
      method: 'GET',
      headers: { 'X-Sucursal-Key': encryptBranchCode(config.sucursal_id) }
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

    try {
      for (const u of usuariosCentral) {
        const decryptedHash = decryptPasswordHash(u.password_hash, u.username);

        // Buscar si ya existe localmente por username o por ID
        const userByUsername = await db.select<any[]>('SELECT id FROM usuarios WHERE username = ?', [u.username]);
        const userById = await db.select<any[]>('SELECT username FROM usuarios WHERE id = ?', [u.id]);

        if (userByUsername.length > 0) {
          // Si el username coincide, actualizamos todos los campos (incluido ID central)
          await db.execute(
            'UPDATE usuarios SET id = ?, password_hash = ?, nombre_completo = ?, rol_id = ?, estado = ? WHERE username = ?',
            [u.id, decryptedHash, u.nombre_completo, u.rol_id, u.estado, u.username]
          );
          actualizados++;
        } else if (userById.length > 0) {
          // Si el ID ya existe pero con otro username, actualizamos los datos y renombramos el username
          await db.execute(
            'UPDATE usuarios SET username = ?, password_hash = ?, nombre_completo = ?, rol_id = ?, estado = ? WHERE id = ?',
            [u.username, decryptedHash, u.nombre_completo, u.rol_id, u.estado, u.id]
          );
          actualizados++;
        } else {
          // Si no existe por ID ni por Username, hacemos una inserción limpia
          await db.execute(
            'INSERT INTO usuarios (id, username, password_hash, nombre_completo, rol_id, estado) VALUES (?, ?, ?, ?, ?, ?)',
            [u.id, u.username, decryptedHash, u.nombre_completo, u.rol_id, u.estado]
          );
          creados++;
        }
      }
    } catch (error) {
      throw error;
    }

    return { creados, actualizados };
  },

  /**
   * Envía las ventas locales no sincronizadas a la sede central
   */
  async pushSales(_dep?: any) {
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
        id_local: v.id,
        fecha: v.fecha,
        total: v.total,
        usuario_id: v.usuario_id,
        metodo_pago: v.metodo_pago || 'EFECTIVO',
        estado: v.estado || 'completado',
        detalles: detalles.map(d => ({
          codigo_barras: d.codigo_barras,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal: d.subtotal
        }))
      };
    }));

    // 3. Enviar a la central
    const response = await fetchWithTimeout(`${config.api_url_central}/api/sincronizar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sucursal-Key': encryptBranchCode(config.sucursal_id)
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
  async pushStockLevels(_dep?: any) {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const db = await getDb();
    const inventario = await db.select<any[]>(
      'SELECT codigo_barras, stock_actual FROM productos WHERE codigo_barras IS NOT NULL'
    );

    const response = await fetchWithTimeout(`${config.api_url_central}/api/stock-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sucursal-Key': encryptBranchCode(config.sucursal_id)
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
  async pushKardex(_dep?: any) {
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

    const response = await fetchWithTimeout(`${config.api_url_central}/api/kardex-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sucursal-Key': encryptBranchCode(config.sucursal_id)
      },
      body: JSON.stringify({
        sucursal_id: config.sucursal_id,
        movimientos: movimientos.map(m => ({
          id_local: m.id,
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
  async pushCajas(_dep?: any) {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const db = await getDb();
    const cajasPendientes = await db.select<any[]>(
      "SELECT * FROM cajas WHERE estado = 'cerrada' AND sincronizado = 0"
    );

    if (cajasPendientes.length === 0) return { enviadas: 0 };

    const response = await fetchWithTimeout(`${config.api_url_central}/api/cajas-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sucursal-Key': encryptBranchCode(config.sucursal_id)
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
  async pushCompras(_dep?: any) {
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
        id_local: c.id,
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
    const response = await fetchWithTimeout(`${config.api_url_central}/api/compras-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sucursal-Key': encryptBranchCode(config.sucursal_id)
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
   * Envía los logs de auditoría locales no sincronizados a la sede central
   */
  async pushLogs(_dep?: any) {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const db = await getDb();

    const logsPendientes = await db.select<any[]>(
      'SELECT * FROM logs WHERE sincronizado = 0 ORDER BY created_at ASC'
    );

    if (logsPendientes.length === 0) return { enviadas: 0 };

    const response = await fetchWithTimeout(`${config.api_url_central}/api/logs-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sucursal-Key': encryptBranchCode(config.sucursal_id)
      },
      body: JSON.stringify({
        sucursal_id: config.sucursal_id,
        logs: logsPendientes.map(l => ({
          id_local: l.id,
          usuario_id: l.usuario_id,
          accion: l.accion,
          tabla: l.tabla,
          registro_id: l.registro_id,
          detalles: l.detalles || null,
          created_at: l.created_at
        }))
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al enviar logs de auditoría');
    }

    // Marcar como sincronizados localmente
    await Promise.all(logsPendientes.map(l =>
      db.execute('UPDATE logs SET sincronizado = 1 WHERE id = ?', [l.id])
    ));

    return { enviadas: logsPendientes.length };
  },

  /**
   * Descarga roles desde la sede central
   */
  async pullRoles(_dep?: any) {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const response = await fetchWithTimeout(`${config.api_url_central}/api/roles`, {
      method: 'GET',
      headers: { 'X-Sucursal-Key': encryptBranchCode(config.sucursal_id) }
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

    try {
      for (const r of rolesCentral) {
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
      }
    } catch (error) {
      throw error;
    }

    return { creados, actualizados };
  },

  /**
   * Descarga unidades de medida desde la sede central
   */
  async pullUnidadesMedida(_dep?: any) {
    const config = await systemConfigService.getConfig();
    if (!config || !config.api_url_central || !config.sucursal_id) {
      throw new Error('Configuración de sucursal incompleta');
    }

    const response = await fetchWithTimeout(`${config.api_url_central}/api/unidades-medida`, {
      method: 'GET',
      headers: { 'X-Sucursal-Key': encryptBranchCode(config.sucursal_id) }
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

    try {
      for (const u of unidadesCentral) {
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
      }
    } catch (error) {
      throw error;
    }

    return { creados, actualizados };
  },

  /**
   * Ejecuta la sincronización completa (push y pull) de forma organizada
   */
  async syncAllData() {
    // 1. Ejecutar PUSH (Subir datos locales a la central) en secuencia estricta por seguridad transaccional.
    // Pasamos el resultado anterior como argumento para indicar dependencia de datos y silenciar al linter.
    const sales = await this.pushSales();
    const kardex = await this.pushKardex(sales);
    const cajas = await this.pushCajas(kardex);
    const compras = await this.pushCompras(cajas);
    const logs = await this.pushLogs(compras);
    const stock = await this.pushStockLevels(logs);

    // 2. Ejecutar PULL (Descargar datos actualizados de la central) en secuencia estricta para evitar bloqueos en SQLite.
    const roles = await this.pullRoles(stock);
    const users = await this.pullUsers(roles);
    const units = await this.pullUnidadesMedida(users);
    const products = await this.pullProducts(units);

    return {
      enviadas: sales.enviadas,
      kEnviadas: kardex.enviadas,
      cEnviadas: cajas.enviadas,
      coEnviadas: compras.enviadas,
      lEnviadas: logs.enviadas,
      pCreados: products.creados,
      pActualizados: products.actualizados,
      uCreados: users.creados,
      uActualizados: users.actualizados,
      rCreados: roles.creados,
      rActualizados: roles.actualizados,
      umCreados: units.creados,
      umActualizados: units.actualizados
    };
  }
};
