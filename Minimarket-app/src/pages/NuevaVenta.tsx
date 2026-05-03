import { useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingBag, Receipt, ArrowLeft, CreditCard, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

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
          <button 
            onClick={() => navigate('/ventas')}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Punto de Venta</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Caja #1 • Cajero: Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total acumulado</p>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">S/ {total.toFixed(2)}</p>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={() => setShowCheckout(true)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-medium rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Receipt size={18} />
            <span className="hidden sm:inline">Cobrar</span>
          </button>
        </div>
      </div>

      {/* ── Área Principal (Dos columnas) ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-transparent">
        
        {/* Lado Izquierdo: Catálogo */}
        <div className="flex-1 flex flex-col h-full lg:border-r border-gray-200 dark:border-gray-700">
          
          {/* Búsqueda y Categorías */}
          <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0 space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código de barras o nombre del producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              />
            </div>
            
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
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all text-left flex flex-col h-full group"
                >
                  <div className="w-full h-24 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-3 flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:scale-105 transition-transform">
                    <ShoppingBag size={32} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">{product.category}</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight mb-2 line-clamp-2">{product.name}</p>
                  </div>
                  <div className="flex items-end justify-between mt-auto pt-2">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">S/ {product.price.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{product.stock} disp.</p>
                  </div>
                </button>
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
              <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-full">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} ítems
              </span>
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
                        <button 
                          onClick={() => item.quantity === 1 ? removeFromCart(item.product.id) : updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-700 rounded shadow-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors"
                        >
                          {item.quantity === 1 ? <Trash2 size={12} className="text-red-500" /> : <Minus size={12} />}
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-gray-800 dark:text-white">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-700 rounded shadow-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
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
            
            <button 
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
              className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-none flex justify-center items-center gap-2 text-lg"
            >
              Cobrar <ArrowLeft size={20} className="rotate-180" />
            </button>
          </div>

        </div>
      </div>

      {/* ── Modal de Cobro (Checkout) ──────────────────────────────────────── */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-6 text-center text-white">
              <p className="text-indigo-200 text-sm font-medium mb-1">Monto a cobrar</p>
              <p className="text-4xl font-black">S/ {total.toFixed(2)}</p>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Métodos de pago */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-semibold transition-colors">
                  <Banknote size={24} />
                  <span>Efectivo</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300 transition-colors">
                  <CreditCard size={24} />
                  <span>Tarjeta / Yape</span>
                </button>
              </div>

              {/* Input Efectivo */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">Monto recibido (S/)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">S/</span>
                    <input 
                      type="number" 
                      autoFocus
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-xl font-bold border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" 
                      placeholder="0.00" 
                    />
                  </div>
                </div>

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

            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-3">
              <button 
                onClick={() => setShowCheckout(false)}
                className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Volver
              </button>
              <button 
                disabled={paidNumber < total}
                onClick={() => {
                  setShowCheckout(false);
                  
                  Swal.fire({
                    title: '¡Venta completada!',
                    text: `El cambio es de S/ ${change.toFixed(2)}`,
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#4f46e5', // indigo-600
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                    color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
                    customClass: {
                      popup: 'rounded-2xl',
                      confirmButton: 'px-4 py-2 rounded-xl text-sm font-medium'
                    }
                  }).then(() => {
                    setCart([]);
                    setAmountPaid('');
                    navigate('/ventas');
                  });
                }}
                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
