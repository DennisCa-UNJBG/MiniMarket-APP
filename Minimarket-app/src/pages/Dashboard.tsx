import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Truck, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { dashboardService, type DashboardStats, type RecentActivity, type ChartData } from '../services/dashboardService';
import { negocioService } from '../services/negocioService';
import { Badge } from '../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const statsConfig = [
  { key: 'totalProductos',  label: 'Productos en stock', icon: Package,      color: 'bg-indigo-500' },
  { key: 'ventasHoy',       label: 'Ventas de hoy',     icon: ShoppingCart, color: 'bg-emerald-500', isMoney: true },
  { key: 'comprasHoy',      label: 'Compras del día',    icon: Truck,        color: 'bg-amber-500',   isMoney: true },
  { key: 'ventasMes',       label: 'Ingresos del mes',   icon: TrendingUp,   color: 'bg-sky-500',     isMoney: true },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isNegocioConfigured, setIsNegocioConfigured] = useState(true);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [s, a, rawChart, l, n] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivity(),
        dashboardService.getSalesChartData(),
        dashboardService.getLowStockProducts(),
        negocioService.get()
      ]);
      
      setIsNegocioConfigured(!!n.razon_social && !!n.ruc);

      // Asegurar que tenemos los últimos 7 días representados
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
      }

      const formattedChart = last7Days.map(day => {
        const match = rawChart.find(rc => rc.dia === day);
        return { dia: day, total: match ? match.total : 0 };
      });

      setStats(s);
      setActivity(a);
      setChartData(formattedChart);
      setLowStock(l);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
            ¡Buen día, Administrador! 👋
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aquí tienes el pulso de tu negocio en tiempo real.
          </p>
        </div>
        <Badge label="En Línea" variant="emerald" />
      </div>

      {/* Banner de configuración pendiente */}
      {!isNegocioConfigured && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-xl text-amber-600 dark:text-amber-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200 leading-tight">Configuración de Sede Incompleta</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">Los datos de tu negocio no han sido configurados. Tus boletas y reportes podrían aparecer con nombres genéricos.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/configuracion')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-200 dark:shadow-none whitespace-nowrap"
          >
            Configurar Ahora
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats && statsConfig.map(({ key, label, icon: Icon, color, isMoney }) => (
          <div
            key={key}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`${color} p-3 rounded-2xl shadow-lg shadow-${color.split('-')[1]}-200 dark:shadow-none group-hover:scale-110 transition-transform`}>
                <Icon size={24} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-black text-gray-800 dark:text-white mt-1">
                {isMoney ? `S/ ${(stats as any)[key].toFixed(2)}` : (stats as any)[key]}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Ventas Semanal (Mini) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-500" />
              Ventas de la Semana
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Últimos 7 días</span>
          </div>
          
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData.map(d => ({
                    ...d,
                    diaNombre: new Date(d.dia + " UTC").toLocaleDateString('es-PE', { weekday: 'short' })
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="diaNombre" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                    formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, 'Ventas']}
                    labelStyle={{ color: '#6366f1', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#6366f1' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                <ShoppingCart size={40} strokeWidth={1} />
                <p className="text-xs italic font-medium">No hay datos suficientes para el gráfico</p>
              </div>
            )}
          </div>
        </div>

        {/* Alertas de Stock Bajo */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
            <AlertTriangle size={20} className="text-amber-500" />
            Alertas de Stock
          </h3>
          <div className="space-y-4">
            {lowStock.length > 0 ? lowStock.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{p.nombre}</p>
                  <p className="text-[10px] text-amber-600 font-bold uppercase">Quedan {p.stock_actual} unidades</p>
                </div>
                <div className="bg-white dark:bg-gray-800 px-2 py-1 rounded-lg text-[10px] font-black text-amber-600 border border-amber-100 dark:border-amber-800">
                  BAJO
                </div>
              </div>
            )) : (
              <div className="text-center py-10 opacity-50">
                <Package size={30} className="mx-auto mb-2" />
                <p className="text-xs font-medium">Todo el stock está al día</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad Reciente */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Actividad Reciente</h3>
            <button className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:underline">
              Ver Todo <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-6">
            {activity.length > 0 ? activity.map((item, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className={`p-2.5 rounded-xl ${item.tipo === 'venta' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}`}>
                  {item.tipo === 'venta' ? <ShoppingCart size={18} /> : <Truck size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.descripcion} #{item.id.toString().padStart(5, '0')}</p>
                  <p className="text-xs text-gray-400">{new Date(item.fecha + " UTC").toLocaleString()}</p>
                </div>
                {item.monto && (
                  <p className={`text-sm font-black ${item.tipo === 'venta' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {item.tipo === 'venta' ? '+' : '-'} S/ {item.monto.toFixed(2)}
                  </p>
                )}
              </div>
            )) : (
              <p className="text-sm text-gray-400 italic text-center py-4">No hay actividad reciente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
