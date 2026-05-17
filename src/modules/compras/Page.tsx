import { useRef, useReducer } from 'react';
import {
  Plus,
  Truck,
  Search,
  Calendar,
  FileText,
  Trash2,
  ShoppingBag,
  ArrowUpRight,
  Edit2,
  Check,
  CircleSlash2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { inventarioService, type CompraDetalle } from '../inventario/Service';
import { productoService, type Product } from '../productos/Service';
import { notificationService } from '../../lib/notifications';
import { useAuth } from '../../contexts/AuthContext';

const defaultDate = new Date().toISOString().split('T')[0];

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr + " UTC").toLocaleDateString();
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr + " UTC").toLocaleTimeString();
};

const formatDateTimeLocal = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString();
};

interface PurchaseRecord {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  fecha: string;
  documento_referencia: string;
  total: number;
  estado: string;
}

interface CartItem extends CompraDetalle {
  nombre: string;
  codigo: string;
}

interface ComprasState {
  showModal: boolean;
  search: string;
  showDetailModal: boolean;
  selectedPurchase: PurchaseRecord | null;
  editingCartIndex: number | null;
  page: number;
  referencia: string;
  cart: CartItem[];
  hasIGV: boolean;
  igvPercent: number;
  metodoPago: 'EFECTIVO' | 'BANCO';
  prodSearch: string;
  showProductList: boolean;
  selectedProd: Product | null;
  qty: string;
  cost: string;
}

type ComprasAction =
  | { type: 'SET_SHOW_MODAL'; payload: boolean }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_SHOW_DETAIL_MODAL'; payload: boolean }
  | { type: 'SET_SELECTED_PURCHASE'; payload: PurchaseRecord | null }
  | { type: 'SET_EDITING_CART_INDEX'; payload: number | null }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_REFERENCIA'; payload: string }
  | { type: 'SET_CART'; payload: CartItem[] | ((prev: CartItem[]) => CartItem[]) }
  | { type: 'SET_HAS_IGV'; payload: boolean }
  | { type: 'SET_IGV_PERCENT'; payload: number }
  | { type: 'SET_METODO_PAGO'; payload: 'EFECTIVO' | 'BANCO' }
  | { type: 'SET_PROD_SEARCH'; payload: string }
  | { type: 'SET_SHOW_PRODUCT_LIST'; payload: boolean }
  | { type: 'SET_SELECTED_PROD'; payload: Product | null }
  | { type: 'SET_QTY'; payload: string }
  | { type: 'SET_COST'; payload: string };

function comprasReducer(state: ComprasState, action: ComprasAction): ComprasState {
  switch (action.type) {
    case 'SET_SHOW_MODAL':
      return { ...state, showModal: action.payload };
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_SHOW_DETAIL_MODAL':
      return { ...state, showDetailModal: action.payload };
    case 'SET_SELECTED_PURCHASE':
      return { ...state, selectedPurchase: action.payload };
    case 'SET_EDITING_CART_INDEX':
      return { ...state, editingCartIndex: action.payload };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_REFERENCIA':
      return { ...state, referencia: action.payload };
    case 'SET_CART':
      return {
        ...state,
        cart: typeof action.payload === 'function' ? action.payload(state.cart) : action.payload
      };
    case 'SET_HAS_IGV':
      return { ...state, hasIGV: action.payload };
    case 'SET_IGV_PERCENT':
      return { ...state, igvPercent: action.payload };
    case 'SET_METODO_PAGO':
      return { ...state, metodoPago: action.payload };
    case 'SET_PROD_SEARCH':
      return { ...state, prodSearch: action.payload };
    case 'SET_SHOW_PRODUCT_LIST':
      return { ...state, showProductList: action.payload };
    case 'SET_SELECTED_PROD':
      return { ...state, selectedProd: action.payload };
    case 'SET_QTY':
      return { ...state, qty: action.payload };
    case 'SET_COST':
      return { ...state, cost: action.payload };
    default:
      return state;
  }
}

export function Compras() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [state, dispatch] = useReducer(comprasReducer, {
    showModal: false,
    search: '',
    showDetailModal: false,
    selectedPurchase: null,
    editingCartIndex: null,
    page: 1,
    referencia: '',
    cart: [],
    hasIGV: false,
    igvPercent: 18,
    metodoPago: 'BANCO',
    prodSearch: '',
    showProductList: false,
    selectedProd: null,
    qty: '',
    cost: ''
  });

  const {
    showModal,
    search,
    showDetailModal,
    selectedPurchase,
    editingCartIndex,
    page,
    referencia,
    cart,
    hasIGV,
    igvPercent,
    metodoPago,
    prodSearch,
    showProductList,
    selectedProd,
    qty,
    cost
  } = state;

  const pageSize = 10;

  const setShowModal = (payload: boolean) => dispatch({ type: 'SET_SHOW_MODAL', payload });
  const setSearch = (payload: string) => dispatch({ type: 'SET_SEARCH', payload });
  const setShowDetailModal = (payload: boolean) => dispatch({ type: 'SET_SHOW_DETAIL_MODAL', payload });
  const setSelectedPurchase = (payload: PurchaseRecord | null) => dispatch({ type: 'SET_SELECTED_PURCHASE', payload });
  const setEditingCartIndex = (payload: number | null) => dispatch({ type: 'SET_EDITING_CART_INDEX', payload });
  const setPage = (payload: number) => dispatch({ type: 'SET_PAGE', payload });
  const setReferencia = (payload: string) => dispatch({ type: 'SET_REFERENCIA', payload });
  const setCart = (payload: CartItem[] | ((prev: CartItem[]) => CartItem[])) => dispatch({ type: 'SET_CART', payload });
  const setHasIGV = (payload: boolean) => dispatch({ type: 'SET_HAS_IGV', payload });
  const setIgvPercent = (payload: number) => dispatch({ type: 'SET_IGV_PERCENT', payload });
  const setMetodoPago = (payload: 'EFECTIVO' | 'BANCO') => dispatch({ type: 'SET_METODO_PAGO', payload });
  const setProdSearch = (payload: string) => dispatch({ type: 'SET_PROD_SEARCH', payload });
  const setShowProductList = (payload: boolean) => dispatch({ type: 'SET_SHOW_PRODUCT_LIST', payload });
  const setSelectedProd = (payload: Product | null) => dispatch({ type: 'SET_SELECTED_PROD', payload });
  const setQty = (payload: string) => dispatch({ type: 'SET_QTY', payload });
  const setCost = (payload: string) => dispatch({ type: 'SET_COST', payload });

  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: purchasesRes = { data: [], total: 0 } } = useQuery({
    queryKey: ['purchases', page, pageSize],
    queryFn: () => inventarioService.getCompras(page, pageSize)
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
    mutationFn: (data: any) => inventarioService.registrarCompraCompleta(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      notificationService.success('Compra completada', 'Se ha actualizado el stock y el historial correctamente.');

      setShowModal(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setCart([]);
    setReferencia('');
    setHasIGV(false);
    setMetodoPago('BANCO');
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

    const quantity = parseFloat(qty);
    const unitCost = parseFloat(cost);

    if (quantity <= 0 || unitCost < 0) {
      notificationService.warning('Valores inválidos', 'La cantidad debe ser mayor a 0 y el costo no puede ser negativo.');
      return;
    }

    const newItem: CartItem = {
      producto_id: selectedProd.id,
      nombre: selectedProd.nombre,
      codigo: selectedProd.codigo_barras,
      cantidad: quantity,
      costo_unitario: unitCost
    };

    if (editingCartIndex !== null) {
      setCart(prev => {
        const newCart = [...prev];
        newCart[editingCartIndex] = newItem;
        return newCart;
      });
      setEditingCartIndex(null);
    } else {
      setCart(prev => [...prev, newItem]);
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
      metodo_pago: metodoPago,
      items: cart.map(({ producto_id, cantidad, costo_unitario }) => ({
        producto_id,
        cantidad,
        costo_unitario: hasIGV ? costo_unitario * (1 + (igvPercent / 100)) : costo_unitario
      }))
    };

    savePurchaseMutation.mutate(purchaseData);
  };

  const annulPurchaseMutation = useMutation({
    mutationFn: (id: number) => inventarioService.anularCompra(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      notificationService.successWithConfirm('Compra anulada', 'El stock ha sido revertido y el movimiento eliminado del kardex.');
    }
  });

  const handleAnular = async (purchase: PurchaseRecord) => {
    const ok = await notificationService.confirm(
      '¿Anular compra?',
      `¿Estás seguro de anular la compra #${purchase.id}? Esta acción revertirá el stock y anulará el registro del Kardex.`
    );
    
    if (ok) {
      annulPurchaseMutation.mutate(purchase.id);
    }
  };

  const handleViewDetail = (purchase: PurchaseRecord) => {
    setSelectedPurchase(purchase);
    setShowDetailModal(true);
  };

  const totalInvertido = purchasesRes.data.reduce((acc: number, p: any) => acc + (p.estado === 'anulado' ? 0 : p.total), 0);
  
  const filtered = purchasesRes.data.filter((p: any) => 
    (p.documento_referencia || '').toLowerCase().includes(search.toLowerCase()) ||
    p.id.toString().includes(search.toLowerCase()) ||
    p.usuario_nombre.toLowerCase().includes(search.toLowerCase())
  );

  const columns: TableColumn<PurchaseRecord>[] = [
    {
      key: 'id',
      header: 'N° Compra',
      render: (row) => <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">#{row.id.toString().padStart(4, '0')}</span>,
    },
    { 
      key: 'fecha', 
      header: 'Fecha',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm text-zinc-800 dark:text-zinc-200">{formatDate(row.fecha)}</span>
          <span className="text-[10px] text-zinc-400">{formatTime(row.fecha)}</span>
        </div>
      )
    },
    { 
      key: 'documento_referencia', 
      header: 'Documento',
      render: (row) => <Badge label={row.documento_referencia || 'Sin ref.'} variant="blue" />
    },
    { 
      key: 'usuario_nombre', 
      header: 'Responsable',
      render: (row) => <span className="text-sm text-zinc-600 dark:text-zinc-400">{row.usuario_nombre}</span>
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
      key: 'total',
      header: 'Total Invertido',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-zinc-800 dark:text-white">S/ {row.total.toFixed(2)}</span>
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
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline p-0 h-auto"
            >
              Ver detalle
            </Button>
          </Tooltip>
          {row.estado !== 'anulado' && (
            <Tooltip text="Anular compra" position="top-right">
              <Button 
                variant="ghost"
                size="sm"
                icon={<CircleSlash2 size={14} />}
                onClick={() => handleAnular(row)}
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              />
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  const inputCls = 'w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition';

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
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-xl flex-shrink-0">
            <Truck size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Compras</p>
            <p className="text-lg font-bold text-zinc-800 dark:text-white">{purchasesRes.total}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-xl flex-shrink-0">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Inversión Total</p>
            <p className="text-lg font-bold text-zinc-800 dark:text-white">
              S/ {totalInvertido.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center gap-4">
          <div className="bg-amber-500 p-3 rounded-xl flex-shrink-0">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Compras del Mes</p>
            <p suppressHydrationWarning className="text-lg font-bold text-zinc-800 dark:text-white">
              {purchasesRes.data.filter((p: any) => new Date(p.fecha).getMonth() === new Date().getMonth()).length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 p-4 shadow-sm flex justify-between items-center">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por documento o responsable..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        serverSide={true}
        totalItems={purchasesRes.total}
        currentPage={page}
        onPageChange={(p) => setPage(p)}
        keyExtractor={(row) => row.id}
        emptyMessage="No se encontraron registros de compras."
      />

      {showModal && (
        <Modal title="Registrar Compra por Lote" onClose={() => setShowModal(false)} maxWidth="2xl">
          <div className="flex flex-col gap-6">
            {/* Cabecera del Documento */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-700/30 rounded-xl border border-zinc-100 dark:border-zinc-700">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="compra-num-doc" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex justify-between">
                  <span>N° Documento <span className="text-red-500">*</span></span>
                </label>
                <input 
                  id="compra-num-doc"
                  className={`${inputCls} uppercase ${!referencia ? 'border-amber-200 dark:border-amber-900/50' : ''}`} 
                  placeholder="Ej. F001-000123" 
                  value={referencia} 
                  onChange={(e) => setReferencia(e.target.value.toUpperCase())} 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="compra-fecha" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Fecha</label>
                <input id="compra-fecha" type="date" className={inputCls} defaultValue={defaultDate} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="compra-igv-percent" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Impuestos (IGV)</label>
                <div className="flex items-center gap-3">
                  <label htmlFor="compra-igv-checkbox" className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input id="compra-igv-checkbox" type="checkbox" className="sr-only peer" checked={hasIGV} onChange={(e) => setHasIGV(e.target.checked)} />
                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                  </label>
                  <div className="relative flex-1">
                    <input 
                      id="compra-igv-percent"
                      type="number" 
                      disabled={!hasIGV}
                      className={`${inputCls} h-[34px] py-1 ${!hasIGV ? 'opacity-50 grayscale' : ''}`}
                      value={igvPercent} 
                      onChange={(e) => setIgvPercent(parseFloat(e.target.value))} 
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-bold">%</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="compra-metodo-pago" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pago desde...</label>
                <select 
                  id="compra-metodo-pago"
                  className={inputCls} 
                  value={metodoPago} 
                  onChange={(e) => setMetodoPago(e.target.value as any)}
                >
                  <option value="BANCO">Banco</option>
                  <option value="EFECTIVO">Caja (Efectivo)</option>
                </select>
              </div>
            </div>

            {/* Añadir Producto al Lote */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <ShoppingBag size={16} /> Agregar productos al lote
              </h3>
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-6 relative">
                  <label htmlFor="compra-buscar-producto" className="text-[10px] font-medium text-zinc-400 mb-1 block">PRODUCTO</label>
                  <input 
                    id="compra-buscar-producto"
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
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl shadow-xl z-[60] max-h-40 overflow-y-auto py-1">
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
                              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-zinc-700"
                              onClick={() => {
                                setSelectedProd(p);
                                setProdSearch(p.nombre);
                                setCost((p.precio_compra || '').toString());
                                setShowProductList(false);
                                setTimeout(() => qtyInputRef.current?.focus(), 50);
                              }}
                            >
                              <span className="block font-medium">{p.nombre}</span>
                              <span className="text-[10px] text-zinc-400">{p.codigo_barras}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs text-zinc-400 italic">No se encontraron productos</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="col-span-2">
                  <label htmlFor="compra-cantidad" className="text-[10px] font-medium text-zinc-400 mb-1 block">CANTIDAD</label>
                  <input id="compra-cantidad" ref={qtyInputRef} type="number" min="1" className={inputCls} placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label htmlFor="compra-costo-u" className="text-[10px] font-medium text-zinc-400 mb-1 block">COSTO U.</label>
                  <input id="compra-costo-u" type="number" min="0" step="0.01" className={inputCls} placeholder="0.00" value={cost} onChange={(e) => setCost(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Tooltip text="Agregar al detalle de la compra" position="top-right">
                  <Button 
                    onClick={addToCart}
                    variant={editingCartIndex !== null ? 'warning' : 'primary'}
                    className={`w-full h-[38px] ${editingCartIndex !== null ? 'shadow-amber-200' : 'shadow-blue-200 dark:shadow-none'} p-0`}
                    icon={editingCartIndex !== null ? <Check size={20} /> : <Plus size={20} />}
                  />
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Listado de Productos en la Compra */}
            <div className="border border-zinc-100 dark:border-zinc-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Producto</th>
                    <th className="px-4 py-2 text-right font-medium">Cant.</th>
                    <th className="px-4 py-2 text-right font-medium">Costo</th>
                    <th className="px-4 py-2 text-right font-medium">Subtotal</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 italic">No has agregado productos al lote.</td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => (
                      <tr key={item.producto_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-700/20">
                        <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">{item.nombre}</td>
                        <td className="px-4 py-3 text-right">{item.cantidad}</td>
                        <td className="px-4 py-3 text-right">S/ {item.costo_unitario.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-white">S/ {(item.cantidad * item.costo_unitario).toFixed(2)}</td>
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
            <div className="flex items-center justify-between p-6 -mx-6 -mb-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-700 rounded-b-2xl mt-4">
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Total de Inversión</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white">
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
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 border-none"
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
            <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-zinc-50 dark:bg-zinc-700/30 rounded-xl border border-zinc-100 dark:border-zinc-700">
              <div>
                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Documento</p>
                <p className="font-medium text-zinc-800 dark:text-white">{selectedPurchase.documento_referencia || 'S/R'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Fecha</p>
                <p className="font-medium text-zinc-800 dark:text-white">{formatDateTimeLocal(selectedPurchase.fecha)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Responsable</p>
                <p className="font-medium text-zinc-800 dark:text-white">{selectedPurchase.usuario_nombre}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Estado</p>
                <Badge 
                  label={selectedPurchase.estado === 'anulado' ? 'ANULADO' : 'COMPLETADO'} 
                  variant={selectedPurchase.estado === 'anulado' ? 'red' : 'emerald'} 
                />
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Total Invertido</p>
                <p className="text-xl font-black text-blue-600 dark:text-blue-400">S/ {selectedPurchase.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="border border-zinc-100 dark:border-zinc-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Producto</th>
                    <th className="px-4 py-2 text-right font-medium">Cant.</th>
                    <th className="px-4 py-2 text-right font-medium">Costo U.</th>
                    <th className="px-4 py-2 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                  {purchaseDetails.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-700/20">
                      <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                        {item.producto_nombre}
                        <span className="block text-[10px] text-zinc-400 font-mono">{item.codigo_barras}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{item.cantidad}</td>
                      <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">S/ {item.costo_unitario.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-white">S/ {item.subtotal.toFixed(2)}</td>
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
