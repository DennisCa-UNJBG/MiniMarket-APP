import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Store, Sun, Moon } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';
import { useSidebar } from '../../contexts/SidebarContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SidebarItem } from './SidebarItem';
import { mainNavItems, bottomNavItems } from '../../../config/navigation';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { systemConfigService } from '../../../modules/configuracion/systemConfigService';

export function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [appVersion, setAppVersion] = useState('');
  const [showThemeTooltip, setShowThemeTooltip] = useState(false);
  const [themeTooltipCoords, setThemeTooltipCoords] = useState({ top: 0, left: 0 });
  const themeBtnRef = useRef<HTMLButtonElement>(null);

  const { data: config } = useQuery({
    queryKey: ['sucursal-config'],
    queryFn: () => systemConfigService.getConfig(),
    enabled: !!user
  });

  const { data: isCentral = false } = useQuery({
    queryKey: ['server-status'],
    queryFn: () => invoke<boolean>('is_server_running'),
    enabled: !!user
  });

  const isBranchMode = !!config?.api_url_central && !isCentral;

  const handleThemeMouseEnter = () => {
    if (!isCollapsed || !themeBtnRef.current) return;
    const rect = themeBtnRef.current.getBoundingClientRect();
    setThemeTooltipCoords({
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
    setShowThemeTooltip(true);
  };

  const handleThemeMouseLeave = () => {
    setShowThemeTooltip(false);
  };

  useEffect(() => {
    getVersion().then(v => setAppVersion(v)).catch(console.error);
  }, []);

  // Filtramos los items de navegación según el rol del usuario y el modo del sistema
  const filterItems = (items: typeof mainNavItems) => {
    return items.filter(item => {
      // Bloquear vistas específicas en modo sucursal
      if (isBranchMode && (item.to === '/usuarios' || item.to === '/sincronizacion' || item.to === '/sucursales')) {
        return false;
      }

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
        'flex flex-col h-screen bg-white dark:bg-zinc-800',
        'border-r border-zinc-200 dark:border-zinc-700 flex-shrink-0 overflow-hidden',
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
          'border-b border-zinc-200 dark:border-zinc-700',
          'hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors',
          isCollapsed ? 'justify-center' : '',
        ].join(' ')}
      >
        {/* Ícono de la empresa */}
        <div className="flex-shrink-0 size-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none">
          <Store size={17} className="text-white" />
        </div>

        {/* Nombre — oculto cuando colapsado */}
        {!isCollapsed && (
          <div className="text-left min-w-0">
            <p className="text-sm font-bold text-zinc-800 dark:text-white leading-tight truncate">
              Minimarket-APP
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate flex items-center gap-1.5">
              Sistema de Inventario
              {appVersion && (
                <span className="px-1.5 py-0.5 bg-zinc-200/60 dark:bg-zinc-700/60 rounded text-[9px] font-bold text-zinc-500 dark:text-zinc-400">
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
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 select-none">
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
      <div className="px-3 py-4 border-t border-zinc-200 dark:border-zinc-700 space-y-0.5 flex-shrink-0">
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
          ref={themeBtnRef}
          id="theme-toggle"
          onClick={() => {
            toggleTheme();
            handleThemeMouseLeave();
          }}
          onMouseEnter={handleThemeMouseEnter}
          onMouseLeave={handleThemeMouseLeave}
          className={[
            'flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-200',
            'text-zinc-500 dark:text-zinc-400',
            'hover:bg-blue-50 dark:hover:bg-zinc-700/60 hover:text-blue-600 dark:hover:text-blue-400',
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

      {/* Tooltip del toggle de tema renderizado vía Portal */}
      {isCollapsed && showThemeTooltip && createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${themeTooltipCoords.top}px`,
            left: `${themeTooltipCoords.left}px`,
            transform: 'translateY(-50%)',
          }}
          className={[
            'z-[9999] px-3 py-1.5 bg-zinc-950 dark:bg-white',
            'text-white dark:text-zinc-950 text-xs font-semibold rounded-lg shadow-xl',
            'whitespace-nowrap pointer-events-none flex items-center transition-all duration-150',
            'animate-in fade-in zoom-in-95 duration-100'
          ].join(' ')}
        >
          {/* Flecha apuntadora */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-y-[5px] border-y-transparent border-r-[5px] border-r-zinc-950 dark:border-r-white mr-[-1px]"></div>
          {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        </div>,
        document.body
      )}
    </aside>
  );
}
