import React from 'react';
import { TrendingUp, Package, ShoppingCart, Info } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer
} from 'recharts';

interface TabReportesProps {
  fechaInicio: string;
  fechaFin: string;
  fechaShortcut: 'hoy' | '7dias' | 'esteMes' | 'mesAnterior' | 'custom';
  handleShortcutClick: (shortcut: 'hoy' | '7dias' | 'esteMes' | 'mesAnterior') => void;
  handleFechaInicioChange: (val: string) => void;
  handleFechaFinChange: (val: string) => void;
  comparisonStats: {
    totalVentas: number;
    cantVentas: number;
    totalProductos: number;
    gastoPromedio: number;
    pctVentas: string;
    pctCantVentas: string;
    pctProductos: string;
    pctGastoProm: string;
  };
  chartData: any[];
  topProductos: any[];
  maxQuantity: number;
}

export const TabReportes: React.FC<TabReportesProps> = ({
  fechaInicio,
  fechaFin,
  fechaShortcut,
  handleShortcutClick,
  handleFechaInicioChange,
  handleFechaFinChange,
  comparisonStats,
  chartData,
  topProductos,
  maxQuantity
}) => {
  const { theme } = useTheme();

  return (
    <div className="space-y-4">
      {/* Controles de Rango de Fechas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
        {/* Botones de Filtro Rápido */}
        <div className="flex flex-wrap gap-2">
          {(['hoy', '7dias', 'esteMes', 'mesAnterior'] as const).map((shortcut) => {
            const labels = {
              hoy: 'Hoy',
              '7dias': 'Últimos 7 Días',
              esteMes: 'Este Mes',
              mesAnterior: 'Mes Anterior'
            };
            return (
              <button
                key={shortcut}
                onClick={() => handleShortcutClick(shortcut)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${fechaShortcut === shortcut
                  ? 'bg-[#1f5eff] text-white shadow-lg shadow-blue-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
              >
                {labels[shortcut]}
              </button>
            );
          })}
        </div>

        {/* Rango de Fechas */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-2xl">
          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Desde</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => handleFechaInicioChange(e.target.value)}
              className="bg-transparent text-sm font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none border-none [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <div className="hidden sm:block h-4 w-px bg-zinc-300 dark:bg-zinc-800" />
          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Hasta</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => handleFechaFinChange(e.target.value)}
              className="bg-transparent text-sm font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none border-none [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas del Período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="p-2.5 bg-blue-500/10 text-[#1f5eff] rounded-xl inline-flex items-center justify-center mb-3">
              <TrendingUp size={18} />
            </div>
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">Ingresos del Período</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1.5">S/ {comparisonStats.totalVentas.toFixed(2)}</p>
          </div>
          <p className="text-[10px] font-semibold text-emerald-500 mt-4">
            {comparisonStats.pctVentas} <span className="text-zinc-400 dark:text-zinc-500">vs. período anterior</span>
          </p>
        </div>

        {/* Productos Vendidos */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="p-2.5 bg-emerald-500/10 text-[#10b981] rounded-xl inline-flex items-center justify-center mb-3">
              <Package size={18} />
            </div>
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">Productos Vendidos</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1.5">{comparisonStats.totalProductos}</p>
          </div>
          <p className="text-[10px] font-semibold text-emerald-500 mt-4">
            Período actual <span className="text-zinc-400 dark:text-zinc-500">vs. período anterior</span>
          </p>
        </div>

        {/* N° Ventas */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="p-2.5 bg-blue-500/10 text-[#1f5eff] rounded-xl inline-flex items-center justify-center mb-3">
              <ShoppingCart size={18} />
            </div>
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">N° de Ventas</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1.5">{comparisonStats.cantVentas}</p>
          </div>
          <p className="text-[10px] font-semibold text-emerald-500 mt-4">
            {comparisonStats.pctCantVentas} <span className="text-zinc-400 dark:text-zinc-500">vs. período anterior</span>
          </p>
        </div>

        {/* Gasto Promedio */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="p-2.5 bg-amber-500/10 text-[#f59e0b] rounded-xl inline-flex items-center justify-center mb-3">
              <Info size={18} />
            </div>
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">Gasto Promedio por Cliente</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1.5">S/ {comparisonStats.gastoPromedio.toFixed(2)}</p>
          </div>
          <p className="text-[10px] font-semibold text-emerald-500 mt-4">
            Ingreso Total / N° Ventas <span className="text-zinc-400 dark:text-zinc-500">vs. período anterior</span>
          </p>
        </div>
      </div>

      {/* Fila de Gráfico y Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Ingresos del Período</h3>
            <span className="bg-blue-500/20 text-[#1f5eff] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Historial
            </span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={theme === 'dark' ? '#27272a' : '#e2e8f0'} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: theme === 'dark' ? '#71717a' : '#475569', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: theme === 'dark' ? '#71717a' : '#475569', fontSize: 10, fontWeight: 'bold' }}
                />
                <ChartTooltip
                  cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800 shadow-md'
                          } border p-3 rounded-xl shadow-xl`}>
                          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">{payload[0].payload.dateStr}</p>
                          <p className="text-sm font-black text-[#1f5eff]">S/ {Number(payload[0].value).toFixed(2)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="Ingresos"
                  fill={theme === 'dark' ? '#a1a1aa' : '#1f5eff'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking de Productos */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Ranking de Productos</h3>
            <span className="bg-emerald-500/20 text-[#10b981] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Top 5 Vendidos
            </span>
          </div>

          <div className="space-y-6 flex-grow flex flex-col justify-center">
            {topProductos.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">No hay datos de ventas en este período.</p>
              </div>
            ) : (
              topProductos.map((prod: any, index: number) => {
                const percentage = maxQuantity > 0 ? (prod.total_cantidad / maxQuantity) * 100 : 0;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 bg-[#f59e0b] text-white rounded-full flex items-center justify-center text-xs font-bold font-mono">
                          {index + 1}
                        </span>
                        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{prod.producto_nombre}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-zinc-900 dark:text-white">{prod.total_cantidad} uds.</p>
                        <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">S/ {(prod.total_recaudado || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1f5eff] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
