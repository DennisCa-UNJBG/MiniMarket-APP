import { useMemo, useState } from 'react';
import { Server, Wifi, Globe, Copy, Building2, Database, ShieldCheck } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../../../shared/lib/notifications';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { sucursalService } from '../../sucursales/Service';

export function CentralServerCard() {
  const queryClient = useQueryClient();

  const [autoStartEnabled, setAutoStartEnabled] = useState(() => {
    return localStorage.getItem('central_server_auto_start') === 'true';
  });

  const handleToggleAutoStart = (checked: boolean) => {
    setAutoStartEnabled(checked);
    localStorage.setItem('central_server_auto_start', checked ? 'true' : 'false');
    notificationService.success(
      checked ? 'Autoinicio Activado' : 'Autoinicio Desactivado',
      checked ? 'El servidor se iniciará con la aplicación.' : 'El servidor requerirá inicio manual.'
    );
  };

  const { data: isCentral = false } = useQuery({
    queryKey: ['server-status'],
    queryFn: () => invoke<boolean>('is_server_running')
  });

  const { data: serverIp = '' } = useQuery({
    queryKey: ['local-ip'],
    queryFn: () => invoke<string>('get_local_ip'),
    enabled: isCentral
  });

  const { data: sucursales = [] } = useQuery({
    queryKey: ['sedes'],
    queryFn: () => sucursalService.getAll(),
    enabled: isCentral
  });

  const formattedSucursales = useMemo(() => {
    return sucursales.map(s => {
      const isOnline = s.ultima_sincronizacion
        ? (new Date().getTime() - new Date(s.ultima_sincronizacion).getTime() < 300000)
        : false;
      return {
        ...s,
        fechaSincronizacion: s.ultima_sincronizacion
          ? new Date(s.ultima_sincronizacion).toLocaleString()
          : 'Nunca sincronizado',
        isOnline
      };
    });
  }, [sucursales]);

  const toggleServerMutation = useMutation({
    mutationFn: (active: boolean) => invoke<boolean>('toggle_server', { active }),
    onSuccess: (result) => {
      queryClient.setQueryData(['server-status'], result);
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['local-ip'] });
        notificationService.success('Servidor Iniciado', `La Sede Central está activa.`);
      } else {
        notificationService.info('Servidor Detenido', 'El modo Sede Central ha sido desactivado.');
      }
    },
    onError: (error: any) => {
      notificationService.error('Error de Servidor', error);
    }
  });

  const handleToggleServer = () => {
    toggleServerMutation.mutate(!isCentral);
  };

  return (
    <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Card Principal de Control */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-zinc-800 rounded-[2.5rem] p-8 border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-none relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-10 transition-colors ${isCentral ? 'bg-emerald-500' : 'bg-blue-500'}`} />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between mb-8">
              <div className={`p-4 rounded-3xl shadow-lg ${isCentral ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400'}`}>
                <Server size={32} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Estado del Sistema</p>
                <p className={`text-sm font-bold ${isCentral ? 'text-emerald-500' : 'text-zinc-400'}`}>
                  {isCentral ? 'Transmitiendo' : 'Fuera de línea'}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <h3 className="text-2xl font-semibold text-zinc-800 dark:text-white leading-tight">
                {isCentral
                  ? 'Esta computadora está actuando como Sede Central'
                  : 'Activar Sincronización Multi-Sede'
                }
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-lg">
                Al activar el modo central, este equipo se convertirá en el servidor maestro.
                Las sucursales secundarias podrán conectarse a tu dirección IP para sincronizar inventarios y ventas.
              </p>
            </div>

            {/* Toggle de Autoinicio */}
            <div className="flex items-center justify-between p-4 bg-emerald-200 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20 mb-6">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Autoiniciar con la aplicación</span>
                <span className="text-[10px] text-emerald-650 dark:text-emerald-450">Levanta el servidor HTTP de forma automática al abrir el sistema.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoStartEnabled}
                  onChange={(e) => handleToggleAutoStart(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="mt-auto pt-6 flex flex-col sm:flex-row items-center gap-4">
              <Button
                onClick={handleToggleServer}
                isLoading={toggleServerMutation.isPending}
                variant={isCentral ? 'warning' : 'primary'}
                className={`group relative flex-1 w-full sm:w-auto px-8 py-4 font-black ${isCentral
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400'
                  : 'shadow-xl shadow-blue-200 dark:shadow-none'
                  }`}
                icon={!isCentral && !toggleServerMutation.isPending ? <Wifi className="animate-pulse" size={20} /> : undefined}
              >
                {isCentral ? 'Detener Servidor de Red' : 'Iniciar Servidor Central'}
              </Button>

              {isCentral && (
                <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                  <Globe size={18} className="text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-400 uppercase">IP Local</span>
                    <span className="text-sm font-mono font-bold text-zinc-800 dark:text-white tracking-wider">{serverIp}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Copy size={16} />}
                    onClick={() => {
                      navigator.clipboard.writeText(`http://${serverIp}:8080`);
                      notificationService.success('Copiado', 'Dirección de conexión copiada');
                    }}
                    className="ml-2 p-2 text-zinc-400 hover:text-blue-500 hover:bg-white dark:hover:bg-zinc-800"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700 flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Database size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase">Base de Datos</p>
              <p className="text-sm font-bold text-zinc-800 dark:text-white">Lista para Sync</p>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase">Seguridad</p>
              <p className="text-sm font-bold text-zinc-800 dark:text-white">Llaves Activas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Informativo o Tabla de Sucursales */}
      <div className="space-y-6">
        {isCentral ? (
          <div className="bg-white dark:bg-zinc-800 rounded-[2.5rem] p-6 border border-zinc-100 dark:border-zinc-700 shadow-sm overflow-hidden">
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-white mb-4 uppercase tracking-widest flex items-center gap-2">
              <Building2 size={16} className="text-blue-500" />
              Sucursales Conectadas
            </h4>
            <div className="space-y-4">
              {formattedSucursales.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No hay sucursales registradas aún.</p>
              ) : (
                formattedSucursales.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 truncate">{s.nombre}</p>
                      <p className="text-[9px] text-zinc-400 font-mono">
                        {s.fechaSincronizacion}
                      </p>
                    </div>
                    <Badge
                      label={s.isOnline ? 'ONLINE' : 'IDLE'}
                      variant={s.isOnline ? 'emerald' : 'gray'}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl border border-zinc-100 dark:border-zinc-800 h-full flex flex-col justify-center">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 italic">
              La sincronización requiere conexión activa a la red local o internet hacia la Sede Central.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
