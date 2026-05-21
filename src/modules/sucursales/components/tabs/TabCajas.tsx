import React from 'react';
import { Search, User, Wallet } from 'lucide-react';
import { DataTable, type TableColumn } from '../../../../components/ui/DataTable';
import { Badge } from '../../../../components/ui/Badge';
import { EmptyState } from '../../../../components/ui/EmptyState';

interface TabCajasProps {
  filteredCajas: any[];
  cajasSearchTerm: string;
  onSearchTermChange: (val: string) => void;
}

export const TabCajas: React.FC<TabCajasProps> = ({
  filteredCajas,
  cajasSearchTerm,
  onSearchTermChange
}) => {
  const cajasColumns: TableColumn<any>[] = [
    {
      key: 'id',
      header: 'Caja ID',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
          #{row.id.toString().padStart(4, '0')}
        </span>
      )
    },
    {
      key: 'usuario_nombre',
      header: 'Cajero / Usuario',
      render: (row) => (
        <span className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
          <User size={12} /> {row.usuario_nombre}
        </span>
      )
    },
    {
      key: 'fecha_apertura',
      header: 'Apertura',
      render: (row) => (
        <span suppressHydrationWarning className="text-xs text-zinc-500 dark:text-zinc-400">
          {new Date(row.fecha_apertura).toLocaleString()}
        </span>
      )
    },
    {
      key: 'fecha_cierre',
      header: 'Cierre',
      render: (row) => (
        <span suppressHydrationWarning className="text-xs text-zinc-500 dark:text-zinc-400">
          {row.fecha_cierre ? new Date(row.fecha_cierre).toLocaleString() : 'Abierta'}
        </span>
      )
    },
    {
      key: 'monto_inicial',
      header: 'Monto Inicial',
      align: 'right',
      render: (row) => (
        <span className="text-xs text-zinc-600 dark:text-zinc-400">S/ {row.monto_inicial.toFixed(2)}</span>
      )
    },
    {
      key: 'monto_esperado',
      header: 'Esperado en Ventas',
      align: 'right',
      render: (row) => (
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          S/ {(row.monto_esperado || 0).toFixed(2)}
        </span>
      )
    },
    {
      key: 'monto_final',
      header: 'Arqueo Final (Real)',
      align: 'right',
      render: (row) => (
        <span className="text-xs font-bold text-zinc-900 dark:text-white">
          {row.monto_final !== null ? `S/ ${row.monto_final.toFixed(2)}` : 'N/C'}
        </span>
      )
    },
    {
      key: 'diferencia',
      header: 'Diferencia (Cuadre)',
      align: 'right',
      render: (row) => {
        if (row.monto_final === null) return <span className="text-zinc-400 text-xs">-</span>;
        
        // La diferencia es Monto Final - Monto Esperado
        const dif = row.monto_final - row.monto_esperado;
        if (dif === 0) {
          return <span className="text-xs font-bold text-emerald-500">S/ 0.00 (OK)</span>;
        } else if (dif < 0) {
          return <span className="text-xs font-bold text-rose-500">S/ {dif.toFixed(2)} (Faltante)</span>;
        } else {
          return <span className="text-xs font-bold text-blue-500">S/ +{dif.toFixed(2)} (Sobrante)</span>;
        }
      }
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <Badge
          label={row.estado.toUpperCase()}
          variant={row.estado === 'abierta' ? 'emerald' : 'gray'}
        />
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Buscador de Cajas */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Buscar caja por ID o Cajero..."
          value={cajasSearchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
        />
      </div>

      <DataTable
        columns={cajasColumns}
        data={filteredCajas}
        keyExtractor={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Wallet}
            title="Sin sesiones de caja"
            description="No hay registros de arqueos ni cierres de caja en esta sucursal."
          />
        }
      />
    </div>
  );
};
