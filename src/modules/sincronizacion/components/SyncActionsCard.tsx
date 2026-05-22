import { CloudSync } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ventaService } from '../../ventas/Service';
import { syncService } from '../Service';
import { notificationService } from '../../../shared/lib/notifications';
import { Button } from '../../../shared/components/ui/Button';

export function SyncActionsCard() {
  const queryClient = useQueryClient();

  const { data: isCentral = false } = useQuery({
    queryKey: ['server-status'],
    queryFn: () => invoke<boolean>('is_server_running')
  });

  const { data: pendingSales = 0, refetch: refetchPending } = useQuery({
    queryKey: ['pending-sales'],
    queryFn: () => ventaService.getVentasPendientes(),
    enabled: !isCentral
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      notificationService.info('Sincronizando', 'Enviando ventas y descargando catálogo actualizado...');

      const [
        { enviadas },
        { enviadas: kEnviadas },
        _,
        { creados: pCreados, actualizados: pActualizados },
        { creados: uCreados, actualizados: uActualizados }
      ] = await Promise.all([
        syncService.pushSales(),
        syncService.pushKardex(),
        syncService.pushStockLevels(),
        syncService.pullProducts(),
        syncService.pullUsers()
      ]);

      return { enviadas, kEnviadas, pCreados, pActualizados, uCreados, uActualizados };
    },
    onSuccess: (data) => {
      notificationService.success(
        'Sincronización Completa',
        `Enviados: ${data.enviadas} ventas y ${data.kEnviadas} movimientos. Stock OK. Catálogo: +${data.pCreados}/~${data.pActualizados}. Usuarios: +${data.uCreados}/~${data.uActualizados}.`
      );
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      notificationService.error('Error de Sincronización', error.message);
    }
  });

  const handlePushData = () => {
    syncMutation.mutate();
  };

  if (isCentral) return null;

  return (
    <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sidebar de sincronización local */}
      <div className="lg:col-span-2 p-8 bg-white dark:bg-zinc-800 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-700 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 size-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

        <div className="relative">
          <div className="size-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
            <CloudSync size={24} />
          </div>

          <h4 className="text-xl font-semibold text-zinc-800 dark:text-white mb-4">Sincronización Local</h4>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
            Envía tus ventas realizadas y descarga los últimos productos y personal autorizado desde la Sede Central.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold border-b border-zinc-50 dark:border-zinc-700 pb-2">
              <span className="text-zinc-400 uppercase tracking-wider">Ventas pendientes</span>
              <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-[10px]">
                {pendingSales} registros
              </span>
            </div>

            <Button
              onClick={handlePushData}
              isLoading={syncMutation.isPending}
              fullWidth
              size="lg"
              className="rounded-2xl font-black shadow-lg shadow-blue-100 dark:shadow-none"
            >
              Sincronizar Ahora
            </Button>
          </div>
        </div>
      </div>

      {/* Pasos de Configuración */}
      <div className="p-8 bg-white dark:bg-zinc-800 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-700">
        <h4 className="text-sm font-semibold text-zinc-800 dark:text-white mb-4 uppercase tracking-widest">Pasos de Configuración</h4>
        <ul className="space-y-4">
          {[
            'Obtén la URL de la Central.',
            'Pega la URL en Configuración.',
            'Verifica que tu ID de Sede sea correcto.',
            'Presiona Sincronizar para descargar datos.'
          ].map((step, i) => (
            <li key={step} className="flex gap-3 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
              <span className="flex-shrink-0 size-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-[10px]">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
