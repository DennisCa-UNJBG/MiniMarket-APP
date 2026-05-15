import { useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
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

const columns: TableColumn<any>[] = [
  {
    key: 'fecha',
    header: 'Fecha y Hora',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(row.fecha + " UTC").toLocaleString()}
        </span>
      </div>
    ),
  },
  {
    key: 'producto_nombre',
    header: 'Producto',
    render: (row) => <span className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">{row.producto_nombre}</span>,
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
      const { variant } = config[type] || { variant: 'indigo', icon: null };
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
        <span className="text-sm font-medium text-gray-800 dark:text-white line-clamp-1">{row.referencia}</span>
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
      <span className="font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
        {row.saldo_posterior}
      </span>
    ),
  },
  {
    key: 'usuario_nombre',
    header: 'Usuario',
    render: (row) => <span className="text-xs text-gray-500">{row.usuario_nombre}</span>,
  },
];

export function Kardex() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterType, setFilterType] = useState<'today' | 'all' | 'filtered'>('today');

  // Queries
  const { data: products = [] } = useQuery({
    queryKey: ['products', true],
    queryFn: () => productoService.getAll(true)
  });

  const { data: movements = [], isLoading: loading } = useQuery({
    queryKey: ['movements', filterType, selectedProduct?.id, dateRange.start, dateRange.end],
    queryFn: () => {
      if (filterType === 'today') return inventarioService.getMovimientosDia();
      if (filterType === 'all') return inventarioService.getMovimientosFiltrados({});
      return inventarioService.getMovimientosFiltrados({
        productoId: selectedProduct?.id,
        fechaInicio: dateRange.start,
        fechaFin: dateRange.end
      });
    }
  });

  const loadTodayMovements = () => {
    setFilterType('today');
    setSelectedProduct(null);
    setDateRange({ start: '', end: '' });
  };

  const loadAllMovements = () => {
    setFilterType('all');
    setSelectedProduct(null);
    setDateRange({ start: '', end: '' });
  };

  const handleFilter = () => {
    setFilterType('filtered');
  };

  const exportToExcel = () => {
    if (movements.length === 0) return;
    
    const headers = ['Fecha', 'Producto', 'Tipo', 'Referencia', 'Cantidad', 'Saldo Resultante', 'Usuario'];
    
    // Generamos una tabla HTML que Excel interpreta perfectamente como hoja de cálculo
    let table = `<table border="1">`;
    // Encabezados con estilo
    table += `<tr style="background-color: #4f46e5; color: white; font-weight: bold;">`;
    headers.forEach(h => table += `<th style="padding: 10px;">${h}</th>`);
    table += `</tr>`;
    
    // Filas de datos
    movements.forEach(m => {
      table += `<tr>`;
      table += `<td style="padding: 5px;">${new Date(m.fecha + " UTC").toLocaleString()}</td>`;
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
    const fileName = `kardex_${new Date().toISOString().split('T')[0]}.xls`;
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
  };

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(search.toLowerCase()) || 
    (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search.toLowerCase()))
  );

  const entradas = movements.filter(m => m.tipo_movimiento === 'INGRESO').reduce((acc, m) => acc + m.cantidad, 0);
  const salidas = movements.filter(m => m.tipo_movimiento === 'SALIDA').reduce((acc, m) => acc + m.cantidad, 0);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Kardex de Inventario" 
        subtitle={selectedProduct ? `Historial: ${selectedProduct.nombre}` : (dateRange.start ? "Movimientos filtrados" : "Movimientos registrados hoy")}
        icon={<History className="text-indigo-600" />}
        action={
          <div className="flex gap-2">
            <Tooltip text="Se exportaran los datos visualizados en la tabla" position="top">
              <Button 
                variant="secondary" 
                size="sm" 
                icon={<Download size={16} />} 
                onClick={exportToExcel} 
                disabled={movements.length === 0}
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
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
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
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(p => (
                        <button
                          key={p.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => handleSelectProduct(p)}
                        >
                          <p className="font-medium text-gray-800 dark:text-white">{p.nombre}</p>
                          <p className="text-[10px] text-gray-400">{p.codigo_barras}</p>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-400">No hay resultados</div>
                    )}
                  </div>
                )}
              </div>
              
              {selectedProduct ? (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">Seleccionado</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{selectedProduct.nombre}</p>
                  <p className="text-xs text-gray-500 mt-1">Stock Actual: <span className="font-bold text-indigo-600">{selectedProduct.stock_actual}</span></p>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl text-center">
                  <p className="text-xs text-gray-400 italic">Filtrando por todos los productos</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest">Rango de Fechas</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 mb-1 block">DESDE</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 mb-1 block">HASTA</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
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
            <Card className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-lg shadow-indigo-200 dark:shadow-none">
               <h4 className="text-xs font-bold opacity-80 uppercase tracking-widest mb-3">Resumen de Movimientos</h4>
               <div className="space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="text-sm opacity-90 text-indigo-100">Total Entradas</span>
                   <span className="font-bold">+{entradas} un.</span>
                 </div>
                 <div className="flex justify-between items-center text-red-100">
                   <span className="text-sm opacity-90">Total Salidas</span>
                   <span className="font-bold">-{salidas} un.</span>
                 </div>
                 <div className="pt-2 border-t border-white/20 flex justify-between items-center">
                   <span className="text-sm font-bold">Balance</span>
                   <span className="text-lg font-black">{entradas - salidas} un.</span>
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
              data={movements} 
              keyExtractor={(row) => row.id}
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
