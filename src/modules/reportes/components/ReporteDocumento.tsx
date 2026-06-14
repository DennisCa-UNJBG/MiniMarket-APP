import { useQuery } from '@tanstack/react-query';
import { type TopProduct, type MonthlyRevenue, type ReportKPIs } from '../Service';
import { RendimientoChart, RankingProductos, CategoryChart } from './ReportComponents';
import { negocioService } from '../../configuracion/negocioService';
import { dateUtils } from '../../../shared/lib/dateUtils';

interface ReporteDocumentoProps {
  id: string;
  kpis: ReportKPIs;
  topProducts: TopProduct[];
  monthlySales: MonthlyRevenue[];
  categorySales?: any[];
  startDate?: string;
  endDate?: string;
}

export const ReporteDocumento: React.FC<ReporteDocumentoProps> = ({ id, kpis, topProducts, monthlySales, categorySales, startDate, endDate }) => {
  const { data: negocio } = useQuery({
    queryKey: ['negocio'],
    queryFn: () => negocioService.get()
  });

  return (
    <div 
      id={id} 
      className="bg-white p-12 text-zinc-900 font-sans"
      style={{ width: '210mm', minHeight: '297mm', position: 'absolute', left: '-9999px', top: 0 }}
    >
      {/* Encabezado del Reporte */}
      <div className="flex justify-between items-start border-b-2 border-blue-600 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-blue-900 uppercase tracking-tighter">
            {negocio?.razon_social || 'Reporte de Gestión'}
          </h1>
          <p className="text-zinc-500 font-bold">
            {negocio?.ruc ? `RUC: ${negocio.ruc}` : 'Sistema de Inventario'}
          </p>
          {startDate && endDate && (
            <p suppressHydrationWarning className="text-xs text-blue-600 font-bold mt-1">
              PERÍODO: {dateUtils.formatLocalISOToLocalDateString(startDate)} al {dateUtils.formatLocalISOToLocalDateString(endDate)}
            </p>
          )}
          <p className="text-[10px] text-zinc-400 font-medium">
            {negocio?.direccion || ''} {negocio?.telefono ? `• Tel: ${negocio.telefono}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-zinc-400">FECHA DE EMISIÓN</p>
          <p suppressHydrationWarning className="text-lg font-black">{dateUtils.formatToLongDateString()}</p>
        </div>
      </div>

      {/* Resumen de KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'CAT. MÁS RENTABLE', value: kpis.topCategory },
          { label: 'GANANCIA NETA', value: `S/ ${kpis.profit.toFixed(2)}` },
          { label: 'TICKET PROMEDIO', value: `S/ ${kpis.salesCount > 0 ? (kpis.revenue / kpis.salesCount).toFixed(2) : '0.00'}` },
          { label: 'INGRESOS TOTALES', value: `S/ ${kpis.revenue.toFixed(2)}` },
          { label: 'N° DE VENTAS', value: kpis.salesCount },
          { label: 'PRODUCTOS VENDIDOS', value: kpis.productsSold },
          { label: 'INVERSIÓN EN COMPRAS', value: `S/ ${kpis.purchasesAmount.toFixed(2)}` },
          { label: 'N° DE COMPRAS', value: kpis.purchasesCount },
          { label: 'PRODUCTOS COMPRADOS', value: kpis.productsBought },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-center">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{kpi.label}</p>
            <p className="text-lg font-black text-blue-700">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Gráfico de Rendimiento */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4 border-l-2 border-blue-500 pl-2.5">Rendimiento General (Ingresos vs Compras vs Ganancias)</h3>
        <div className="h-64 w-full bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
           <RendimientoChart data={monthlySales} isPrint />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Ranking de Productos */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4 border-l-2 border-emerald-500 pl-2.5">Ranking de Productos (Top 5)</h3>
          <RankingProductos products={topProducts} isPrint />
        </div>

        {/* Categorías */}
        {categorySales && categorySales.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4 border-l-2 border-amber-500 pl-2.5">Ventas por Categoría</h3>
            <div className="h-48 w-full bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
              <CategoryChart data={categorySales} isPrint />
            </div>
          </div>
        )}
      </div>

      {/* Pie de página del PDF */}
      <div className="absolute bottom-12 left-12 right-12 border-t border-zinc-100 pt-6 text-center">
        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
          Documento generado automáticamente por el Sistema de Inventario • Página 1 de 1
        </p>
      </div>
    </div>
  );
};
