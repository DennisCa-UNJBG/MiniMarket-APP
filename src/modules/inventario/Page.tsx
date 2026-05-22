import { useReducer } from 'react';
import {
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type TableColumn } from '../../shared/components/ui/DataTable';
import { Badge } from '../../shared/components/ui/Badge';
import { PageHeader } from '../../shared/components/ui/PageHeader';
import { Button } from '../../shared/components/ui/Button';
import { productoService, type Product } from '../productos/Service';

type StockStatus = 'ok' | 'low' | 'out';

function getStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return 'out';
  if (stock <= minStock) return 'low';
  return 'ok';
}

const statusBadge: Record<StockStatus, { label: string; variant: 'emerald' | 'amber' | 'red' }> = {
  ok: { label: 'En stock', variant: 'emerald' },
  low: { label: 'Stock bajo', variant: 'amber' },
  out: { label: 'Sin stock', variant: 'red' },
};

interface InventarioState {
  search: string;
  showFilters: boolean;
  statusFilter: 'all' | 'low' | 'out';
  categoryFilter: number | 'all';
  catSearch: string;
  showCatList: boolean;
}

type InventarioAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_SHOW_FILTERS'; payload: boolean }
  | { type: 'SET_STATUS_FILTER'; payload: 'all' | 'low' | 'out' }
  | { type: 'SET_CATEGORY_FILTER'; payload: number | 'all' }
  | { type: 'SET_CAT_SEARCH'; payload: string }
  | { type: 'SET_SHOW_CAT_LIST'; payload: boolean };

function inventarioReducer(state: InventarioState, action: InventarioAction): InventarioState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_SHOW_FILTERS':
      return { ...state, showFilters: action.payload };
    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload };
    case 'SET_CATEGORY_FILTER':
      return { ...state, categoryFilter: action.payload };
    case 'SET_CAT_SEARCH':
      return { ...state, catSearch: action.payload };
    case 'SET_SHOW_CAT_LIST':
      return { ...state, showCatList: action.payload };
    default:
      return state;
  }
}

const initialInventarioState: InventarioState = {
  search: '',
  showFilters: false,
  statusFilter: 'all',
  categoryFilter: 'all',
  catSearch: '',
  showCatList: false
};

export function Inventario() {
  const [state, dispatch] = useReducer(inventarioReducer, initialInventarioState);

  const {
    search,
    showFilters,
    statusFilter,
    categoryFilter,
    catSearch,
    showCatList
  } = state;

  const setSearch = (payload: string) => dispatch({ type: 'SET_SEARCH', payload });
  const setShowFilters = (payload: boolean) => dispatch({ type: 'SET_SHOW_FILTERS', payload });
  const setStatusFilter = (payload: 'all' | 'low' | 'out') => dispatch({ type: 'SET_STATUS_FILTER', payload });
  const setCategoryFilter = (payload: number | 'all') => dispatch({ type: 'SET_CATEGORY_FILTER', payload });
  const setCatSearch = (payload: string) => dispatch({ type: 'SET_CAT_SEARCH', payload });
  const setShowCatList = (payload: boolean) => dispatch({ type: 'SET_SHOW_CAT_LIST', payload });

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
      render: (row) => <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{row.codigo_barras}</span>,
    },
    {
      key: 'nombre',
      header: 'Producto',
      render: (row) => <span className="font-medium text-zinc-800 dark:text-white">{row.nombre}</span>,
    },
    { key: 'categoria_nombre', header: 'Categoría', render: (row) => <Badge label={row.categoria_nombre || 'General'} variant="blue" /> },
    {
      key: 'stock_actual',
      header: 'Stock',
      align: 'right',
      render: (row) => {
        const status = getStatus(row.stock_actual, row.stock_minimo);
        return (
          <div className="flex items-center justify-end gap-1.5">
            {status === 'low' && <AlertTriangle size={13} className="text-amber-500" />}
            <span className={`font-semibold ${status === 'out' ? 'text-red-500' : 'text-zinc-800 dark:text-white'}`}>
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
      render: (row) => <span className="text-zinc-600 dark:text-zinc-300">S/ {(row.precio_compra || 0).toFixed(2)}</span>,
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
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search.toLowerCase()));

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
          className={`bg-white dark:bg-zinc-800 p-5 rounded-2xl border transition-all text-left shadow-sm ${statusFilter === 'all' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-zinc-100 dark:border-zinc-700'}`}
        >
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase">Total Productos</p>
          <p className="text-2xl font-bold text-zinc-800 dark:text-white mt-1">{products.length}</p>
        </button>
        <button
          onClick={() => setStatusFilter('low')}
          className={`bg-white dark:bg-zinc-800 p-5 rounded-2xl border transition-all text-left shadow-sm ${statusFilter === 'low' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-zinc-100 dark:border-zinc-700'}`}
        >
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase">Stock Bajo</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{products.filter(p => getStatus(p.stock_actual, p.stock_minimo) === 'low').length}</p>
        </button>
        <button
          onClick={() => setStatusFilter('out')}
          className={`bg-white dark:bg-zinc-800 p-5 rounded-2xl border transition-all text-left shadow-sm ${statusFilter === 'out' ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-100 dark:border-zinc-700'}`}
        >
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase">Sin Stock</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{products.filter(p => p.stock_actual <= 0).length}</p>
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 p-4 shadow-sm space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar producto por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50"
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
          <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-700 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2 relative min-w-[220px]">
              <label htmlFor="filtro-categoria-search" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Filtrar por Categoría</label>
              <div className="relative">
                <input
                  id="filtro-categoria-search"
                  type="text"
                  placeholder={categoryFilter === 'all' ? "Escribe para buscar..." : categories.find(c => c.id === categoryFilter)?.nombre || "Buscar..."}
                  value={catSearch}
                  onFocus={() => setShowCatList(true)}
                  onChange={(e) => {
                    setCatSearch(e.target.value);
                    setShowCatList(true);
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {showCatList && (
                  <>
                    <button
                      type="button"
                      aria-label="Cerrar filtro de categorías"
                      className="fixed inset-0 z-10 w-full h-full cursor-default bg-transparent border-none outline-none"
                      onClick={() => setShowCatList(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto py-1">
                      <button
                        onClick={() => {
                          setCategoryFilter('all');
                          setCatSearch('');
                          setShowCatList(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400 font-semibold"
                      >
                        Todas las categorías
                      </button>
                      {categories.flatMap(cat => cat.nombre.toLowerCase().includes(catSearch.toLowerCase()) ? [
                        <button
                          key={cat.id}
                          onClick={() => {
                            setCategoryFilter(cat.id);
                            setCatSearch('');
                            setShowCatList(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
                        >
                          {cat.nombre}
                        </button>
                      ] : [])}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Estado de Stock</span>
              <div className="flex gap-2">
                {(['all', 'low', 'out'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg border transition-all ${statusFilter === status
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-600 text-zinc-500 hover:border-blue-400'
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
