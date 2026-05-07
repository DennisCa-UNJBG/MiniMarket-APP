import { getDb } from '../lib/db';
import { withDb } from '../lib/withDb';
import { sucursalService } from './sucursalService';

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
      const config = await sucursalService.getConfig();
      const sucursalId = config?.sucursal_id || 'LOCAL';

      return db.select(`
        SELECT p.nombre as name, SUM(vd.cantidad) as sales, SUM(vd.subtotal) as revenue
        FROM ventas_detalle vd
        JOIN ventas v ON vd.venta_id = v.id
        JOIN productos p ON vd.producto_id = p.id
        WHERE v.sucursal_id = ? OR v.sucursal_id IS NULL
        GROUP BY vd.producto_id
        ORDER BY sales DESC
        LIMIT ?
      `, [sucursalId, limit]);
    });
  },

  /**
   * Obtiene los ingresos mensuales de los últimos 6 meses
   */
  async getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
    return withDb(async () => {
      const db = await getDb();
      const config = await sucursalService.getConfig();
      const sucursalId = config?.sucursal_id || 'LOCAL';

      const results = await db.select<any[]>(`
        SELECT strftime('%Y-%m', fecha, 'localtime') as monthKey,
               SUM(total) as amount
        FROM ventas
        WHERE fecha >= date('now', 'localtime', '-6 months')
        AND (sucursal_id = ? OR sucursal_id IS NULL)
        GROUP BY monthKey
        ORDER BY monthKey ASC
      `, [sucursalId]);

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
      const config = await sucursalService.getConfig();
      const sucursalId = config?.sucursal_id || 'LOCAL';
      
      const currentMonth = await db.select<any[]>(`
        SELECT 
          COALESCE(SUM(total), 0) as revenue, 
          COUNT(*) as salesCount,
          (SELECT COALESCE(SUM(vd.cantidad), 0) 
           FROM ventas_detalle vd 
           JOIN ventas v2 ON vd.venta_id = v2.id 
           WHERE strftime('%Y-%m', v2.fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime')
           AND (v2.sucursal_id = ? OR v2.sucursal_id IS NULL)) as productsSold
        FROM ventas v
        WHERE strftime('%Y-%m', v.fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime')
        AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)
      `, [sucursalId, sucursalId]);

      const prevMonth = await db.select<any[]>(`
        SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as salesCount
        FROM ventas
        WHERE strftime('%Y-%m', fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime', '-1 month')
        AND (sucursal_id = ? OR sucursal_id IS NULL)
      `, [sucursalId]);

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
