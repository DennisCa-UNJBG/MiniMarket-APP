import { useState } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Download,
  DollarSign,
  Tag,
  Truck,
  Receipt,
  Archive,
  Trophy
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { reporteService } from './Service';
import { Badge } from '../../shared/components/ui/Badge';
import { Tooltip } from '../../shared/components/ui/Tooltip';
import { Button } from '../../shared/components/ui/Button';
import { notificationService } from '../../shared/lib/notifications';
import { ReporteDocumento } from './components/ReporteDocumento';
import { RendimientoChart, RankingProductos, CategoryChart } from './components/ReportComponents';
import { logService } from '../../shared/lib/logService';
import { useAuth } from '../../shared/contexts/AuthContext';
import { dateUtils } from '../../shared/lib/dateUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function Reportes() {
  const { user } = useAuth();

  const [startDate, setStartDate] = useState(() => dateUtils.getFirstDayOfMonthLocal());
  const [endDate, setEndDate] = useState(() => dateUtils.getTodayLocal());

  // Queries
  const { data: topProducts = [] } = useQuery({
    queryKey: ['report-top-products', startDate, endDate],
    queryFn: () => reporteService.getTopProducts(5, startDate, endDate)
  });

  const { data: monthlySales = [] } = useQuery({
    queryKey: ['report-monthly-revenue', startDate, endDate],
    queryFn: () => reporteService.getMonthlyRevenue(startDate, endDate)
  });

  const { data: categorySales = [] } = useQuery({
    queryKey: ['report-category-sales', startDate, endDate],
    queryFn: () => reporteService.getCategorySales(startDate, endDate)
  });

  const { data: kpis = null, isLoading: loading } = useQuery({
    queryKey: ['report-kpis', startDate, endDate],
    queryFn: () => reporteService.getKPIs(startDate, endDate)
  });

  const handleExportPDF = async () => {
    const element = document.getElementById('reporte-pdf-content');
    if (!element) return;

    try {
      notificationService.info('Procesando', 'Generando documento PDF...');

      const canvas = await html2canvas(element, {
        scale: 3, // Muy alta calidad
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Reporte_Rendimiento_${startDate}_a_${endDate}.pdf`);

      notificationService.success('Completado', 'Reporte descargado correctamente');

      // Registrar Log de Auditoría
      if (user) {
        await logService.register({
          usuario_id: user.id,
          accion: 'EXPORT_PDF',
          tabla: 'reportes',
          registro_id: user.id,
          detalles: `Exportación de Reporte de Rendimiento (${startDate} a ${endDate}) a PDF`
        });
      }
    } catch (error) {
      console.error(error);
      notificationService.error('Error', 'No se pudo generar el reporte PDF');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full size-10 border-b-2 border-blue-600"></div>
    </div>
  );

  const kpiCards = kpis ? [
    { label: 'Cat. más Rentable', value: kpis.topCategory, change: `Por ganancia`, up: true, icon: Trophy, color: 'bg-emerald-500' },
    { label: 'Ganancia Neta', value: `S/ ${kpis.profit.toFixed(2)}`, change: `${kpis.profitChange >= 0 ? '+' : ''}${kpis.profitChange.toFixed(1)}%`, up: kpis.profitChange >= 0, icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Ticket Promedio', value: `S/ ${kpis.salesCount > 0 ? (kpis.revenue / kpis.salesCount).toFixed(2) : '0.00'}`, change: 'Ingreso / N° Ventas', up: true, icon: Tag, color: 'bg-amber-500' },
    { label: 'Ingresos Totales', value: `S/ ${kpis.revenue.toFixed(2)}`, change: `${kpis.revenueChange >= 0 ? '+' : ''}${kpis.revenueChange.toFixed(1)}%`, up: kpis.revenueChange >= 0, icon: TrendingUp, color: 'bg-blue-500' },
    { label: 'N° de Ventas', value: kpis.salesCount, change: `${kpis.salesCountChange >= 0 ? '+' : ''}${kpis.salesCountChange.toFixed(1)}%`, up: kpis.salesCountChange >= 0, icon: ShoppingCart, color: 'bg-purple-500' },
    { label: 'Productos Vendidos', value: kpis.productsSold, change: `Período actual`, up: true, icon: Package, color: 'bg-violet-500' },
    { label: 'Inversión en Compras', value: `S/ ${kpis.purchasesAmount.toFixed(2)}`, change: `${kpis.purchasesAmountChange >= 0 ? '+' : ''}${kpis.purchasesAmountChange.toFixed(1)}%`, up: kpis.purchasesAmountChange <= 0, icon: Truck, color: 'bg-orange-500' },
    { label: 'N° de Compras', value: kpis.purchasesCount, change: `${kpis.purchasesCountChange >= 0 ? '+' : ''}${kpis.purchasesCountChange.toFixed(1)}%`, up: kpis.purchasesCountChange <= 0, icon: Receipt, color: 'bg-red-500' },
    { label: 'Productos Comprados', value: kpis.productsBought, change: `Período actual`, up: true, icon: Archive, color: 'bg-rose-500' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white tracking-tight">Reportes de Rendimiento</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Análisis detallado de tus ventas y productos</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip text="Exportar reporte del período filtrado" position="left">
            <Button
              onClick={handleExportPDF}
              icon={<Download size={16} />}
              className="shadow-lg shadow-blue-200 dark:shadow-none"
            >
              Exportar PDF
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Barra de Filtros Premium */}
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Accesos Rápidos */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Hoy', getDates: () => ({ start: dateUtils.getTodayLocal(), end: dateUtils.getTodayLocal() }) },
            {
              label: 'Últimos 7 Días', getDates: () => {
                const days = dateUtils.getLastDaysLocal(7);
                return { start: days[0], end: days[days.length - 1] };
              }
            },
            { label: 'Este Mes', getDates: () => ({ start: dateUtils.getFirstDayOfMonthLocal(), end: dateUtils.getTodayLocal() }) },
            {
              label: 'Mes Anterior', getDates: () => dateUtils.getPreviousMonthRangeLocal()
            }
          ].map((opt) => {
            const dates = opt.getDates();
            const isActive = startDate === dates.start && endDate === dates.end;
            return (
              <button
                key={opt.label}
                onClick={() => {
                  setStartDate(dates.start);
                  setEndDate(dates.end);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none scale-105'
                  : 'bg-zinc-50 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600'
                  }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Inputs de Fecha Manual */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-700 px-3.5 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-600">
            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Desde</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-700 px-3.5 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-600">
            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Hasta</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map(({ label, value, change, up, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-zinc-800 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow">
            <div className={`${color} w-10 h-10 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-${color.split('-')[1]}-100 dark:shadow-none`}>
              <Icon size={20} className="text-white" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-zinc-800 dark:text-white">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${up ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-red-50 text-red-500 dark:bg-red-900/20'}`}>
                {change}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium italic">vs. período anterior</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* Gráfico de rendimiento principal */}
        <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">Rendimiento General</h3>
            <Badge label="Ingresos vs Compras vs Ganancias" variant="blue" />
          </div>
          <div className="h-72 w-full">
            <RendimientoChart data={monthlySales} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Top productos */}
          <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">Ranking de Productos</h3>
              <Badge label="Top 5 Vendidos" variant="emerald" />
            </div>
            <RankingProductos products={topProducts} />
          </div>

          {/* Categorías */}
          <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">Ventas por Categoría</h3>
              <Badge label="Desglose" variant="amber" />
            </div>
            <div className="h-64 w-full">
              {categorySales.length > 0 ? (
                <CategoryChart data={categorySales} />
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
                  No hay datos suficientes
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Componente oculto para exportación a PDF */}
      {kpis && (
        <ReporteDocumento
          id="reporte-pdf-content"
          kpis={kpis}
          topProducts={topProducts}
          monthlySales={monthlySales}
          categorySales={categorySales}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}
