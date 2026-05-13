import { useQuery } from '@tanstack/react-query';
import { negocioService } from '../../services/negocioService';

interface VoucherProps {
  venta: any; // Cabecera de la venta
  detalles: any[]; // Items de la venta
}

export function Voucher({ venta, detalles }: VoucherProps) {
  const { data: negocio } = useQuery({
    queryKey: ['negocio'],
    queryFn: () => negocioService.get()
  });

  return (
    <div id="printable-voucher" className="hidden print:block font-mono text-black bg-white p-4 w-[80mm] mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-lg font-black uppercase">
          {negocio?.razon_social || 'Minimarket App'}
        </h1>
        <p className="text-[10px]">RUC: {negocio?.ruc || '10234567890'}</p>
        <p className="text-[10px]">{negocio?.direccion || 'Calle Principal #123 - Tacna'}</p>
        {negocio?.telefono && <p className="text-[10px]">TEL: {negocio.telefono}</p>}
        
        <div className="border-b border-dashed border-black my-2"></div>
        <h2 className="text-xs font-bold">COMPROBANTE DE VENTA</h2>
        <p className="text-xs font-bold">#{venta.id.toString().padStart(5, '0')}</p>
      </div>

      <div className="text-[10px] space-y-1 mb-4">
        <p>FECHA: {new Date(venta.fecha + " UTC").toLocaleDateString()}</p>
        <p>HORA: {new Date(venta.fecha + " UTC").toLocaleTimeString()}</p>
        <p>CAJERO: {venta.usuario_nombre || 'Admin'}</p>
        <p>PAGO: {venta.metodo_pago}</p>
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
          {detalles.map((det, index) => (
            <tr key={index}>
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
        <div className="flex justify-between font-bold">
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
            margin: 0; 
          }
          body * { visibility: hidden; }
          #printable-voucher, #printable-voucher * { visibility: visible; }
          #printable-ticket { display: none; } /* Asegurar que el ID anterior no interfiera */
          #printable-voucher {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 10mm; /* Añadimos padding interno para que el texto no pegue al borde físico */
            background: white;
          }
        }
      `}</style>
    </div>
  );
}
