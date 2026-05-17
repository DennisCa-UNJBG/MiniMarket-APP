import { useState } from 'react';
import {
  Shield,
  Users as UsersIcon,
} from 'lucide-react';
import { TabUsuarios } from './components/TabUsuarios';
import { TabRoles } from './components/TabRoles';

// ── Componente Principal de Página ───────────────────────────────────────────
export function Usuarios() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'roles'>('usuarios');

  const tabs = [
    { key: 'usuarios', label: 'Usuarios', icon: UsersIcon },
    { key: 'roles', label: 'Roles y Permisos', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white tracking-tight">Personal y Accesos</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Administra usuarios, asigna sucursales y configura permisos.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`tab-${key}`}
            onClick={() => setActiveTab(key as any)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === key
                ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
            ].join(' ')}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'usuarios' && <TabUsuarios />}
      {activeTab === 'roles'    && <TabRoles />}
    </div>
  );
}
