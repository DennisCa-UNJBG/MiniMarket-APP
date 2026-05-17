import { useMemo } from 'react';
import {
  Package,
  ShoppingCart,
  Truck,
  TrendingUp,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from './Service';
import { negocioService } from '../configuracion/negocioService';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';

const statsConfig = [
  { key: 'totalProductos',  label: 'Productos en stock', icon: Package,      color: 'bg-blue-500' },
  { key: 'ventasHoy',       label: 'Ventas de hoy',     icon: ShoppingCart, color: 'bg-emerald-500', isMoney: true },
  { key: 'comprasHoy',      label: 'Compras del día',    icon: Truck,        color: 'bg-amber-500',   isMoney: true },
  { key: 'ventasMes',       label: 'Ingresos del mes',   icon: TrendingUp,   color: 'bg-sky-500',     isMoney: true },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.nombre_completo?.split(' ')[0] || 'Administrador';
  const roleLabel = user?.rol_nombre || 'Usuario';

  // Queries
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats()
  });

  const { data: activity = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => dashboardService.getRecentActivity()
  });

  const { data: rawChart = [], isLoading: isLoadingChart } = useQuery({
    queryKey: ['sales-chart'],
    queryFn: () => dashboardService.getSalesChartData()
  });

  const { data: lowStock = [], isLoading: isLoadingLowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => dashboardService.getLowStockProducts()
  });

  const { data: negocio, isLoading: isLoadingNegocio } = useQuery({
    queryKey: ['negocio'],
    queryFn: () => negocioService.get()
  });

  const chartData = useMemo(() => {
    if (!rawChart) return [];
    // Asegurar que tenemos los últimos 7 días representados
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    return last7Days.map(day => {
      const match = rawChart.find(rc => rc.dia === day);
      return { 
        dia: day, 
        total: match ? match.total : 0,
        diaNombre: new Date(day + " UTC").toLocaleDateString('es-PE', { weekday: 'short' })
      };
    });
  }, [rawChart]);

  const formattedActivity = useMemo(() => {
    return activity.map(item => ({
      ...item,
      fechaFormateada: new Date(item.fecha + " UTC").toLocaleString()
    }));
  }, [activity]);

  const isNegocioConfigured = useMemo(() => {
    return !!negocio?.razon_social && !!negocio?.ruc;
  }, [negocio]);

  const loading = isLoadingStats || isLoadingActivity || isLoadingChart || isLoadingLowStock || isLoadingNegocio;

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full size-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white tracking-tight">
            ¡Buen día, {firstName}! 👋
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {roleLabel} • Aquí tienes el pulso de tu negocio en tiempo real.
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
          <Tooltip text="Completar la información básica de tu negocio" position="top-right">
            <Button 
              onClick={() => navigate('/configuracion')}
              variant="warning"
              size="sm"
              icon={<ArrowRight size={14} />}
              iconPosition="right"
              className="bg-amber-600 hover:bg-amber-700 shadow-amber-200 text-white rounded-xl font-bold"
            >
              Configurar Ahora
            </Button>
          </Tooltip>
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats && statsConfig.map(({ key, label, icon: Icon, color, isMoney }) => (
          <div
            key={key}
            className="bg-white dark:bg-zinc-800 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-700 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`${color} p-3 rounded-2xl shadow-lg shadow-${color.split('-')[1]}-200 dark:shadow-none group-hover:scale-110 transition-transform`}>
                <Icon size={24} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-black text-zinc-800 dark:text-white mt-1">
                {isMoney ? `S/ ${(stats as any)[key].toFixed(2)}` : (stats as any)[key]}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Ventas Semanal (Mini) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-800 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              Ventas de la Semana
            </h3>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Últimos 7 días</span>
          </div>
          
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
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
                  <RechartsTooltip 
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
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
                <ShoppingCart size={40} strokeWidth={1} />
                <p className="text-xs italic font-medium">No hay datos suficientes para el gráfico</p>
              </div>
            )}
          </div>
        </div>

        {/* Alertas de Stock Bajo */}
        <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-white flex items-center gap-2 mb-6">
            <AlertTriangle size={20} className="text-amber-500" />
            Alertas de Stock
          </h3>
          <div className="space-y-4">
            {lowStock.length > 0 ? lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{p.nombre}</p>
                  <p className="text-[10px] text-amber-600 font-bold uppercase">Quedan {p.stock_actual} unidades</p>
                </div>
                <div className="bg-white dark:bg-zinc-800 px-2 py-1 rounded-lg text-[10px] font-black text-amber-600 border border-amber-100 dark:border-amber-800">
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
        <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">Actividad Reciente</h3>
            <Tooltip text="Ver todos los movimientos" position="top-right">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => navigate('/kardex')}
                icon={<ArrowRight size={12} />}
                iconPosition="right"
                className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest p-1 px-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Ver Todo
              </Button>
            </Tooltip>
          </div>
          <div className="space-y-6">
            {formattedActivity.length > 0 ? formattedActivity.map((item) => (
              <div key={item.id} className="flex items-center gap-4 group">
                <div className={`p-2.5 rounded-xl ${item.tipo === 'venta' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}`}>
                  {item.tipo === 'venta' ? <ShoppingCart size={18} /> : <Truck size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{item.descripcion} #{item.id.toString().padStart(5, '0')}</p>
                  <p className="text-xs text-zinc-400">{item.fechaFormateada}</p>
                </div>
                {item.monto && (
                  <p className={`text-sm font-black ${item.tipo === 'venta' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {item.tipo === 'venta' ? '+' : '-'} S/ {item.monto.toFixed(2)}
                  </p>
                )}
              </div>
            )) : (
              <p className="text-sm text-zinc-400 italic text-center py-4">No hay actividad reciente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
