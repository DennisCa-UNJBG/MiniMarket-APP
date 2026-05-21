import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { sucursalService } from '../Service';
import { useAuth } from '../../../contexts/AuthContext';
import { notificationService } from '../../../lib/notifications';
import { Button } from '../../../components/ui/Button';

interface AjustarStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  sucursalId: string;
  producto: {
    codigo_barras: string;
    producto_nombre: string;
    stock: number;
    unidad_medida?: string;
  } | null;
  onSuccess: () => void;
}

export function AjustarStockModal({
  isOpen,
  onClose,
  sucursalId,
  producto,
  onSuccess,
}: AjustarStockModalProps) {
  const { user } = useAuth();
  const [nuevoStock, setNuevoStock] = useState<string>(() =>
    producto ? producto.stock.toString() : '0'
  );

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!producto) return;
      const stockNum = parseFloat(nuevoStock);
      if (isNaN(stockNum) || stockNum < 0) {
        throw new Error('El stock debe ser un número válido y mayor o igual a 0.');
      }
      return sucursalService.adjustStock(
        sucursalId,
        producto.codigo_barras,
        stockNum,
        user?.id || 1
      );
    },
    onSuccess: () => {
      notificationService.success(
        'Stock Ajustado',
        `Se ha modificado el stock de "${producto?.producto_nombre}" a ${nuevoStock} unidades.`
      );
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      notificationService.error(
        'Error al ajustar stock',
        error.message || 'Ocurrió un error inesperado.'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustMutation.mutate();
  };

  if (!isOpen || !producto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-zinc-100 dark:border-zinc-700/50">
        {/* Cabecera */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-white">Ajustar Stock Manual</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Sucursal: {sucursalId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 p-2 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Advertencia */}
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl text-amber-700 dark:text-amber-400">
            <AlertTriangle className="flex-shrink-0" size={20} />
            <div className="text-xs">
              <p className="font-bold">Acción de Sede Central</p>
              <p className="opacity-90 mt-0.5">
                Esta modificación cambiará el stock registrado en la central. Se actualizará en la sucursal la próxima vez que sincronice.
              </p>
            </div>
          </div>

          {/* Información del Producto */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-2">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                Producto
              </span>
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block">
                {producto.producto_nombre}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                  Código de Barras
                </span>
                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  {producto.codigo_barras}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                  Stock Actual
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {producto.stock} {producto.unidad_medida || 'UND'}
                </span>
              </div>
            </div>
          </div>

          {/* Campo de Entrada para nuevo stock */}
          <div className="space-y-1.5">
            <label
              htmlFor="nuevo-stock"
              className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1"
            >
              Nuevo Stock Disponible ({producto.unidad_medida || 'UND'})
            </label>
            <input
              id="nuevo-stock"
              required
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={nuevoStock}
              onChange={(e) => setNuevoStock(e.target.value)}
              className="w-full px-4 py-3 text-base font-bold border border-zinc-200 dark:border-zinc-700 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={onClose}
              className="py-3 font-semibold rounded-2xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              fullWidth
              isLoading={adjustMutation.isPending}
              className="py-3 font-bold rounded-2xl shadow-lg shadow-blue-500/10"
            >
              Confirmar Ajuste
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
