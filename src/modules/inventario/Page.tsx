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
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  
  // Estados para el buscador de categorías
  const [catSearch, setCatSearch] = useState('');
  const [showCatList, setShowCatList] = useState(false);

  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ['products', true],
    queryFn: () => productoService.getAll(true)
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => import('../productos/categoriaService').then(m => m.categoriaService.getAll())
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

  const filtered = products.filter((p) => {
    const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
                        p.codigo_barras.toLowerCase().includes(search.toLowerCase());
    
    const status = getStatus(p.stock_actual, p.stock_minimo);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || p.categoria_id === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const resetFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setSearch('');
    setCatSearch('');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Control de Inventario"
        subtitle="Monitoreo de existencias y niveles de stock"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button 
          onClick={() => setStatusFilter('all')}
          className={`bg-white dark:bg-gray-800 p-5 rounded-2xl border transition-all text-left shadow-sm ${statusFilter === 'all' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-100 dark:border-gray-700'}`}
        >
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Total Productos</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{products.length}</p>
        </button>
        <button 
          onClick={() => setStatusFilter('low')}
          className={`bg-white dark:bg-gray-800 p-5 rounded-2xl border transition-all text-left shadow-sm ${statusFilter === 'low' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-gray-100 dark:border-gray-700'}`}
        >
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Stock Bajo</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{products.filter(p => getStatus(p.stock_actual, p.stock_minimo) === 'low').length}</p>
        </button>
        <button 
          onClick={() => setStatusFilter('out')}
          className={`bg-white dark:bg-gray-800 p-5 rounded-2xl border transition-all text-left shadow-sm ${statusFilter === 'out' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-100 dark:border-gray-700'}`}
        >
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Sin Stock</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{products.filter(p => p.stock_actual <= 0).length}</p>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm space-y-4">
        <div className="flex gap-3 flex-wrap">
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
            variant={showFilters || statusFilter !== 'all' || categoryFilter !== 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter size={15} />}
          >
            Filtros
          </Button>
          {(statusFilter !== 'all' || categoryFilter !== 'all' || search) && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
              Limpiar
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2 relative min-w-[220px]">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filtrar por Categoría</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={categoryFilter === 'all' ? "Escribe para buscar..." : categories.find(c => c.id === categoryFilter)?.nombre || "Buscar..."}
                  value={catSearch}
                  onFocus={() => setShowCatList(true)}
                  onChange={(e) => {
                    setCatSearch(e.target.value);
                    setShowCatList(true);
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {showCatList && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCatList(false)}></div>
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto py-1">
                      <button
                        onClick={() => {
                          setCategoryFilter('all');
                          setCatSearch('');
                          setShowCatList(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-400 font-semibold"
                      >
                        Todas las categorías
                      </button>
                      {categories.filter(c => c.nombre.toLowerCase().includes(catSearch.toLowerCase())).map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setCategoryFilter(cat.id);
                            setCatSearch('');
                            setShowCatList(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                        >
                          {cat.nombre}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado de Stock</label>
              <div className="flex gap-2">
                {(['all', 'low', 'out'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                      statusFilter === status 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 hover:border-indigo-400'
                    }`}
                  >
                    {status === 'all' ? 'Todo' : status === 'low' ? 'Bajo' : 'Agotado'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
        emptyMessage={loading ? "Consultando base de datos..." : "No se encontraron productos con los filtros seleccionados."}
        defaultPageSize={10}
      />
    </div>
  );
}
