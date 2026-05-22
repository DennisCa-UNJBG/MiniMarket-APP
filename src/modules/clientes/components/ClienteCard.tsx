import { User, Pencil, Phone, Mail } from 'lucide-react';
import { Tooltip } from '../../../shared/components/ui/Tooltip';
import { Button } from '../../../shared/components/ui/Button';
import type { Cliente } from '../Service';

interface ClienteCardProps {
  cliente: Cliente;
  onEdit: (c: Cliente) => void;
  onViewHistory: (c: Cliente) => void;
}

export function ClienteCard({ cliente, onEdit, onViewHistory }: ClienteCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* Avatar + nombre y Editar */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-800 dark:text-white truncate">{cliente.nombre}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">DNI/RUC: {cliente.dni_ruc || 'Sin Documento'}</p>
          </div>
        </div>

        <Tooltip text="Editar cliente" position="top-right">
          <button
            onClick={() => onEdit(cliente)}
            className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Editar cliente"
          >
            <Pencil size={15} />
          </button>
        </Tooltip>
      </div>

      {/* Contacto */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Phone size={12} /> {cliente.telefono || 'Sin teléfono'}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Mail size={12} /> {cliente.email || 'Sin correo'}
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-700">
        <div className="text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Compras</p>
          <p className="text-sm font-bold text-zinc-800 dark:text-white">{cliente.compras}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Total gastado</p>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">S/ {(cliente.total_gastado || 0).toFixed(2)}</p>
        </div>
        <Tooltip text="Ver historial del cliente" position="top-right">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
            onClick={() => onViewHistory(cliente)}
          >
            Ver historial
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
