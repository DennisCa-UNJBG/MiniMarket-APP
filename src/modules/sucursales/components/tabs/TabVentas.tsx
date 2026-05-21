import React, { useState } from 'react';
import { Search, Calendar, Clock, User, Banknote, CreditCard, Receipt, ShoppingCart } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { sucursalService } from '../../Service';
import { dateUtils } from '../../../../lib/dateUtils';
import { DataTable, type TableColumn } from '../../../../components/ui/DataTable';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Tooltip } from '../../../../components/ui/Tooltip';
import { Modal } from '../../../../components/ui/Modal';
import { EmptyState } from '../../../../components/ui/EmptyState';

interface TabVentasProps {
  ventas: any[];
  filteredVentas: any[];
  ventasSearchTerm: string;
  onSearchTermChange: (val: string) => void;
}

export const TabVentas: React.FC<TabVentasProps> = ({
  ventas,
  filteredVentas,
  ventasSearchTerm,
  onSearchTermChange
}) => {
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [saleDetails, setSaleDetails] = useState<any[]>([]);

  const loadSaleDetailsMutation = useMutation({
    mutationFn: (saleId: number) => sucursalService.getVentaDetalles(saleId),
    onSuccess: (details, saleId) => {
      setSaleDetails(details);
      setSelectedSale(ventas.find((v: any) => v.id === saleId));
    }
  });

  const ventasColumns: TableColumn<any>[] = [
    {
      key: 'id',
      header: 'N° Venta',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
          #{row.id.toString().padStart(5, '0')}
        </span>
      )
    },
    {
      key: 'fecha',
      header: 'Fecha / Hora',
      render: (row) => (
        <div className="flex flex-col">
          <span suppressHydrationWarning className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
            <Calendar size={10} /> {dateUtils.formatUTCtoLocalDateString(row.fecha)}
          </span>
          <span suppressHydrationWarning className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Clock size={10} /> {dateUtils.formatUTCtoLocalTimeString(row.fecha)}
          </span>
        </div>
      )
    },
    {
      key: 'usuario_nombre',
      header: 'Cajero',
      render: (row) => (
        <span className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
          <User size={12} /> {row.usuario_nombre}
        </span>
      )
    },
    {
      key: 'metodo_pago',
      header: 'Método Pago',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.metodo_pago === 'EFECTIVO' ? (
            <Banknote size={12} className="text-emerald-500" />
          ) : (
            <CreditCard size={12} className="text-blue-500" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider">{row.metodo_pago}</span>
        </div>
      )
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-zinc-900 dark:text-white">S/ {row.total.toFixed(2)}</span>
      )
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <Badge
          label={row.estado === 'anulado' ? 'ANULADO' : 'COMPLETADO'}
          variant={row.estado === 'anulado' ? 'red' : 'emerald'}
        />
      )
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (row) => (
        <Tooltip text="Detalle de Boleta" position="top-right">
          <Button
            onClick={() => loadSaleDetailsMutation.mutate(row.id)}
            variant="ghost"
            size="sm"
            icon={<Receipt size={13} />}
            className="text-[10px] font-bold uppercase tracking-tighter text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
          >
            Ver Boleta
          </Button>
        </Tooltip>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Buscador de Ventas */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por N° Venta o Cajero..."
          value={ventasSearchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
        />
      </div>

      <DataTable
        columns={ventasColumns}
        data={filteredVentas}
        keyExtractor={(row) => row.id}
        emptyState={
          <EmptyState
            icon={ShoppingCart}
            title="Sin ventas sincronizadas"
            description="Esta sucursal aún no ha sincronizado ventas con la sede central."
          />
        }
      />

      {/* Modal de Detalle de Venta */}
      {selectedSale && (
        <Modal
          onClose={() => setSelectedSale(null)}
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
                  {saleDetails.map((det) => (
                    <tr key={det.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 font-medium">{det.producto_nombre}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 text-center">{det.cantidad} {det.unidad_medida || 'UND'}</td>
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
                  {selectedSale.monto_pagado > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">Monto Pagado:</td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">S/ {(selectedSale.monto_pagado || 0).toFixed(2)}</td>
                    </tr>
                  )}
                  {selectedSale.vuelto > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">Vuelto entregado:</td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-orange-600 dark:text-orange-400">S/ {(selectedSale.vuelto || 0).toFixed(2)}</td>
                    </tr>
                  )}
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
                onClick={() => setSelectedSale(null)}
                className="font-bold"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
