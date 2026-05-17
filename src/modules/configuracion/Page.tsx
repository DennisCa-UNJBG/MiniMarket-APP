import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../components/ui/Badge';
import { SedesSection } from './components/SedesSection';
import { BusinessSection } from './components/BusinessSection';
import { SecuritySection } from './components/SecuritySection';
import { PreferencesSection } from './components/PreferencesSection';
import { KeyboardShortcutsSection } from './components/KeyboardShortcutsSection';
import { sucursalService } from '../sucursales/Service';
import { negocioService } from './negocioService';

export function Configuracion() {
  const { data: sucursalData, isLoading: loadingSucursal } = useQuery({
    queryKey: ['sucursal-config'],
    queryFn: () => sucursalService.getConfig()
  });

  const { data: negocioData, isLoading: loadingNegocio } = useQuery({
    queryKey: ['negocio'],
    queryFn: () => negocioService.get()
  });

  if (loadingSucursal || loadingNegocio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-y-4 animate-in fade-in duration-300">
        <div className="relative size-12">
          <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
        </div>
        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest animate-pulse">Cargando Configuración…</p>
      </div>
    );
  }

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
        <SedesSection initialData={sucursalData!} key={sucursalData?.ultima_sincronizacion || 'sedes'} />
        <BusinessSection initialData={negocioData!} key={negocioData?.razon_social || 'negocio'} />
        <SecuritySection />
        <KeyboardShortcutsSection />
        <PreferencesSection />
      </div>
    </div>
  );
}
