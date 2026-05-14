import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, ShoppingBag, Trash2, Edit, TrendingUp, DollarSign, ShoppingCart, Plus, Minus, ArrowUpRight, Receipt, Calendar, Clock, User, CreditCard, Banknote, Printer } from 'lucide-react';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ventaService } from '../services/ventaService';
import { productoService } from '../services/productoService';
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
  
  // Estados para búsqueda de productos en el modal de edición
  const [prodSearch, setProdSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);
  const [selectedProd, setSelectedProd] = useState<any>(null);
  const [qty, setQty] = useState('1');
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [] } = useQuery({
    queryKey: ['products', true],
    queryFn: () => productoService.getAll(true)
  });

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
      const sale = sales.find(s => s.id === id);
      if (sale) {
        setEditingSale({ 
          ...sale, 
          igv_percent: sale.igv_porcentaje || 0
        });
        setEditItems(details);
      }
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      notificationService.success('Venta Actualizada', 'Los cambios se han guardado y el stock ha sido ajustado.');
      setEditingSale(null);
    }
  });

  const handleUpdateItemQuantity = (productoId: number, newQty: number) => {
    if (newQty <= 0) return;

    // Buscar el producto en la lista maestra para saber su stock actual
    const productInfo = products.find(p => p.id === productoId);
    if (!productInfo) return;

    // Buscar cuánta cantidad tenía originalmente este producto en esta venta
    const originalSaleData = sales.find(s => s.id === editingSale.id);
    // Necesitaríamos los items originales, pero como simplificación podemos usar el stock actual 
    // y sumarle lo que ya tenemos en el carrito de edición si es que vino de la DB
    
    // Para una validación perfecta, comparamos con el stock real disponible:
    // (Stock en DB + Stock que ya está en esta venta antes de editar)
    const originalItem = fetchEditDetailsMutation.data?.find((i: any) => i.producto_id === productoId);
    const oldQty = originalItem ? originalItem.cantidad : 0;
    const stockDisponibleReal = (productInfo.stock_actual || 0) + oldQty;

    if (newQty > stockDisponibleReal) {
      notificationService.warning(
        'Stock insuficiente', 
        `Solo tienes ${stockDisponibleReal} unidades disponibles de "${productInfo.nombre}" (incluyendo las de esta venta).`
      );
      return;
    }

    setEditItems(prev => prev.map(item => 
      item.producto_id === productoId ? { ...item, cantidad: newQty, subtotal: newQty * item.precio_unitario } : item
    ));
  };

  const handleAddItem = () => {
    if (!selectedProd || !qty) return;
    
    const cantidad = parseFloat(qty);
    const existing = editItems.find(i => i.producto_id === selectedProd.id);
    const totalQtySolicitada = existing ? existing.cantidad + cantidad : cantidad;

    // Validación de stock para producto nuevo o incremento
    const originalItem = fetchEditDetailsMutation.data?.find((i: any) => i.producto_id === selectedProd.id);
    const oldQty = originalItem ? originalItem.cantidad : 0;
    const stockDisponibleReal = (selectedProd.stock_actual || 0) + oldQty;

    if (totalQtySolicitada > stockDisponibleReal) {
      notificationService.warning(
        'Stock insuficiente', 
        `No puedes agregar esa cantidad. Stock disponible real: ${stockDisponibleReal}`
      );
      return;
    }
    
    if (existing) {
      handleUpdateItemQuantity(selectedProd.id, totalQtySolicitada);
    } else {
      setEditItems([...editItems, {
        producto_id: selectedProd.id,
        producto_nombre: selectedProd.nombre,
        cantidad: cantidad,
        precio_unitario: selectedProd.precio_venta,
        subtotal: cantidad * selectedProd.precio_venta
      }]);
    }
    
    setSelectedProd(null);
    setProdSearch('');
    setQty('1');
  };

  const handleRemoveItem = (productoId: number) => {
    if (editItems.length <= 1) {
      notificationService.warning('Acción no permitida', 'Una venta no puede quedar vacía. Cancela la venta si es necesario.');
      return;
    }
    setEditItems(prev => prev.filter(item => item.producto_id !== productoId));
  };

  const handleSaveEdit = () => {
    const itemsTotal = editItems.reduce((acc, item) => acc + item.subtotal, 0);
    const igvPercent = parseFloat(editingSale.igv_percent) || 0;
    
    // El IGV en soles se calcula basado en el porcentaje decidido por el usuario
    const igvAmount = Math.round((itemsTotal * (igvPercent / 100)) * 100) / 100;
    const finalTotal = Math.round((itemsTotal + igvAmount) * 100) / 100;
    const paidAmount = parseFloat(editingSale.monto_pagado) || 0;

    // Validación de monto suficiente
    if (paidAmount < finalTotal) {
      notificationService.warning(
        'Monto insuficiente', 
        `El monto pagado (S/ ${paidAmount.toFixed(2)}) no cubre el nuevo total de la venta (S/ ${finalTotal.toFixed(2)}).`
      );
      return;
    }

    const payload = {
      ...editingSale,
      total: finalTotal,
      igv: igvAmount,
      igv_porcentaje: igvPercent, // Nuevo campo persistente
      monto_pagado: paidAmount,
      vuelto: Math.round((paidAmount - finalTotal) * 100) / 100,
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

      {editingSale && (
        <Modal 
          title={`Editando Venta #${editingSale.id.toString().padStart(5, '0')}`} 
          onClose={() => setEditingSale(null)}
          maxWidth="2xl"
        >
          <div className="flex flex-col gap-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-center gap-3">
              <Edit className="text-amber-600" size={20} />
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                Al guardar los cambios, el stock de los productos se recalculará automáticamente. Esta acción quedará registrada en el historial de auditoría.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto Pagado (S/)</label>
                <input 
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  value={editingSale.monto_pagado} 
                  onChange={(e) => setEditingSale({ ...editingSale, monto_pagado: e.target.value })} 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Impuesto IGV (%)</label>
                <div className="relative">
                  <input 
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    value={editingSale.igv_percent} 
                    onChange={(e) => setEditingSale({ ...editingSale, igv_percent: e.target.value })} 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vuelto Calculado</label>
                <div className="w-full px-3 py-2 text-sm border border-transparent rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 font-black flex items-center">
                  S/ {Math.max(0, (parseFloat(editingSale.monto_pagado) || 0) - ( editItems.reduce((acc, item) => acc + item.subtotal, 0) * (1 + (parseFloat(editingSale.igv_percent) || 0) / 100) )).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <ShoppingBag size={16} /> Agregar productos a la venta
              </h3>
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-8 relative">
                  <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wider">Buscar Producto</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition uppercase" 
                      placeholder="Nombre o código de barras..." 
                      value={prodSearch}
                      onFocus={() => setShowProductList(true)}
                      onChange={(e) => {
                        setProdSearch(e.target.value.toUpperCase());
                        setShowProductList(true);
                      }}
                    />
                  </div>
                  {showProductList && (
                    <>
                      <div className="fixed inset-0 z-[5]" onClick={() => setShowProductList(false)}></div>
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-[60] max-h-40 overflow-y-auto py-1">
                        {products.filter(p => 
                          p.nombre.toLowerCase().includes(prodSearch.toLowerCase()) || 
                          (p.codigo_barras && p.codigo_barras.toLowerCase().includes(prodSearch.toLowerCase()))
                        ).length > 0 ? (
                          products.filter(p => 
                            p.nombre.toLowerCase().includes(prodSearch.toLowerCase()) || 
                            (p.codigo_barras && p.codigo_barras.toLowerCase().includes(prodSearch.toLowerCase()))
                          ).map(p => (
                            <button
                              key={p.id}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-gray-700 flex justify-between items-center"
                              onClick={() => {
                                setSelectedProd(p);
                                setProdSearch(p.nombre);
                                setShowProductList(false);
                                setTimeout(() => qtyInputRef.current?.focus(), 50);
                              }}
                            >
                              <div>
                                <span className="block font-medium">{p.nombre}</span>
                                <span className="text-[10px] text-gray-400">{p.codigo_barras}</span>
                              </div>
                               <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">S/ {(p.precio_venta ?? 0).toFixed(2)}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs text-gray-400 italic">No se encontraron productos</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wider">Cant.</label>
                  <input 
                    ref={qtyInputRef} 
                    type="number" 
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" 
                    placeholder="1" 
                    value={qty} 
                    onChange={(e) => setQty(e.target.value)} 
                  />
                </div>
                <div className="col-span-2">
                  <Button 
                    onClick={handleAddItem}
                    className="w-full h-[38px] p-0 flex items-center justify-center"
                    icon={<Plus size={20} />}
                  />
                </div>
              </div>
            </div>

            <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800/50">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold">Producto</th>
                    <th className="px-4 py-2 text-center font-bold">Cant.</th>
                    <th className="px-4 py-2 text-right font-bold">Precio</th>
                    <th className="px-4 py-2 text-right font-bold">Subtotal</th>
                    <th className="px-4 py-2 text-center font-bold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {editItems.map((item) => (
                    <tr key={item.producto_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                        {item.producto_nombre}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleUpdateItemQuantity(item.producto_id, item.cantidad - 1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-bold">{item.cantidad}</span>
                          <button 
                            onClick={() => handleUpdateItemQuantity(item.producto_id, item.cantidad + 1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">S/ {item.precio_unitario.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">S/ {item.subtotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => handleRemoveItem(item.producto_id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total y Acción Final */}
            <div className="flex items-center justify-between p-6 -mx-6 -mb-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 rounded-b-2xl mt-4">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total de Venta</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white">
                  S/ {(editItems.reduce((acc, item) => acc + item.subtotal, 0) * (1 + (parseFloat(editingSale.igv_percent) || 0) / 100)).toFixed(2)}
                </p>
                <div className="flex gap-3 text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  <span>Base: S/ {editItems.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2)}</span>
                  <span>IGV: S/ {(editItems.reduce((acc, item) => acc + item.subtotal, 0) * (parseFloat(editingSale.igv_percent) || 0) / 100).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setEditingSale(null)}
                  className="px-6 py-2.5 font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  isLoading={updateVentaMutation.isPending}
                  className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 border-none"
                  icon={<ArrowUpRight size={20} />}
                  iconPosition="right"
                >
                  Guardar Cambios
                </Button>
              </div>
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
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-gray-500 text-xs italic">IGV ({selectedSale.igv_porcentaje || 0}%):</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-gray-700 dark:text-gray-300">S/ {(selectedSale.igv || 0).toFixed(2)}</td>
                  </tr>
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
