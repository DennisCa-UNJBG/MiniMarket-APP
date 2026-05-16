import { useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Receipt,
  ArrowLeft,
  CreditCard,
  Banknote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../../lib/notifications';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Tooltip } from '../../components/ui/Tooltip';
import { productoService, type Product } from '../productos/Service';
import { categoriaService } from '../productos/categoriaService';
import { ventaService } from './Service';
import { useAuth } from '../../contexts/AuthContext';

interface CartItem {
  product: Product;
  quantity: number;
}

export function NuevaVenta() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | 'Todos'>('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Checkout Modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
  const [amountPaid, setAmountPaid] = useState('');

  // Lógica de Impuestos (IGV)
  const [hasIGV, setHasIGV] = useState(false);
  const [igvPercent, setIgvPercent] = useState(18);

  // Queries
  const { data: products = [] } = useQuery({
    queryKey: ['products', true],
    queryFn: () => productoService.getAll(true)
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriaService.getAll()
  });

  // Mutations
  const registrarVentaMutation = useMutation({
    mutationFn: (ventaData: any) => ventaService.registrarVenta(ventaData),
    onSuccess: async (_, variables) => {
      setShowCheckout(false);
      await notificationService.successWithConfirm('¡Venta completada!', `Vuelto: S/ ${variables.vuelto.toFixed(2)}`);
      
      setCart([]);
      setAmountPaid('');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['sales-chart'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
    }
  });

  // ── Lógica del Catálogo ───────────────────────────────────────────────────────
  const filteredCatalog = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || 
                         (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === 'Todos' || p.categoria_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
            <p className="text-xs text-gray-500 dark:text-gray-400">Caja #1 • Cajero: {user?.nombre_completo || 'Admin'}</p>
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
              placeholder="Buscar por código o nombre del producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={18} />}
            />
            
            {/* Scroll horizontal de categorías */}
            <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
                <Button
                  variant={activeCategory === 'Todos' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveCategory('Todos')}
                  className={`px-4 py-1.5 rounded-full whitespace-nowrap border-none ${
                    activeCategory === 'Todos' 
                      ? 'bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Todos
                </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full whitespace-nowrap border-none ${
                    activeCategory === cat.id 
                      ? 'bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat.nombre}
                </Button>
              ))}
            </div>
          </div>

          {/* Grid de Productos */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCatalog.map(product => (
                <Card
                  key={product.id}
                  onClick={() => (product.stock_actual || 0) > 0 ? addToCart(product) : notificationService.warning('Sin Stock', 'Este producto no tiene existencias.')}
                  hoverable
                  className={`p-4 text-left flex flex-col h-full group ${(product.stock_actual || 0) <= 0 ? 'opacity-60 grayscale-[0.5]' : ''}`}
                >
                  <div className="w-full h-24 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-3 flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:scale-105 transition-transform relative overflow-hidden">
                    <ShoppingBag size={32} />
                    {(product.stock_actual || 0) <= 0 && (
                      <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter shadow-lg">Agotado</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Badge label={product.categoria_nombre || 'General'} variant="indigo" className="mb-1" />
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight mb-2 line-clamp-2">{product.nombre}</p>
                  </div>
                  <div className="flex items-end justify-between mt-auto pt-2">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">S/ {(product.precio_venta || 0).toFixed(2)}</p>
                    <p className={`text-[10px] font-medium ${product.stock_actual <= (product.stock_minimo || 0) ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {product.stock_actual} {product.unidad_medida}
                    </p>
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
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.product.nombre}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">S/ {((item.product.precio_venta || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400">S/ {(item.product.precio_venta || 0).toFixed(2)} c/u</p>
                      
                      <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg border border-gray-200/50 dark:border-gray-700">
                        <Tooltip text={item.quantity === 1 ? "Eliminar" : "Disminuir"} position="top-right">
                          <Button 
                            variant="secondary"
                            size="sm"
                            onClick={() => item.quantity === 1 ? removeFromCart(item.product.id) : updateQuantity(item.product.id, -1)}
                            className="h-8 p-0 px-0 min-h-0 bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500"
                          >
                            {item.quantity === 1 ? <Trash2 size={16} className="text-red-500" /> : <Minus size={18} strokeWidth={3} className="text-gray-800 dark:text-white" />}
                          </Button>
                        </Tooltip>
                        <span className="w-10 text-center text-base font-black text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <Tooltip text="Aumentar" position="top-right">
                          <Button 
                            variant="secondary"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className=" h-8 p-0 px-0 min-h-0 bg-white dark:bg-gray-700 shadow-sm border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 active:bg-gray-100"
                          >
                            <Plus size={18} strokeWidth={3} className="text-gray-800 dark:text-white" />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Resumen Totales */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 space-y-4">
            
            {/* Control de IGV */}
            <div className="bg-white dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Impuestos IGV</span>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer scale-75 origin-left">
                    <input type="checkbox" className="sr-only peer" checked={hasIGV} onChange={(e) => setHasIGV(e.target.checked)} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                  <span className={`text-[10px] font-black uppercase ${hasIGV ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                    {hasIGV ? 'ACTIVO' : 'NO APLICA'}
                  </span>
                </div>
              </div>

              {hasIGV && (
                <div className="relative w-16">
                  <input 
                    type="number" 
                    className="w-full pl-2 pr-5 py-1 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={igvPercent}
                    onChange={(e) => setIgvPercent(parseFloat(e.target.value) || 0)}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">%</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 px-1">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Subtotal Base</span>
                <span>S/ {subtotalBase.toFixed(2)}</span>
              </div>
              {hasIGV && (
                <div className="flex justify-between text-xs text-indigo-500/70 dark:text-indigo-400/70 italic">
                  <span>IGV ({igvPercent}%)</span>
                  <span>+ S/ {igvAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tighter">Total a Cobrar</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">S/ {total.toFixed(2)}</span>
              </div>
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
                onClick={() => setPaymentMethod('EFECTIVO')}
                className={`flex-col h-auto py-4 border-2 transition-all ${paymentMethod === 'EFECTIVO' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-transparent opacity-60'}`}
                icon={<Banknote size={24} />}
              >
                <span>Efectivo</span>
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setPaymentMethod('TARJETA');
                  setAmountPaid(total.toString());
                }}
                className={`flex-col h-auto py-4 border-2 transition-all ${paymentMethod === 'TARJETA' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-transparent opacity-60'}`}
                icon={<CreditCard size={24} />}
              >
                <span>Tarjeta / Yape</span>
              </Button>
            </div>

            {/* Input de Monto - Siempre visible */}
            <div className="space-y-4">
              <Input
                label={paymentMethod === 'EFECTIVO' ? "Monto recibido (S/)" : "Monto exacto (Tarjeta/Yape)"}
                type="number"
                disabled={paymentMethod === 'TARJETA'}
                autoFocus
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                icon={<span className="text-gray-400 font-bold">S/</span>}
                placeholder="0.00"
                className="text-xl font-bold"
              />

              {/* Vuelto / Estado del Pago */}
              <div className={`p-4 rounded-xl flex justify-between items-center transition-colors ${
                paidNumber >= total 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800'
              }`}>
                <span className="font-semibold">{paidNumber >= total ? 'Vuelto:' : 'Pendiente:'}</span>
                <span className="text-2xl font-black">S/ {Math.abs(change).toFixed(2)}</span>
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
                disabled={paymentMethod === 'EFECTIVO' && paidNumber < total}
                onClick={() => {
                  const ventaData = {
                    usuario_id: user?.id || 1,
                    total,
                    igv: igvAmount,
                    igv_porcentaje: hasIGV ? igvPercent : 0,
                    metodo_pago: paymentMethod,
                    monto_pagado: paidNumber,
                    vuelto: change,
                    items: cart.map(i => ({
                      producto_id: i.product.id,
                      cantidad: i.quantity,
                      precio_unitario: i.product.precio_venta || 0
                    }))
                  };
                  registrarVentaMutation.mutate(ventaData);
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
