import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ShoppingCart, Plus, Receipt, TrendingUp, DollarSign, Calendar, Clock, User, CreditCard, Banknote, Printer } from 'lucide-react';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ventaService } from '../services/ventaService';
import { Voucher } from '../components/shared/Voucher';

const getColumns = (onViewDetail: (sale: any) => void): TableColumn<any>[] => [
  {
    key: 'id',
    header: 'N° Venta',
    render: (row) => (
      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
        #{row.id.toString().padStart(5, '0')}
      </span>
    ),
  },
  { 
    key: 'fecha',    
    header: 'Fecha / Hora',
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <Calendar size={10} /> {new Date(row.fecha + " UTC").toLocaleDateString()}
        </span>
        <span className="text-[10px] text-gray-400 flex items-center gap-1">
          <Clock size={10} /> {new Date(row.fecha + " UTC").toLocaleTimeString()}
        </span>
      </div>
    )
  },
  { 
    key: 'usuario_nombre', 
    header: 'Cajero',
    render: (row) => (
      <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
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
    render: (row) => <Badge label={row.items_count} variant="indigo" />
  },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    render: (row) => (
      <span className="font-bold text-gray-900 dark:text-white">S/ {row.total.toFixed(2)}</span>
    ),
  },
  {
    key: 'acciones',
    header: '',
    align: 'right',
    render: (row) => (
      <button 
        onClick={() => onViewDetail(row)}
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800 transition-all"
      >
        <Receipt size={13} /> Ver Boleta
      </button>
    ),
  },
];

export function Ventas() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [saleDetails, setSaleDetails] = useState<any[]>([]);

  // Queries
  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => ventaService.getVentas()
  });

  const { data: resumen = { total: 0, count: 0 } } = useQuery({
    queryKey: ['sales-summary'],
    queryFn: () => ventaService.getResumenHoy()
  });

  const fetchDetailsMutation = useMutation({
    mutationFn: (id: number) => ventaService.getVentaDetalles(id),
    onSuccess: (details, id) => {
      setSaleDetails(details);
      setSelectedSale(sales.find(s => s.id === id));
    }
  });

  const handleViewDetail = (sale: any) => {
    fetchDetailsMutation.mutate(sale.id);
  };

  const handlePrint = () => {
    if (!selectedSale) return;
    window.print();
  };

  const filtered = sales.filter((s) => s.id.toString().includes(search.toLowerCase()));

  const summaryCards = [
    { label: 'Ventas de hoy',   value: `S/ ${resumen.total.toFixed(2)}`, sub: `${resumen.count} transacciones`,   icon: ShoppingCart, color: 'bg-indigo-500' },
    { label: 'Total Histórico', value: `S/ ${sales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}`, sub: 'Cargadas en lista', icon: TrendingUp,   color: 'bg-emerald-500' },
    { label: 'Ticket promedio', value: `S/ ${(resumen.total / (resumen.count || 1)).toFixed(2)}`, sub: 'Ventas de hoy', icon: DollarSign,   color: 'bg-sky-500' },
  ];

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
        columns={getColumns(handleViewDetail)}
        data={filtered}
        keyExtractor={(row) => row.id}
        emptyMessage="No se encontraron ventas registradas."
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fecha</p>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{new Date(selectedSale.fecha + " UTC").toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hora</p>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{new Date(selectedSale.fecha + " UTC").toLocaleTimeString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cajero</p>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{selectedSale.usuario_nombre}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pago</p>
                <Badge label={selectedSale.metodo_pago} variant={selectedSale.metodo_pago === 'EFECTIVO' ? 'emerald' : 'indigo'} />
              </div>
            </div>

            {/* Tabla de Items */}
            <div className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">Producto</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase text-center">Cant.</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase text-right">Precio</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {saleDetails.map((det) => (
                    <tr key={det.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 font-medium">{det.producto_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-center">{det.cantidad} {det.unidad_medida}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">S/ {det.precio_unitario.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-bold text-right">S/ {det.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50/50 dark:bg-gray-700/20">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-gray-500 text-xs italic">Subtotal items:</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-gray-700 dark:text-gray-300">S/ {selectedSale.total.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-gray-500 text-xs italic">Monto Pagado:</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">S/ {(selectedSale.monto_pagado || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-gray-500 text-xs italic">Vuelto entregado:</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-orange-600 dark:text-orange-400">S/ {(selectedSale.vuelto || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="bg-indigo-50/30 dark:bg-indigo-900/10">
                    <td colSpan={3} className="px-4 py-4 text-right font-black text-gray-700 dark:text-gray-200 text-sm uppercase tracking-tighter">Total Final:</td>
                    <td className="px-4 py-4 text-right text-xl font-black text-indigo-600 dark:text-indigo-400">S/ {selectedSale.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setSelectedSale(null)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-xl transition-all"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                <Printer size={18} /> Imprimir Boleta
              </button>
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
