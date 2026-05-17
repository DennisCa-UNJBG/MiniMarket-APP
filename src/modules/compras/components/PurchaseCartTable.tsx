import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Tooltip } from '../../../components/ui/Tooltip';

interface CartItem {
  producto_id: number;
  nombre: string;
  codigo: string;
  cantidad: number;
  costo_unitario: number;
}

interface PurchaseCartTableProps {
  cart: CartItem[];
  editCartItem: (idx: number) => void;
  removeFromCart: (idx: number) => void;
}

export function PurchaseCartTable({
  cart,
  editCartItem,
  removeFromCart
}: PurchaseCartTableProps) {
  return (
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
  );
}
