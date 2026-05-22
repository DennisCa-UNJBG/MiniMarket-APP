import { useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Plus,
  Receipt,
  Calendar,
  Clock,
  User,
  CreditCard,
  Banknote,
  Printer,
  CircleSlash2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, type TableColumn } from '../../shared/components/ui/DataTable';
import { PageHeader } from '../../shared/components/ui/PageHeader';
import { Badge } from '../../shared/components/ui/Badge';
import { Modal } from '../../shared/components/ui/Modal';
import { ventaService } from './Service';
import { Voucher } from './components/Voucher';
import { notificationService } from '../../shared/lib/notifications';
import { EmptyState } from '../../shared/components/ui/EmptyState';
import { Tooltip } from '../../shared/components/ui/Tooltip';
import { Button } from '../../shared/components/ui/Button';
import { dateUtils } from '../../shared/lib/dateUtils';

const formatDate = (dateStr: string) => {
  return dateUtils.formatUTCtoLocalDateString(dateStr);
};

const formatTime = (dateStr: string) => {
  return dateUtils.formatUTCtoLocalTimeString(dateStr);
};

const getColumns = (onViewDetail: (sale: any) => void, onAnular: (sale: any) => void): TableColumn<any>[] => [
  {
    key: 'id',
    header: 'N° Venta',
    render: (row) => (
      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
        #{row.id.toString().padStart(5, '0')}
      </span>
    ),
  },
  {
    key: 'fecha',
    header: 'Fecha / Hora',
    render: (row) => (
      <div className="flex flex-col">
        <span suppressHydrationWarning className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
          <Calendar size={10} /> {dateUtils.formatUTCtoLocalDateString(row.fecha)}
        </span>
        <span suppressHydrationWarning className="text-[10px] text-zinc-400 flex items-center gap-1">
          <Clock size={10} /> {dateUtils.formatUTCtoLocalTimeString(row.fecha)}
        </span>
      </div>
    )
  },
  {
    key: 'usuario_nombre',
    header: 'Cajero',
    render: (row) => (
      <span className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
        <User size={12} /> {row.usuario_nombre}
      </span>
    )
  },
  {
    key: 'metodo_pago',
    header: 'Pago',
    render: (row) => (
      <div className="flex items-center gap-1">
        {row.metodo_pago === 'EFECTIVO' ? <Banknote size={12} className="text-emerald-500" /> : <CreditCard size={12} className="text-blue-500" />}
        <span className="text-[10px] font-bold uppercase tracking-wider">{row.metodo_pago}</span>
      </div>
    )
  },
  {
    key: 'items_count',
    header: 'Ítems',
    align: 'center',
    render: (row) => <Badge label={row.items_count} variant="blue" />
  },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    render: (row) => (
      <span className="font-bold text-zinc-900 dark:text-white">S/ {row.total.toFixed(2)}</span>
    ),
  },
  {
    key: 'estado',
    header: 'Estado',
    render: (row) => (
      <Badge
        label={row.estado === 'anulado' ? 'ANULADO' : 'COMPLETADO'}
        variant={row.estado === 'anulado' ? 'red' : 'emerald'}
      />
    )
  },
  {
    key: 'acciones',
    header: '',
    align: 'right',
    render: (row) => (
      <div className="flex items-center justify-end gap-2">
        {row.estado !== 'anulado' && (
          <Tooltip text="Anular Venta" position="top-right">
            <Button
              onClick={() => onAnular(row)}
              variant="ghost"
              size="sm"
              icon={<CircleSlash2 size={14} />}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            />
          </Tooltip>
        )}
        <Tooltip text="Ver Boleta" position="top-right">
          <Button
            onClick={() => onViewDetail(row)}
            variant="ghost"
            size="sm"
            icon={<Receipt size={13} />}
            className="text-[10px] font-bold uppercase tracking-tighter text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
          >
            Ver Boleta
          </Button>
        </Tooltip>
      </div>
    ),
  },
];

interface VentasState {
  page: number;
  pageSize: number;
  search: string;
  selectedSale: any;
  saleDetails: any[];
}

type VentasAction =
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_SELECTED_SALE'; payload: any }
  | { type: 'SET_SALE_DETAILS'; payload: any[] };

const initialVentasState: VentasState = {
  page: 1,
  pageSize: 10,
  search: '',
  selectedSale: null,
  saleDetails: []
};

function ventasReducer(state: VentasState, action: VentasAction): VentasState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload };
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_SELECTED_SALE':
      return { ...state, selectedSale: action.payload };
    case 'SET_SALE_DETAILS':
      return { ...state, saleDetails: action.payload };
    default:
      return state;
  }
}

export function Ventas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [state, dispatch] = useReducer(ventasReducer, initialVentasState);

  const { page, pageSize, search, selectedSale, saleDetails } = state;

  const setPage = (payload: number) => dispatch({ type: 'SET_PAGE', payload });
  const setPageSize = (payload: number) => dispatch({ type: 'SET_PAGE_SIZE', payload });
  const setSearch = (payload: string) => dispatch({ type: 'SET_SEARCH', payload });
  const setSelectedSale = (payload: any) => dispatch({ type: 'SET_SELECTED_SALE', payload });
  const setSaleDetails = (payload: any[]) => dispatch({ type: 'SET_SALE_DETAILS', payload });

  // Queries
  const yesterday = dateUtils.getYesterdayLocal();

  const { data: salesRes = { data: [], total: 0 } } = useQuery({
    queryKey: ['sales', page, pageSize],
    queryFn: () => ventaService.getVentas(page, pageSize)
  });

  const { data: resumen = { total: 0, count: 0 } } = useQuery({
    queryKey: ['sales-summary'],
    queryFn: () => ventaService.getResumenHoy()
  });

  const { data: resumenAyer = { total: 0, count: 0 } } = useQuery({
    queryKey: ['sales-summary-yesterday', yesterday],
    queryFn: () => ventaService.getResumenRango(yesterday, yesterday)
  });

  const fetchDetailsMutation = useMutation({
    mutationFn: (id: number) => ventaService.getVentaDetalles(id),
    onSuccess: (details, id) => {
      queryClient.setQueryData(['sale-details', id], details);
      setSaleDetails(details);
      setSelectedSale(salesRes.data.find((s: any) => s.id === id));
    }
  });

  const annulVentaMutation = useMutation({
    mutationFn: (id: number) => ventaService.anularVenta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      notificationService.successWithConfirm('Venta Anulada', 'El stock ha sido revertido y el movimiento eliminado del kardex.');
    }
  });

  const handleViewDetail = (sale: any) => {
    fetchDetailsMutation.mutate(sale.id);
  };

  const handleAnular = async (sale: any) => {
    const ok = await notificationService.confirm(
      '¿Anular venta?',
      `¿Estás seguro de anular la venta #${sale.id}? Esta acción revertirá el stock de los productos y anulará el registro del Kardex.`
    );

    if (ok) {
      annulVentaMutation.mutate(sale.id);
    }
  };

  const handlePrint = () => {
    if (!selectedSale) return;
    window.print();
  };

  const filtered = salesRes.data.filter((s: any) =>
    s.id.toString().includes(search.toLowerCase()) ||
    (s.estado || '').toLowerCase().includes(search.toLowerCase())
  );

  // Cálculo de crecimiento real vs ayer
  const crecimientoValor = resumenAyer.total === 0
    ? (resumen.total > 0 ? 100 : 0)   // si ayer fue 0 y hoy hay ventas => +100%
    : ((resumen.total - resumenAyer.total) / resumenAyer.total) * 100;
  const crecimientoLabel = `${crecimientoValor >= 0 ? '+' : ''}${crecimientoValor.toFixed(1)}%`;
  const crecimientoPositivo = crecimientoValor >= 0;

  const summaryCards = [
    { label: 'Ventas de hoy', value: `S/ ${resumen.total.toFixed(2)}`, sub: `${resumen.count} transacciones`, icon: ShoppingCart, color: 'bg-blue-500', up: true },
    { label: 'Crecimiento vs Ayer', value: crecimientoLabel, sub: `Ayer: S/ ${resumenAyer.total.toFixed(2)}`, icon: TrendingUp, color: crecimientoPositivo ? 'bg-emerald-500' : 'bg-rose-500', up: crecimientoPositivo },
    { label: 'Promedio Ticket', value: `S/ ${(resumen.total / (resumen.count || 1)).toFixed(2)}`, sub: 'por venta', icon: DollarSign, color: 'bg-amber-500', up: true },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ventas"
        subtitle="Historial de ventas realizadas"
        action={
          <Button
            id="new-sale-btn"
            onClick={() => navigate('/nueva-venta')}
            icon={<Plus size={16} />}
          >
            Nueva venta
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center gap-4">
            <div className={`${color} p-3 rounded-xl flex-shrink-0`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
              <p className="text-lg font-bold text-zinc-800 dark:text-white">{value}</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <input
            id="search-sales"
            type="text"
            placeholder="Buscar por N° de venta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        </div>
      </div>

      <DataTable
        columns={getColumns(handleViewDetail, handleAnular)}
        data={filtered}
        keyExtractor={(row) => row.id}
        serverSide={true}
        totalItems={salesRes.total}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        emptyState={
          <EmptyState
            icon={ShoppingCart}
            title="Sin ventas registradas"
            description={search ? `No se encontró ninguna venta con el número "${search}".` : "No hay ventas registradas todavía. Crea una nueva venta para empezar."}
            action={
              !search ? (
                <Button
                  onClick={() => navigate('/nueva-venta')}
                >
                  Crear mi primera venta
                </Button>
              ) : undefined
            }
          />
        }
      />



      {/* Modal de Detalle de Venta */}
      {selectedSale && (
        <Modal
          onClose={() => setSelectedSale(null)}
          title={`Detalle de Venta #${selectedSale.id.toString().padStart(5, '0')}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Cabecera del Detalle */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Fecha</p>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{formatDate(selectedSale.fecha)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Hora</p>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{formatTime(selectedSale.fecha)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Cajero</p>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{selectedSale.usuario_nombre}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Pago</p>
                <Badge label={selectedSale.metodo_pago} variant={selectedSale.metodo_pago === 'EFECTIVO' ? 'emerald' : 'blue'} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Estado</p>
                <Badge
                  label={selectedSale.estado === 'anulado' ? 'ANULADO' : 'COMPLETADO'}
                  variant={selectedSale.estado === 'anulado' ? 'red' : 'emerald'}
                />
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Cliente</p>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate">
                  {selectedSale.cliente_nombre ? `${selectedSale.cliente_nombre} (${selectedSale.cliente_dni_ruc || 'S/D'})` : 'Público en General'}
                </p>
              </div>
            </div>

            {/* Tabla de Items */}
            <div className="border border-zinc-100 dark:border-zinc-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-50 dark:bg-zinc-700/50">
                  <tr>
                    <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase">Producto</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase text-center">Cant.</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase text-right">Precio</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700">
                  {saleDetails.map((det) => (
                    <tr key={det.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 font-medium">{det.producto_nombre}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 text-center">{det.cantidad} {det.unidad_medida}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 text-right">S/ {det.precio_unitario.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white font-bold text-right">S/ {det.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-50/50 dark:bg-zinc-700/20">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">IGV ({selectedSale.igv_porcentaje || 0}%):</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-zinc-700 dark:text-zinc-300">S/ {(selectedSale.igv || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">Subtotal items:</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-zinc-700 dark:text-zinc-300">S/ {selectedSale.total.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">Monto Pagado:</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">S/ {(selectedSale.monto_pagado || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">Vuelto entregado:</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-orange-600 dark:text-orange-400">S/ {(selectedSale.vuelto || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="bg-blue-50/30 dark:bg-blue-900/10">
                    <td colSpan={3} className="p-4 text-right font-black text-zinc-700 dark:text-zinc-200 text-sm uppercase tracking-tighter">Total Final:</td>
                    <td className="p-4 text-right text-xl font-black text-blue-600 dark:text-blue-400">S/ {selectedSale.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-700">
              <Button
                variant="secondary"
                onClick={() => setSelectedSale(null)}
                className="font-bold"
              >
                Cerrar
              </Button>
              <Button
                onClick={handlePrint}
                icon={<Printer size={18} />}
                className="font-bold shadow-lg shadow-blue-200 dark:shadow-none"
              >
                Imprimir Boleta
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Componente de Voucher (Solo visible al imprimir) */}
      {selectedSale && (
        <Voucher venta={selectedSale} detalles={saleDetails} />
      )}
    </div>
  );
}
