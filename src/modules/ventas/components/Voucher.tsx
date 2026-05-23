import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { negocioService } from '../../configuracion/negocioService';
import { dateUtils } from '../../../shared/lib/dateUtils';

interface VoucherProps {
  venta: any; // Cabecera de la venta
  detalles: any[]; // Items de la venta
}

export function Voucher({ venta, detalles }: VoucherProps) {
  const { data: negocio } = useQuery({
    queryKey: ['negocio'],
    queryFn: () => negocioService.get()
  });

  // Extraemos y formateamos la fecha/hora para evitar cálculos en JSX y cumplir con buenas prácticas
  const fechaStr = dateUtils.formatUTCtoLocalDateString(venta.fecha);
  const horaStr = dateUtils.formatUTCtoLocalTimeString(venta.fecha);

  const voucherMarkup = (
    <div id="printable-voucher" className="hidden print:block font-mono text-black bg-white p-4 w-[80mm] mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-lg font-semibold uppercase">
          {negocio?.razon_social || 'Minimarket App'}
        </h1>
        <p className="text-[10px]">RUC: {negocio?.ruc || '10234567890'}</p>
        <p className="text-[10px]">{negocio?.direccion || 'Calle Principal #123 - Tacna'}</p>
        {negocio?.telefono && <p className="text-[10px]">TEL: {negocio.telefono}</p>}
        
        <div className="border-b border-dashed border-black my-2"></div>
        <h2 className="text-xs font-semibold">COMPROBANTE DE VENTA</h2>
        <p className="text-xs font-bold">#{venta.id.toString().padStart(5, '0')}</p>
      </div>

      <div className="text-[10px] space-y-1 mb-4">
        <p suppressHydrationWarning>FECHA: {fechaStr}</p>
        <p suppressHydrationWarning>HORA: {horaStr}</p>
        <p>CAJERO: {venta.usuario_nombre || 'Admin'}</p>
        <p>PAGO: {venta.metodo_pago}</p>
        <p>CLIENTE: {venta.cliente_nombre || ''}</p>
        <p>DNI/RUC: {venta.cliente_dni_ruc || ''}</p>
      </div>

      <div className="border-b border-dashed border-black my-2"></div>

      <table className="w-full text-[10px] mb-4 border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">DESCRIPCIÓN</th>
            <th className="text-center py-1">CANT</th>
            <th className="text-right py-1">P.U.</th>
            <th className="text-right py-1">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {detalles.map((det) => (
            <tr key={det.id}>
              <td className="py-1 uppercase">{det.producto_nombre}</td>
              <td className="text-center py-1">{det.cantidad}</td>
              <td className="text-right py-1">{det.precio_unitario.toFixed(2)}</td>
              <td className="text-right py-1">{det.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-b border-dashed border-black my-2"></div>

      <div className="text-[10px] space-y-1">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span>S/ {(venta.total - (venta.igv || 0)).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>IGV ({venta.igv_porcentaje || 0}%):</span>
          <span>S/ {(venta.igv || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-xs pt-1 border-t border-black/10">
          <span>TOTAL A PAGAR:</span>
          <span>S/ {venta.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>MONTO RECIBIDO:</span>
          <span>S/ {(venta.monto_pagado || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>VUELTO:</span>
          <span>S/ {(venta.vuelto || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center mt-6">
        <p className="text-[9px] italic">¡Gracias por su preferencia!</p>
        <p className="text-[8px] mt-2">Este documento no tiene valor tributario</p>
      </div>
      
      <style>{`
        @media print {
          @page { 
            size: 80mm auto;
            margin: 0; 
          }
          html, body {
            width: 80mm;
            background: white !important;
            margin: 0;
            padding: 0;
          }
          #root {
            display: none !important;
          }
          #printable-voucher {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 4mm;
            box-sizing: border-box;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(voucherMarkup, document.body);
}
