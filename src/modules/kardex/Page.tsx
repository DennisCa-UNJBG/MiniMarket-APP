import { useReducer } from 'react';
import { 
  History, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeftRight, 
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tooltip } from '../../components/ui/Tooltip';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { notificationService } from '../../lib/notifications';
import { inventarioService } from '../inventario/Service';
import { productoService, type Product } from '../productos/Service';
import { dateUtils } from '../../lib/dateUtils';

const columns: TableColumn<any>[] = [
  {
    key: 'fecha',
    header: 'Fecha y Hora',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-zinc-400" />
        <span suppressHydrationWarning className="text-sm text-zinc-600 dark:text-zinc-400">
          {dateUtils.formatUTCtoLocalString(row.fecha)}
        </span>
      </div>
    ),
  },
  {
    key: 'producto_nombre',
    header: 'Producto',
    render: (row) => <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 line-clamp-1">{row.producto_nombre}</span>,
  },
  {
    key: 'tipo_movimiento',
    header: 'Movimiento',
    render: (row) => {
      const config = {
        INGRESO: { variant: 'emerald' as const, icon: <TrendingUp size={12} /> },
        SALIDA:  { variant: 'red' as const,     icon: <TrendingDown size={12} /> },
        AJUSTE:  { variant: 'amber' as const,   icon: <ArrowLeftRight size={12} /> },
      };
      const type = row.tipo_movimiento as keyof typeof config;
      const { variant } = config[type] || { variant: 'blue', icon: null };
      return (
        <div className="flex items-center gap-2">
          <Badge label={row.tipo_movimiento} variant={variant} />
        </div>
      );
    },
  },
  {
    key: 'referencia',
    header: 'Concepto / Motivo',
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-zinc-800 dark:text-white line-clamp-1">{row.referencia}</span>
      </div>
    ),
  },
  {
    key: 'cantidad',
    header: 'Cant.',
    align: 'right',
    render: (row) => (
      <span className={`font-bold ${row.tipo_movimiento === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'}`}>
        {row.tipo_movimiento === 'INGRESO' ? '+' : '-'}{row.cantidad}
      </span>
    ),
  },
  {
    key: 'saldo_posterior',
    header: 'Stock Resultante',
    align: 'right',
    render: (row) => (
      <span className="font-black text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded-md">
        {row.saldo_posterior}
      </span>
    ),
  },
  {
    key: 'usuario_nombre',
    header: 'Usuario',
    render: (row) => <span className="text-xs text-zinc-500">{row.usuario_nombre}</span>,
  },
];

interface KardexState {
  selectedProduct: Product | null;
  search: string;
  showProductList: boolean;
  dateRange: { start: string; end: string };
  filterType: 'today' | 'all' | 'filtered';
  page: number;
  pageSize: number;
}

type KardexAction =
  | { type: 'SET_SELECTED_PRODUCT'; payload: Product | null }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_SHOW_PRODUCT_LIST'; payload: boolean }
  | { type: 'SET_DATE_RANGE'; payload: Partial<KardexState['dateRange']> | ((prev: KardexState['dateRange']) => KardexState['dateRange']) }
  | { type: 'SET_FILTER_TYPE'; payload: 'today' | 'all' | 'filtered' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number };

function kardexReducer(state: KardexState, action: KardexAction): KardexState {
  switch (action.type) {
    case 'SET_SELECTED_PRODUCT':
      return { ...state, selectedProduct: action.payload };
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_SHOW_PRODUCT_LIST':
      return { ...state, showProductList: action.payload };
    case 'SET_DATE_RANGE':
      return {
        ...state,
        dateRange: typeof action.payload === 'function'
          ? action.payload(state.dateRange)
          : { ...state.dateRange, ...action.payload }
      };
    case 'SET_FILTER_TYPE':
      return { ...state, filterType: action.payload };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload };
    default:
      return state;
  }
}

const initialKardexState: KardexState = {
  selectedProduct: null,
  search: '',
  showProductList: false,
  dateRange: { start: '', end: '' },
  filterType: 'today',
  page: 1,
  pageSize: 10
};

export function Kardex() {
  const [state, dispatch] = useReducer(kardexReducer, initialKardexState);

  const {
    selectedProduct,
    search,
    showProductList,
    dateRange,
    filterType,
    page,
    pageSize
  } = state;

  const setSelectedProduct = (payload: Product | null) => dispatch({ type: 'SET_SELECTED_PRODUCT', payload });
  const setSearch = (payload: string) => dispatch({ type: 'SET_SEARCH', payload });
  const setShowProductList = (payload: boolean) => dispatch({ type: 'SET_SHOW_PRODUCT_LIST', payload });
  const setDateRange = (payload: Partial<KardexState['dateRange']> | ((prev: KardexState['dateRange']) => KardexState['dateRange'])) => dispatch({ type: 'SET_DATE_RANGE', payload });
  const setFilterType = (payload: 'today' | 'all' | 'filtered') => dispatch({ type: 'SET_FILTER_TYPE', payload });
  const setPage = (payload: number) => dispatch({ type: 'SET_PAGE', payload });
  const setPageSize = (payload: number) => dispatch({ type: 'SET_PAGE_SIZE', payload });

  // Queries
  const { data: products = [] } = useQuery({
    queryKey: ['products', true],
    queryFn: () => productoService.getAll(true)
  });

  const { data: movementsRes = { data: [], total: 0 }, isLoading: loading } = useQuery({
    queryKey: ['movements', filterType, selectedProduct?.id, dateRange.start, dateRange.end, page, pageSize],
    queryFn: () => {
      if (filterType === 'today') return inventarioService.getMovimientosDia(page, pageSize);
      if (filterType === 'all') return inventarioService.getMovimientosFiltrados({}, page, pageSize);
      return inventarioService.getMovimientosFiltrados({
        productoId: selectedProduct?.id,
        fechaInicio: dateRange.start,
        fechaFin: dateRange.end
      }, page, pageSize);
    },
    placeholderData: keepPreviousData
  });

  const loadTodayMovements = () => {
    setFilterType('today');
    setSelectedProduct(null);
    setDateRange({ start: '', end: '' });
    setPage(1);
  };

  const loadAllMovements = () => {
    setFilterType('all');
    setSelectedProduct(null);
    setDateRange({ start: '', end: '' });
    setPage(1);
  };

  const handleFilter = () => {
    setFilterType('filtered');
    setPage(1);
  };

  const exportToExcel = () => {
    if (movementsRes.data.length === 0) return;
    
    const headers = ['Fecha', 'Producto', 'Tipo', 'Referencia', 'Cantidad', 'Saldo Resultante', 'Usuario'];
    
    // Generamos una tabla HTML que Excel interpreta perfectamente como hoja de cálculo
    let table = `<table border="1">`;
    // Encabezados con estilo
    table += `<tr style="background-color: #4f46e5; color: white; font-weight: bold;">`;
    headers.forEach(h => table += `<th style="padding: 10px;">${h}</th>`);
    table += `</tr>`;
    
    // Filas de datos
    movementsRes.data.forEach((m: any) => {
      table += `<tr>`;
      table += `<td style="padding: 5px;">${dateUtils.formatUTCtoLocalString(m.fecha)}</td>`;
      table += `<td style="padding: 5px;">${m.producto_nombre}</td>`;
      table += `<td style="padding: 5px;">${m.tipo_movimiento}</td>`;
      table += `<td style="padding: 5px;">${m.referencia}</td>`;
      table += `<td style="padding: 5px; text-align: right;">${m.cantidad}</td>`;
      table += `<td style="padding: 5px; text-align: right;">${m.saldo_posterior}</td>`;
      table += `<td style="padding: 5px;">${m.usuario_nombre}</td>`;
      table += `</tr>`;
    });
    table += `</table>`;

    const blob = new Blob(['\ufeff', table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = `kardex_${dateUtils.getTodayLocal()}.xls`;
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Notificar al usuario con botón de aceptar
    notificationService.successWithConfirm(
      '¡Exportación Exitosa!', 
      `El archivo "${fileName}" se ha guardado en tu carpeta de Descargas.`
    );
  };

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setShowProductList(false);
    setSearch('');
    setFilterType('filtered');
    setPage(1);
  };

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(search.toLowerCase()) || 
    (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search.toLowerCase()))
  );

  const filtered = movementsRes.data.filter((m: any) => 
    m.producto_nombre.toLowerCase().includes(search.toLowerCase()) ||
    (m.referencia || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalIngresos = movementsRes.data.filter((m: any) => m.tipo_movimiento === 'INGRESO').reduce((acc: number, m: any) => acc + m.cantidad, 0);
  const totalSalidas  = movementsRes.data.filter((m: any) => m.tipo_movimiento === 'SALIDA').reduce((acc: number, m: any) => acc + m.cantidad, 0);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Kardex de Inventario" 
        subtitle={selectedProduct ? `Historial: ${selectedProduct.nombre}` : (dateRange.start ? "Movimientos filtrados" : "Movimientos registrados hoy")}
        icon={<History className="text-blue-600" />}
        action={
          <div className="flex gap-2">
            <Tooltip text="Se exportaran los datos visualizados en la tabla" position="top">
              <Button 
                variant="secondary" 
                size="sm" 
                icon={<Download size={16} />} 
                onClick={exportToExcel} 
                disabled={movementsRes.data.length === 0}
              >
                Exportar Excel
              </Button>
            </Tooltip>
            <Button variant="secondary" size="sm" onClick={loadAllMovements}>
              Ver Historial Completo
            </Button>
            {selectedProduct || dateRange.start || dateRange.end ? (
              <Button variant="ghost" size="sm" onClick={loadTodayMovements}>
                Resetear a Hoy
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Selección */}
        <aside className="lg:col-span-1 space-y-4">
          <Card className="p-4 overflow-visible">
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <Filter size={16} /> Seleccionar Producto
            </h4>
            <div className="space-y-4 relative">
              <div className="relative">
                <Input 
                  label="Buscar Producto" 
                  placeholder="Nombre o código..." 
                  icon={<Search size={18} />}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowProductList(true);
                  }}
                  onFocus={() => setShowProductList(true)}
                />
                {showProductList && search && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(p => (
                        <button
                          key={p.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-zinc-700 transition-colors"
                          onClick={() => handleSelectProduct(p)}
                        >
                          <p className="font-medium text-zinc-800 dark:text-white">{p.nombre}</p>
                          <p className="text-[10px] text-zinc-400">{p.codigo_barras}</p>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-zinc-400">No hay resultados</div>
                    )}
                  </div>
                )}
              </div>
              
              {selectedProduct ? (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Seleccionado</p>
                  <p className="text-sm font-bold text-zinc-800 dark:text-white truncate">{selectedProduct.nombre}</p>
                  <p className="text-xs text-zinc-500 mt-1">Stock Actual: <span className="font-bold text-blue-600">{selectedProduct.stock_actual}</span></p>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-zinc-100 dark:border-zinc-700 rounded-xl text-center">
                  <p className="text-xs text-zinc-400 italic">Filtrando por todos los productos</p>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-700">
                <h4 className="text-[10px] font-semibold text-zinc-400 uppercase mb-3 tracking-widest">Rango de Fechas</h4>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="fecha-desde" className="text-[10px] font-medium text-zinc-500 mb-1 block">DESDE</label>
                    <input 
                      id="fecha-desde"
                      type="date" 
                      className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="fecha-hasta" className="text-[10px] font-medium text-zinc-500 mb-1 block">HASTA</label>
                    <input 
                      id="fecha-hasta"
                      type="date" 
                      className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                  <Button fullWidth size="sm" onClick={handleFilter} className="mt-2">
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          
          {selectedProduct && (
            <Card className="p-4 bg-gradient-to-br from-blue-600 to-violet-700 text-white border-none shadow-lg shadow-blue-200 dark:shadow-none">
               <h4 className="text-xs font-semibold opacity-80 uppercase tracking-widest mb-3">Resumen de Movimientos</h4>
               <div className="space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="text-sm opacity-90 text-blue-100">Total Entradas</span>
                   <span className="font-bold">+{totalIngresos} un.</span>
                 </div>
                 <div className="flex justify-between items-center text-red-100">
                   <span className="text-sm opacity-90">Total Salidas</span>
                   <span className="font-bold">-{totalSalidas} un.</span>
                 </div>
                 <div className="pt-2 border-t border-white/20 flex justify-between items-center">
                   <span className="text-sm font-bold">Balance</span>
                   <span className="text-lg font-black">{totalIngresos - totalSalidas} un.</span>
                 </div>
               </div>
            </Card>
          )}
        </aside>

        {/* Tabla de Movimientos */}
        <main className="lg:col-span-3">
          <Card className="overflow-hidden">
            <DataTable 
              columns={columns} 
              data={filtered} 
              keyExtractor={(row) => row.id}
              serverSide={true}
              totalItems={movementsRes.total}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              emptyMessage={
                loading 
                  ? "Consultando movimientos..." 
                  : filterType === 'today'
                    ? "No se han registrado movimientos el día de hoy."
                    : filterType === 'all'
                      ? "El historial de movimientos está vacío."
                      : selectedProduct
                        ? `No hay movimientos para "${selectedProduct.nombre}" en este rango.`
                        : "Selecciona un producto o define un rango para filtrar el historial."
              }
            />
          </Card>
        </main>
      </div>
    </div>
  );
}
