import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Server, RefreshCw, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { systemConfigService, type SucursalConfig } from '../systemConfigService';
import { useSync } from '../../sincronizacion/hooks/useSync';
import { notificationService } from '../../../shared/lib/notifications';
import { Tooltip } from '../../../shared/components/ui/Tooltip';
import { Button } from '../../../shared/components/ui/Button';
import { dateUtils } from '../../../shared/lib/dateUtils';

const formatDateTimeLocal = (dateStr: string) => {
  return dateUtils.formatUTCtoLocalString(dateStr);
};

const DEFAULT_SUCURSAL: SucursalConfig = { sucursal_id: '', nombre_sucursal: '', api_url_central: '' };

export function SedesSection({ initialData }: { initialData: SucursalConfig | null }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [localSucursal, setLocalSucursal] = useState<SucursalConfig>(() => initialData ?? DEFAULT_SUCURSAL);

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { data: isCentral = false } = useQuery({
    queryKey: ['server-status'],
    queryFn: () => invoke<boolean>('is_server_running')
  });

  const saveSucursalMutation = useMutation({
    mutationFn: (data: SucursalConfig) => systemConfigService.saveConfig(data, user?.id || 1),
    onSuccess: () => {
      notificationService.success('Configuración Guardada', 'La identidad de la sede se actualizó correctamente.');
      queryClient.invalidateQueries({ queryKey: ['sucursal-config'] });
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: () => systemConfigService.testConnection(localSucursal.api_url_central, localSucursal.sucursal_id),
    onSuccess: () => {
      notificationService.success('Conexión Exitosa', 'La sede central está disponible y lista.');
      setConnectionStatus('success');
      queryClient.invalidateQueries({ queryKey: ['server-status'] });
    },
    onError: (error: any) => {
      notificationService.error('Conexión Fallida', error.message);
      setConnectionStatus('error');
    }
  });

  const syncMutation = useSync({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sucursal-config'] });
    }
  });

  const handleSucursalSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSucursalMutation.mutate(localSucursal);
  };

  const handleTestConnection = () => {
    if (!localSucursal.api_url_central || !localSucursal.sucursal_id) {
      notificationService.error('Configuración Incompleta', 'Ingresa el ID de Sede y la URL de la central.');
      return;
    }
    testConnectionMutation.mutate();
  };

  const handleSync = () => {
    if (isCentral) {
      notificationService.info('Sede Principal', 'Las sedes principales no sincronizan productos de otros, solo los sirven.');
      return;
    }
    syncMutation.mutate();
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow relative">
      {isCentral && (
        <div className="absolute inset-0 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-[1.5px] z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 rounded-2xl mb-3 border border-amber-100 dark:border-amber-900/30">
            <Server size={24} />
          </div>
          <h4 className="text-sm font-bold text-zinc-800 dark:text-white mb-1">Sección Bloqueada</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px]">
            Esta sección está deshabilitada porque el equipo está configurado como <strong>Sede Central</strong> (Servidor activo).
          </p>
        </div>
      )}
      <div className="p-6 border-b border-zinc-50 dark:border-zinc-700/50 bg-zinc-50/30 dark:bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
            <Server size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-white tracking-tight">Sedes y Sincronización</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Configura la identidad de esta sucursal y su conexión central.</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <form onSubmit={handleSucursalSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="id-sede-unico" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">ID de Sede Único</label>
              <input
                id="id-sede-unico"
                type="text"
                value={localSucursal.sucursal_id}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalSucursal(prev => ({ ...prev, sucursal_id: val }));
                }}
                placeholder="Ej: SEDE-01"
                className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nombre-sucursal-config" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Nombre de Sucursal</label>
              <input
                id="nombre-sucursal-config"
                type="text"
                value={localSucursal.nombre_sucursal}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalSucursal(prev => ({ ...prev, nombre_sucursal: val }));
                }}
                placeholder="Ej: Sucursal Centro"
                className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="url-api-central" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">URL API Sede Central</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="url-api-central"
                      type="url"
                      value={localSucursal.api_url_central}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalSucursal(prev => ({ ...prev, api_url_central: val }));
                        setConnectionStatus('idle');
                      }}
                      placeholder="https://central.tu-negocio.com/api"
                      className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {connectionStatus === 'success' && <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                      {connectionStatus === 'error' && <div className="size-2 rounded-full bg-red-500" />}
                    </div>
                  </div>
                  <Tooltip text="Probar Conexión" position="top">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleTestConnection}
                      isLoading={testConnectionMutation.isPending}
                      disabled={isCentral}
                      className={`px-4 py-2.5 rounded-2xl h-full ${connectionStatus === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                          : connectionStatus === 'error'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
                        }`}
                      icon={<RefreshCw size={18} className={testConnectionMutation.isPending ? 'animate-spin' : ''} />}
                    />
                  </Tooltip>
                </div>
              </div>
            </div>

            {!isCentral && (
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSync}
                  isLoading={syncMutation.isPending}
                  disabled={!localSucursal.api_url_central}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-2xl hover:bg-blue-100 border border-blue-100 dark:border-blue-800"
                  icon={<RefreshCw size={18} className={syncMutation.isPending ? 'animate-spin' : ''} />}
                >
                  Sincronizar con Sede Central
                </Button>
                {localSucursal.ultima_sincronizacion && (
                  <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter mt-1 text-right">
                    Última: {formatDateTimeLocal(localSucursal.ultima_sincronizacion)}
                  </p>
                )}
              </div>
            )}
          </div>
          <Button
            type="submit"
            isLoading={saveSucursalMutation.isPending}
            className="w-full sm:w-auto px-6 py-2.5 font-bold rounded-2xl"
            icon={<Save size={18} />}
          >
            Guardar Identidad de Sede
          </Button>
        </form>
      </div>
    </div>
  );
}
