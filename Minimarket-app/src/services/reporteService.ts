import { getDb } from '../lib/db';
import { withDb } from '../lib/withDb';

export interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

export interface MonthlyRevenue {
  month: string;
  amount: number;
}

export interface ReportKPIs {
  revenue: number;
  revenueChange: number;
  salesCount: number;
  salesCountChange: number;
  productsSold: number;
}

export const reporteService = {
  /**
   * Obtiene el ranking de los productos más vendidos
   */
  async getTopProducts(limit = 5): Promise<TopProduct[]> {
    return withDb(async () => {
      const db = await getDb();
      return db.select(`
        SELECT p.nombre as name, SUM(vd.cantidad) as sales, SUM(vd.subtotal) as revenue
        FROM ventas_detalle vd
        JOIN productos p ON vd.producto_id = p.id
        GROUP BY vd.producto_id
        ORDER BY sales DESC
        LIMIT ?
      `, [limit]);
    });
  },

  /**
   * Obtiene los ingresos mensuales de los últimos 6 meses
   */
  async getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
    return withDb(async () => {
      const db = await getDb();
      const results = await db.select<any[]>(`
        SELECT strftime('%Y-%m', fecha, 'localtime') as monthKey,
               SUM(total) as amount
        FROM ventas
        WHERE fecha >= date('now', 'localtime', '-6 months')
        GROUP BY monthKey
        ORDER BY monthKey ASC
      `);

      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      return results.map(r => {
        const [year, month] = r.monthKey.split('-');
        return {
          month: `${monthNames[parseInt(month) - 1]} - ${year}`,
          amount: r.amount
        };
      });
    });
  },

  /**
   * Obtiene indicadores clave (KPIs) comparando con el mes anterior
   */
  async getKPIs(): Promise<ReportKPIs> {
    return withDb(async () => {
      const db = await getDb();
      
      const currentMonth = await db.select<any[]>(`
        SELECT 
          COALESCE(SUM(total), 0) as revenue, 
          COUNT(*) as salesCount,
          (SELECT COALESCE(SUM(cantidad), 0) FROM ventas_detalle vd JOIN ventas v ON vd.venta_id = v.id WHERE strftime('%Y-%m', v.fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime')) as productsSold
        FROM ventas
        WHERE strftime('%Y-%m', fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime')
      `);

      const prevMonth = await db.select<any[]>(`
        SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as salesCount
        FROM ventas
        WHERE strftime('%Y-%m', fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime', '-1 month')
      `);

      const c = currentMonth[0];
      const p = prevMonth[0];

      const calculateChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
      };

      return {
        revenue: c.revenue,
        revenueChange: calculateChange(c.revenue, p.revenue),
        salesCount: c.salesCount,
        salesCountChange: calculateChange(c.salesCount, p.salesCount),
        productsSold: c.productsSold
      };
    });
  }
};
