import { useState } from 'react';
import { CreditCard, Banknote } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ventaService } from '../Service';
import { notificationService } from '../../../lib/notifications';
import { type Product } from '../../productos/Service';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  igvAmount: number;
  hasIGV: boolean;
  igvPercent: number;
  cart: CartItem[];
  user: any;
  onSuccess: () => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  total,
  igvAmount,
  hasIGV,
  igvPercent,
  cart,
  user,
  onSuccess
}: CheckoutModalProps) {
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
  const [amountPaid, setAmountPaid] = useState('');

  const registrarVentaMutation = useMutation({
    mutationFn: (ventaData: any) => ventaService.registrarVenta(ventaData),
    onSuccess: async (data) => {
      onClose();
      await notificationService.successWithConfirm('¡Venta completada!', `Vuelto: S/ ${data.vuelto.toFixed(2)}`);
      
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['sales-chart'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      
      onSuccess();
    }
  });

  const paidNumber = parseFloat(amountPaid) || 0;
  const roundedTotal = parseFloat(total.toFixed(2));
  const change = Math.max(0, paidNumber - roundedTotal);

  if (!isOpen) return null;

  return (
    <Modal 
      title="Completar Venta" 
      onClose={onClose}
      maxWidth="md"
    >
      <div className="-mx-6 -mt-5 mb-6">
        <div className="bg-blue-600 p-8 text-center text-white">
          <p className="text-blue-200 text-sm font-medium mb-1">Monto a cobrar</p>
          <p className="text-4xl font-black">S/ {roundedTotal.toFixed(2)}</p>
        </div>
      </div>
        
      <div className="space-y-6">
        {/* Métodos de pago */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setPaymentMethod('EFECTIVO')}
            className={`flex-col h-auto py-4 border-2 transition-all ${paymentMethod === 'EFECTIVO' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-transparent opacity-60'}`}
            icon={<Banknote size={24} />}
          >
            <span>Efectivo</span>
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => {
              setPaymentMethod('TARJETA');
              setAmountPaid(roundedTotal.toFixed(2));
            }}
            className={`flex-col h-auto py-4 border-2 transition-all ${paymentMethod === 'TARJETA' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-transparent opacity-60'}`}
            icon={<CreditCard size={24} />}
          >
            <span>Tarjeta / Yape</span>
          </Button>
        </div>

        {/* Input de Monto */}
        <div className="space-y-4">
          <Input
            label={paymentMethod === 'EFECTIVO' ? "Monto recibido (S/)" : "Monto exacto (Tarjeta/Yape)"}
            type="number"
            disabled={paymentMethod === 'TARJETA'}
            autoFocus
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            icon={<span className="text-zinc-400 font-bold">S/</span>}
            placeholder="0.00"
            className="text-xl font-bold"
          />

          {/* Vuelto / Estado del Pago */}
          <div className={`p-4 rounded-xl flex justify-between items-center transition-colors ${
            paidNumber >= roundedTotal 
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
              : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800'
          }`}>
            <span className="font-semibold">{paidNumber >= roundedTotal ? 'Vuelto:' : 'Pendiente:'}</span>
            <span className="text-2xl font-black">S/ {Math.abs(change).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            variant="secondary" 
            onClick={onClose}
            className="w-full"
          >
            Volver
          </Button>
          <Button 
            disabled={paymentMethod === 'EFECTIVO' && paidNumber < roundedTotal}
            isLoading={registrarVentaMutation.isPending}
            onClick={() => {
              const ventaData = {
                usuario_id: user?.id || 1,
                total: roundedTotal,
                igv: parseFloat(igvAmount.toFixed(2)),
                igv_porcentaje: hasIGV ? igvPercent : 0,
                metodo_pago: paymentMethod,
                monto_pagado: paidNumber,
                vuelto: parseFloat(change.toFixed(2)),
                items: cart.map(i => ({
                  producto_id: i.product.id,
                  cantidad: i.quantity,
                  precio_unitario: i.product.precio_venta || 0
                }))
              };
              registrarVentaMutation.mutate(ventaData);
            }}
            className="w-full flex-[2]"
          >
            Confirmar Pago
          </Button>
        </div>
      </div>
    </Modal>
  );
}
