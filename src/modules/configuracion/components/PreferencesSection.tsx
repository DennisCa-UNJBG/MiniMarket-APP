import { useState } from 'react';
import { Bell, Database } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { preferenciasService, type AppPreferences } from '../preferenciasService';
import { databaseService } from '../databaseService';
import { notificationService } from '../../../shared/lib/notifications';
import { Tooltip } from '../../../shared/components/ui/Tooltip';
import { Button } from '../../../shared/components/ui/Button';

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function PreferencesSection() {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<AppPreferences>(() => preferenciasService.get());

  const { data: dbStats = { size: 0, path: 'Cargando...' } } = useQuery({
    queryKey: ['db-stats'],
    queryFn: () => databaseService.getDbStats()
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
      queryClient.invalidateQueries({ queryKey: ['db-stats'] });
      notificationService.successWithConfirm('Copia Creada', 'El respaldo se completó y la carpeta se ha abierto.');
    }
  });

  const handleBackup = () => {
    notificationService.info('Respaldo', 'Creando copia de seguridad...');
    backupMutation.mutate();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-2">
      {/* Almacenamiento */}
      <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-6 border-b border-zinc-50 dark:border-zinc-700/50 bg-zinc-50/30 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-800 dark:text-white tracking-tight">Almacenamiento</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Estado y mantenimiento de la base de datos local.</p>
            </div>
          </div>
        </div>
        <div className="p-6">
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
                  className="flex-1 w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 rounded-2xl"
                >
                  Optimizar Tablas
                </Button>
              </Tooltip>
              <Tooltip text="Descargar la base de datos" position="top" className="w-1/2">
                <Button
                  variant="secondary"
                  onClick={handleBackup}
                  isLoading={backupMutation.isPending}
                  className="flex-1 w-full px-4 py-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 text-xs font-bold rounded-2xl"
                >
                  Respaldar Datos
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Preferencias */}
      <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-6 border-b border-zinc-50 dark:border-zinc-700/50 bg-zinc-50/30 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-800 dark:text-white tracking-tight">Preferencias</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Controla las alertas y notificaciones del sistema.</p>
            </div>
          </div>
        </div>
        <div className="p-6">
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
        </div>
      </div>
    </div>
  );
}
