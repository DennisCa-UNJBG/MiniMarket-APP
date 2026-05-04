import { useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingBag, Receipt, ArrowLeft, CreditCard, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string; // Para un diseño más premium
}

interface CartItem {
  product: Product;
  quantity: number;
}

// ── Datos de ejemplo ───────────────────────────────────────────────────────────
const catalog: Product[] = [
  { id: 1, name: 'Arroz Costeño 1kg',      category: 'Abarrotes', price: 3.50, stock: 120 },
  { id: 2, name: 'Aceite Primor 1L',        category: 'Abarrotes', price: 7.00, stock: 45 },
  { id: 3, name: 'Leche Gloria 400g',       category: 'Lácteos',   price: 4.00, stock: 80 },
  { id: 4, name: 'Azúcar Rubia 1kg',        category: 'Abarrotes', price: 3.00, stock: 75 },
  { id: 5, name: 'Inka Kola 1.5L',          category: 'Bebidas',   price: 5.00, stock: 36 },
  { id: 6, name: 'Coca Cola 1.5L',          category: 'Bebidas',   price: 5.50, stock: 40 },
  { id: 7, name: 'Pan de Molde Bimbo',      category: 'Panadería', price: 5.50, stock: 14 },
  { id: 8, name: 'Galletas Oreo',           category: 'Snacks',    price: 1.50, stock: 50 },
  { id: 9, name: 'Yogurt Gloria Fresa 1L',  category: 'Lácteos',   price: 6.50, stock: 25 },
];

const categories = ['Todos', 'Abarrotes', 'Bebidas', 'Lácteos', 'Snacks', 'Panadería'];

export function NuevaVenta() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Checkout Modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');

  // ── Lógica del Catálogo ───────────────────────────────────────────────────────
  const filteredCatalog = catalog.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // ── Lógica del Carrito ────────────────────────────────────────────────────────
  const addToCart = (product: Product) => {
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
    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const paidNumber = parseFloat(amountPaid) || 0;
  const change = Math.max(0, paidNumber - total);

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col -m-6 overflow-hidden bg-transparent">
      {/* ── Encabezado POS ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between z-10 shrink-0">
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
            <h1 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">Punto de Venta</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Caja #1 • Cajero: Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total acumulado</p>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">S/ {total.toFixed(2)}</p>
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
        
        {/* Lado Izquierdo: Catálogo */}
        <div className="flex-1 flex flex-col h-full lg:border-r border-gray-200 dark:border-gray-700">
          
          {/* Búsqueda y Categorías */}
          <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0 space-y-3">
            <Input
              placeholder="Buscar por código de barras o nombre del producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={18} />}
            />
            
            {/* Scroll horizontal de categorías */}
            <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                    activeCategory === cat 
                      ? 'bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Productos */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCatalog.map(product => (
                <Card
                  key={product.id}
                  onClick={() => addToCart(product)}
                  hoverable
                  className="p-4 text-left flex flex-col h-full group"
                >
                  <div className="w-full h-24 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-3 flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:scale-105 transition-transform">
                    <ShoppingBag size={32} />
                  </div>
                  <div className="flex-1">
                    <Badge label={product.category} variant="indigo" className="mb-1" />
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight mb-2 line-clamp-2">{product.name}</p>
                  </div>
                  <div className="flex items-end justify-between mt-auto pt-2">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">S/ {product.price.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{product.stock} disp.</p>
                  </div>
                </Card>
              ))}
            </div>
            {filteredCatalog.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <ShoppingBag size={48} className="mb-3 opacity-20" />
                <p>No se encontraron productos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Ticket / Carrito */}
        <div className="w-full lg:w-[400px] flex flex-col bg-white dark:bg-gray-800 shrink-0 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)] z-10">
          
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-white flex items-center justify-between">
              <span>Ticket Actual</span>
              <Badge 
                label={`${cart.reduce((sum, item) => sum + item.quantity, 0)} ítems`} 
                variant="indigo" 
              />
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-gray-500">
                <Receipt size={48} className="mb-4 opacity-20" />
                <p className="text-sm">El carrito está vacío</p>
                <p className="text-xs mt-1">Selecciona productos del catálogo para agregarlos a la venta.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {cart.map(item => (
                  <li key={item.product.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.product.name}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">S/ {(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400">S/ {item.product.price.toFixed(2)} c/u</p>
                      
                      <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => item.quantity === 1 ? removeFromCart(item.product.id) : updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 p-0 min-h-0 bg-white dark:bg-gray-700"
                        >
                          {item.quantity === 1 ? <Trash2 size={12} className="text-red-500" /> : <Minus size={12} />}
                        </Button>
                        <span className="w-6 text-center text-xs font-bold text-gray-800 dark:text-white">
                          {item.quantity}
                        </span>
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 p-0 min-h-0 bg-white dark:bg-gray-700"
                        >
                          <Plus size={12} />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Resumen Totales */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 space-y-3">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Subtotal</span>
              <span>S/ {(total / 1.18).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>IGV (18%)</span>
              <span>S/ {(total - (total / 1.18)).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800 dark:text-white">Total</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">S/ {total.toFixed(2)}</span>
            </div>
            
            <Button 
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
              fullWidth
              size="lg"
              className="mt-2"
              icon={<ArrowLeft size={20} className="rotate-180" />}
              iconPosition="right"
            >
              Cobrar
            </Button>
          </div>

        </div>
      </div>

      {/* ── Modal de Cobro (Checkout) ──────────────────────────────────────── */}
      {showCheckout && (
        <Modal 
          title="Completar Venta" 
          onClose={() => setShowCheckout(false)}
          maxWidth="md"
        >
          <div className="-mx-6 -mt-5 mb-6">
            <div className="bg-indigo-600 p-8 text-center text-white">
              <p className="text-indigo-200 text-sm font-medium mb-1">Monto a cobrar</p>
              <p className="text-4xl font-black">S/ {total.toFixed(2)}</p>
            </div>
          </div>
            
          <div className="space-y-6">
            {/* Métodos de pago */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="secondary" 
                className="flex-col h-auto py-4 border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                icon={<Banknote size={24} />}
              >
                <span>Efectivo</span>
              </Button>
              <Button 
                variant="secondary" 
                className="flex-col h-auto py-4 border-2 border-transparent"
                icon={<CreditCard size={24} />}
              >
                <span>Tarjeta / Yape</span>
              </Button>
            </div>

            {/* Input Efectivo */}
            <div className="space-y-4">
              <Input
                label="Monto recibido (S/)"
                type="number"
                autoFocus
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                icon={<span className="text-gray-400 font-bold">S/</span>}
                placeholder="0.00"
                className="text-xl font-bold"
              />

              {/* Vuelto */}
              <div className={`p-4 rounded-xl flex justify-between items-center transition-colors ${
                paidNumber >= total 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800'
              }`}>
                <span className="font-semibold">Vuelto:</span>
                <span className="text-2xl font-black">S/ {change.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowCheckout(false)}
                fullWidth
              >
                Volver
              </Button>
              <Button 
                disabled={paidNumber < total}
                onClick={() => {
                  setShowCheckout(false);
                  notificationService.success('¡Venta completada!', `El cambio es de S/ ${change.toFixed(2)}`).then(() => {
                    setCart([]);
                    setAmountPaid('');
                    navigate('/ventas');
                  });
                }}
                fullWidth
                className="flex-[2]"
              >
                Confirmar Pago
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
