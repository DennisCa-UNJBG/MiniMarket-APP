import { getDb } from '../../shared/lib/db';
import { logService } from '../../shared/lib/logService';

export interface Cliente {
  id: number;
  nombre: string;
  dni_ruc: string;
  telefono: string;
  email: string;
  compras: number;
  total_gastado: number;
  estado: string;
}

export const clienteService = {
  async getClientes(
    page: number,
    pageSize: number,
    search = ''
  ): Promise<{ data: Cliente[]; total: number }> {
    const db = await getDb();
    const offset = (page - 1) * pageSize;

    let whereClause = " WHERE estado = 'activo' ";
    const params: any[] = [];

    if (search && search.trim() !== '') {
      const searchParam = `%${search}%`;
      whereClause += " AND (nombre LIKE ? OR dni_ruc LIKE ?) ";
      params.push(searchParam, searchParam);
    }

    const [totalRes, data] = await Promise.all([
      db.select<any[]>(
        `SELECT COUNT(*) as count FROM clientes ${whereClause}`,
        params
      ),
      db.select<Cliente[]>(
        `SELECT * FROM clientes ${whereClause} ORDER BY nombre ASC LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      )
    ]);

    const total = totalRes[0]?.count || 0;
    return { data, total };
  },

  async create(
    cliente: Omit<Cliente, 'id' | 'compras' | 'total_gastado' | 'estado'>,
    usuarioId: number
  ): Promise<number> {
    const db = await getDb();
    const result = await db.execute(
      `INSERT INTO clientes (nombre, dni_ruc, telefono, email, compras, total_gastado, estado) 
       VALUES (?, ?, ?, ?, 0, 0.0, 'activo')`,
      [
        cliente.nombre,
        cliente.dni_ruc || null,
        cliente.telefono || null,
        cliente.email || null
      ]
    );

    const clienteId = result.lastInsertId as number;

    // Registrar Log de Auditoría
    await logService.register({
      usuario_id: usuarioId,
      accion: 'CREAR_CLIENTE',
      tabla: 'clientes',
      registro_id: clienteId,
      detalles: `Se registró el cliente: ${cliente.nombre} (DNI/RUC: ${cliente.dni_ruc || 'Sin Documento'})`
    });

    return clienteId;
  },

  async update(
    id: number,
    cliente: Omit<Cliente, 'id' | 'compras' | 'total_gastado' | 'estado'>,
    usuarioId: number
  ): Promise<void> {
    const db = await getDb();
    await db.execute(
      `UPDATE clientes 
       SET nombre = ?, dni_ruc = ?, telefono = ?, email = ?
       WHERE id = ?`,
      [
        cliente.nombre,
        cliente.dni_ruc || null,
        cliente.telefono || null,
        cliente.email || null,
        id
      ]
    );

    // Registrar Log de Auditoría
    await logService.register({
      usuario_id: usuarioId,
      accion: 'EDITAR_CLIENTE',
      tabla: 'clientes',
      registro_id: id,
      detalles: `Se editó el cliente: ${cliente.nombre} (DNI/RUC: ${cliente.dni_ruc || 'Sin Documento'})`
    });
  },

  async existsDniRuc(dniRuc: string, excludeId?: number): Promise<boolean> {
    const db = await getDb();
    let query = "SELECT COUNT(*) as count FROM clientes WHERE dni_ruc = ? AND estado = 'activo'";
    const params: any[] = [dniRuc.trim()];
    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }
    const result = await db.select<any[]>(query, params);
    return (result[0]?.count || 0) > 0;
  },

  async getByDniRuc(dniRuc: string): Promise<Cliente | null> {
    const db = await getDb();
    const result = await db.select<Cliente[]>(
      "SELECT * FROM clientes WHERE dni_ruc = ? AND estado = 'activo' LIMIT 1",
      [dniRuc.trim()]
    );
    return result[0] || null;
  },
  async queryDocument(document: string, key: string): Promise<{ nombre: string }> {
    if (!document) {
      throw new Error('El número de documento es obligatorio.');
    }
    if (!key) {
      throw new Error('La clave API (KEY) de PeruDevs es obligatoria.');
    }

    let url = '';
    const cleanDoc = document.trim();

    if (cleanDoc.length === 8) {
      // DNI
      url = `https://api.perudevs.com/api/v1/dni/simple?document=${cleanDoc}&key=${key}`;
    } else if (cleanDoc.length === 11) {
      // RUC
      url = `https://api.perudevs.com/api/v1/ruc?document=${cleanDoc}&key=${key}`;
    } else {
      throw new Error('El documento debe tener 8 dígitos para DNI u 11 para RUC.');
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error en la consulta: ${response.status}`);
      }

      const data = await response.json();

      if (data.estado === false || data.success === false) {
        throw new Error(data.mensaje || data.message || 'No se encontraron resultados.');
      }

      // Extracción robusta de nombre o razón social
      const nombre =
        data.resultado?.nombre_completo ||
        data.resultado?.razon_social ||
        data.resultado?.nombre_o_razon_social ||
        data.data?.nombre_completo ||
        data.data?.razon_social ||
        data.data?.nombre_o_razon_social ||
        data.nombre_completo ||
        data.razon_social ||
        (data.resultado?.nombres
          ? `${data.resultado.nombres} ${data.resultado.apellido_paterno || ''} ${data.resultado.apellido_materno || ''}`.trim()
          : '') ||
        (data.data?.nombres
          ? `${data.data.nombres} ${data.data.apellido_paterno || ''} ${data.data.apellido_materno || ''}`.trim()
          : '');

      if (!nombre) {
        throw new Error('No se pudo determinar el nombre del titular en la respuesta de la API.');
      }

      return { nombre };
    } catch (err: any) {
      throw new Error(err.message || 'Error al conectar con la API de PeruDevs.');
    }
  }
};
