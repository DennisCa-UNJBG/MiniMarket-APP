import { ShoppingBag, Plus, Check } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { Tooltip } from '../../../shared/components/ui/Tooltip';
import type { RefObject } from 'react';

interface PurchaseProductSelectorProps {
  prodSearch: string;
  setProdSearch: (val: string) => void;
  showProductList: boolean;
  setShowProductList: (val: boolean) => void;
  filteredProducts: any[];
  setSelectedProd: (val: any) => void;
  setCost: (val: string) => void;
  qtyInputRef: RefObject<HTMLInputElement | null>;
  qty: string;
  setQty: (val: string) => void;
  cost: string;
  editingCartIndex: number | null;
  addToCart: () => void;
}

export function PurchaseProductSelector({
  prodSearch,
  setProdSearch,
  showProductList,
  setShowProductList,
  filteredProducts,
  setSelectedProd,
  setCost,
  qtyInputRef,
  qty,
  setQty,
  cost,
  editingCartIndex,
  addToCart
}: PurchaseProductSelectorProps) {
  const inputCls = 'w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition';

  return (
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
            autoComplete="off"
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
              <button
                type="button"
                aria-label="Cerrar lista de productos"
                className="fixed inset-0 z-[5] w-full h-full cursor-default bg-transparent border-none outline-none"
                onClick={() => setShowProductList(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl shadow-xl z-[60] max-h-40 overflow-y-auto py-1">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
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
  );
}
