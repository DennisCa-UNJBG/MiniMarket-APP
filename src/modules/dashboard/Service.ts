import { getDb } from '../../shared/lib/db';
import { systemConfigService } from '../configuracion/systemConfigService';

export interface DashboardStats {
  totalProductos: number;
  ventasHoy: number;
  transaccionesHoy: number;
  comprasHoy: number;
  ventasMes: number;
}

export interface RecentActivity {
  tipo: 'venta' | 'compra' | 'kardex';
  id: number;
  monto?: number;
  descripcion: string;
  fecha: string;
}

export interface ChartData {
  dia: string;
  total: number;
}

export const dashboardService = {
  /**
   * Obtiene las estadísticas principales del dashboard
   */
  async getStats(): Promise<DashboardStats> {
    const [db, config] = await Promise.all([
      getDb(),
      systemConfigService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';

    // Obtener estadísticas de dashboard en paralelo
    const [stockData, todaySales, todayPurchases, monthSales] = await Promise.all([
      db.select<any[]>('SELECT COUNT(*) as total FROM productos WHERE stock_actual > 0'),
      db.select<any[]>(`
        SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count 
        FROM ventas 
        WHERE date(fecha, 'localtime') = date('now', 'localtime')
        AND (sucursal_id = ? OR sucursal_id IS NULL)
      `, [sucursalId]),
      db.select<any[]>(`
        SELECT COALESCE(SUM(total), 0) as total 
        FROM compras_ingresos 
        WHERE date(fecha, 'localtime') = date('now', 'localtime')
        AND (sucursal_id = ? OR sucursal_id IS NULL)
      `, [sucursalId]),
      db.select<any[]>(`
        SELECT COALESCE(SUM(total), 0) as total 
        FROM ventas 
        WHERE strftime('%Y-%m', fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime')
        AND (sucursal_id = ? OR sucursal_id IS NULL)
      `, [sucursalId])
    ]);

    return {
      totalProductos: stockData[0].total,
      ventasHoy: todaySales[0].total,
      transaccionesHoy: todaySales[0].count,
      comprasHoy: todayPurchases[0].total,
      ventasMes: monthSales[0].total
    };
  },

  /**
   * Obtiene la actividad reciente (últimos 5 eventos)
   */
  async getRecentActivity(): Promise<RecentActivity[]> {
    const [db, config] = await Promise.all([
      getDb(),
      systemConfigService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';

    return db.select(`
      SELECT * FROM (
        SELECT 'venta' as tipo, id, total as monto, 'Venta realizada' as descripcion, fecha, sucursal_id
        FROM ventas
        UNION ALL
        SELECT 'compra' as tipo, id, total as monto, 'Compra de mercadería' as descripcion, fecha, sucursal_id
        FROM compras_ingresos
      )
      WHERE sucursal_id = ? OR sucursal_id IS NULL
      ORDER BY fecha DESC
      LIMIT 5
    `, [sucursalId]);
  },

  /**
   * Obtiene datos para el gráfico de ventas de los últimos 7 días
   */
  async getSalesChartData(): Promise<ChartData[]> {
    const [db, config] = await Promise.all([
      getDb(),
      systemConfigService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';

    return db.select(`
      SELECT date(fecha, 'localtime') as dia, SUM(total) as total
      FROM ventas
      WHERE date(fecha, 'localtime') >= date('now', 'localtime', '-7 days')
      AND (sucursal_id = ? OR sucursal_id IS NULL)
      GROUP BY dia
      ORDER BY dia ASC
    `, [sucursalId]);
  },

  /**
   * Productos con stock bajo (menor o igual al mínimo)
   */
  async getLowStockProducts(): Promise<any[]> {
    const db = await getDb();
    return db.select(`
      SELECT nombre, stock_actual, stock_minimo
      FROM productos
      WHERE stock_actual <= stock_minimo AND estado = 'activo'
      ORDER BY stock_actual ASC
      LIMIT 5
    `);
  }
};
