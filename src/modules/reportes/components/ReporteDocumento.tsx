import { useQuery } from '@tanstack/react-query';
import { type TopProduct, type MonthlyRevenue, type ReportKPIs } from '../Service';
import { VentasBarChart, RankingProductos } from './ReportComponents';
import { negocioService } from '../../configuracion/negocioService';

interface ReporteDocumentoProps {
  id: string;
  kpis: ReportKPIs;
  topProducts: TopProduct[];
  monthlySales: MonthlyRevenue[];
}

export const ReporteDocumento: React.FC<ReporteDocumentoProps> = ({ id, kpis, topProducts, monthlySales }) => {
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
          <p className="text-[10px] text-zinc-400 font-medium">
            {negocio?.direccion || ''} {negocio?.telefono ? `• Tel: ${negocio.telefono}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-zinc-400">FECHA DE EMISIÓN</p>
          <p suppressHydrationWarning className="text-lg font-black">{new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Resumen de KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label: 'INGRESOS TOTALES', value: `S/ ${kpis.revenue.toFixed(2)}` },
          { label: 'PRODUCTOS VENDIDOS', value: kpis.productsSold },
          { label: 'TOTAL TRANSACCIONES', value: kpis.salesCount },
          { label: 'GASTO PROMEDIO', value: `S/ ${(kpis.revenue / (kpis.salesCount || 1)).toFixed(2)}` },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 text-center">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className="text-xl font-black text-blue-700">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Gráfico de Ventas */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4 border-l-4 border-blue-500 pl-3">Rendimiento de Ventas Mensuales</h3>
        <div className="h-64 w-full bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
           <VentasBarChart data={monthlySales} isPrint />
        </div>
      </div>

      {/* Ranking de Productos */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4 border-l-4 border-emerald-500 pl-3">Ranking de Productos (Top 5)</h3>
        <RankingProductos products={topProducts} isPrint />
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
