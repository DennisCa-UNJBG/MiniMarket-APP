import React from 'react';
import { Search, Fingerprint, User } from 'lucide-react';
import { DataTable, type TableColumn } from '../../../../shared/components/ui/DataTable';
import { Badge } from '../../../../shared/components/ui/Badge';
import { EmptyState } from '../../../../shared/components/ui/EmptyState';
import { dateUtils } from '../../../../shared/lib/dateUtils';

interface TabAuditoriasProps {
  filteredLogs: any[];
  logsSearchTerm: string;
  onSearchTermChange: (val: string) => void;
}

export const TabAuditorias: React.FC<TabAuditoriasProps> = ({
  filteredLogs,
  logsSearchTerm,
  onSearchTermChange
}) => {
  const logsColumns: TableColumn<any>[] = [
    {
      key: 'id',
      header: 'ID Central',
      render: (row) => (
        <span className="font-mono text-[10px] font-bold text-zinc-400">
          #{row.id.toString().padStart(5, '0')}
        </span>
      )
    },
    {
      key: 'sucursal_local_id',
      header: 'ID Local',
      render: (row) => (
        <span className="font-mono text-[10px] font-bold text-zinc-500">
          #{row.sucursal_local_id ? row.sucursal_local_id.toString().padStart(5, '0') : 'N/A'}
        </span>
      )
    },
    {
      key: 'fecha',
      header: 'Fecha / Hora',
      render: (row) => (
        <span suppressHydrationWarning className="text-xs text-zinc-500 dark:text-zinc-400">
          {dateUtils.formatUTCtoLocalString(row.created_at)}
        </span>
      )
    },
    {
      key: 'usuario_nombre',
      header: 'Usuario',
      render: (row) => (
        <span className="text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
          <User size={12} className="text-zinc-400" /> {row.usuario_nombre || `Usuario #${row.usuario_id}`}
        </span>
      )
    },
    {
      key: 'accion',
      header: 'Acción',
      align: 'center',
      render: (row) => {
        const accion = row.accion || '';
        let variant: 'blue' | 'emerald' | 'amber' | 'red' | 'sky' | 'gray' = 'gray';

        if (accion.includes('CREAR') || accion.includes('AGREGAR')) variant = 'emerald';
        else if (accion.includes('EDITAR') || accion.includes('ACTUALIZAR') || accion.includes('AJUSTE')) variant = 'blue';
        else if (accion.includes('ELIMINAR') || accion.includes('ANULAR')) variant = 'red';
        else if (accion.includes('LOGIN') || accion.includes('LOGOUT') || accion.includes('SESION')) variant = 'sky';
        else if (accion.includes('ESTADO')) variant = 'amber';

        return <Badge label={accion} variant={variant} className="font-bold text-[10px] tracking-wider" />;
      }
    },
    {
      key: 'tabla',
      header: 'Tabla Afectada',
      render: (row) => (
        <span className="font-mono text-xs px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-700 rounded-md">
          {row.tabla}
        </span>
      )
    },
    {
      key: 'registro_id',
      header: 'Reg. ID',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {row.registro_id}
        </span>
      )
    },
    {
      key: 'detalles',
      header: 'Detalles',
      render: (row) => (
        <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs block" title={row.detalles}>
          {row.detalles || 'Sin detalles adicionales'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Buscador de Logs */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Buscar logs por acción, tabla o detalles..."
          value={logsSearchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
        />
      </div>

      <DataTable
        columns={logsColumns}
        data={filteredLogs}
        keyExtractor={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Fingerprint}
            title="Sin registros de auditoría"
            description="No se han sincronizado logs de auditoría de esta sucursal a la central."
          />
        }
      />
    </div>
  );
};
