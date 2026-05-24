import { getDb } from '../../shared/lib/db';
import { systemConfigService } from '../configuracion/systemConfigService';
import { dateUtils } from '../../shared/lib/dateUtils';

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
  async getTopProducts(limit = 5, startDate?: string, endDate?: string): Promise<TopProduct[]> {
    const [db, config] = await Promise.all([
      getDb(),
      systemConfigService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';

    let query = `
      SELECT p.nombre as name, SUM(vd.cantidad) as sales, SUM(vd.subtotal) as revenue
      FROM ventas_detalle vd
      JOIN ventas v ON vd.venta_id = v.id
      JOIN productos p ON vd.producto_id = p.id
      WHERE (v.sucursal_id = ? OR v.sucursal_id IS NULL)
    `;
    const params: any[] = [sucursalId];

    if (startDate) {
      query += ` AND date(v.fecha, 'localtime') >= date(?)`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date(v.fecha, 'localtime') <= date(?)`;
      params.push(endDate);
    }

    query += `
      GROUP BY vd.producto_id
      ORDER BY sales DESC
      LIMIT ?
    `;
    params.push(limit);

    return db.select(query, params);
  },

  /**
   * Obtiene los ingresos mensuales (o diarios si el rango es corto)
   */
  async getMonthlyRevenue(startDate?: string, endDate?: string): Promise<MonthlyRevenue[]> {
    const [db, config] = await Promise.all([
      getDb(),
      systemConfigService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';

    let isDaily = false;
    if (startDate && endDate) {
      const diffDays = dateUtils.getDaysDifference(startDate, endDate);
      if (diffDays <= 31) {
        isDaily = true;
      }
    }

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    if (isDaily) {
      let query = `
        SELECT strftime('%Y-%m-%d', fecha, 'localtime') as dateKey,
               SUM(total) as amount
        FROM ventas
        WHERE (sucursal_id = ? OR sucursal_id IS NULL)
      `;
      const params: any[] = [sucursalId];
      if (startDate) {
        query += ` AND date(fecha, 'localtime') >= date(?)`;
        params.push(startDate);
      }
      if (endDate) {
        query += ` AND date(fecha, 'localtime') <= date(?)`;
        params.push(endDate);
      }
      query += `
        GROUP BY dateKey
        ORDER BY dateKey ASC
      `;

      const results = await db.select<any[]>(query, params);
      return results.map(r => {
        const [, month, day] = r.dateKey.split('-');
        const monthName = monthNames[parseInt(month) - 1];
        return {
          month: `${day} ${monthName}`,
          amount: r.amount
        };
      });
    } else {
      let query = `
        SELECT strftime('%Y-%m', fecha, 'localtime') as monthKey,
               SUM(total) as amount
        FROM ventas
        WHERE (sucursal_id = ? OR sucursal_id IS NULL)
      `;
      const params: any[] = [sucursalId];

      if (startDate) {
        query += ` AND date(fecha, 'localtime') >= date(?)`;
        params.push(startDate);
      } else {
        query += ` AND fecha >= date('now', 'localtime', '-6 months')`;
      }
      if (endDate) {
        query += ` AND date(fecha, 'localtime') <= date(?)`;
        params.push(endDate);
      }

      query += `
        GROUP BY monthKey
        ORDER BY monthKey ASC
      `;

      const results = await db.select<any[]>(query, params);
      return results.map(r => {
        const [year, month] = r.monthKey.split('-');
        return {
          month: `${monthNames[parseInt(month) - 1]} - ${year}`,
          amount: r.amount
        };
      });
    }
  },

  /**
   * Obtiene indicadores clave (KPIs) comparando con el período anterior de igual duración
   */
  async getKPIs(startDate?: string, endDate?: string): Promise<ReportKPIs> {
    const [db, config] = await Promise.all([
      getDb(),
      systemConfigService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';

    let currentStart = startDate;
    let currentEnd = endDate;
    let prevStart = '';
    let prevEnd = '';

    const useRange = !!(currentStart && currentEnd);

    if (useRange) {
      const { start, end } = dateUtils.getPreviousPeriodRangeLocal(currentStart, currentEnd);
      prevStart = start;
      prevEnd = end;
    }

    const currentQuery = useRange
      ? `
        SELECT 
          COALESCE(SUM(total), 0) as revenue, 
          COUNT(*) as salesCount,
          (SELECT COALESCE(SUM(vd.cantidad), 0) 
           FROM ventas_detalle vd 
           JOIN ventas v2 ON vd.venta_id = v2.id 
           WHERE date(v2.fecha, 'localtime') >= date(?)
             AND date(v2.fecha, 'localtime') <= date(?)
             AND (v2.sucursal_id = ? OR v2.sucursal_id IS NULL)) as productsSold
        FROM ventas v
        WHERE date(v.fecha, 'localtime') >= date(?)
          AND date(v.fecha, 'localtime') <= date(?)
          AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)
      `
      : `
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
      `;

    const currentParams = useRange
      ? [currentStart, currentEnd, sucursalId, currentStart, currentEnd, sucursalId]
      : [sucursalId, sucursalId];

    const prevQuery = useRange
      ? `
        SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as salesCount
        FROM ventas
        WHERE date(fecha, 'localtime') >= date(?)
          AND date(fecha, 'localtime') <= date(?)
          AND (sucursal_id = ? OR sucursal_id IS NULL)
      `
      : `
        SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as salesCount
        FROM ventas
        WHERE strftime('%Y-%m', fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime', '-1 month')
          AND (sucursal_id = ? OR sucursal_id IS NULL)
      `;

    const prevParams = useRange
      ? [prevStart, prevEnd, sucursalId]
      : [sucursalId];

    const [currentMonth, prevMonth] = await Promise.all([
      db.select<any[]>(currentQuery, currentParams),
      db.select<any[]>(prevQuery, prevParams)
    ]);

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
  }
};
