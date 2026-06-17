import { getDb } from '../../shared/lib/db';
import { systemConfigService } from '../configuracion/systemConfigService';
import { dateUtils } from '../../shared/lib/dateUtils';

export interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  unit?: string;
}

export interface MonthlyRevenue {
  month: string;
  ventas: number;
  compras: number;
  ganancias: number;
}

export interface ReportKPIs {
  revenue: number;
  revenueChange: number;
  salesCount: number;
  salesCountChange: number;
  productsSold: number;
  profit: number;
  profitChange: number;
  purchasesAmount: number;
  purchasesAmountChange: number;
  purchasesCount: number;
  purchasesCountChange: number;
  productsBought: number;
  topCategory: string;
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
      SELECT p.nombre as name, SUM(vd.cantidad) as sales, SUM(vd.subtotal) as revenue, u.abreviatura as unit
      FROM ventas_detalle vd
      JOIN ventas v ON vd.venta_id = v.id
      JOIN productos p ON vd.producto_id = p.id
      LEFT JOIN unidades_medida u ON p.unidad_id = u.id
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
   * Obtiene los ingresos mensuales (o diarios si el rango es corto), incluyendo compras y ganancias
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

    const formatStr = isDaily ? `'%Y-%m-%d'` : `'%Y-%m'`;
    
    let baseWhere = `estado = 'completado' AND (sucursal_id = ? OR sucursal_id IS NULL)`;
    const params: any[] = [sucursalId];
    if (startDate) {
      baseWhere += ` AND date(fecha, 'localtime') >= date(?)`;
      params.push(startDate);
    } else if (!isDaily) {
      baseWhere += ` AND fecha >= date('now', 'localtime', '-6 months')`;
    }
    if (endDate) {
      baseWhere += ` AND date(fecha, 'localtime') <= date(?)`;
      params.push(endDate);
    }

    let baseWhereVentas = `v.estado = 'completado' AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)`;
    const paramsVentas: any[] = [sucursalId];
    if (startDate) {
      baseWhereVentas += ` AND date(v.fecha, 'localtime') >= date(?)`;
      paramsVentas.push(startDate);
    } else if (!isDaily) {
      baseWhereVentas += ` AND v.fecha >= date('now', 'localtime', '-6 months')`;
    }
    if (endDate) {
      baseWhereVentas += ` AND date(v.fecha, 'localtime') <= date(?)`;
      paramsVentas.push(endDate);
    }

    const [ventas, compras, ganancias] = await Promise.all([
      db.select<any[]>(`
        SELECT strftime(${formatStr}, fecha, 'localtime') as dateKey, SUM(total) as total
        FROM ventas
        WHERE ${baseWhere}
        GROUP BY dateKey
      `, params),
      db.select<any[]>(`
        SELECT strftime(${formatStr}, fecha, 'localtime') as dateKey, SUM(total) as total
        FROM compras_ingresos
        WHERE ${baseWhere}
        GROUP BY dateKey
      `, params),
      db.select<any[]>(`
        SELECT strftime(${formatStr}, v.fecha, 'localtime') as dateKey, SUM(vd.cantidad * vd.ganancia_unitaria) as total
        FROM ventas_detalle vd
        JOIN ventas v ON v.id = vd.venta_id
        WHERE ${baseWhereVentas}
        GROUP BY dateKey
      `, paramsVentas)
    ]);

    const mergedData = new Map<string, MonthlyRevenue>();

    const mergeResult = (data: any[], key: 'ventas' | 'compras' | 'ganancias') => {
      for (const row of data) {
        if (!mergedData.has(row.dateKey)) {
          let label = '';
          if (isDaily) {
            const [, month, day] = row.dateKey.split('-');
            const monthName = monthNames[parseInt(month) - 1];
            label = `${day} ${monthName}`;
          } else {
            const [year, month] = row.dateKey.split('-');
            label = `${monthNames[parseInt(month) - 1]} - ${year}`;
          }
          mergedData.set(row.dateKey, { month: label, ventas: 0, compras: 0, ganancias: 0 });
        }
        mergedData.get(row.dateKey)![key] = row.total || 0;
      }
    };

    mergeResult(ventas, 'ventas');
    mergeResult(compras, 'compras');
    mergeResult(ganancias, 'ganancias');

    const result = Array.from(mergedData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(entry => entry[1]);

    return result;
  },

  /**
   * Obtiene las ventas agrupadas por categoría
   */
  async getCategorySales(startDate?: string, endDate?: string): Promise<any[]> {
    const [db, config] = await Promise.all([
      getDb(),
      systemConfigService.getConfig()
    ]);
    const sucursalId = config?.sucursal_id || 'LOCAL';

    let query = `
      SELECT c.nombre as category, SUM(vd.cantidad) as sales, SUM(vd.subtotal) as revenue
      FROM ventas_detalle vd
      JOIN ventas v ON vd.venta_id = v.id
      JOIN productos p ON vd.producto_id = p.id
      JOIN categorias c ON p.categoria_id = c.id
      WHERE v.estado = 'completado' AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)
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
      GROUP BY c.id
      ORDER BY revenue DESC
    `;

    return db.select(query, params);
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

    const buildSalesQuery = (isCurrent: boolean) => {
      let q = `SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as salesCount FROM ventas WHERE estado = 'completado' AND (sucursal_id = ? OR sucursal_id IS NULL)`;
      if (useRange) {
        q += ` AND date(fecha, 'localtime') >= date(?) AND date(fecha, 'localtime') <= date(?)`;
      } else {
        q += isCurrent 
          ? ` AND strftime('%Y-%m', fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime')`
          : ` AND strftime('%Y-%m', fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime', '-1 month')`;
      }
      return q;
    };

    const buildProfitQuery = (isCurrent: boolean) => {
      let q = `SELECT COALESCE(SUM(vd.cantidad), 0) as productsSold, COALESCE(SUM(vd.cantidad * vd.ganancia_unitaria), 0) as profit FROM ventas_detalle vd JOIN ventas v ON v.id = vd.venta_id WHERE v.estado = 'completado' AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)`;
      if (useRange) {
        q += ` AND date(v.fecha, 'localtime') >= date(?) AND date(v.fecha, 'localtime') <= date(?)`;
      } else {
        q += isCurrent 
          ? ` AND strftime('%Y-%m', v.fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime')`
          : ` AND strftime('%Y-%m', v.fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime', '-1 month')`;
      }
      return q;
    };

    const buildPurchasesQuery = (isCurrent: boolean) => {
      let q = `
        SELECT 
          COALESCE(SUM(c.total), 0) as amount, 
          COUNT(*) as count,
          (SELECT COALESCE(SUM(cd.cantidad), 0) FROM compras_detalle cd JOIN compras_ingresos c2 ON cd.compra_id = c2.id WHERE c2.estado = 'completado' AND (c2.sucursal_id = ? OR c2.sucursal_id IS NULL)
      `;
      if (useRange) {
        q += ` AND date(c2.fecha, 'localtime') >= date(?) AND date(c2.fecha, 'localtime') <= date(?)`;
      } else {
        q += isCurrent 
          ? ` AND strftime('%Y-%m', c2.fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime')`
          : ` AND strftime('%Y-%m', c2.fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime', '-1 month')`;
      }
      q += `) as productsBought FROM compras_ingresos c WHERE c.estado = 'completado' AND (c.sucursal_id = ? OR c.sucursal_id IS NULL)`;
      if (useRange) {
        q += ` AND date(c.fecha, 'localtime') >= date(?) AND date(c.fecha, 'localtime') <= date(?)`;
      } else {
        q += isCurrent 
          ? ` AND strftime('%Y-%m', c.fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime')`
          : ` AND strftime('%Y-%m', c.fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime', '-1 month')`;
      }
      return q;
    };

    const buildTopCategoryQuery = () => {
      let q = `
        SELECT c.nombre, SUM(vd.cantidad * vd.ganancia_unitaria) as profit 
        FROM ventas_detalle vd 
        JOIN ventas v ON vd.venta_id = v.id 
        JOIN productos p ON p.id = vd.producto_id 
        JOIN categorias c ON c.id = p.categoria_id 
        WHERE v.estado = 'completado' AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)
      `;
      if (useRange) {
        q += ` AND date(v.fecha, 'localtime') >= date(?) AND date(v.fecha, 'localtime') <= date(?)`;
      } else {
        q += ` AND strftime('%Y-%m', v.fecha, 'localtime') = strftime('%Y-%m', 'now', 'localtime')`;
      }
      q += ` GROUP BY c.id ORDER BY profit DESC LIMIT 1`;
      return q;
    };

    const currentParams = useRange ? [sucursalId, currentStart, currentEnd, sucursalId, currentStart, currentEnd] : [sucursalId, sucursalId];
    const prevParams = useRange ? [sucursalId, prevStart, prevEnd, sucursalId, prevStart, prevEnd] : [sucursalId, sucursalId];
    const topCatParams = useRange ? [sucursalId, currentStart, currentEnd] : [sucursalId];

    const [currSalesData, currProfitData, currPurchasesData, prevSalesData, prevProfitData, prevPurchasesData, topCategoryData] = await Promise.all([
      db.select<any[]>(buildSalesQuery(true), currentParams),
      db.select<any[]>(buildProfitQuery(true), currentParams),
      db.select<any[]>(buildPurchasesQuery(true), currentParams),
      db.select<any[]>(buildSalesQuery(false), prevParams),
      db.select<any[]>(buildProfitQuery(false), prevParams),
      db.select<any[]>(buildPurchasesQuery(false), prevParams),
      db.select<any[]>(buildTopCategoryQuery(), topCatParams)
    ]);

    const currSales = currSalesData[0];
    const currProfit = currProfitData[0];
    const currPurchases = currPurchasesData[0];
    const prevSales = prevSalesData[0];
    const prevProfit = prevProfitData[0];
    const prevPurchases = prevPurchasesData[0];

    const calculateChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      revenue: currSales.revenue,
      revenueChange: calculateChange(currSales.revenue, prevSales.revenue),
      salesCount: currSales.salesCount,
      salesCountChange: calculateChange(currSales.salesCount, prevSales.salesCount),
      productsSold: currProfit.productsSold,
      profit: currProfit.profit,
      profitChange: calculateChange(currProfit.profit, prevProfit.profit),
      purchasesAmount: currPurchases.amount,
      purchasesAmountChange: calculateChange(currPurchases.amount, prevPurchases.amount),
      purchasesCount: currPurchases.count,
      purchasesCountChange: calculateChange(currPurchases.count, prevPurchases.count),
      productsBought: currPurchases.productsBought,
      topCategory: topCategoryData[0]?.nombre || 'Sin datos'
    };
  }
};
