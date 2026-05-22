import { useRef, useReducer } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { inventarioService, type CompraDetalle } from '../../inventario/Service';
import { productoService, type Product } from '../../productos/Service';
import { notificationService } from '../../../shared/lib/notifications';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { PurchaseDocHeader } from './PurchaseDocHeader';
import { PurchaseProductSelector } from './PurchaseProductSelector';
import { PurchaseCartTable } from './PurchaseCartTable';
import { dateUtils } from '../../../shared/lib/dateUtils';

const defaultDate = dateUtils.getTodayLocal();

interface CartItem extends CompraDetalle {
  nombre: string;
  codigo: string;
}

interface NewPurchaseState {
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
  editingCartIndex: number | null;
}

type NewPurchaseAction =
  | { type: 'SET_REFERENCIA'; payload: string }
  | { type: 'SET_CART'; payload: CartItem[] | ((prev: CartItem[]) => CartItem[]) }
  | { type: 'SET_HAS_IGV'; payload: boolean }
  | { type: 'SET_IGV_PERCENT'; payload: number }
  | { type: 'SET_METODO_PAGO'; payload: 'EFECTIVO' | 'BANCO' }
  | { type: 'SET_PROD_SEARCH'; payload: string }
  | { type: 'SET_SHOW_PRODUCT_LIST'; payload: boolean }
  | { type: 'SET_SELECTED_PROD'; payload: Product | null }
  | { type: 'SET_QTY'; payload: string }
  | { type: 'SET_COST'; payload: string }
  | { type: 'SET_EDITING_CART_INDEX'; payload: number | null }
  | { type: 'RESET_FORM' };

const initialState: NewPurchaseState = {
  referencia: '',
  cart: [],
  hasIGV: false,
  igvPercent: 18,
  metodoPago: 'BANCO',
  prodSearch: '',
  showProductList: false,
  selectedProd: null,
  qty: '',
  cost: '',
  editingCartIndex: null
};

function newPurchaseReducer(state: NewPurchaseState, action: NewPurchaseAction): NewPurchaseState {
  switch (action.type) {
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
    case 'SET_EDITING_CART_INDEX':
      return { ...state, editingCartIndex: action.payload };
    case 'RESET_FORM':
      return { ...initialState };
    default:
      return state;
  }
}

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewPurchaseModal({ isOpen, onClose }: NewPurchaseModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [state, dispatch] = useReducer(newPurchaseReducer, initialState);

  const {
    referencia,
    cart,
    hasIGV,
    igvPercent,
    metodoPago,
    prodSearch,
    showProductList,
    selectedProd,
    qty,
    cost,
    editingCartIndex
  } = state;

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
  const setEditingCartIndex = (payload: number | null) => dispatch({ type: 'SET_EDITING_CART_INDEX', payload });
  const resetForm = () => dispatch({ type: 'RESET_FORM' });

  const qtyInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [] } = useQuery({
    queryKey: ['products', true],
    queryFn: () => productoService.getAll(true)
  });

  const savePurchaseMutation = useMutation({
    mutationFn: (data: any) => inventarioService.registrarCompraCompleta(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      notificationService.success('Compra completada', 'Se ha actualizado el stock y el historial correctamente.');
      resetForm();
      onClose();
    }
  });

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

  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(prodSearch.toLowerCase()) ||
    (p.codigo_barras && p.codigo_barras.toLowerCase().includes(prodSearch.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <Modal title="Registrar Compra por Lote" onClose={onClose} maxWidth="2xl">
      <div className="flex flex-col gap-6">
        {/* Cabecera del Documento */}
        <PurchaseDocHeader
          referencia={referencia}
          setReferencia={setReferencia}
          hasIGV={hasIGV}
          setHasIGV={setHasIGV}
          igvPercent={igvPercent}
          setIgvPercent={setIgvPercent}
          metodoPago={metodoPago}
          setMetodoPago={setMetodoPago}
          defaultDate={defaultDate}
        />

        {/* Añadir Producto al Lote */}
        <PurchaseProductSelector
          prodSearch={prodSearch}
          setProdSearch={setProdSearch}
          showProductList={showProductList}
          setShowProductList={setShowProductList}
          filteredProducts={filteredProducts}
          setSelectedProd={setSelectedProd}
          setCost={setCost}
          qtyInputRef={qtyInputRef}
          qty={qty}
          setQty={setQty}
          cost={cost}
          editingCartIndex={editingCartIndex}
          addToCart={addToCart}
        />

        {/* Listado de Productos en la Compra */}
        <PurchaseCartTable
          cart={cart}
          editCartItem={editCartItem}
          removeFromCart={removeFromCart}
        />

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
              onClick={onClose}
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
  );
}
