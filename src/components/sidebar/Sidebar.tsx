import { useState, useEffect } from 'react';
import { Store, Sun, Moon } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';
import { useSidebar } from '../../contexts/SidebarContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SidebarItem } from './SidebarItem';
import { mainNavItems, bottomNavItems } from '../../config/navigation';

export function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    getVersion().then(v => setAppVersion(v)).catch(console.error);
  }, []);

  // Filtramos los items de navegación según el rol del usuario
  const filterItems = (items: typeof mainNavItems) => {
    return items.filter(item => {
      if (!item.requiredPermission) return true; // Visible para todos si no hay restricciones
      if (!user || !user.permisos) return false;
      
      // El permiso '*' otorga acceso total (usado por Administradores)
      if (user.permisos.includes('*')) return true;
      
      // Verificar si tiene el permiso específico
      return user.permisos.includes(item.requiredPermission);
    });
  };

  const filteredMainItems = filterItems(mainNavItems);
  const filteredBottomItems = filterItems(bottomNavItems);

  return (
    <aside
      className={[
        'flex flex-col h-screen bg-white dark:bg-gray-800',
        'border-r border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-hidden',
        'transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[68px]' : 'w-64',
      ].join(' ')}
    >
      {/* ── Encabezado empresa — clic para colapsar/expandir ── */}
      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        className={[
          'flex items-center gap-3 w-full px-4 py-[18px] flex-shrink-0',
          'border-b border-gray-200 dark:border-gray-700',
          'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
          isCollapsed ? 'justify-center' : '',
        ].join(' ')}
      >
        {/* Ícono de la empresa */}
        <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
          <Store size={17} className="text-white" />
        </div>

        {/* Nombre — oculto cuando colapsado */}
        {!isCollapsed && (
          <div className="text-left min-w-0">
            <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight truncate">
              Minimarket
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate flex items-center gap-1.5">
              Sistema de Inventario
              {appVersion && (
                <span className="px-1.5 py-0.5 bg-gray-200/60 dark:bg-gray-700/60 rounded text-[9px] font-bold text-gray-500 dark:text-gray-400">
                  v {appVersion}
                </span>
              )}
            </p>
          </div>
        )}
      </button>

      {/* ── Navegación principal ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-0.5">
        {!isCollapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 select-none">
            Menú principal
          </p>
        )}
        {filteredMainItems.map((item) => (
          <SidebarItem
            key={item.to}
            icon={item.icon}
            label={item.label}
            to={item.to}
            isCollapsed={isCollapsed}
            exact={item.exact}
          />
        ))}
      </nav>

      {/* ── Sección inferior ── */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700 space-y-0.5 flex-shrink-0">
        {filteredBottomItems.map((item) => (
          <SidebarItem
            key={item.to}
            icon={item.icon}
            label={item.label}
            to={item.to}
            isCollapsed={isCollapsed}
          />
        ))}

        {/* Toggle tema */}
        <button
          id="theme-toggle"
          onClick={toggleTheme}
          title={isCollapsed ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : undefined}
          className={[
            'flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-200',
            'text-gray-500 dark:text-gray-400',
            'hover:bg-indigo-50 dark:hover:bg-gray-700/60 hover:text-indigo-600 dark:hover:text-indigo-400',
            isCollapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {!isCollapsed && (
            <span className="text-sm font-medium">
              {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
