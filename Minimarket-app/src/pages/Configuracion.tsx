import { useState, useEffect } from 'react';
import { Store, Database, Bell, Save, Shield } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { notificationService } from '../lib/notifications';
import { databaseService } from '../services/databaseService';

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
  const [dbStats, setDbStats] = useState<{ size: number; path: string }>({ size: 0, path: 'Cargando...' });

  const loadStats = async () => {
    const stats = await databaseService.getDbStats();
    setDbStats(stats);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      notificationService.success('Configuración Guardada', 'Los cambios se aplicaron correctamente.');
    }, 1000);
  };

  const handleOptimize = async () => {
    try {
      notificationService.info('Mantenimiento', 'Optimizando base de datos...');
      await databaseService.optimize();
      await loadStats();
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
              { label: 'Alertas de Stock Crítico', desc: 'Notificar cuando un producto se agota.', active: true },
              { label: 'Copia Automática', desc: 'Realizar respaldo al cerrar sesión.', active: false },
              { label: 'Sonido en POS', desc: 'Activar sonido al escanear productos.', active: true },
            ].map(({ label, desc, active }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{desc}</p>
                </div>
                <button className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${active ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}
