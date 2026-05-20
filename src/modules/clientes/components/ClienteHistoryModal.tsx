import { Loader2, ShoppingCart, Banknote, CreditCard } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { dateUtils } from '../../../lib/dateUtils';
import type { Cliente } from '../Service';

interface ClienteHistoryModalProps {
  showHistoryModal: boolean;
  selectedHistoryClient: Cliente | null;
  isLoadingHistory: boolean;
  historyData: any;
  historyPage: number;
  onClose: () => void;
  onPageChange: (page: number) => void;
  onFetchDetails: (saleId: number) => void;
}

export function ClienteHistoryModal({
  showHistoryModal,
  selectedHistoryClient,
  isLoadingHistory,
  historyData,
  historyPage,
  onClose,
  onPageChange,
  onFetchDetails,
}: ClienteHistoryModalProps) {
  if (!showHistoryModal || !selectedHistoryClient) return null;

  return (
    <Modal
      title={`Historial de Compras: ${selectedHistoryClient.nombre}`}
      onClose={onClose}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-150 dark:border-zinc-700/60">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Documento</p>
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{selectedHistoryClient.dni_ruc || 'Sin Documento'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Total Compras</p>
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{selectedHistoryClient.compras} transacciones</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Monto Acumulado</p>
            <p className="text-xs font-black text-blue-600 dark:text-blue-400">S/ {(selectedHistoryClient.total_gastado || 0).toFixed(2)}</p>
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-8 text-blue-600 animate-spin" />
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Cargando compras...</p>
          </div>
        ) : !historyData || historyData.data.length === 0 ? (
          <div className="h-48 border border-zinc-100 dark:border-zinc-700 rounded-xl flex items-center justify-center">
            <EmptyState
              icon={ShoppingCart}
              title="Sin compras registradas"
              description="Este cliente no tiene compras asociadas en el sistema todavía."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-700 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-700">
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider">N° Venta</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider">Fecha / Hora</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider">Pago</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider text-right">Total</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                  {historyData.data.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-750/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        #{sale.id.toString().padStart(5, '0')}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        <div className="flex flex-col">
                          <span className="font-semibold">{dateUtils.formatUTCtoLocalDateString(sale.fecha)}</span>
                          <span className="text-[10px] text-zinc-400">{dateUtils.formatUTCtoLocalTimeString(sale.fecha)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase text-zinc-700 dark:text-zinc-300">
                          {sale.metodo_pago === 'EFECTIVO' ? (
                            <Banknote size={12} className="text-emerald-500" />
                          ) : (
                            <CreditCard size={12} className="text-blue-500" />
                          )}
                          {sale.metodo_pago}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          label={sale.estado === 'anulado' ? 'ANULADO' : 'COMPLETADO'} 
                          variant={sale.estado === 'anulado' ? 'red' : 'emerald'} 
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                        S/ {sale.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] font-bold uppercase tracking-tight text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 hover:bg-blue-50 px-2.5 py-1"
                          onClick={() => onFetchDetails(sale.id)}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación Historial */}
            {historyData.total > 5 && (
              <div className="flex items-center justify-between px-2 pt-2 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Página <span className="font-bold">{historyPage}</span> de {Math.ceil(historyData.total / 5)}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={historyPage === 1}
                    onClick={() => onPageChange(historyPage - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={historyPage === Math.ceil(historyData.total / 5)}
                    onClick={() => onPageChange(historyPage + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
