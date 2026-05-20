import { getDb } from '../../lib/db';
import { logService } from '../../lib/logService';
import { sucursalService } from '../sucursales/Service';
import { invoke } from '@tauri-apps/api/core';

export interface Product {
  id: number;
  codigo_barras: string;
  nombre: string;
  categoria_id: number;
  categoria_nombre?: string;
  unidad_medida?: string; // Campo antiguo de texto
  unidad_id?: number;      // Nueva relación
  unidad_nombre?: string;
  stock_minimo: number;
  stock_actual: number;
  estado: string;
  precio_compra?: number;
  precio_venta?: number;
}

export const productoService = {
  async getAll(onlyActive = true): Promise<Product[]> {
    const db = await getDb();
    let query = `
      SELECT 
        p.*, 
        c.nombre as categoria_nombre,
        u.nombre as unidad_nombre,
        ph.precio_compra,
        ph.precio_venta
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN unidades_medida u ON p.unidad_id = u.id
      LEFT JOIN precios_historial ph ON p.id = ph.producto_id AND ph.activo = 1
    `;

    if (onlyActive) {
      query += " WHERE p.estado = 'activo' ";
    }

    query += " ORDER BY p.estado ASC, p.nombre ASC";
    
    const result = await db.select<Product[]>(query);
    return result;
  },

  async create(product: Omit<Product, 'id' | 'estado'>, usuarioId: number): Promise<void> {
    const db = await getDb();

    // 1. Verificar si este equipo está actuando como Sede Central
    let isCentral = false;
    try {
      isCentral = await invoke<boolean>('is_server_running');
    } catch (e) {
      throw new Error('Error del sistema: No se pudo verificar si este equipo es la Sede Central. Reinicia la aplicación.');
    }

    if (isCentral) {
      // --- FLUJO DE SEDE CENTRAL (Acceso directo a BD) ---
      // Verificar si el código de barras ya existe localmente
      const prodExistente = await db.select<any[]>(
        'SELECT nombre FROM productos WHERE codigo_barras = ?',
        [product.codigo_barras]
      );

      if (prodExistente.length > 0) {
        throw new Error(`El código de barras ya está registrado en el catálogo maestro ("${prodExistente[0].nombre}").`);
      }
    } else {
      // --- FLUJO DE SUCURSAL (Validación síncrona en línea) ---
      // Obtener la configuración de la sucursal
      const config = await sucursalService.getConfig();
      if (!config || !config.api_url_central || !config.sucursal_id) {
        throw new Error('Configuración de sucursal incompleta. Configure la conexión a la sede central.');
      }

      // Obtener el nombre de la categoría local para enviarla a la central
      let categoriaNombre = "";
      if (product.categoria_id) {
        const catRow = await db.select<any[]>('SELECT nombre FROM categorias WHERE id = ?', [product.categoria_id]);
        if (catRow.length > 0) {
          categoriaNombre = catRow[0].nombre;
        }
      }

      // Realizar la verificación y creación en línea en la central
      let response;
      try {
        response = await fetch(`${config.api_url_central}/api/productos/verificar-crear`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Sucursal-Key': config.sucursal_id
          },
          body: JSON.stringify({
            codigo_barras: product.codigo_barras,
            nombre: product.nombre,
            categoria_nombre: categoriaNombre || null,
            unidad_id: product.unidad_id || null,
            stock_minimo: product.stock_minimo,
            precio_compra: product.precio_compra || 0.0,
            precio_venta: product.precio_venta || 0.0
          })
        });
      } catch (err) {
        throw new Error('No se pudo conectar con el servidor central para validar el producto. Operación cancelada.');
      }

      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json();
          const prodExistente = errorData.producto?.nombre ? ` ("${errorData.producto.nombre}")` : "";
          throw new Error(`El código de barras ya está registrado en la central${prodExistente}.`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error al validar el producto en el servidor central.');
        }
      }
    }

    // 4. Si la central responde con éxito, insertar localmente con sincronizado = 1
    const result = await db.execute(
      `INSERT INTO productos (codigo_barras, nombre, categoria_id, unidad_id, stock_minimo, stock_actual, sincronizado) 
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        product.codigo_barras,
        product.nombre,
        product.categoria_id,
        product.unidad_id,
        product.stock_minimo,
        product.stock_actual
      ]
    );

    const productId = result.lastInsertId as number;

    // Registrar Log de Creación
    await logService.register({
      usuario_id: usuarioId,
      accion: 'CREAR_PRODUCTO',
      tabla: 'productos',
      registro_id: productId,
      detalles: `Se creó el producto: ${product.nombre} (${product.codigo_barras})`
    });

    // Si se proporcionaron precios, registrarlos en el historial
    if (product.precio_compra !== undefined && product.precio_venta !== undefined) {
      await db.execute(
        `INSERT INTO precios_historial (producto_id, precio_compra, precio_venta, activo) 
         VALUES (?, ?, ?, 1)`,
        [productId, product.precio_compra, product.precio_venta]
      );
    }
  },

  async updateStatus(id: number, estado: 'activo' | 'inactivo', usuarioId: number): Promise<void> {
    const db = await getDb();
    
    // Obtener nombre para el detalle
    const pData = await db.select<any[]>('SELECT nombre FROM productos WHERE id = ?', [id]);
    const nombre = pData[0]?.nombre || 'Desconocido';

    await db.execute(
      'UPDATE productos SET estado = ? WHERE id = ?',
      [estado, id]
    );

    // Registrar Log
    await logService.register({
      usuario_id: usuarioId,
      accion: 'ESTADO_PRODUCTO',
      tabla: 'productos',
      registro_id: id,
      detalles: `Producto "${nombre}" marcado como ${estado.toUpperCase()}`
    });
  },

  async update(id: number, product: Omit<Product, 'id' | 'estado' | 'stock_actual'>, usuarioId: number): Promise<void> {
    const db = await getDb();
    
    // Obtener precio anterior para el log
    const oldPriceData = await db.select<any[]>(
      'SELECT precio_venta, precio_compra FROM precios_historial WHERE producto_id = ? AND activo = 1',
      [id]
    );
    const oldVenta = oldPriceData[0]?.precio_venta || 0;
    const oldCompra = oldPriceData[0]?.precio_compra || 0;

    await db.execute(
      `UPDATE productos 
       SET nombre = ?, categoria_id = ?, unidad_id = ?, stock_minimo = ?
       WHERE id = ?`,
      [product.nombre, product.categoria_id, product.unidad_id, product.stock_minimo, id]
    );

    if (product.precio_venta !== undefined) {
      // Solo registrar log si el precio realmente cambió
      if (oldVenta !== product.precio_venta) {
        await logService.register({
          usuario_id: usuarioId,
          accion: 'CAMBIO_PRECIO',
          tabla: 'productos',
          registro_id: id,
          detalles: `Precio de venta cambiado de S/ ${oldVenta} a S/ ${product.precio_venta} para el producto: ${product.nombre}`
        });
      }

      // Desactivar precios anteriores para este producto
      await db.execute(
        'UPDATE precios_historial SET activo = 0 WHERE producto_id = ?',
        [id]
      );
      // Insertar el nuevo precio como activo (manteniendo el precio de compra actual si existe)
      await db.execute(
        `INSERT INTO precios_historial (producto_id, precio_compra, precio_venta, activo) 
         VALUES (?, ?, ?, 1)`,
        [id, product.precio_compra ?? oldCompra, product.precio_venta]
      );
    } else {
      // Si no hay cambio de precio, registrar un log de edición general
      await logService.register({
        usuario_id: usuarioId,
        accion: 'EDITAR_PRODUCTO',
        tabla: 'productos',
        registro_id: id,
        detalles: `Datos actualizados para el producto: ${product.nombre}`
      });
    }
  },

  async getLastCode(): Promise<string | null> {
    const db = await getDb();
    const result = await db.select<{ codigo_barras: string }[]>(
      'SELECT codigo_barras FROM productos ORDER BY id DESC LIMIT 1'
    );
    return result.length > 0 ? result[0].codigo_barras : null;
  }
};
