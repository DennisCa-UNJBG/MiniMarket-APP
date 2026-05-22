import { RefreshCw } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../shared/components/ui/Badge';
import { CentralServerCard } from './components/CentralServerCard';
import { SyncActionsCard } from './components/SyncActionsCard';

export function Sincronizacion() {
  // Queries
  const { data: isCentral = false, isLoading: isLoadingServer } = useQuery({
    queryKey: ['server-status'],
    queryFn: () => invoke<boolean>('is_server_running')
  });

  if (isLoadingServer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 animate-in fade-in duration-500">
        <div className="relative">
          <div className="size-16 rounded-full border-4 border-blue-50 dark:border-blue-900/20" />
          <RefreshCw size={32} className="absolute inset-0 m-auto animate-spin text-blue-500" />
        </div>
        <p className="text-sm font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Sincronizando Red…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-zinc-800 dark:text-white tracking-tight">Panel de Sincronización</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Control maestro de la red y el servidor de datos central.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            label={isCentral ? 'MODO CENTRAL ACTIVO' : 'MODO LOCAL'}
            variant={isCentral ? 'emerald' : 'gray'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <CentralServerCard />
        <SyncActionsCard />
      </div>

      <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl border border-zinc-100 dark:border-zinc-800">
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 italic">
          {isCentral
            ? "El servidor utiliza el puerto 8080 por defecto. Asegúrate de permitir el tráfico en tu firewall."
            : "La sincronización requiere conexión activa a la red local o internet hacia la Sede Central."
          }
        </p>
      </div>
    </div>
  );
}
