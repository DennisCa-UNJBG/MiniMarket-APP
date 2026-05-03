import { Plus, Truck, CheckCircle, Clock, Search } from 'lucide-react';
import { useState } from 'react';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';

interface Purchase {
  id: string;
  date: string;
  supplier: string;
  products: number;
  total: number;
  status: 'completado' | 'pendiente';
}

const purchases: Purchase[] = [
  { id: 'C-0021', date: '02/05/2026', supplier: 'Distribuidora Lima', products: 12, total: 320.00, status: 'completado' },
  { id: 'C-0020', date: '01/05/2026', supplier: 'Mayorista Tacna',    products: 5,  total: 150.50, status: 'completado' },
  { id: 'C-0019', date: '30/04/2026', supplier: 'Distribuidora Lima', products: 8,  total: 210.00, status: 'pendiente'  },
  { id: 'C-0018', date: '28/04/2026', supplier: 'Proveedor Sur',      products: 20, total: 580.00, status: 'completado' },
  { id: 'C-0017', date: '25/04/2026', supplier: 'Mayorista Tacna',    products: 3,  total: 95.00,  status: 'pendiente'  },
];

// Definición de columnas — una sola vez
const columns: TableColumn<Purchase>[] = [
  {
    key: 'id',
    header: 'N° Compra',
    render: (row) => (
      <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">{row.id}</span>
    ),
  },
  { key: 'date',     header: 'Fecha'     },
  { key: 'supplier', header: 'Proveedor' },
  {
    key: 'products',
    header: 'Productos',
    render: (row) => <span className="text-gray-600 dark:text-gray-300">{row.products} items</span>,
  },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    render: (row) => (
      <span className="font-semibold text-gray-800 dark:text-white">S/ {row.total.toFixed(2)}</span>
    ),
  },
  {
    key: 'status',
    header: 'Estado',
    align: 'center',
    // ✅ Reutilizamos el componente Badge
    render: (row) => (
      <Badge
        label={row.status}
        variant={row.status === 'completado' ? 'emerald' : 'amber'}
      />
    ),
  },
  {
    key: 'acciones',
    header: '',
    render: () => (
      <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">
        Ver detalle
      </button>
    ),
  },
];

export function Compras() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const filteredPurchases = purchases.filter(
    (p) =>
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Compras"
        subtitle="Registro de ingresos de mercancía"
        action={
          <button
            id="new-purchase-btn"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus size={16} /> Registrar compra
          </button>
        }
      />

      {/* Stats rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Compras este mes', value: 'S/ 1,355.50', icon: Truck,        color: 'bg-indigo-500'  },
          { label: 'Completadas',      value: '3',            icon: CheckCircle,  color: 'bg-emerald-500' },
          { label: 'Pendientes',       value: '2',            icon: Clock,        color: 'bg-amber-500'   },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className={`${color} p-3 rounded-xl flex-shrink-0`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por N° de compra o proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
        </div>
      </div>

      {/* ✅ Tabla reutilizable */}
      <DataTable
        columns={columns}
        data={filteredPurchases}
        keyExtractor={(row) => row.id}
        emptyMessage="No hay compras registradas."
      />

      {showModal && (
        <Modal title="Registrar Compra" onClose={() => setShowModal(false)} maxWidth="lg">
          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">N° Compra</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" placeholder="Ej. C-0022" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Fecha</label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" />
            </div>
             <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Proveedor</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" placeholder="Nombre del proveedor..." />
            </div>
             <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Cantidad de Productos</label>
              <input type="number" className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" placeholder="0" />
            </div>
             <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Facturado (S/)</label>
              <input type="number" step="0.01" className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" placeholder="0.00" />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Estado</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition">
                <option value="completado">Completado</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
              Guardar Compra
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
