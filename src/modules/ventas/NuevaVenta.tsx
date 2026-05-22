import { useReducer } from 'react';
import { ArrowLeft, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/ui/Button';
import { ProductCatalog } from './components/ProductCatalog';
import { VentaCart } from './components/VentaCart';
import { CheckoutModal } from './components/CheckoutModal';
import { useAuth } from '../../shared/contexts/AuthContext';
import { type Product } from '../productos/Service';
import { notificationService } from '../../shared/lib/notifications';

interface CartItem {
  product: Product;
  quantity: number;
}

interface NuevaVentaState {
  search: string;
  activeCategory: number | 'Todos';
  cart: CartItem[];
  showCheckout: boolean;
  hasIGV: boolean;
  igvPercent: number;
}

type NuevaVentaAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_ACTIVE_CATEGORY'; payload: number | 'Todos' }
  | { type: 'SET_CART'; payload: CartItem[] | ((prev: CartItem[]) => CartItem[]) }
  | { type: 'SET_SHOW_CHECKOUT'; payload: boolean }
  | { type: 'SET_HAS_IGV'; payload: boolean }
  | { type: 'SET_IGV_PERCENT'; payload: number }
  | { type: 'RESET_CART' };

function nuevaVentaReducer(state: NuevaVentaState, action: NuevaVentaAction): NuevaVentaState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_ACTIVE_CATEGORY':
      return { ...state, activeCategory: action.payload };
    case 'SET_CART':
      return {
        ...state,
        cart: typeof action.payload === 'function' ? action.payload(state.cart) : action.payload
      };
    case 'SET_SHOW_CHECKOUT':
      return { ...state, showCheckout: action.payload };
    case 'SET_HAS_IGV':
      return { ...state, hasIGV: action.payload };
    case 'SET_IGV_PERCENT':
      return { ...state, igvPercent: action.payload };
    case 'RESET_CART':
      return {
        ...state,
        cart: [],
        showCheckout: false
      };
    default:
      return state;
  }
}

export function NuevaVenta() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [state, dispatch] = useReducer(nuevaVentaReducer, {
    search: '',
    activeCategory: 'Todos',
    cart: [],
    showCheckout: false,
    hasIGV: false,
    igvPercent: 18
  });

  const {
    search,
    activeCategory,
    cart,
    showCheckout,
    hasIGV,
    igvPercent
  } = state;

  const setSearch = (payload: string) => dispatch({ type: 'SET_SEARCH', payload });
  const setActiveCategory = (payload: number | 'Todos') => dispatch({ type: 'SET_ACTIVE_CATEGORY', payload });
  const setCart = (payload: CartItem[] | ((prev: CartItem[]) => CartItem[])) => dispatch({ type: 'SET_CART', payload });
  const setShowCheckout = (payload: boolean) => dispatch({ type: 'SET_SHOW_CHECKOUT', payload });
  const setHasIGV = (payload: boolean) => dispatch({ type: 'SET_HAS_IGV', payload });
  const setIgvPercent = (payload: number) => dispatch({ type: 'SET_IGV_PERCENT', payload });
  const resetCart = () => dispatch({ type: 'RESET_CART' });

  // ── Lógica del Carrito ────────────────────────────────────────────────────────
  const addToCart = (product: Product) => {
    const existingInCart = cart.find(item => item.product.id === product.id);
    const quantityInCart = existingInCart ? existingInCart.quantity : 0;

    if (quantityInCart + 1 > (product.stock_actual || 0)) {
      notificationService.warning('Sin Stock suficiente', `No puedes agregar más. Solo quedan ${product.stock_actual} unidades.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    const item = cart.find(i => i.product.id === id);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    if (delta > 0 && newQuantity > (item.product.stock_actual || 0)) {
      notificationService.warning('Límite alcanzado', 'No hay más unidades en stock.');
      return;
    }

    if (newQuantity > 0) {
      setCart(prev => prev.map(i =>
        i.product.id === id ? { ...i, quantity: newQuantity } : i
      ));
    }
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const subtotalBase = cart.reduce((sum, item) => sum + ((item.product.precio_venta || 0) * item.quantity), 0);
  const igvAmount = hasIGV ? (subtotalBase * (igvPercent / 100)) : 0;
  const total = subtotalBase + igvAmount;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col -m-6 overflow-hidden bg-transparent">
      {/* ── Encabezado POS ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700 p-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/ventas')}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-zinc-800 dark:text-white leading-tight">Punto de Venta</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Caja #1 • Cajero: {user?.nombre_completo || 'Admin'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total acumulado</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">S/ {total.toFixed(2)}</p>
          </div>
          <Button
            disabled={cart.length === 0}
            onClick={() => setShowCheckout(true)}
            icon={<Receipt size={18} />}
          >
            <span className="hidden sm:inline">Cobrar</span>
          </Button>
        </div>
      </div>

      {/* ── Área Principal (Dos columnas) ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-transparent">
        <ProductCatalog
          search={search}
          setSearch={setSearch}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          addToCart={addToCart}
        />

        <VentaCart
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          hasIGV={hasIGV}
          setHasIGV={setHasIGV}
          igvPercent={igvPercent}
          setIgvPercent={setIgvPercent}
          subtotalBase={subtotalBase}
          igvAmount={igvAmount}
          total={total}
          onCobrar={() => setShowCheckout(true)}
        />
      </div>

      {showCheckout && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          total={total}
          igvAmount={igvAmount}
          hasIGV={hasIGV}
          igvPercent={igvPercent}
          cart={cart}
          user={user}
          onSuccess={resetCart}
        />
      )}
    </div>
  );
}
