import { useState, useEffect, useReducer } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Store,
  Database,
  Bell,
  Save,
  Shield,
  Server,
  RefreshCw,
  Eye,
  EyeOff,
  Keyboard,
  Plus,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../components/ui/Badge';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import { notificationService } from '../../lib/notifications';
import { databaseService } from './databaseService';
import { preferenciasService, type AppPreferences } from './preferenciasService';
import { sucursalService, type SucursalConfig } from '../sucursales/Service';
import { syncService } from '../sincronizacion/Service';
import { negocioService, type DatosNegocio } from './negocioService';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../login/Service';
import { allNavItems } from '../../config/navigation';

const formatDateTimeLocal = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString();
};

function Section({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6 border-b border-zinc-50 dark:border-zinc-700/50 bg-zinc-50/30 dark:bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-white tracking-tight">{title}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
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
      <label className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${isPassword ? 'pr-11' : ''}`}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400"
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            icon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          />
        )}
      </div>
    </div>
  );
}

interface ConfiguracionState {
  connectionStatus: 'idle' | 'success' | 'error';
  prefs: AppPreferences;
  localSucursal: SucursalConfig;
  localNegocio: DatosNegocio;
  securityData: {
    newPassword: string;
    confirmPassword: string;
  };
  newShortcutCombo: string;
  newShortcutPath: string;
  isRecordingCombo: boolean;
}

type ConfiguracionAction =
  | { type: 'SET_CONNECTION_STATUS'; payload: 'idle' | 'success' | 'error' }
  | { type: 'SET_PREFS'; payload: AppPreferences }
  | { type: 'SET_LOCAL_SUCURSAL'; payload: Partial<SucursalConfig> | ((prev: SucursalConfig) => SucursalConfig) }
  | { type: 'SET_LOCAL_NEGOCIO'; payload: Partial<DatosNegocio> | ((prev: DatosNegocio) => DatosNegocio) }
  | { type: 'SET_SECURITY_DATA'; payload: Partial<{ newPassword: string; confirmPassword: string }> | ((prev: { newPassword: string; confirmPassword: string }) => { newPassword: string; confirmPassword: string }) }
  | { type: 'SET_NEW_SHORTCUT_COMBO'; payload: string }
  | { type: 'SET_NEW_SHORTCUT_PATH'; payload: string }
  | { type: 'SET_IS_RECORDING_COMBO'; payload: boolean };

function configuracionReducer(state: ConfiguracionState, action: ConfiguracionAction): ConfiguracionState {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    case 'SET_PREFS':
      return { ...state, prefs: action.payload };
    case 'SET_LOCAL_SUCURSAL':
      return {
        ...state,
        localSucursal: typeof action.payload === 'function'
          ? action.payload(state.localSucursal)
          : { ...state.localSucursal, ...action.payload } as SucursalConfig
      };
    case 'SET_LOCAL_NEGOCIO':
      return {
        ...state,
        localNegocio: typeof action.payload === 'function'
          ? action.payload(state.localNegocio)
          : { ...state.localNegocio, ...action.payload } as DatosNegocio
      };
    case 'SET_SECURITY_DATA':
      return {
        ...state,
        securityData: typeof action.payload === 'function'
          ? action.payload(state.securityData)
          : { ...state.securityData, ...action.payload } as any
      };
    case 'SET_NEW_SHORTCUT_COMBO':
      return { ...state, newShortcutCombo: action.payload };
    case 'SET_NEW_SHORTCUT_PATH':
      return { ...state, newShortcutPath: action.payload };
    case 'SET_IS_RECORDING_COMBO':
      return { ...state, isRecordingCombo: action.payload };
    default:
      return state;
  }
}

export function Configuracion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [state, dispatch] = useReducer(configuracionReducer, {
    connectionStatus: 'idle',
    prefs: preferenciasService.get(),
    localSucursal: {
      sucursal_id: '',
      nombre_sucursal: '',
      api_url_central: ''
    },
    localNegocio: {
      razon_social: '',
      ruc: '',
      direccion: '',
      telefono: '',
      email: ''
    },
    securityData: {
      newPassword: '',
      confirmPassword: ''
    },
    newShortcutCombo: '',
    newShortcutPath: allNavItems[0].to,
    isRecordingCombo: false
  });

  const {
    connectionStatus,
    prefs,
    localSucursal,
    localNegocio,
    securityData,
    newShortcutCombo,
    newShortcutPath,
    isRecordingCombo
  } = state;

  const setConnectionStatus = (payload: 'idle' | 'success' | 'error') => dispatch({ type: 'SET_CONNECTION_STATUS', payload });
  const setPrefs = (payload: AppPreferences) => dispatch({ type: 'SET_PREFS', payload });
  const setLocalSucursal = (payload: Partial<SucursalConfig> | ((prev: SucursalConfig) => SucursalConfig)) => dispatch({ type: 'SET_LOCAL_SUCURSAL', payload });
  const setLocalNegocio = (payload: Partial<DatosNegocio> | ((prev: DatosNegocio) => DatosNegocio)) => dispatch({ type: 'SET_LOCAL_NEGOCIO', payload });
  const setSecurityData = (payload: Partial<{ newPassword: string; confirmPassword: string }> | ((prev: { newPassword: string; confirmPassword: string }) => { newPassword: string; confirmPassword: string })) => dispatch({ type: 'SET_SECURITY_DATA', payload });
  const setNewShortcutCombo = (payload: string) => dispatch({ type: 'SET_NEW_SHORTCUT_COMBO', payload });
  const setNewShortcutPath = (payload: string) => dispatch({ type: 'SET_NEW_SHORTCUT_PATH', payload });
  const setIsRecordingCombo = (payload: boolean) => dispatch({ type: 'SET_IS_RECORDING_COMBO', payload });

  // Queries
  const { data: dbStats = { size: 0, path: 'Cargando...' } } = useQuery({
    queryKey: ['db-stats'],
    queryFn: () => databaseService.getDbStats()
  });

  const { data: sucursalData } = useQuery({
    queryKey: ['sucursal-config'],
    queryFn: () => sucursalService.getConfig()
  });

  const { data: negocioData } = useQuery({
    queryKey: ['negocio'],
    queryFn: () => negocioService.get()
  });

  const { data: isCentral = false } = useQuery({
    queryKey: ['server-status'],
    queryFn: () => invoke<boolean>('is_server_running')
  });

  useEffect(() => {
    if (sucursalData) setLocalSucursal(sucursalData);
  }, [sucursalData]);

  useEffect(() => {
    if (negocioData) setLocalNegocio(negocioData);
  }, [negocioData]);

  // Mutations
  const saveSucursalMutation = useMutation({
    mutationFn: (data: SucursalConfig) => sucursalService.saveConfig(data, user?.id || 1),
    onSuccess: () => {
      notificationService.success('Configuración Guardada', 'La identidad de la sede se actualizó correctamente.');
      queryClient.invalidateQueries({ queryKey: ['sucursal-config'] });
    }
  });

  const saveNegocioMutation = useMutation({
    mutationFn: (data: DatosNegocio) => negocioService.save(data),
    onSuccess: () => {
      notificationService.success('Datos Actualizados', 'La información del negocio se guardó correctamente.');
      queryClient.invalidateQueries({ queryKey: ['negocio'] });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (password: string) => authService.updatePassword(user!.id, password),
    onSuccess: () => {
      notificationService.success('Contraseña Actualizada', 'Tu acceso ha sido actualizado correctamente.');
      setSecurityData({ newPassword: '', confirmPassword: '' });
    }
  });

  const handleToggle = (key: keyof AppPreferences) => {
    const updated = preferenciasService.toggle(key);
    setPrefs(updated as AppPreferences);
    
    if (key === 'stockAlert') {
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
    }
  };

  const handleUpdatePref = (key: keyof AppPreferences, value: any) => {
    const current = preferenciasService.get();
    const updated = { ...current, [key]: value };
    preferenciasService.save(updated as AppPreferences);
    setPrefs(updated as AppPreferences);
  };

  const handleAddShortcut = () => {
    if (!newShortcutCombo) {
      notificationService.warning('Atajo incompleto', 'Debes presionar una combinación de teclas primero.');
      return;
    }
    
    const current = preferenciasService.get();
    const currentShortcuts = current.shortcuts || {};

    const existingComboForPath = Object.keys(currentShortcuts).find(key => currentShortcuts[key] === newShortcutPath);
    if (existingComboForPath) {
      notificationService.warning('Vista ya asignada', `Esta vista ya tiene el atajo ${existingComboForPath}. Elimínalo primero.`);
      return;
    }

    if (currentShortcuts[newShortcutCombo]) {
      notificationService.warning('Atajo en uso', 'Esta combinación de teclas ya está asignada a otra vista.');
      return;
    }

    const updatedShortcuts = { ...currentShortcuts, [newShortcutCombo]: newShortcutPath };
    const updated = { ...current, shortcuts: updatedShortcuts };
    
    preferenciasService.save(updated as AppPreferences);
    setPrefs(updated as AppPreferences);
    
    setNewShortcutCombo('');
    setIsRecordingCombo(false);
    notificationService.success('Atajo Guardado', `La combinación ${newShortcutCombo} ahora abre una nueva vista.`);
  };

  const handleRemoveShortcut = (combo: string) => {
    const current = preferenciasService.get();
    const updatedShortcuts = { ...current.shortcuts };
    delete updatedShortcuts[combo];
    const updated = { ...current, shortcuts: updatedShortcuts };
    
    preferenciasService.save(updated as AppPreferences);
    setPrefs(updated as AppPreferences);
  };

  const handleSucursalSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSucursalMutation.mutate(localSucursal);
  };

  const handleNegocioSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveNegocioMutation.mutate(localNegocio);
  };

  const testConnectionMutation = useMutation({
    mutationFn: () => sucursalService.testConnection(localSucursal.api_url_central, localSucursal.sucursal_id),
    onSuccess: () => {
      notificationService.success('Conexión Exitosa', 'La sede central está disponible y lista.');
      setConnectionStatus('success');
    },
    onError: (error: any) => {
      notificationService.error('Conexión Fallida', error.message);
      setConnectionStatus('error');
    }
  });

  const handleTestConnection = () => {
    if (!localSucursal.api_url_central || !localSucursal.sucursal_id) {
      notificationService.error('Configuración Incompleta', 'Ingresa el ID de Sede y la URL de la central.');
      return;
    }
    testConnectionMutation.mutate();
  };

  const syncMutation = useMutation({
    mutationFn: async () => {
      notificationService.info('Sincronizando', 'Actualizando catálogo, usuarios y enviando ventas...');
      const [
        { enviadas: vEnviadas },
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
      return { vEnviadas, kEnviadas, pCreados, pActualizados, uCreados, uActualizados };
    },
    onSuccess: (data) => {
      notificationService.success(
        'Sincronización Completa', 
        `Enviado: ${data.vEnviadas} ventas y ${data.kEnviadas} mov. Catálogo: +${data.pCreados}/~${data.pActualizados}. Usuarios: +${data.uCreados}/~${data.uActualizados}.`
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const handleSync = () => {
    if (isCentral) {
      notificationService.info('Sede Principal', 'Las sedes principales no sincronizan productos de otros, solo los sirven.');
      return;
    }
    syncMutation.mutate();
  };

  const optimizeMutation = useMutation({
    mutationFn: () => databaseService.optimize(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['db-stats'] });
      notificationService.success('Completado', 'La base de datos ha sido optimizada.');
    }
  });

  const handleOptimize = () => {
    notificationService.info('Mantenimiento', 'Optimizando base de datos...');
    optimizeMutation.mutate();
  };

  const backupMutation = useMutation({
    mutationFn: async () => {
      const path = await databaseService.backup();
      await databaseService.reveal(path);
      return path;
    },
    onSuccess: () => {
      notificationService.successWithConfirm('Copia Creada', 'El respaldo se completó y la carpeta se ha abierto.');
    }
  });

  const handleBackup = () => {
    notificationService.info('Respaldo', 'Creando copia de seguridad...');
    backupMutation.mutate();
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
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

    updatePasswordMutation.mutate(securityData.newPassword);
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
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white tracking-tight">Configuración del Sistema</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Administra los parámetros globales de tu minimarket.</p>
        </div>
        <Badge label="Versión 0.8.6" variant="blue" />
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
                <label htmlFor="id-sede-unico" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">ID de Sede Único</label>
                <input
                  id="id-sede-unico"
                  type="text"
                  value={localSucursal.sucursal_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocalSucursal(prev => ({...prev, sucursal_id: val}));
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
                    setLocalSucursal(prev => ({...prev, nombre_sucursal: val}));
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
                          setLocalSucursal(prev => ({...prev, api_url_central: val}));
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
                        className={`px-4 py-2.5 rounded-2xl h-full ${
                          connectionStatus === 'success' 
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
        </Section>
        
        {/* Datos de la empresa */}
        <Section 
          icon={Store} 
          title="Datos del Negocio" 
          description="Información que aparecerá en tus comprobantes."
        >
          <form onSubmit={handleNegocioSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Razón Social" value={localNegocio.razon_social} onChange={val => setLocalNegocio(prev => ({...prev, razon_social: val}))} placeholder="Ej: Minimarket El Sol S.A.C." />
              <Field label="RUC / Identificación" value={localNegocio.ruc} onChange={val => setLocalNegocio(prev => ({...prev, ruc: val}))} placeholder="Ej: 20123456789" />
              <div className="sm:col-span-2">
                <Field label="Dirección Fiscal" value={localNegocio.direccion} onChange={val => setLocalNegocio(prev => ({...prev, direccion: val}))} placeholder="Av. Principal 123, Tacna" />
              </div>
              <Field label="Teléfono de Contacto" value={localNegocio.telefono} onChange={val => setLocalNegocio(prev => ({...prev, telefono: val}))} placeholder="Ej: 052 123 456" />
              <Field label="Correo Electrónico" value={localNegocio.email} onChange={val => setLocalNegocio(prev => ({...prev, email: val}))} placeholder="contacto@empresa.com" />
            </div>
            <Button 
              type="submit"
              isLoading={saveNegocioMutation.isPending}
              className="w-full sm:w-auto px-6 py-2.5 font-bold rounded-2xl"
              icon={<Save size={18} />}
            >
              Guardar Datos del Negocio
            </Button>
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
                <label htmlFor="config-usuario" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Usuario</label>
                <input id="config-usuario" disabled value={user?.username || 'admin'} className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="config-rol" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Rol del Sistema</label>
                <input id="config-rol" disabled value={user?.rol_id === 1 ? 'Administrador' : 'Cajero'} className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed" />
              </div>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nueva Contraseña" value={securityData.newPassword} onChange={val => setSecurityData(prev => ({...prev, newPassword: val}))} type="password" placeholder="Nueva clave" />
                <Field label="Confirmar Nueva" value={securityData.confirmPassword} onChange={val => setSecurityData(prev => ({...prev, confirmPassword: val}))} type="password" placeholder="Repite clave" />
              </div>
            </div>
            <Button 
              type="submit"
              variant="secondary"
              isLoading={updatePasswordMutation.isPending}
              className="w-full sm:w-auto px-6 py-2.5 font-bold rounded-2xl bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-900 text-white"
            >
              Actualizar Credenciales
            </Button>
          </form>
        </Section>

        {/* Base de Datos */}
        <Section 
          icon={Database} 
          title="Almacenamiento" 
          description="Estado y mantenimiento de la base de datos local."
        >
          <div className="space-y-6">
            <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Motor de Base de Datos</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                  Activo
                </span>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                SQLite (Local) • {formatSize(dbStats.size)}
              </p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono truncate mt-1" title={dbStats.path}>
                {dbStats.path}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Tooltip text="Optimizar registros de la base de datos" position="top" className="w-1/2">
                <Button 
                  variant="ghost"
                  onClick={handleOptimize}
                  isLoading={optimizeMutation.isPending}
                  className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 rounded-2xl"
                >
                  Optimizar Tablas
                </Button>
              </Tooltip>
              <Tooltip text="Descargar la base de datos" position="top" className="w-1/2">
                <Button 
                  variant="secondary"
                  onClick={handleBackup}
                  isLoading={backupMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 text-xs font-bold rounded-2xl"
                >
                  Respaldar Datos
                </Button>
              </Tooltip>
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
                <div key={label} className="flex items-center justify-between py-3 border-b border-zinc-50 dark:border-zinc-700 last:border-0">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 truncate">{label}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{desc}</p>
                  </div>
                  <button 
                    onClick={() => handleToggle(id as keyof AppPreferences)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${active ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              );
            })}

            {prefs.enableAutoLogout && (
              <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-300">Tiempo de Inactividad</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      max="1440"
                      value={prefs.inactivityTimeout}
                      onChange={(e) => handleUpdatePref('inactivityTimeout', parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 text-center text-sm font-black bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-700 rounded-lg text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">min</span>
                  </div>
                </div>
              </div>
            )}

            {/* Brillo */}
            <div className="flex items-center justify-between py-3 border-t border-zinc-50 dark:border-zinc-700 mt-2 pt-4">
              <div className="min-w-0 pr-4">
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 truncate">Brillo General</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Ajusta la iluminación para cuidar tu vista.</p>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="30" 
                  max="100" 
                  value={prefs.brightness ?? 100}
                  onChange={(e) => handleUpdatePref('brightness', parseInt(e.target.value))}
                  className="w-24 accent-blue-500"
                />
                <span className="text-xs font-bold text-zinc-500 w-8 text-right">{prefs.brightness ?? 100}%</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Atajos de Teclado */}
        <Section 
          icon={Keyboard} 
          title="Atajos de Teclado" 
          description="Configura atajos rápidos para navegar entre las vistas."
        >
          <div className="space-y-4">
            <div className="bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="select-vista-shortcut" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Seleccionar Vista</label>
                <select 
                  id="select-vista-shortcut"
                  value={newShortcutPath}
                  onChange={(e) => setNewShortcutPath(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {allNavItems.map(item => {
                    const isAssigned = Object.values(prefs.shortcuts || {}).includes(item.to);
                    return (
                      <option key={item.to} value={item.to}>
                        {item.label} {isAssigned ? '(Ya asignado)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="combo-teclas-shortcut" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Combinación de Teclas</label>
                <div className="flex gap-2">
                  <button 
                    id="combo-teclas-shortcut"
                    type="button"
                    onClick={() => {
                      setIsRecordingCombo(true);
                      setNewShortcutCombo('');
                    }}
                    onKeyDown={(e) => {
                      if (!isRecordingCombo) return;
                      e.preventDefault();
                      
                      const keys = [];
                      if (e.ctrlKey) keys.push('Ctrl');
                      if (e.altKey) keys.push('Alt');
                      if (e.shiftKey) keys.push('Shift');
                      
                      if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
                        const keyName = e.key === ' ' ? 'Space' : e.key.toUpperCase();
                        keys.push(keyName);
                      }

                      if (keys.length > 0) {
                        setNewShortcutCombo(keys.join('+'));
                        if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
                          setIsRecordingCombo(false);
                        }
                      }
                    }}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium border rounded-2xl transition-all text-left ${isRecordingCombo ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]' : 'border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500'}`}
                  >
                    {isRecordingCombo ? 'Presiona una combinación...' : (newShortcutCombo || 'Haz clic aquí para grabar')}
                  </button>
                  <Button 
                    onClick={handleAddShortcut}
                    disabled={!newShortcutCombo}
                    className="px-4 py-2.5 rounded-2xl"
                    icon={<Plus size={18} />}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(prefs.shortcuts || {}).length > 0 ? (
                Object.entries(prefs.shortcuts || {}).map(([combo, path]) => {
                  const viewLabel = allNavItems.find(i => i.to === path)?.label || path;
                  return (
                    <div key={combo} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold rounded-lg border border-zinc-200 dark:border-zinc-600">
                          {combo}
                        </div>
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                          <ArrowRight size={14} />
                          {viewLabel}
                        </span>
                      </div>
                      <Button 
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleRemoveShortcut(combo)}
                        className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                      />
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 italic text-center py-4">No hay atajos configurados.</p>
              )}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
