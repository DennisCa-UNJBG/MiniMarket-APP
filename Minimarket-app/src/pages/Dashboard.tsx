import { Package, ShoppingCart, Truck, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Productos en stock', value: '1,284', icon: Package,      color: 'bg-indigo-500' },
  { label: 'Ventas del día',     value: 'S/ 3,420', icon: ShoppingCart, color: 'bg-emerald-500' },
  { label: 'Compras pendientes', value: '7',         icon: Truck,        color: 'bg-amber-500'  },
  { label: 'Ingresos del mes',   value: 'S/ 48,200', icon: TrendingUp,   color: 'bg-sky-500'    },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          ¡Buen día! 👋
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Aquí tienes el resumen del día.
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4"
          >
            <div className={`${color} p-3 rounded-xl flex-shrink-0`}>
              <Icon size={22} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder de contenido futuro */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
          Actividad reciente
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-600">
          Los gráficos y tablas de actividad se mostrarán aquí.
        </p>
      </div>
    </div>
  );
}
