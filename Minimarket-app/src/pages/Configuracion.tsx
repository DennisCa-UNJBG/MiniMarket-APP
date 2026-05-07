import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Store, Database, Bell, Save, Shield, Server, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { notificationService } from '../lib/notifications';
import { databaseService } from '../services/databaseService';
import { preferenciasService, type AppPreferences } from '../services/preferenciasService';
import { sucursalService, type SucursalConfig } from '../services/sucursalService';
import { syncService } from '../services/syncService';
import { negocioService, type DatosNegocio } from '../services/negocioService';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

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

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (val: string) => void; type?: string; placeholder?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${isPassword ? 'pr-11' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

export function Configuracion() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [dbStats, setDbStats] = useState<{ size: number; path: string }>({ size: 0, path: 'Cargando...' });
  const [prefs, setPrefs] = useState<AppPreferences>(preferenciasService.get());
  const [sucursal, setSucursal] = useState<SucursalConfig>({
    sucursal_id: '',
    nombre_sucursal: '',
    api_url_central: ''
  });
  const [negocio, setNegocio] = useState<DatosNegocio>({
    razon_social: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: ''
  });
  const [isCentral, setIsCentral] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Estado para la sección de seguridad
  const [securityData, setSecurityData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const loadData = async () => {
    const stats = await databaseService.getDbStats();
    setDbStats(stats);
    
    const config = await sucursalService.getConfig();
    if (config) setSucursal(config);

    const datosNegocio = await negocioService.get();
    setNegocio(datosNegocio);

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

  const handleSucursalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sucursalService.saveConfig(sucursal);
      notificationService.success('Configuración Guardada', 'La identidad de la sede se actualizó correctamente.');
      loadData();
    } catch (error) {
      notificationService.error('Error', 'No se pudo guardar la configuración.');
    } finally {
      setLoading(false);
    }
  };

  const handleNegocioSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await negocioService.save(negocio);
      notificationService.success('Datos Actualizados', 'La información del negocio se guardó correctamente.');
      loadData();
    } catch (error) {
      notificationService.error('Error', 'No se pudieron guardar los datos del negocio.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!sucursal.api_url_central || !sucursal.sucursal_id) {
      notificationService.error('Configuración Incompleta', 'Ingresa el ID de Sede y la URL de la central.');
      return;
    }
    setTestingConnection(true);
    try {
      await sucursalService.testConnection(sucursal.api_url_central, sucursal.sucursal_id);
      notificationService.success('Conexión Exitosa', 'La sede central está disponible y lista.');
      setConnectionStatus('success');
    } catch (error: any) {
      notificationService.error('Conexión Fallida', error.message);
      setConnectionStatus('error');
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
      
      const { enviadas: vEnviadas } = await syncService.pushSales();
      const { enviadas: kEnviadas } = await syncService.pushKardex();
      await syncService.pushStockLevels();
      const { creados: pCreados, actualizados: pActualizados } = await syncService.pullProducts();
      const { creados: uCreados, actualizados: uActualizados } = await syncService.pullUsers();

      notificationService.success(
        'Sincronización Completa', 
        `Enviado: ${vEnviadas} ventas y ${kEnviadas} mov. Catálogo: +${pCreados}/~${pActualizados}. Usuarios: +${uCreados}/~${uActualizados}.`
      );
    } catch (error: any) {
      notificationService.error('Error de Sincronización', error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!securityData.newPassword) {
      notificationService.warning('Campo Incompleto', 'Debes ingresar la nueva contraseña.');
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      notificationService.error('Error', 'Las nuevas contraseñas no coinciden.');
      return;
    }

    if (securityData.newPassword.length < 4) {
      notificationService.warning('Contraseña muy corta', 'La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(user.id, securityData.newPassword);
      notificationService.success('Contraseña Actualizada', 'Tu acceso ha sido actualizado correctamente.');
      setSecurityData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      notificationService.error('Error', error.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
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
                    <div className="relative flex-1">
                      <input
                        type="url"
                        value={sucursal.api_url_central}
                        onChange={(e) => {
                          setSucursal({...sucursal, api_url_central: e.target.value});
                          setConnectionStatus('idle');
                        }}
                        placeholder="https://central.tu-negocio.com/api"
                        className="w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {connectionStatus === 'success' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                        {connectionStatus === 'error' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection || isCentral}
                      className={`px-4 rounded-2xl transition-all disabled:opacity-50 border ${
                        connectionStatus === 'success' 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                          : connectionStatus === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800'
                          : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800'
                      }`}
                      title="Probar Conexión"
                    >
                      <RefreshCw size={18} className={testingConnection ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
              </div>

              {!isCentral && (
                <div className="sm:col-span-2">
                  <button 
                    type="button"
                    onClick={handleSync}
                    disabled={syncing || !sucursal.api_url_central}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-2xl hover:bg-indigo-100 transition-all disabled:opacity-50 border border-indigo-100 dark:border-indigo-800"
                  >
                    <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Sincronizando...' : 'Sincronizar con Sede Central'}
                  </button>
                  {sucursal.ultima_sincronizacion && (
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter mt-1 text-right">
                      Última: {new Date(sucursal.ultima_sincronizacion).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Guardando...' : 'Guardar Identidad de Sede'}
            </button>
          </form>
        </Section>
        
        {/* Datos de la empresa */}
        <Section 
          icon={Store} 
          title="Datos del Negocio" 
          description="Información que aparecerá en tus comprobantes."
        >
          <form onSubmit={handleNegocioSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Razón Social" value={negocio.razon_social} onChange={val => setNegocio({...negocio, razon_social: val})} placeholder="Ej: Minimarket El Sol S.A.C." />
              <Field label="RUC / Identificación" value={negocio.ruc} onChange={val => setNegocio({...negocio, ruc: val})} placeholder="Ej: 20123456789" />
              <div className="sm:col-span-2">
                <Field label="Dirección Fiscal" value={negocio.direccion} onChange={val => setNegocio({...negocio, direccion: val})} placeholder="Av. Principal 123, Tacna" />
              </div>
              <Field label="Teléfono de Contacto" value={negocio.telefono} onChange={val => setNegocio({...negocio, telefono: val})} placeholder="Ej: 052 123 456" />
              <Field label="Correo Electrónico" value={negocio.email} onChange={val => setNegocio({...negocio, email: val})} placeholder="contacto@empresa.com" />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Guardando...' : 'Guardar Datos del Negocio'}
            </button>
          </form>
        </Section>

        {/* Seguridad y Cuenta */}
        <Section 
          icon={Shield} 
          title="Seguridad y Acceso" 
          description="Gestiona tus credenciales de administrador."
        >
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Usuario</label>
                <input disabled value={user?.username || 'admin'} className="w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Rol del Sistema</label>
                <input disabled value={user?.rol_id === 1 ? 'Administrador' : 'Cajero'} className="w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed" />
              </div>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nueva Contraseña" value={securityData.newPassword} onChange={val => setSecurityData({...securityData, newPassword: val})} type="password" placeholder="Nueva clave" />
                <Field label="Confirmar Nueva" value={securityData.confirmPassword} onChange={val => setSecurityData({...securityData, confirmPassword: val})} type="password" placeholder="Repite clave" />
              </div>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 text-white text-sm font-bold rounded-2xl transition-all disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Actualizar Credenciales'}
            </button>
          </form>
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
              { id: 'enableAutoLogout', label: 'Cierre de Sesión Automático', desc: 'Protege tu cuenta cerrando la sesión tras un periodo de inactividad.' },
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

            {prefs.enableAutoLogout && (
              <div className="mt-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Tiempo de Inactividad</p>
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
