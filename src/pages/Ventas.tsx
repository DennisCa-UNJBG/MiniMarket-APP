import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ShoppingCart, Plus, Receipt, TrendingUp, DollarSign, Calendar, Clock, User, CreditCard, Banknote, Printer, Edit, Trash2 } from 'lucide-react';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ventaService } from '../services/ventaService';
import { Voucher } from '../components/shared/Voucher';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../lib/notifications';
import { EmptyState } from '../components/ui/EmptyState';
import { Tooltip } from '../components/ui/Tooltip';
import { Button } from '../components/ui/Button';
import { useQueryClient } from '@tanstack/react-query';
import { esRegistroEditable } from '../lib/dateUtils';

const getColumns = (onViewDetail: (sale: any) => void, onEdit: (sale: any) => void): TableColumn<any>[] => [
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
      <div className="flex items-center justify-end gap-2">
        {esRegistroEditable(row.fecha) ? (
          <Tooltip text="Editar Venta" position="top-right">
            <Button 
              onClick={() => onEdit(row)}
              variant="warning"
              size="sm"
              icon={<Edit size={14} />}
              className="p-2 min-w-[36px] h-[36px] flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:border-amber-900/30"
            />
          </Tooltip>
        ) : (
          <Tooltip text="Edición deshabilitada (pasaron 12h)" position="top-right">
            <div 
              className="p-2 text-gray-400 cursor-not-allowed opacity-50"
            >
              <Edit size={14} />
            </div>
          </Tooltip>
        )}
        <Tooltip text="Ver Boleta" position="top-right">
          <Button 
            onClick={() => onViewDetail(row)}
            variant="ghost"
            size="sm"
            icon={<Receipt size={13} />}
            className="text-[10px] font-bold uppercase tracking-tighter text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800"
          >
            Ver Boleta
          </Button>
        </Tooltip>
      </div>
    ),
  },
];

export function Ventas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [saleDetails, setSaleDetails] = useState<any[]>([]);

  // Estado para Edición
  const [editingSale, setEditingSale] = useState<any>(null);
  const [editItems, setEditItems] = useState<any[]>([]);

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

  const fetchEditDetailsMutation = useMutation({
    mutationFn: (id: number) => ventaService.getVentaDetalles(id),
    onSuccess: (details, id) => {
      setEditItems(details);
      setEditingSale(sales.find(s => s.id === id));
    }
  });

  const handleViewDetail = (sale: any) => {
    fetchDetailsMutation.mutate(sale.id);
  };

  const handleEdit = (sale: any) => {
    fetchEditDetailsMutation.mutate(sale.id);
  };

  const handlePrint = () => {
    if (!selectedSale) return;
    window.print();
  };

  const updateVentaMutation = useMutation({
    mutationFn: (payload: any) => ventaService.actualizarVenta(editingSale.id, payload, user?.id || 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
      notificationService.success('Venta Actualizada', 'Los cambios se han guardado y el stock ha sido ajustado.');
      setEditingSale(null);
    }
  });

  const handleUpdateItemQuantity = (productoId: number, newQty: number) => {
    if (newQty <= 0) return;
    setEditItems(prev => prev.map(item => 
      item.producto_id === productoId ? { ...item, cantidad: newQty, subtotal: newQty * item.precio_unitario } : item
    ));
  };

  const handleRemoveItem = (productoId: number) => {
    if (editItems.length <= 1) {
      notificationService.warning('Acción no permitida', 'Una venta no puede quedar vacía. Cancela la venta si es necesario.');
      return;
    }
    setEditItems(prev => prev.filter(item => item.producto_id !== productoId));
  };

  const handleSaveEdit = () => {
    const total = editItems.reduce((acc, item) => acc + item.subtotal, 0);
    // Para simplificar, asumimos que el monto pagado sigue siendo el mismo o se ajusta al total
    const payload = {
      ...editingSale,
      total,
      items: editItems
    };
    updateVentaMutation.mutate(payload);
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
          <Button
            id="new-sale-btn"
            onClick={() => navigate('/nueva-venta')}
            icon={<Plus size={16} />}
          >
            Nueva venta
          </Button>
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
        columns={getColumns(handleViewDetail, handleEdit)}
        data={filtered}
        keyExtractor={(row) => row.id}
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

      {/* Modal de Edición de Venta */}
      {editingSale && (
        <Modal
          onClose={() => setEditingSale(null)}
          title={`Editando Venta #${editingSale.id.toString().padStart(5, '0')}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-center gap-3">
              <Edit className="text-amber-600" size={20} />
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                Al guardar los cambios, el stock de los productos se recalculará automáticamente. Esta acción quedará registrada en el historial de auditoría.
              </p>
            </div>

            <div className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">Producto</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase text-center">Cant.</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase text-right">Precio</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase text-right">Subtotal</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {editItems.map((item) => (
                    <tr key={item.producto_id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">{item.producto_nombre}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="secondary"
                            size="sm"
                            className="w-6 h-6 p-0 rounded-lg"
                            onClick={() => handleUpdateItemQuantity(item.producto_id, item.cantidad - 1)}
                          >-</Button>
                          <span className="text-sm font-bold w-8 text-center">{item.cantidad}</span>
                          <Button 
                            variant="secondary"
                            size="sm"
                            className="w-6 h-6 p-0 rounded-lg"
                            onClick={() => handleUpdateItemQuantity(item.producto_id, item.cantidad + 1)}
                          >+</Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">S/ {item.precio_unitario.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-right">S/ {item.subtotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <Tooltip text="Eliminar ítem" position="top-right">
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            onClick={() => handleRemoveItem(item.producto_id)}
                            icon={<Trash2 size={14} />}
                          />
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50/50 dark:bg-gray-700/20 font-black">
                    <td colSpan={3} className="px-4 py-4 text-right text-sm">NUEVO TOTAL:</td>
                    <td className="px-4 py-4 text-right text-lg text-indigo-600 dark:text-indigo-400">
                      S/ {editItems.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button
                variant="ghost"
                onClick={() => setEditingSale(null)}
                className="text-gray-500 font-bold"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                isLoading={updateVentaMutation.isPending}
                className="px-8 font-bold"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
                className="font-bold shadow-lg shadow-indigo-200 dark:shadow-none"
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
