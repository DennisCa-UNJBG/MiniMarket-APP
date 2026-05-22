import React, { useState } from 'react';
import { Search, Calendar, Clock, User, Receipt, FileText } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { sucursalService } from '../../Service';
import { dateUtils } from '../../../../shared/lib/dateUtils';
import { DataTable, type TableColumn } from '../../../../shared/components/ui/DataTable';
import { Badge } from '../../../../shared/components/ui/Badge';
import { Button } from '../../../../shared/components/ui/Button';
import { Tooltip } from '../../../../shared/components/ui/Tooltip';
import { Modal } from '../../../../shared/components/ui/Modal';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';

interface TabComprasProps {
  compras: any[];
  filteredCompras: any[];
  comprasSearchTerm: string;
  onSearchTermChange: (val: string) => void;
}

export const TabCompras: React.FC<TabComprasProps> = ({
  compras,
  filteredCompras,
  comprasSearchTerm,
  onSearchTermChange
}) => {
  const [selectedCompra, setSelectedCompra] = useState<any | null>(null);
  const [compraDetails, setCompraDetails] = useState<any[]>([]);

  const loadCompraDetailsMutation = useMutation({
    mutationFn: (compraId: number) => sucursalService.getCompraDetalles(compraId),
    onSuccess: (details, compraId) => {
      setCompraDetails(details);
      setSelectedCompra(compras.find((c: any) => c.id === compraId));
    }
  });

  const comprasColumns: TableColumn<any>[] = [
    {
      key: 'id',
      header: 'N° Compra',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
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
      key: 'documento_referencia',
      header: 'Doc. Referencia',
      render: (row) => (
        <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
          {row.documento_referencia || 'S/D'}
        </span>
      )
    },
    {
      key: 'usuario_nombre',
      header: 'Usuario',
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
        <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-700 dark:text-zinc-300">
          {row.metodo_pago}
        </span>
      )
    },
    {
      key: 'total',
      header: 'Total Costo',
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
          label={row.estado.toUpperCase()}
          variant={row.estado === 'anulado' ? 'red' : 'emerald'}
        />
      )
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (row) => (
        <Tooltip text="Detalle de Compra" position="top-right">
          <Button
            onClick={() => loadCompraDetailsMutation.mutate(row.id)}
            variant="ghost"
            size="sm"
            icon={<Receipt size={13} />}
            className="text-[10px] font-bold uppercase tracking-tighter text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-amber-100 dark:border-amber-800"
          >
            Ver Detalle
          </Button>
        </Tooltip>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Buscador de Compras */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Buscar compra por N° o Usuario..."
          value={comprasSearchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
        />
      </div>

      <DataTable
        columns={comprasColumns}
        data={filteredCompras}
        keyExtractor={(row) => row.id}
        emptyState={
          <EmptyState
            icon={FileText}
            title="Sin compras sincronizadas"
            description="Esta sucursal aún no ha sincronizado compras locales con la sede central."
          />
        }
      />

      {/* Modal de Detalle de Compra */}
      {selectedCompra && (
        <Modal
          onClose={() => setSelectedCompra(null)}
          title={`Detalle de Compra #${selectedCompra.id.toString().padStart(5, '0')}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Cabecera del Detalle */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Fecha</p>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{dateUtils.formatUTCtoLocalDateString(selectedCompra.fecha)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Hora</p>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{dateUtils.formatUTCtoLocalTimeString(selectedCompra.fecha)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Usuario</p>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{selectedCompra.usuario_nombre}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Pago</p>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full text-zinc-700 dark:text-zinc-200">
                  {selectedCompra.metodo_pago}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Estado</p>
                <Badge
                  label={selectedCompra.estado.toUpperCase()}
                  variant={selectedCompra.estado === 'anulado' ? 'red' : 'emerald'}
                />
              </div>
              <div className="col-span-3">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Doc. Referencia</p>
                <p className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-200 truncate">
                  {selectedCompra.documento_referencia || 'Sin documento asociado'}
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
                    <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase text-right">Costo Unit.</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700">
                  {compraDetails.map((det) => (
                    <tr key={det.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 font-medium">{det.producto_nombre}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 text-center">{det.cantidad} {det.unidad_medida || 'UND'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 text-right">S/ {det.costo_unitario.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white font-bold text-right">S/ {det.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-50/50 dark:bg-zinc-700/20">
                  <tr className="bg-amber-50/30 dark:bg-amber-900/10">
                    <td colSpan={3} className="p-4 text-right font-black text-zinc-700 dark:text-zinc-200 text-sm uppercase tracking-tighter">Total Costo:</td>
                    <td className="p-4 text-right text-xl font-black text-amber-600 dark:text-amber-400">S/ {selectedCompra.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-700">
              <Button
                variant="secondary"
                onClick={() => setSelectedCompra(null)}
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
