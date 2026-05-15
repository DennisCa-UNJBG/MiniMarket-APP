import { useState } from 'react';
import {
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { productoService, type Product } from '../productos/Service';

type StockStatus = 'ok' | 'low' | 'out';

function getStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return 'out';
  if (stock <= minStock) return 'low';
  return 'ok';
}

const statusBadge: Record<StockStatus, { label: string; variant: 'emerald' | 'amber' | 'red' }> = {
  ok:  { label: 'En stock',   variant: 'emerald' },
  low: { label: 'Stock bajo', variant: 'amber'   },
  out: { label: 'Sin stock',  variant: 'red'     },
};

export function Inventario() {
  const [search, setSearch] = useState('');

  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ['products', true],
    queryFn: () => productoService.getAll(true)
  });

  const columns: TableColumn<Product>[] = [
    {
      key: 'codigo_barras',
      header: 'Código',
      render: (row) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{row.codigo_barras}</span>,
    },
    {
      key: 'nombre',
      header: 'Producto',
      render: (row) => <span className="font-medium text-gray-800 dark:text-white">{row.nombre}</span>,
    },
    { key: 'categoria_nombre', header: 'Categoría', render: (row) => <Badge label={row.categoria_nombre || 'General'} variant="indigo" /> },
    {
      key: 'stock_actual',
      header: 'Stock',
      align: 'right',
      render: (row) => {
        const status = getStatus(row.stock_actual, row.stock_minimo);
        return (
          <div className="flex items-center justify-end gap-1.5">
            {status === 'low' && <AlertTriangle size={13} className="text-amber-500" />}
            <span className={`font-semibold ${status === 'out' ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
              {row.stock_actual} {row.unidad_medida}
            </span>
          </div>
        );
      },
    },
    {
      key: 'precio_compra',
      header: 'Último Costo',
      align: 'right',
      render: (row) => <span className="text-gray-600 dark:text-gray-300">S/ {(row.precio_compra || 0).toFixed(2)}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (row) => {
        const { label, variant } = statusBadge[getStatus(row.stock_actual, row.stock_minimo)];
        return <Badge label={label} variant={variant} />;
      },
    }
  ];

  const filtered = products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo_barras.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div className="space-y-5">
      <PageHeader
        title="Control de Inventario"
        subtitle="Monitoreo de existencias y niveles de stock"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Total Productos</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{products.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Stock Bajo</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{products.filter(p => getStatus(p.stock_actual, p.stock_minimo) === 'low').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Sin Stock</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{products.filter(p => p.stock_actual <= 0).length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex gap-3 flex-wrap shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition disabled:opacity-50"
          />
        </div>
        <Button 
          variant="secondary"
          size="sm"
          icon={<Filter size={15} />}
        >
          Filtros
        </Button>
      </div>

      <DataTable
        columns={columns.filter(c => c.key !== 'acciones')}
        data={filtered}
        keyExtractor={(row) => row.id}
        emptyMessage={loading ? "Consultando base de datos..." : "No se encontraron productos en el inventario."}
        defaultPageSize={10}
      />
    </div>
  );
}
