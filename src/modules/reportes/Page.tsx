import {
  TrendingUp,
  Package,
  ShoppingCart,
  Calendar,
  Info,
  Download
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { reporteService } from './Service';
import { Badge } from '../../components/ui/Badge';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import { notificationService } from '../../lib/notifications';
import { ReporteDocumento } from './components/ReporteDocumento';
import { VentasBarChart, RankingProductos } from './components/ReportComponents';
import { logService } from '../../lib/logService';
import { useAuth } from '../../contexts/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function Reportes() {
  const { user } = useAuth();
  // Queries
  const { data: topProducts = [] } = useQuery({
    queryKey: ['report-top-products'],
    queryFn: () => reporteService.getTopProducts()
  });

  const { data: monthlySales = [] } = useQuery({
    queryKey: ['report-monthly-revenue'],
    queryFn: () => reporteService.getMonthlyRevenue()
  });

  const { data: kpis = null, isLoading: loading } = useQuery({
    queryKey: ['report-kpis'],
    queryFn: () => reporteService.getKPIs()
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
      pdf.save(`Reporte_Rendimiento_${new Date().toISOString().split('T')[0]}.pdf`);
      
      notificationService.success('Completado', 'Reporte descargado correctamente');

      // Registrar Log de Auditoría
      if (user) {
        await logService.register({
          usuario_id: user.id,
          accion: 'EXPORT_PDF',
          tabla: 'reportes',
          registro_id: 0,
          detalles: `Exportación de Reporte de Rendimiento Mensual a PDF`
        });
      }
    } catch (error) {
      console.error(error);
      notificationService.error('Error', 'No se pudo generar el reporte PDF');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  const kpiCards = kpis ? [
    { label: 'Ingresos del mes',   value: `S/ ${kpis.revenue.toFixed(2)}`, change: `${kpis.revenueChange >= 0 ? '+' : ''}${kpis.revenueChange.toFixed(1)}%`, up: kpis.revenueChange >= 0, icon: TrendingUp,   color: 'bg-indigo-500' },
    { label: 'Productos vendidos', value: kpis.productsSold,      change: `Mes actual`,  up: true,  icon: Package,      color: 'bg-emerald-500' },
    { label: 'N° de ventas',       value: kpis.salesCount,        change: `${kpis.salesCountChange >= 0 ? '+' : ''}${kpis.salesCountChange.toFixed(1)}%`,  up: kpis.salesCountChange >= 0,  icon: ShoppingCart, color: 'bg-sky-500' },
    { label: 'Gasto Promedio por Cliente',   value: `S/ ${kpis.salesCount > 0 ? (kpis.revenue / kpis.salesCount).toFixed(2) : '0.00'}`, change: 'Ingreso Total / N° Ventas', up: true, icon: Info, color: 'bg-amber-500' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Reportes de Rendimiento</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Análisis detallado de tus ventas y productos</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip text="Exportar reporte del mes actual" position="bottom">
            <Button 
              onClick={handleExportPDF}
              icon={<Download size={16} />}
              className="shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              Exportar PDF
            </Button>
          </Tooltip>
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300">
            <Calendar size={14} />
            <span>{new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, change, up, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className={`${color} w-10 h-10 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-${color.split('-')[1]}-100 dark:shadow-none`}>
              <Icon size={20} className="text-white" />
            </div>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${up ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-red-50 text-red-500 dark:bg-red-900/20'}`}>
                {change}
              </span>
              <span className="text-[10px] text-gray-400 font-medium italic">vs. mes anterior</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Gráfico de ventas mensuales */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Ingresos Mensuales</h3>
            <Badge label="Últimos 6 meses" variant="indigo" />
          </div>
          <div className="h-64 w-full">
            <VentasBarChart data={monthlySales} />
          </div>
        </div>

        {/* Top productos */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Ranking de Productos</h3>
            <Badge label="Top 5 Vendidos" variant="emerald" />
          </div>
          <RankingProductos products={topProducts} />
        </div>
      </div>

      {/* Componente oculto para exportación a PDF */}
      {kpis && (
        <ReporteDocumento 
          id="reporte-pdf-content"
          kpis={kpis}
          topProducts={topProducts}
          monthlySales={monthlySales}
        />
      )}
    </div>
  );
}
