import { Printer } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { dateUtils } from '../../../shared/lib/dateUtils';

interface ClienteSaleDetailModalProps {
  selectedSale: any | null;
  saleDetails: any[];
  onClose: () => void;
  onPrint: () => void;
}

export function ClienteSaleDetailModal({
  selectedSale,
  saleDetails,
  onClose,
  onPrint,
}: ClienteSaleDetailModalProps) {
  if (!selectedSale) return null;

  return (
    <Modal
      onClose={onClose}
      title={`Detalle de Venta #${selectedSale.id.toString().padStart(5, '0')}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Cabecera del Detalle */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Fecha</p>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{dateUtils.formatUTCtoLocalDateString(selectedSale.fecha)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Hora</p>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{dateUtils.formatUTCtoLocalTimeString(selectedSale.fecha)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Cajero</p>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{selectedSale.usuario_nombre}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Pago</p>
            <Badge label={selectedSale.metodo_pago} variant={selectedSale.metodo_pago === 'EFECTIVO' ? 'emerald' : 'blue'} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Estado</p>
            <Badge
              label={selectedSale.estado === 'anulado' ? 'ANULADO' : 'COMPLETADO'}
              variant={selectedSale.estado === 'anulado' ? 'red' : 'emerald'}
            />
          </div>
          <div className="col-span-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Cliente</p>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate">
              {selectedSale.cliente_nombre ? `${selectedSale.cliente_nombre} (${selectedSale.cliente_dni_ruc || 'S/D'})` : 'Público en General'}
            </p>
          </div>
        </div>

        {/* Tabla de Items */}
        <div className="border border-zinc-100 dark:border-zinc-700 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-700/50">
              <tr>
                <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase">Producto</th>
                <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase text-center">Cant.</th>
                <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase text-right">Precio</th>
                <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700">
              {saleDetails.map((det: any) => (
                <tr key={det.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 font-medium">{det.producto_nombre}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 text-center">{det.cantidad} {det.unidad_medida}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 text-right">S/ {det.precio_unitario.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white font-bold text-right">S/ {det.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-50/50 dark:bg-zinc-700/20">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">IGV ({selectedSale.igv_porcentaje || 0}%):</td>
                <td className="px-4 py-2 text-right text-sm font-bold text-zinc-700 dark:text-zinc-300">S/ {(selectedSale.igv || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">Subtotal items:</td>
                <td className="px-4 py-2 text-right text-sm font-bold text-zinc-700 dark:text-zinc-300">S/ {selectedSale.total.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">Monto Pagado:</td>
                <td className="px-4 py-2 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">S/ {(selectedSale.monto_pagado || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">Vuelto entregado:</td>
                <td className="px-4 py-2 text-right text-sm font-bold text-orange-600 dark:text-orange-400">S/ {(selectedSale.vuelto || 0).toFixed(2)}</td>
              </tr>
              <tr className="bg-blue-50/30 dark:bg-blue-900/10">
                <td colSpan={3} className="p-4 text-right font-black text-zinc-700 dark:text-zinc-200 text-sm uppercase tracking-tighter">Total Final:</td>
                <td className="p-4 text-right text-xl font-black text-blue-600 dark:text-blue-400">S/ {selectedSale.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-700">
          <Button
            variant="secondary"
            onClick={onClose}
            className="font-bold"
          >
            Cerrar
          </Button>
          <Button
            onClick={onPrint}
            icon={<Printer size={18} />}
            className="font-bold shadow-lg shadow-blue-200 dark:shadow-none"
          >
            Imprimir Boleta
          </Button>
        </div>
      </div>
    </Modal>
  );
}
