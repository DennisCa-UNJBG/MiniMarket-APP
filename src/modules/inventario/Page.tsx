import { useReducer, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  AlertTriangle,
  Eye,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  PowerOff
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../shared/contexts/AuthContext';
import { notificationService } from '../../shared/lib/notifications';
import { DataTable, type TableColumn } from '../../shared/components/ui/DataTable';
import { Badge } from '../../shared/components/ui/Badge';
import { PageHeader } from '../../shared/components/ui/PageHeader';
import { Button } from '../../shared/components/ui/Button';
import { Modal } from '../../shared/components/ui/Modal';
import { productoService, type Product } from '../productos/Service';
import { inventarioService } from './Service';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';

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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'activo' | 'inactivo' }) =>
      productoService.updateStatus(id, status, user?.id || 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      notificationService.success('Producto desactivado', 'El producto ha sido ocultado del inventario activo.');
    }
  });

  const [state, dispatch] = useReducer(inventarioReducer, initialInventarioState);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const searchVal = searchParams.get('search');
    setSearch(searchVal || '');
  }, [searchParams]);

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
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedProduct(row)}
            icon={<Eye size={14} />}
            className="p-1 px-2 rounded-xl text-xs font-semibold"
          >
            Detalle
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm(`¿Estás seguro de desactivar "${row.nombre}"?`)) {
                statusMutation.mutate({ id: row.id, status: 'inactivo' });
              }
            }}
            icon={<PowerOff size={14} />}
            className="p-1 px-2 rounded-xl text-xs font-semibold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10"
          >
            Desactivar
          </Button>
        </div>
      ),
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
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: rawPrecios = [], isLoading: loadingPrecios } = useQuery({
    queryKey: ['historial-precios', product.id],
    queryFn: () => inventarioService.getHistorialPrecios(product.id),
    staleTime: 0,
    gcTime: 0,
  });

  const { data: rawMovimientos = [], isLoading: loadingMovimientos } = useQuery({
    queryKey: ['movimientos-kardex', product.id],
    queryFn: () => inventarioService.getMovimientosKardexProducto(product.id),
    staleTime: 0,
    gcTime: 0,
  });

  // Filtrar precios
  const filteredPrecios = useMemo(() => {
    return rawPrecios.filter((p: any) => {
      const dateStr = p.fecha_inicio.split(' ')[0]; // SQLite timestamp "YYYY-MM-DD HH:MM:SS"
      return dateStr >= startDate && dateStr <= endDate;
    }).map((p: any) => ({
      ...p,
      fechaFormateada: new Date(p.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    }));
  }, [rawPrecios, startDate, endDate]);

  // Filtrar movimientos
  const filteredMovimientos = useMemo(() => {
    return rawMovimientos.filter((m: any) => {
      const dateStr = m.fecha.split(' ')[0];
      return dateStr >= startDate && dateStr <= endDate;
    });
  }, [rawMovimientos, startDate, endDate]);

  // Totales
  const resumen = useMemo(() => {
    let ingresos = 0;
    let salidas = 0;
    filteredMovimientos.forEach((m: any) => {
      if (m.tipo_movimiento === 'INGRESO') ingresos += m.cantidad;
      else if (m.tipo_movimiento === 'SALIDA') salidas += m.cantidad;
    });
    return { ingresos, salidas };
  }, [filteredMovimientos]);

  // Agrupar movimientos por día para el gráfico de barras
  const chartMovimientosData = useMemo(() => {
    const groups: Record<string, { fecha: string; Ingresos: number; Salidas: number }> = {};
    
    // Inicializar rango de fechas para que muestre días sin movimientos también
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      groups[dateStr] = { fecha: label, Ingresos: 0, Salidas: 0 };
    }

    filteredMovimientos.forEach((m: any) => {
      const dateStr = m.fecha.split(' ')[0];
      if (groups[dateStr]) {
        if (m.tipo_movimiento === 'INGRESO') {
          groups[dateStr].Ingresos += m.cantidad;
        } else if (m.tipo_movimiento === 'SALIDA') {
          groups[dateStr].Salidas += m.cantidad;
        }
      }
    });

    return Object.values(groups);
  }, [filteredMovimientos, startDate, endDate]);

  const loading = loadingPrecios || loadingMovimientos;

  return (
    <Modal title={`Detalles de: ${product.nombre}`} onClose={onClose} maxWidth="4xl">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        {/* Selector de Rango de Fechas */}
        <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-700/30 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
            <Calendar size={18} />
            <span className="text-sm font-semibold">Rango de tiempo para los gráficos</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <label htmlFor="modal-date-start" className="text-xs text-zinc-400 font-bold uppercase">Desde</label>
              <input
                id="modal-date-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="modal-date-end" className="text-xs text-zinc-400 font-bold uppercase">Hasta</label>
              <input
                id="modal-date-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full size-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Ingresos</p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                    {resumen.ingresos} {product.unidad_medida || 'UND'}
                  </p>
                </div>
                <div className="p-3 bg-emerald-500 text-white rounded-xl">
                  <ArrowUpRight size={24} />
                </div>
              </div>
              <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Salidas</p>
                  <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
                    {resumen.salidas} {product.unidad_medida || 'UND'}
                  </p>
                </div>
                <div className="p-3 bg-rose-500 text-white rounded-xl">
                  <ArrowDownLeft size={24} />
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico 1: Fluctuación de Precios */}
              <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-blue-500" size={18} />
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Fluctuación de Precios</h4>
                </div>
                <div className="h-64 w-full">
                  {filteredPrecios.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={filteredPrecios} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="compraColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="ventaColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="fechaFormateada" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                          formatter={(value: any, name: any) => [`S/ ${Number(value).toFixed(2)}`, name === 'precio_compra' ? 'Costo Compra' : 'Precio Venta']}
                        />
                        <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                        <Area type="monotone" name="precio_compra" dataKey="precio_compra" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#compraColor)" />
                        <Area type="monotone" name="precio_venta" dataKey="precio_venta" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#ventaColor)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-1.5">
                      <TrendingUp size={32} strokeWidth={1} />
                      <p className="text-xs italic font-medium">Sin variaciones de precio en este rango</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Gráfico 2: Ingresos y Salidas */}
              <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={18} />
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Volumen de Movimientos</h4>
                </div>
                <div className="h-64 w-full">
                  {filteredMovimientos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartMovimientosData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                          formatter={(value: any) => [`${value} ${product.unidad_medida || 'UND'}`]}
                        />
                        <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                        <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Salidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-1.5">
                      <Calendar size={32} strokeWidth={1} />
                      <p className="text-xs italic font-medium">No se registraron movimientos en este rango</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
