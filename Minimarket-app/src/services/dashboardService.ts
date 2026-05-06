import { getDb } from '../lib/db';
import { withDb } from '../lib/withDb';

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
    return withDb(async () => {
      const db = await getDb();
      
      // 1. Total Productos con stock
      const stockData = await db.select<any[]>('SELECT COUNT(*) as total FROM productos WHERE stock_actual > 0');
      
      // 2. Ventas del día (Localtime)
      const todaySales = await db.select<any[]>(`
        SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count 
        FROM ventas 
        WHERE date(fecha, 'localtime') = date('now', 'localtime')
      `);
      
      // 3. Compras del día
      const todayPurchases = await db.select<any[]>(`
        SELECT COALESCE(SUM(total), 0) as total 
        FROM compras_ingresos 
        WHERE date(fecha, 'localtime') = date('now', 'localtime')
      `);

      // 4. Ventas del mes
      const monthSales = await db.select<any[]>(`
        SELECT COALESCE(SUM(total), 0) as total 
        FROM ventas 
        WHERE strftime('%Y-%m', fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime')
      `);

      return {
        totalProductos: stockData[0].total,
        ventasHoy: todaySales[0].total,
        transaccionesHoy: todaySales[0].count,
        comprasHoy: todayPurchases[0].total,
        ventasMes: monthSales[0].total
      };
    });
  },

  /**
   * Obtiene la actividad reciente (últimos 5 eventos)
   */
  async getRecentActivity(): Promise<RecentActivity[]> {
    return withDb(async () => {
      const db = await getDb();
      return db.select(`
        SELECT * FROM (
          SELECT 'venta' as tipo, id, total as monto, 'Venta realizada' as descripcion, fecha
          FROM ventas
          UNION ALL
          SELECT 'compra' as tipo, id, total as monto, 'Compra de mercadería' as descripcion, fecha
          FROM compras_ingresos
        )
        ORDER BY fecha DESC
        LIMIT 5
      `);
    });
  },

  /**
   * Obtiene datos para el gráfico de ventas de los últimos 7 días
   */
  async getSalesChartData(): Promise<ChartData[]> {
    return withDb(async () => {
      const db = await getDb();
      return db.select(`
        SELECT date(fecha, 'localtime') as dia, SUM(total) as total
        FROM ventas
        WHERE date(fecha, 'localtime') >= date('now', 'localtime', '-7 days')
        GROUP BY dia
        ORDER BY dia ASC
      `);
    });
  },

  /**
   * Productos con stock bajo (menor o igual al mínimo)
   */
  async getLowStockProducts(): Promise<any[]> {
    return withDb(async () => {
      const db = await getDb();
      return db.select(`
        SELECT nombre, stock_actual, stock_minimo
        FROM productos
        WHERE stock_actual <= stock_minimo AND estado = 'activo'
        ORDER BY stock_actual ASC
        LIMIT 5
      `);
    });
  }
};
