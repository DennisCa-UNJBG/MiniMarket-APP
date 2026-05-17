import { Trash2, Minus, Plus, Receipt, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Tooltip } from '../../../components/ui/Tooltip';
import { type Product } from '../../productos/Service';

interface CartItem {
  product: Product;
  quantity: number;
}

interface VentaCartProps {
  cart: CartItem[];
  updateQuantity: (id: number, delta: number) => void;
  removeFromCart: (id: number) => void;
  hasIGV: boolean;
  setHasIGV: (val: boolean) => void;
  igvPercent: number;
  setIgvPercent: (val: number) => void;
  subtotalBase: number;
  igvAmount: number;
  total: number;
  onCobrar: () => void;
}

export function VentaCart({
  cart,
  updateQuantity,
  removeFromCart,
  hasIGV,
  setHasIGV,
  igvPercent,
  setIgvPercent,
  subtotalBase,
  igvAmount,
  total,
  onCobrar
}: VentaCartProps) {
  return (
    <div className="w-full lg:w-[400px] flex flex-col bg-white dark:bg-zinc-800 shrink-0 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)] z-10">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800">
        <h2 className="font-semibold text-zinc-800 dark:text-white flex items-center justify-between">
          <span>Ticket Actual</span>
          <Badge 
            label={`${cart.reduce((sum, item) => sum + item.quantity, 0)} ítems`} 
            variant="blue" 
          />
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-500">
            <Receipt size={48} className="mb-4 opacity-20" />
            <p className="text-sm">El carrito está vacío</p>
            <p className="text-xs mt-1">Selecciona productos del catálogo para agregarlos a la venta.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {cart.map(item => (
              <li key={item.product.id} className="p-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{item.product.nombre}</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">S/ {((item.product.precio_venta || 0) * item.quantity).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">S/ {(item.product.precio_venta || 0).toFixed(2)} c/u</p>
                  
                  <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-lg border border-zinc-200/50 dark:border-zinc-700">
                    <Tooltip text={item.quantity === 1 ? "Eliminar" : "Disminuir"} position="top-right">
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => item.quantity === 1 ? removeFromCart(item.product.id) : updateQuantity(item.product.id, -1)}
                        className="h-8 p-0 px-0 min-h-0 bg-white dark:bg-zinc-700 shadow-sm border border-zinc-200 dark:border-zinc-600 hover:border-blue-400 dark:hover:border-blue-500"
                      >
                        {item.quantity === 1 ? <Trash2 size={16} className="text-red-500" /> : <Minus size={18} strokeWidth={3} className="text-zinc-800 dark:text-white" />}
                      </Button>
                    </Tooltip>
                    <span className="w-10 text-center text-base font-black text-zinc-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <Tooltip text="Aumentar" position="top-right">
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className=" h-8 p-0 px-0 min-h-0 bg-white dark:bg-zinc-700 shadow-sm border-2 border-zinc-200 dark:border-zinc-600 hover:border-blue-500 dark:hover:border-blue-400 active:bg-zinc-100"
                      >
                        <Plus size={18} strokeWidth={3} className="text-zinc-800 dark:text-white" />
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
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 space-y-4">
        {/* Control de IGV */}
        <div className="bg-white dark:bg-zinc-700/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-600 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Impuestos IGV</span>
            <div className="flex items-center gap-2">
              <label htmlFor="checkbox-impuestos-igv" aria-label="Aplicar impuestos IGV" className="relative inline-flex items-center cursor-pointer scale-75 origin-left">
                <input id="checkbox-impuestos-igv" type="checkbox" className="sr-only peer" checked={hasIGV} onChange={(e) => setHasIGV(e.target.checked)} />
                <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                <span className="sr-only">Aplicar impuestos IGV</span>
              </label>
              <span className={`text-[10px] font-black uppercase ${hasIGV ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`}>
                {hasIGV ? 'ACTIVO' : 'NO APLICA'}
              </span>
            </div>
          </div>

          {hasIGV && (
            <div className="relative w-16">
              <input 
                type="number" 
                className="w-full pl-2 pr-5 py-1 text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                value={igvPercent}
                onChange={(e) => setIgvPercent(parseFloat(e.target.value) || 0)}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-bold">%</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5 px-1">
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Subtotal Base</span>
            <span>S/ {subtotalBase.toFixed(2)}</span>
          </div>
          {hasIGV && (
            <div className="flex justify-between text-xs text-blue-500/70 dark:text-blue-400/70 italic">
              <span>IGV ({igvPercent}%)</span>
              <span>+ S/ {igvAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-zinc-200 dark:border-zinc-600 pt-2 flex justify-between items-center">
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tighter">Total a Cobrar</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">S/ {total.toFixed(2)}</span>
          </div>
        </div>
        
        <Button 
          disabled={cart.length === 0}
          onClick={onCobrar}
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
  );
}
