import { useState, useRef } from 'react';
import { Plus, Truck, Search, Calendar, FileText, Trash2, ShoppingBag, ArrowUpRight, Edit2, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Tooltip } from '../components/ui/Tooltip';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { inventarioService, type CompraDetalle } from '../services/inventarioService';
import { productoService, type Product } from '../services/productoService';
import { notificationService } from '../lib/notifications';
import { useAuth } from '../contexts/AuthContext';
import { esRegistroEditable } from '../lib/dateUtils';

interface PurchaseRecord {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  fecha: string;
  documento_referencia: string;
  total: number;
}

interface CartItem extends CompraDetalle {
  nombre: string;
  codigo: string;
}

export function Compras() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  
  // --- Estado para el Detalle de Compra ---
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null);
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null);
  
  // --- Estado para el Lote de Compra ---
  const [referencia, setReferencia] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hasIGV, setHasIGV] = useState(false);
  const [igvPercent, setIgvPercent] = useState(18);
  
  // Selector de producto individual
  const [prodSearch, setProdSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);
  const [selectedProd, setSelectedProd] = useState<Product | null>(null);
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => inventarioService.getCompras(50)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', true],
    queryFn: () => productoService.getAll(true)
  });

  const { data: purchaseDetails = [] } = useQuery({
    queryKey: ['purchase-details', selectedPurchase?.id],
    queryFn: () => inventarioService.getCompraDetalle(selectedPurchase!.id),
    enabled: !!selectedPurchase
  });

  // Mutations
  const savePurchaseMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingPurchaseId) {
        return inventarioService.actualizarCompraCompleta(editingPurchaseId, data);
      } else {
        return inventarioService.registrarCompraCompleta(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      notificationService.success(
        editingPurchaseId ? 'Compra actualizada' : 'Compra completada', 
        editingPurchaseId ? 'Los cambios se han guardado correctamente.' : 'Se ha actualizado el stock y el historial correctamente.'
      );

      setShowModal(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setCart([]);
    setReferencia('');
    setHasIGV(false);
    setEditingPurchaseId(null);
    setEditingCartIndex(null);
    setSelectedProd(null);
    setProdSearch('');
    setQty('');
    setCost('');
  };

  const addToCart = () => {
    if (!selectedProd || !qty || !cost) {
      notificationService.warning('Campos incompletos', 'Indica producto, cantidad y costo.');
      return;
    }

    const newItem: CartItem = {
      producto_id: selectedProd.id,
      nombre: selectedProd.nombre,
      codigo: selectedProd.codigo_barras,
      cantidad: parseFloat(qty),
      costo_unitario: parseFloat(cost)
    };

    if (editingCartIndex !== null) {
      const newCart = [...cart];
      newCart[editingCartIndex] = newItem;
      setCart(newCart);
      setEditingCartIndex(null);
    } else {
      setCart([...cart, newItem]);
    }
    
    // Reset selector
    setSelectedProd(null);
    setProdSearch('');
    setQty('');
    setCost('');
  };

  const editCartItem = (index: number) => {
    const item = cart[index];
    setSelectedProd(products.find(p => p.id === item.producto_id) || null);
    setProdSearch(item.nombre);
    setQty(item.cantidad.toString());
    setCost(item.costo_unitario.toString());
    setEditingCartIndex(index);
    setTimeout(() => qtyInputRef.current?.focus(), 50);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalSinIGV = cart.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);
  const igvAmount = hasIGV ? (totalSinIGV * (igvPercent / 100)) : 0;
  const totalFinal = totalSinIGV + igvAmount;

  const handleConfirmarCompra = () => {
    if (!referencia.trim()) {
      notificationService.warning('Documento requerido', 'Debes ingresar el número de boleta, factura o referencia de la compra.');
      return;
    }

    if (cart.length === 0) {
      notificationService.warning('Carrito vacío', 'Agrega al menos un producto a la compra.');
      return;
    }

    const purchaseData = {
      usuario_id: user?.id || 1,
      documento_referencia: referencia.trim(),
      items: cart.map(({ producto_id, cantidad, costo_unitario }) => ({
        producto_id,
        cantidad,
        costo_unitario: hasIGV ? costo_unitario * (1 + (igvPercent / 100)) : costo_unitario
      }))
    };

    savePurchaseMutation.mutate(purchaseData);
  };

  const fetchDetailsMutation = useMutation({
    mutationFn: (id: number) => inventarioService.getCompraDetalle(id),
    onSuccess: (details, id) => {
      const purchase = purchases.find(p => p.id === id);
      if (!purchase) return;
      
      setReferencia(purchase.documento_referencia);
      setCart(details.map(d => ({
        producto_id: d.producto_id,
        nombre: d.producto_nombre,
        codigo: d.codigo_barras,
        cantidad: d.cantidad,
        costo_unitario: d.costo_unitario
      })));
      setEditingPurchaseId(purchase.id);
      setHasIGV(false);
      setShowModal(true);
    }
  });

  const handleEdit = (purchase: PurchaseRecord) => {
    fetchDetailsMutation.mutate(purchase.id);
  };

  const handleViewDetail = (purchase: PurchaseRecord) => {
    setSelectedPurchase(purchase);
    setShowDetailModal(true);
  };

  const columns: TableColumn<PurchaseRecord>[] = [
    {
      key: 'id',
      header: 'N° Compra',
      render: (row) => <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">#{row.id.toString().padStart(4, '0')}</span>,
    },
    { 
      key: 'fecha', 
      header: 'Fecha',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-800 dark:text-gray-200">{new Date(row.fecha + " UTC").toLocaleDateString()}</span>
          <span className="text-[10px] text-gray-400">{new Date(row.fecha + " UTC").toLocaleTimeString()}</span>
        </div>
      )
    },
    { 
      key: 'documento_referencia', 
      header: 'Documento',
      render: (row) => <Badge label={row.documento_referencia || 'Sin ref.'} variant="indigo" />
    },
    { 
      key: 'usuario_nombre', 
      header: 'Responsable',
      render: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{row.usuario_nombre}</span>
    },
    {
      key: 'total',
      header: 'Total Invertido',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-gray-800 dark:text-white">S/ {row.total.toFixed(2)}</span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex items-center gap-3 justify-end">
          <Tooltip text="Ver detalle de la compra" position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetail(row)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline p-0 h-auto"
            >
              Ver detalle
            </Button>
          </Tooltip>
          {esRegistroEditable(row.fecha) ? (
            <Tooltip text="Editar compra" position="top-right">
              <Button 
                variant="ghost"
                size="sm"
                icon={<Edit2 size={14} />}
                onClick={() => handleEdit(row)}
                className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              />
            </Tooltip>
          ) : (
            <Tooltip text="Edición deshabilitada (pasaron 12h)" position="top-right">
              <div 
                className="p-1.5 text-gray-400 cursor-not-allowed opacity-50"
              >
                <Edit2 size={14} />
              </div>
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestión de Compras"
        subtitle="Registro masivo de mercadería e inversión"
        action={
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            icon={<Plus size={16} />}
          >
            Registrar Nueva Compra
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-500 p-3 rounded-xl flex-shrink-0">
            <Truck size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Compras</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">{purchases.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-xl flex-shrink-0">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Inversión Total</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              S/ {purchases.reduce((acc, p) => acc + p.total, 0).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="bg-amber-500 p-3 rounded-xl flex-shrink-0">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Compras del Mes</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {purchases.filter(p => new Date(p.fecha).getMonth() === new Date().getMonth()).length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex justify-between items-center">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por documento o responsable..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={purchases.filter(p => (p.documento_referencia || '').toLowerCase().includes(search.toLowerCase()) || p.usuario_nombre.toLowerCase().includes(search.toLowerCase()))}
        keyExtractor={(row) => row.id}
        emptyMessage="No se encontraron registros de compras."
      />

      {showModal && (
        <Modal title={editingPurchaseId ? `Editando Compra #${editingPurchaseId.toString().padStart(4, '0')}` : "Registrar Compra por Lote"} onClose={() => setShowModal(false)} maxWidth="2xl">
          <div className="flex flex-col gap-6">
            {/* Cabecera del Documento */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex justify-between">
                  <span>N° Documento <span className="text-red-500">*</span></span>
                </label>
                <input 
                  className={`${inputCls} uppercase ${!referencia ? 'border-amber-200 dark:border-amber-900/50' : ''}`} 
                  placeholder="Ej. F001-000123" 
                  value={referencia} 
                  onChange={(e) => setReferencia(e.target.value.toUpperCase())} 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha de Emisión</label>
                <input type="date" className={inputCls} defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Impuestos (IGV)</label>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={hasIGV} onChange={(e) => setHasIGV(e.target.checked)} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                  <span className={`text-[10px] font-bold uppercase tracking-tight ${hasIGV ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                    {hasIGV ? 'Activado' : 'Desactivado'}
                  </span>
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      disabled={!hasIGV}
                      className={`${inputCls} h-[34px] py-1 ${!hasIGV ? 'opacity-50 grayscale' : ''}`}
                      value={igvPercent} 
                      onChange={(e) => setIgvPercent(parseFloat(e.target.value))} 
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Añadir Producto al Lote */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <ShoppingBag size={16} /> Agregar productos al lote
              </h3>
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-6 relative">
                  <label className="text-[10px] font-medium text-gray-400 mb-1 block">PRODUCTO</label>
                  <input 
                    type="text" 
                    className={`${inputCls} uppercase`} 
                    placeholder="Buscar producto..." 
                    value={prodSearch}
                    onFocus={() => setShowProductList(true)}
                    onChange={(e) => {
                      setProdSearch(e.target.value.toUpperCase());
                      setShowProductList(true);
                    }}
                  />
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
                              className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-gray-700"
                              onClick={() => {
                                setSelectedProd(p);
                                setProdSearch(p.nombre);
                                setCost((p.precio_compra || '').toString());
                                setShowProductList(false);
                                setTimeout(() => qtyInputRef.current?.focus(), 50);
                              }}
                            >
                              <span className="block font-medium">{p.nombre}</span>
                              <span className="text-[10px] text-gray-400">{p.codigo_barras}</span>
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
                  <label className="text-[10px] font-medium text-gray-400 mb-1 block">CANTIDAD</label>
                  <input ref={qtyInputRef} type="number" className={inputCls} placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-medium text-gray-400 mb-1 block">COSTO U.</label>
                  <input type="number" step="0.01" className={inputCls} placeholder="0.00" value={cost} onChange={(e) => setCost(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Button 
                    onClick={addToCart}
                    variant={editingCartIndex !== null ? 'warning' : 'primary'}
                    className={`w-full h-[38px] ${editingCartIndex !== null ? 'shadow-amber-200' : 'bg-gray-800 dark:bg-gray-100'} p-0`}
                    icon={editingCartIndex !== null ? <Check size={20} /> : <Plus size={20} />}
                  />
                </div>
              </div>
            </div>

            {/* Listado de Productos en la Compra */}
            <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Producto</th>
                    <th className="px-4 py-2 text-right font-medium">Cant.</th>
                    <th className="px-4 py-2 text-right font-medium">Costo</th>
                    <th className="px-4 py-2 text-right font-medium">Subtotal</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">No has agregado productos al lote.</td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                        <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{item.nombre}</td>
                        <td className="px-4 py-3 text-right">{item.cantidad}</td>
                        <td className="px-4 py-3 text-right">S/ {item.costo_unitario.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">S/ {(item.cantidad * item.costo_unitario).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                          <Tooltip text="Editar item" position="top-right">
                            <Button 
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 size={14} />}
                              onClick={() => editCartItem(idx)}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            />
                          </Tooltip>
                          <Tooltip text="Eliminar item" position="top-right">
                            <Button 
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={14} />}
                              onClick={() => removeFromCart(idx)} 
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            />
                          </Tooltip>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total y Acción Final */}
            <div className="flex items-center justify-between p-6 -mx-6 -mb-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 rounded-b-2xl mt-4">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total de Inversión</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white">
                  S/ {totalFinal.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 font-bold"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmarCompra}
                  isLoading={savePurchaseMutation.isPending}
                  className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 border-none"
                  icon={<ArrowUpRight size={20} />}
                  iconPosition="right"
                >
                  Completar Registro
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {showDetailModal && selectedPurchase && (
        <Modal title={`Detalle de Compra #${selectedPurchase.id.toString().padStart(4, '0')}`} onClose={() => setShowDetailModal(false)} maxWidth="2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Documento</p>
                <p className="font-medium text-gray-800 dark:text-white">{selectedPurchase.documento_referencia || 'S/R'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Fecha</p>
                <p className="font-medium text-gray-800 dark:text-white">{new Date(selectedPurchase.fecha).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Responsable</p>
                <p className="font-medium text-gray-800 dark:text-white">{selectedPurchase.usuario_nombre}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Invertido</p>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">S/ {selectedPurchase.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Producto</th>
                    <th className="px-4 py-2 text-right font-medium">Cant.</th>
                    <th className="px-4 py-2 text-right font-medium">Costo U.</th>
                    <th className="px-4 py-2 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {purchaseDetails.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                      <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                        {item.producto_nombre}
                        <span className="block text-[10px] text-gray-400 font-mono">{item.codigo_barras}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{item.cantidad}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">S/ {item.costo_unitario.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">S/ {item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                variant="secondary"
                onClick={() => setShowDetailModal(false)}
                className="px-6 font-bold"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
