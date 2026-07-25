import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Store,
  Shield,
  RefreshCw,
  Sliders,
  Keyboard,
  Menu
} from 'lucide-react';
import { Badge } from '../../shared/components/ui/Badge';
import { SedesSection } from './components/SedesSection';
import { BusinessSection } from './components/BusinessSection';
import { SecuritySection } from './components/SecuritySection';
import { PreferencesSection } from './components/PreferencesSection';
import { KeyboardShortcutsSection } from './components/KeyboardShortcutsSection';
import { MenuOrderSection } from './components/MenuOrderSection';
import { UpdaterSection } from './components/UpdaterSection';
import { systemConfigService } from './systemConfigService';
import { negocioService } from './negocioService';

export function Configuracion() {
  const [activeTab, setActiveTab] = useState('sedes');

  const { data: sucursalData, isLoading: loadingSucursal } = useQuery({
    queryKey: ['sucursal-config'],
    queryFn: () => systemConfigService.getConfig()
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

  const tabs = [
    {
      id: 'sedes',
      label: 'Sedes',
      icon: Building2,
      component: <SedesSection initialData={sucursalData ?? null} key={sucursalData?.ultima_sincronizacion || 'sedes'} />
    },
    {
      id: 'negocio',
      label: 'Negocio',
      icon: Store,
      component: <BusinessSection initialData={negocioData!} key={negocioData?.razon_social || 'negocio'} />
    },
    {
      id: 'seguridad',
      label: 'Seguridad',
      icon: Shield,
      component: <SecuritySection />
    },
    {
      id: 'actualizaciones',
      label: 'Actualizaciones',
      icon: RefreshCw,
      component: <UpdaterSection />
    },
    {
      id: 'preferencias',
      label: 'Preferencias',
      icon: Sliders,
      component: <PreferencesSection />
    },
    {
      id: 'atajos',
      label: 'Atajos de Teclado',
      icon: Keyboard,
      component: <KeyboardShortcutsSection />
    },
    {
      id: 'menu',
      label: 'Menú',
      icon: Menu,
      component: <MenuOrderSection />
    }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab) || tabs[0];
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white tracking-tight">Configuración del Sistema</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Administra los parámetros globales de tu minimarket.</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-zinc-100 dark:border-zinc-800 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-px scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-200 group relative outline-none ${isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-200 dark:hover:border-zinc-700'
                  }`}
              >
                <Icon
                  size={16}
                  className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                    }`}
                />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-in fade-in zoom-in-95 duration-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div
        key={activeTab}
        className="animate-in fade-in slide-in-from-bottom-2 duration-300 focus:outline-none w-full"
      >
        <div className="w-full">
          {currentTab.component}
        </div>
      </div>
    </div>
  );
}
