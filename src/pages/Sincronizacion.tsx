import { Server, Wifi, Globe, Copy, RefreshCw, Database, ShieldCheck, Building2, CloudSync } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../lib/notifications';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { sucursalService } from '../services/sucursalService';
import { syncService } from '../services/syncService';
import { ventaService } from '../services/ventaService';

export function Sincronizacion() {
  const queryClient = useQueryClient();

  // Queries
  const { data: isCentral = false, isLoading: isLoadingServer } = useQuery({
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

  const { data: pendingSales = 0, refetch: refetchPending } = useQuery({
    queryKey: ['pending-sales'],
    queryFn: () => ventaService.getVentasPendientes(),
    enabled: !isCentral
  });

  // Mutations
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

  const syncMutation = useMutation({
    mutationFn: async () => {
      notificationService.info('Sincronizando', 'Enviando ventas y descargando catálogo actualizado...');
      
      // 1. Enviar ventas y movimientos
      const { enviadas } = await syncService.pushSales();
      const { enviadas: kEnviadas } = await syncService.pushKardex();
      
      // 2. Enviar niveles de stock
      await syncService.pushStockLevels();
      
      // 3. Descargar catálogo
      const { creados: pCreados, actualizados: pActualizados } = await syncService.pullProducts();
      
      // 4. Descargar usuarios
      const { creados: uCreados, actualizados: uActualizados } = await syncService.pullUsers();

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

  const handleToggleServer = () => {
    toggleServerMutation.mutate(!isCentral);
  };

  const handlePushData = () => {
    syncMutation.mutate();
  };

  const loading = isLoadingServer || syncMutation.isPending || toggleServerMutation.isPending;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-50 dark:border-indigo-900/20" />
          <RefreshCw size={32} className="absolute inset-0 m-auto animate-spin text-indigo-500" />
        </div>
        <p className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sincronizando Red...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Panel de Sincronización</h2>
          <p className="text-gray-500 dark:text-gray-400">Control maestro de la red y el servidor de datos central.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            label={isCentral ? 'MODO CENTRAL ACTIVO' : 'MODO LOCAL'} 
            variant={isCentral ? 'emerald' : 'gray'} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Card Principal de Control */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-10 transition-colors ${isCentral ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-8">
                <div className={`p-4 rounded-3xl shadow-lg ${isCentral ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                  <Server size={32} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado del Sistema</p>
                  <p className={`text-sm font-bold ${isCentral ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {isCentral ? 'Transmitiendo' : 'Fuera de línea'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <h3 className="text-2xl font-black text-gray-800 dark:text-white leading-tight">
                  {isCentral 
                    ? 'Esta computadora está actuando como Sede Central' 
                    : 'Activar Sincronización Multi-Sede'
                  }
                </h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg">
                  Al activar el modo central, este equipo se convertirá en el servidor maestro. 
                  Las sucursales secundarias podrán conectarse a tu dirección IP para sincronizar inventarios y ventas.
                </p>
              </div>

              <div className="mt-auto pt-6 flex flex-col sm:flex-row items-center gap-4">
                <Button 
                  onClick={handleToggleServer}
                  isLoading={toggleServerMutation.isPending}
                  variant={isCentral ? 'warning' : 'primary'}
                  className={`group relative flex-1 w-full sm:w-auto px-8 py-4 font-black ${
                    isCentral 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400' 
                    : 'shadow-xl shadow-indigo-200 dark:shadow-none'
                  }`}
                  icon={!isCentral && !toggleServerMutation.isPending ? <Wifi className="animate-pulse" size={20} /> : undefined}
                >
                  {isCentral ? 'Detener Servidor de Red' : 'Iniciar Servidor Central'}
                </Button>
                
                {isCentral && (
                  <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <Globe size={18} className="text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-gray-400 uppercase">IP Local</span>
                      <span className="text-sm font-mono font-bold text-gray-800 dark:text-white tracking-wider">{serverIp}</span>
                    </div>
                    <Button 
                      variant="ghost"
                      size="sm"
                      icon={<Copy size={16} />}
                      onClick={() => {
                        navigator.clipboard.writeText(`http://${serverIp}:8080`);
                        notificationService.success('Copiado', 'Dirección de conexión copiada');
                      }}
                      className="ml-2 p-2 text-gray-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-gray-800"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                <Database size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Base de Datos</p>
                <p className="text-sm font-bold text-gray-800 dark:text-white">Lista para Sync</p>
              </div>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Seguridad</p>
                <p className="text-sm font-bold text-gray-800 dark:text-white">Llaves Activas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Informativo o Tabla de Sucursales */}
        <div className="space-y-6">
          {isCentral ? (
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <h4 className="text-sm font-black text-gray-800 dark:text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={16} className="text-indigo-500" />
                Sucursales Conectadas
              </h4>
              <div className="space-y-4">
                {sucursales.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No hay sucursales registradas aún.</p>
                ) : (
                  sucursales.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{s.nombre}</p>
                        <p className="text-[9px] text-gray-400 font-mono">
                          {s.ultima_sincronizacion ? new Date(s.ultima_sincronizacion).toLocaleString() : 'Nunca sincronizado'}
                        </p>
                      </div>
                      <Badge 
                        label={s.ultima_sincronizacion && (new Date().getTime() - new Date(s.ultima_sincronizacion).getTime() < 300000) ? 'ONLINE' : 'IDLE'} 
                        variant={s.ultima_sincronizacion && (new Date().getTime() - new Date(s.ultima_sincronizacion).getTime() < 300000) ? 'emerald' : 'gray'} 
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                
                <div className="relative">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                    <CloudSync size={24} />
                  </div>
                  
                  <h4 className="text-xl font-black text-gray-800 dark:text-white mb-4">Sincronización Local</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                    Envía tus ventas realizadas y descarga los últimos productos y personal autorizado desde la Sede Central.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold border-b border-gray-50 dark:border-gray-700 pb-2">
                      <span className="text-gray-400 uppercase tracking-wider">Ventas pendientes</span>
                      <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-[10px]">
                        {pendingSales} registros
                      </span>
                    </div>
                    
                    <Button 
                      onClick={handlePushData}
                      isLoading={syncMutation.isPending}
                      fullWidth
                      size="lg"
                      className="rounded-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none"
                    >
                      Sincronizar Ahora
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700">
                <h4 className="text-sm font-black text-gray-800 dark:text-white mb-4 uppercase tracking-widest">Pasos de Configuración</h4>
                <ul className="space-y-4">
                  {[
                    'Obtén la URL de la Central.',
                    'Pega la URL en Configuración.',
                    'Verifica que tu ID de Sede sea correcto.',
                    'Presiona Sincronizar para descargar datos.'
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 text-xs leading-snug text-gray-500 dark:text-gray-400">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-[10px]">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          
          <div className="p-6 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border border-gray-100 dark:border-gray-800">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 italic">
              {isCentral 
                ? "El servidor utiliza el puerto 8080 por defecto. Asegúrate de permitir el tráfico en tu firewall."
                : "La sincronización requiere conexión activa a la red local o internet hacia la Sede Central."
              }
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
