import { TrendingUp, TrendingDown, Package, ShoppingCart, Calendar } from 'lucide-react';

const topProducts = [
  { name: 'Arroz Costeño 1kg',  sales: 320, revenue: 1120.00 },
  { name: 'Inka Kola 1.5L',     sales: 210, revenue: 1050.00 },
  { name: 'Aceite Primor 1L',   sales: 185, revenue: 1295.00 },
  { name: 'Azúcar Rubia 1kg',   sales: 160, revenue:  480.00 },
  { name: 'Pan de Molde Bimbo', sales: 140, revenue:  770.00 },
];

const monthlySales = [
  { month: 'Ene', amount: 32400 },
  { month: 'Feb', amount: 28900 },
  { month: 'Mar', amount: 41200 },
  { month: 'Abr', amount: 38700 },
  { month: 'May', amount: 48200 },
];

const maxAmount = Math.max(...monthlySales.map((m) => m.amount));

export function Reportes() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Reportes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Resumen de rendimiento del negocio</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300">
          <Calendar size={15} />
          <span>Mayo 2026</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Ingresos del mes',   value: 'S/ 48,200', change: '+12%', up: true,  icon: TrendingUp,   color: 'bg-indigo-500' },
          { label: 'Productos vendidos', value: '1,015',      change: '+8%',  up: true,  icon: Package,      color: 'bg-emerald-500' },
          { label: 'N° de ventas',       value: '342',        change: '+5%',  up: true,  icon: ShoppingCart, color: 'bg-sky-500' },
          { label: 'Devoluciones',       value: '3',          change: '-2',   up: false, icon: TrendingDown, color: 'bg-rose-500' },
        ].map(({ label, value, change, up, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className={`${color} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p>
            <span className={`text-xs font-semibold ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {change} vs. mes anterior
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Gráfico de ventas mensuales (barras CSS) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-5">Ventas mensuales (S/)</h3>
          <div className="flex items-end gap-3 h-36">
            {monthlySales.map(({ month, amount }) => {
              const heightPct = Math.round((amount / maxAmount) * 100);
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {(amount / 1000).toFixed(0)}k
                  </span>
                  <div
                    className="w-full bg-indigo-500 rounded-t-lg transition-all duration-500 hover:bg-indigo-600"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top productos */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-5">Productos más vendidos</h3>
          <div className="space-y-3">
            {topProducts.map((p, i) => {
              const pct = Math.round((p.sales / topProducts[0].sales) * 100);
              return (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 dark:text-gray-200 font-medium">
                      <span className="text-gray-400 dark:text-gray-500 mr-1.5">#{i + 1}</span>
                      {p.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">{p.sales} uds.</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
