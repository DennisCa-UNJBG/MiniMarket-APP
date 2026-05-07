import { useState, useEffect } from 'react';
import { Server, Wifi, Globe, Copy, RefreshCw, Database, ShieldCheck, Building2, CloudSync } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { notificationService } from '../lib/notifications';
import { Badge } from '../components/ui/Badge';
import { sucursalService } from '../services/sucursalService';
import { syncService } from '../services/syncService';
import { getDb } from '../lib/db';

export function Sincronizacion() {
  const [isCentral, setIsCentral] = useState(false);
  const [serverIp, setServerIp] = useState('');
  const [loading, setLoading] = useState(true);

  const checkServerStatus = async () => {
    setLoading(true);
    try {
      const running = await invoke<boolean>('is_server_running');
      setIsCentral(running);
      if (running) {
        const ip = await invoke<string>('get_local_ip');
        setServerIp(ip);
        loadSucursales();
      }
    } catch (error) {
      console.error('Error al verificar servidor:', error);
    } finally {
      setLoading(false);
    }
  };

  const [sucursales, setSucursales] = useState<any[]>([]);
  const loadSucursales = async () => {
    const data = await sucursalService.getAll();
    setSucursales(data);
  };

  const [pendingSales, setPendingSales] = useState(0);
  const checkPendingData = async () => {
    if (!isCentral) {
      const db = await getDb();
      const res = await db.select<any[]>('SELECT count(*) as count FROM ventas WHERE sincronizado = 0');
      setPendingSales(res[0].count);
    }
  };

  useEffect(() => {
    checkServerStatus();
    checkPendingData();
  }, [isCentral]);

  const handleToggleServer = async () => {
    try {
      const newState = !isCentral;
      const result = await invoke<boolean>('toggle_server', { active: newState });
      setIsCentral(result);
      
      if (result) {
        const ip = await invoke<string>('get_local_ip');
        setServerIp(ip);
        notificationService.success('Servidor Iniciado', `La Sede Central está activa en http://${ip}:8080`);
      } else {
        notificationService.info('Servidor Detenido', 'El modo Sede Central ha sido desactivado.');
      }
    } catch (error: any) {
      notificationService.error('Error de Servidor', error);
    }
  };

  const handlePushData = async () => {
    setLoading(true);
    try {
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

      notificationService.success(
        'Sincronización Completa', 
        `Enviados: ${enviadas} ventas y ${kEnviadas} movimientos. Stock OK. Catálogo: +${pCreados}/~${pActualizados}. Usuarios: +${uCreados}/~${uActualizados}.`
      );
      checkPendingData();
    } catch (error: any) {
      notificationService.error('Error de Sincronización', error.message);
    } finally {
      setLoading(false);
    }
  };

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
                <button 
                  onClick={handleToggleServer}
                  className={`group relative flex-1 w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black transition-all active:scale-95 ${
                    isCentral 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none'
                  }`}
                >
                  {isCentral ? (
                    <>Detener Servidor de Red</>
                  ) : (
                    <>
                      <Wifi className="animate-pulse" size={20} />
                      Iniciar Servidor Central
                    </>
                  )}
                </button>
                
                {isCentral && (
                  <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <Globe size={18} className="text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-gray-400 uppercase">IP Local</span>
                      <span className="text-sm font-mono font-bold text-gray-800 dark:text-white tracking-wider">{serverIp}</span>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`http://${serverIp}:8080`);
                        notificationService.success('Copiado', 'Dirección de conexión copiada');
                      }}
                      className="ml-2 p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all text-gray-400 hover:text-indigo-500"
                    >
                      <Copy size={16} />
                    </button>
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
              <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                <CloudSync className="mb-6 opacity-50" size={32} />
                <h4 className="text-xl font-black mb-4">Sincronización Local</h4>
                <p className="text-sm text-indigo-100 mb-6 leading-relaxed">
                  Envía tus ventas realizadas y descarga los últimos productos y personal autorizado desde la Sede Central.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-indigo-200 font-bold border-b border-white/10 pb-2">
                    <span>Ventas pendientes:</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full">{pendingSales}</span>
                  </div>
                  
                  <button 
                    onClick={handlePushData}
                    className="w-full py-3 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-50 active:scale-95 transition-all shadow-lg"
                  >
                    Sincronizar Ahora
                  </button>
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
