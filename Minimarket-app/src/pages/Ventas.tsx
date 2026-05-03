import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Receipt, TrendingUp, DollarSign } from 'lucide-react';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';

interface Sale {
  id: string;
  date: string;
  time: string;
  cashier: string;
  items: number;
  total: number;
  paid: number;
}

const sales: Sale[] = [
  { id: 'V-0045', date: '03/05/2026', time: '08:32', cashier: 'Admin', items: 5, total: 24.50, paid: 30.00 },
  { id: 'V-0044', date: '03/05/2026', time: '08:15', cashier: 'Admin', items: 2, total: 8.00,  paid: 10.00 },
  { id: 'V-0043', date: '03/05/2026', time: '07:58', cashier: 'Admin', items: 8, total: 52.80, paid: 60.00 },
  { id: 'V-0042', date: '02/05/2026', time: '18:40', cashier: 'Admin', items: 3, total: 15.00, paid: 15.00 },
  { id: 'V-0041', date: '02/05/2026', time: '17:25', cashier: 'Admin', items: 6, total: 37.20, paid: 40.00 },
  { id: 'V-0040', date: '02/05/2026', time: '12:10', cashier: 'Admin', items: 1, total: 5.50,  paid: 10.00 },
];

const summaryCards = [
  { label: 'Ventas de hoy',   value: 'S/ 85.30', sub: '3 transacciones',   icon: ShoppingCart, color: 'bg-indigo-500' },
  { label: 'Total del mes',   value: 'S/ 3,420', sub: '+12% vs. mes ant.', icon: TrendingUp,   color: 'bg-emerald-500' },
  { label: 'Ticket promedio', value: 'S/ 28.43', sub: 'Por venta',          icon: DollarSign,   color: 'bg-sky-500' },
];

// Definición de columnas — se declara una sola vez
const columns: TableColumn<Sale>[] = [
  {
    key: 'id',
    header: 'N° Venta',
    render: (row) => (
      <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">{row.id}</span>
    ),
  },
  { key: 'date',    header: 'Fecha'  },
  { key: 'time',    header: 'Hora'   },
  { key: 'cashier', header: 'Cajero' },
  { key: 'items',   header: 'Ítems', align: 'center' },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    render: (row) => (
      <span className="font-semibold text-gray-800 dark:text-white">S/ {row.total.toFixed(2)}</span>
    ),
  },
  {
    key: 'vuelto',
    header: 'Vuelto',
    align: 'right',
    render: (row) => (
      <span className="text-gray-500 dark:text-gray-400">S/ {(row.paid - row.total).toFixed(2)}</span>
    ),
  },
  {
    key: 'acciones',
    header: '',
    render: () => (
      <button className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">
        <Receipt size={13} /> Boleta
      </button>
    ),
  },
];

export function Ventas() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = sales.filter((s) => s.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ventas"
        subtitle="Historial de ventas realizadas"
        action={
          <button
            id="new-sale-btn"
            onClick={() => navigate('/nueva-venta')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus size={16} /> Nueva venta
          </button>
        }
      />

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className={`${color} p-3 rounded-xl flex-shrink-0`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">{value}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <input
            id="search-sales"
            type="text"
            placeholder="Buscar por N° de venta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
        </div>
      </div>

      {/* ✅ Tabla reutilizable — misma lógica, cero duplicación */}
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
        emptyMessage="No se encontraron ventas."
      />
    </div>
  );
}
