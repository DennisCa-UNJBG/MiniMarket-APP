import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../../shared/components/ui/Modal';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { inventarioService } from '../../inventario/Service';
import { dateUtils } from '../../../shared/lib/dateUtils';

interface PurchaseRecord {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  fecha: string;
  documento_referencia: string;
  total: number;
  estado: string;
}

interface PurchaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: PurchaseRecord | null;
}

const formatDateTimeLocal = (dateStr: string) => {
  return dateUtils.formatUTCtoLocalString(dateStr);
};

export function PurchaseDetailsModal({ isOpen, onClose, purchase }: PurchaseDetailsModalProps) {
  const { data: purchaseDetails = [] } = useQuery({
    queryKey: ['purchase-details', purchase?.id],
    queryFn: () => inventarioService.getCompraDetalle(purchase!.id),
    enabled: !!purchase && isOpen
  });

  if (!isOpen || !purchase) return null;

  return (
    <Modal title={`Detalle de Compra #${purchase.id.toString().padStart(4, '0')}`} onClose={onClose} maxWidth="2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-zinc-50 dark:bg-zinc-700/30 rounded-xl border border-zinc-100 dark:border-zinc-700">
          <div>
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Documento</p>
            <p className="font-medium text-zinc-800 dark:text-white">{purchase.documento_referencia || 'S/R'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Fecha</p>
            <p className="font-medium text-zinc-800 dark:text-white">{formatDateTimeLocal(purchase.fecha)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Responsable</p>
            <p className="font-medium text-zinc-800 dark:text-white">{purchase.usuario_nombre}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Estado</p>
            <Badge
              label={purchase.estado === 'anulado' ? 'ANULADO' : 'COMPLETADO'}
              variant={purchase.estado === 'anulado' ? 'red' : 'emerald'}
            />
          </div>
          <div className="text-right col-span-2">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Total Invertido</p>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400">S/ {purchase.total.toFixed(2)}</p>
          </div>
        </div>

        <div className="border border-zinc-100 dark:border-zinc-700 rounded-xl overflow-y-auto max-h-[50vh]">
          <table className="w-full text-sm relative">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm shadow-sm">
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
            onClick={onClose}
            className="px-6 font-bold"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
