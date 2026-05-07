import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Store, Database, Bell, Save, Shield, Server, RefreshCw } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { notificationService } from '../lib/notifications';
import { databaseService } from '../services/databaseService';
import { preferenciasService, type AppPreferences } from '../services/preferenciasService';
import { sucursalService, type SucursalConfig } from '../services/sucursalService';
import { syncService } from '../services/syncService';

function Section({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-800 dark:text-white tracking-tight">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function Field({ label, defaultValue, type = 'text', placeholder }: { label: string; defaultValue: string; type?: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
      />
    </div>
  );
}

export function Configuracion() {
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [dbStats, setDbStats] = useState<{ size: number; path: string }>({ size: 0, path: 'Cargando...' });
  const [prefs, setPrefs] = useState<AppPreferences>(preferenciasService.get());
  const [sucursal, setSucursal] = useState<SucursalConfig>({
    sucursal_id: '',
    nombre_sucursal: '',
    api_url_central: ''
  });
  const [isCentral, setIsCentral] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    const stats = await databaseService.getDbStats();
    setDbStats(stats);
    
    const config = await sucursalService.getConfig();
    if (config) setSucursal(config);

    // Verificar si el servidor está corriendo (solo para saber si ocultar/mostrar opciones)
    const running = await invoke<boolean>('is_server_running');
    setIsCentral(running);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = (key: keyof AppPreferences) => {
    const updated = preferenciasService.toggle(key);
    setPrefs(updated);
  };

  const handleUpdatePref = (key: keyof AppPreferences, value: any) => {
    const current = preferenciasService.get();
    const updated = { ...current, [key]: value };
    preferenciasService.save(updated);
    setPrefs(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      notificationService.success('Configuración Guardada', 'Los cambios se aplicaron correctamente.');
    }, 1000);
  };

  const handleSucursalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sucursalService.saveConfig(sucursal);
      notificationService.success('Sede Actualizada', 'Los datos de la sucursal se guardaron con éxito.');
    } catch (error) {
      notificationService.error('Error', 'No se pudo guardar la configuración de la sucursal.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!sucursal.api_url_central) {
      notificationService.error('Error', 'Ingresa una URL de central primero.');
      return;
    }
    setTestingConnection(true);
    try {
      await sucursalService.testConnection(sucursal.api_url_central, sucursal.sucursal_id);
      notificationService.success('Conexión Exitosa', 'La sede central está disponible y lista.');
    } catch (error: any) {
      notificationService.error('Conexión Fallida', error.message);
    } finally {
      setTestingConnection(false);
    }
  };


  const handleSync = async () => {
    if (isCentral) {
      notificationService.info('Sede Principal', 'Las sedes principales no sincronizan productos de otros, solo los sirven.');
      return;
    }

    setSyncing(true);
    try {
      notificationService.info('Sincronizando', 'Actualizando catálogo, usuarios y enviando ventas...');
      
      // 1. Enviar ventas pendientes
      const { enviadas } = await syncService.pushSales();
      
      // 2. Enviar niveles de stock
      await syncService.pushStockLevels();
      
      // 3. Descargar catálogo
      const { creados: pCreados, actualizados: pActualizados } = await syncService.pullProducts();
      
      // 4. Descargar usuarios
      const { creados: uCreados, actualizados: uActualizados } = await syncService.pullUsers();

      notificationService.success(
        'Sincronización Completa', 
        `Se enviaron ${enviadas} ventas y el stock actual. Productos: +${pCreados}/~${pActualizados}. Usuarios: +${uCreados}/~${uActualizados}.`
      );
    } catch (error: any) {
      notificationService.error('Error de Sincronización', error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleOptimize = async () => {
    try {
      notificationService.info('Mantenimiento', 'Optimizando base de datos...');
      await databaseService.optimize();
      await loadData();
      notificationService.success('Completado', 'La base de datos ha sido optimizada.');
    } catch (error) {
      notificationService.error('Error', 'No se pudo optimizar la base de datos.');
    }
  };

  const handleBackup = async () => {
    try {
      notificationService.info('Respaldo', 'Creando copia de seguridad...');
      const path = await databaseService.backup();
      
      // Abrir automáticamente la ubicación en el explorador
      await databaseService.reveal(path);
      
      notificationService.successWithConfirm('Copia Creada', 'El respaldo se completó y la carpeta se ha abierto.');
    } catch (error) {
      console.error(error);
      notificationService.error('Error', 'No se pudo crear el respaldo.');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Configuración del Sistema</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Administra los parámetros globales de tu minimarket.</p>
        </div>
        <Badge label="Versión 1.0.2" variant="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Gestión de Sedes */}
        <Section 
          icon={Server} 
          title="Sedes y Sincronización" 
          description="Configura la identidad de esta sucursal y su conexión central."
        >
          <form onSubmit={handleSucursalSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">ID de Sede Único</label>
                <input
                  type="text"
                  value={sucursal.sucursal_id}
                  onChange={(e) => setSucursal({...sucursal, sucursal_id: e.target.value})}
                  placeholder="Ej: SEDE-01"
                  className="w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Nombre de Sucursal</label>
                <input
                  type="text"
                  value={sucursal.nombre_sucursal}
                  onChange={(e) => setSucursal({...sucursal, nombre_sucursal: e.target.value})}
                  placeholder="Ej: Sucursal Centro"
                  className="w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">URL API Sede Central</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={sucursal.api_url_central}
                      onChange={(e) => setSucursal({...sucursal, api_url_central: e.target.value})}
                      placeholder="https://central.tu-negocio.com/api"
                      className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <button 
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection || isCentral}
                      className="px-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-100 transition-all disabled:opacity-50"
                      title="Probar Conexión"
                    >
                      <RefreshCw size={18} className={testingConnection ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón de Sincronización Manual */}
              {!isCentral && (
                <div className="sm:col-span-2">
                  <button 
                    type="button"
                    onClick={handleSync}
                    disabled={syncing || !sucursal.api_url_central}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-2xl hover:bg-indigo-100 transition-all disabled:opacity-50 border border-indigo-100 dark:border-indigo-800"
                  >
                    <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Sincronizando Catálogo...' : 'Sincronizar Productos desde Central'}
                  </button>
                  <p className="text-[10px] text-gray-400 mt-2 text-center italic">
                    Descarga los últimos productos, categorías y precios de la sede central.
                  </p>
                </div>
              )}
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Guardando...' : 'Actualizar Datos de Sede'}
            </button>
          </form>
        </Section>
        
        {/* Datos de la empresa */}
        <Section 
          icon={Store} 
          title="Datos del Negocio" 
          description="Información que aparecerá en tus comprobantes."
        >
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Razón Social" defaultValue="Minimarket El Sol" />
              <Field label="RUC / Identificación" defaultValue="20123456789" />
              <div className="sm:col-span-2">
                <Field label="Dirección Fiscal" defaultValue="Av. Principal 123, Tacna" />
              </div>
              <Field label="Teléfono de Contacto" defaultValue="052 123 456" />
              <Field label="Correo Electrónico" defaultValue="contacto@elsol.com" />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </Section>

        {/* Seguridad y Cuenta */}
        <Section 
          icon={Shield} 
          title="Seguridad y Acceso" 
          description="Gestiona tus credenciales de administrador."
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Usuario" defaultValue="admin" />
              <Field label="Rol del Sistema" defaultValue="Administrador" />
              <Field label="Contraseña Actual" defaultValue="••••••••" type="password" />
              <Field label="Nueva Contraseña" defaultValue="" type="password" placeholder="Mínimo 8 caracteres" />
            </div>
            <button className="w-full sm:w-auto px-6 py-2.5 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 text-white text-sm font-bold rounded-2xl transition-all">
              Actualizar Credenciales
            </button>
          </div>
        </Section>

        {/* Base de Datos */}
        <Section 
          icon={Database} 
          title="Almacenamiento" 
          description="Estado y mantenimiento de la base de datos local."
        >
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Motor de Base de Datos</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                  Activo
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                SQLite (Local) • {formatSize(dbStats.size)}
              </p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-mono truncate mt-1" title={dbStats.path}>
                {dbStats.path}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleOptimize}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Optimizar Tablas
              </button>
              <button 
                onClick={handleBackup}
                className="flex-1 px-4 py-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 text-xs font-bold rounded-2xl hover:bg-emerald-100 transition-all"
              >
                Respaldar Datos
              </button>
            </div>
          </div>
        </Section>

        {/* Preferencias */}
        <Section 
          icon={Bell} 
          title="Preferencias" 
          description="Controla las alertas y notificaciones del sistema."
        >
          <div className="space-y-2">
            {[
              { id: 'stockAlert', label: 'Alertas de Stock Crítico', desc: 'Notificar cuando un producto se agota.' },
              { id: 'enableAutoLogout', label: 'Cierre de Sesión Automático', desc: 'Protege tu cuenta cerrando la sesión tras un periodo de inactividad (ratón, teclado o scroll).' },
            ].map(({ id, label, desc }) => {
              const active = prefs[id as keyof AppPreferences] as boolean;
              return (
                <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{label}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{desc}</p>
                  </div>
                  <button 
                    onClick={() => handleToggle(id as keyof AppPreferences)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${active ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              );
            })}

            {/* Selector de minutos (Solo si está activo el cierre automático) */}
            {prefs.enableAutoLogout && (
              <div className="mt-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Tiempo de Inactividad</p>
                    <p className="text-[10px] text-indigo-700 dark:text-indigo-400">Minutos antes de desconectar</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      max="1440"
                      value={prefs.inactivityTimeout}
                      onChange={(e) => handleUpdatePref('inactivityTimeout', parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 text-center text-sm font-black bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">min</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>

      </div>
    </div>
  );
}
