import { useState } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';

type StockStatus = 'ok' | 'low' | 'out';

interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  buyPrice: number;
  sellPrice: number;
}

const products: Product[] = [
  { id: 1, code: 'P001', name: 'Arroz Costeño 1kg',       category: 'Abarrotes', stock: 120, minStock: 20, buyPrice: 2.80, sellPrice: 3.50 },
  { id: 2, code: 'P002', name: 'Aceite Primor 1L',         category: 'Abarrotes', stock: 8,   minStock: 15, buyPrice: 5.50, sellPrice: 7.00 },
  { id: 3, code: 'P003', name: 'Leche Gloria 400g',        category: 'Lácteos',   stock: 0,   minStock: 10, buyPrice: 3.20, sellPrice: 4.00 },
  { id: 4, code: 'P004', name: 'Azúcar Rubia 1kg',         category: 'Abarrotes', stock: 75,  minStock: 20, buyPrice: 2.40, sellPrice: 3.00 },
  { id: 5, code: 'P005', name: 'Inka Kola 1.5L',           category: 'Bebidas',   stock: 36,  minStock: 12, buyPrice: 3.80, sellPrice: 5.00 },
  { id: 6, code: 'P006', name: 'Jabón Bolívar',            category: 'Limpieza',  stock: 5,   minStock: 10, buyPrice: 1.20, sellPrice: 1.80 },
  { id: 7, code: 'P007', name: 'Papel Higiénico Elite x4', category: 'Limpieza',  stock: 22,  minStock: 8,  buyPrice: 4.50, sellPrice: 6.00 },
  { id: 8, code: 'P008', name: 'Pan de Molde Bimbo',       category: 'Panadería', stock: 14,  minStock: 5,  buyPrice: 4.20, sellPrice: 5.50 },
];

function getStatus(stock: number, minStock: number): StockStatus {
  if (stock === 0) return 'out';
  if (stock < minStock) return 'low';
  return 'ok';
}

const statusBadge: Record<StockStatus, { label: string; variant: 'emerald' | 'amber' | 'red' }> = {
  ok:  { label: 'En stock',   variant: 'emerald' },
  low: { label: 'Stock bajo', variant: 'amber'   },
  out: { label: 'Sin stock',  variant: 'red'     },
};

// Definición de columnas — una sola vez, reutilizable
const columns: TableColumn<Product>[] = [
  {
    key: 'code',
    header: 'Código',
    render: (row) => (
      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{row.code}</span>
    ),
  },
  {
    key: 'name',
    header: 'Producto',
    render: (row) => (
      <span className="font-medium text-gray-800 dark:text-white">{row.name}</span>
    ),
  },
  { key: 'category', header: 'Categoría' },
  {
    key: 'stock',
    header: 'Stock',
    align: 'right',
    render: (row) => {
      const status = getStatus(row.stock, row.minStock);
      return (
        <div className="flex items-center justify-end gap-1.5">
          {status === 'low' && <AlertTriangle size={13} className="text-amber-500" />}
          <span className={`font-semibold ${status === 'out' ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
            {row.stock}
          </span>
        </div>
      );
    },
  },
  {
    key: 'buyPrice',
    header: 'P. Compra',
    align: 'right',
    render: (row) => <span className="text-gray-600 dark:text-gray-300">S/ {row.buyPrice.toFixed(2)}</span>,
  },
  {
    key: 'sellPrice',
    header: 'P. Venta',
    align: 'right',
    render: (row) => <span className="font-medium text-gray-800 dark:text-white">S/ {row.sellPrice.toFixed(2)}</span>,
  },
  {
    key: 'status',
    header: 'Estado',
    align: 'center',
    render: (row) => {
      const { label, variant } = statusBadge[getStatus(row.stock, row.minStock)];
      return <Badge label={label} variant={variant} />;
    },
  },
  {
    key: 'acciones',
    header: '',
    align: 'right',
    render: () => (
      <div className="flex items-center gap-1 justify-end">
        <button className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600 transition-colors">
          <Edit2 size={14} />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    ),
  },
];

export function Inventario() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventario"
        subtitle={`${products.length} productos registrados`}
        action={
          <button
            id="add-product-btn"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus size={16} /> Agregar producto
          </button>
        }
      />

      {/* Búsqueda y filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex gap-3 flex-wrap shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="search-products"
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Filter size={15} /> Filtrar
        </button>
      </div>

      {/* ✅ Tabla reutilizable con paginación */}
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
        emptyMessage="No se encontraron productos."
        defaultPageSize={5}
      />
      {showModal && (
        <Modal title="Agregar producto al inventario" onClose={() => setShowModal(false)} maxWidth="lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Código</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" placeholder="Ej. P009" />
            </div>
             <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Producto</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" placeholder="Nombre..." />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Categoría</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition">
                <option value="Abarrotes">Abarrotes</option>
                <option value="Lácteos">Lácteos</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Limpieza">Limpieza</option>
                <option value="Panadería">Panadería</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Stock Actual</label>
              <input type="number" className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" placeholder="0" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Stock Mínimo</label>
              <input type="number" className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" placeholder="0" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">P. Compra (S/)</label>
              <input type="number" step="0.01" className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" placeholder="0.00" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">P. Venta (S/)</label>
              <input type="number" step="0.01" className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" placeholder="0.00" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
              Guardar producto
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
