import React from 'react';
import { Search, History } from 'lucide-react';
import { DataTable, type TableColumn } from '../../../../shared/components/ui/DataTable';
import { Badge } from '../../../../shared/components/ui/Badge';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';

interface TabKardexProps {
  filteredKardex: any[];
  kardexSearchTerm: string;
  onSearchTermChange: (val: string) => void;
}

export const TabKardex: React.FC<TabKardexProps> = ({
  filteredKardex,
  kardexSearchTerm,
  onSearchTermChange
}) => {
  const kardexColumns: TableColumn<any>[] = [
    {
      key: 'fecha',
      header: 'Fecha / Hora',
      render: (row) => (
        <span suppressHydrationWarning className="text-xs text-zinc-500 dark:text-zinc-400">
          {new Date(row.fecha).toLocaleString()}
        </span>
      )
    },
    {
      key: 'producto_nombre',
      header: 'Producto',
      render: (row) => (
        <span className="text-xs font-bold text-zinc-800 dark:text-white">
          {row.producto_nombre || 'Producto Desconocido'}
        </span>
      )
    },
    {
      key: 'tipo_movimiento',
      header: 'Movimiento',
      align: 'center',
      render: (row) => {
        let variant: 'emerald' | 'red' | 'amber' = 'emerald';
        if (row.tipo_movimiento === 'SALIDA') variant = 'red';
        if (row.tipo_movimiento === 'AJUSTE') variant = 'amber';
        return <Badge label={row.tipo_movimiento} variant={variant} />;
      }
    },
    {
      key: 'cantidad',
      header: 'Cantidad',
      align: 'center',
      render: (row) => (
        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
          {row.cantidad}
        </span>
      )
    },
    {
      key: 'saldo_posterior',
      header: 'Stock Resultante',
      align: 'center',
      render: (row) => (
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          {row.saldo_posterior}
        </span>
      )
    },
    {
      key: 'referencia',
      header: 'Referencia',
      render: (row) => (
        <span className="text-xs font-mono text-zinc-400">
          {row.referencia || 'Sin referencia'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Buscador de Kardex */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por producto o tipo de movimiento..."
          value={kardexSearchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
        />
      </div>

      <DataTable
        columns={kardexColumns}
        data={filteredKardex}
        keyExtractor={(row) => row.id}
        emptyState={
          <EmptyState
            icon={History}
            title="Sin movimientos de Kardex"
            description="No hay registro de movimientos de inventario reportados por la sucursal."
          />
        }
      />
    </div>
  );
};
