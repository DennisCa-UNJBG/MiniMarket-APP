import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'react-router-dom';
import { Bell, User, LogOut, AlertTriangle, Package } from 'lucide-react';
import { mainNavItems, bottomNavItems } from '../../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { alertaService } from '../../../modules/dashboard/alertaService';
import { preferenciasService } from '../../../modules/configuracion/preferenciasService';
import { AutoLogoutTimer } from '../auth/AutoLogoutTimer';

/** Obtiene el título de la página según la ruta activa */
function usePageTitle(): string {
  const { pathname } = useLocation();
  const allItems = [...mainNavItems, ...bottomNavItems];
  const found = allItems.find((item) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to)
  );
  return found?.label ?? 'Dashboard';
}

export function TopBar() {
  const pageTitle = usePageTitle();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: alerts = [] } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const prefs = preferenciasService.get();
      if (prefs.stockAlert) {
        return await alertaService.getLowStockAlerts();
      }
      return [];
    },
    refetchInterval: 60000, // Opcional: cada minuto como backup
  });

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 flex-shrink-0 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between px-6">
      {/* Título de la página actual */}
      <h1 className="text-base font-semibold text-zinc-700 dark:text-zinc-200">
        {pageTitle}
      </h1>

      {/* Acciones del lado derecho */}
      <div className="flex items-center gap-4">

        {/* Temporizador de Cierre de Sesión */}
        <AutoLogoutTimer />

        {/* Notificaciones */}
        <div className="relative" ref={dropdownRef}>
          <Tooltip text="Notificaciones" position="bottom">
            <button
              id="notifications-btn"
              aria-label="Notificaciones"
              onClick={() => setShowDropdown(!showDropdown)}
              className={`relative p-2 rounded-xl transition-all ${showDropdown
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
            >
              <Bell size={20} />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 flex size-4">
                  <span className="relative inline-flex rounded-full size-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
                    {alerts.length}
                  </span>
                </span>
              )}
            </button>
          </Tooltip>

          {/* Panel de Notificaciones Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-700 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-zinc-50 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-800/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-white tracking-tight">Alertas de Inventario</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">
                  {alerts.length} pendientes
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {alerts.length > 0 ? (
                  <div className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
                    {alerts.map((alerta) => (
                      <Link
                        key={alerta.id}
                        to="/inventario"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-start gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors"
                      >
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 dark:text-amber-400 flex-shrink-0">
                          <AlertTriangle size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">
                            {alerta.nombre}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-lg">
                              Stock: {alerta.stock_actual}
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                              Mínimo: {alerta.stock_minimo}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <div className="size-12 bg-zinc-50 dark:bg-zinc-700/50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-zinc-300 dark:text-zinc-600">
                      <Package size={24} />
                    </div>
                    <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500">Todo en orden</p>
                    <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-1">No hay productos con stock bajo.</p>
                  </div>
                )}
              </div>

              <Link
                to="/inventario"
                onClick={() => setShowDropdown(false)}
                className="block p-4 text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 border-t border-zinc-50 dark:border-zinc-700/50 transition-colors"
              >
                Ver todo el inventario
              </Link>
            </div>
          )}
        </div>

        {/* Info Usuario y Logout */}
        <div className="flex items-center gap-3 pl-4 border-l border-zinc-100 dark:border-zinc-700">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-none">
              {user?.nombre_completo || 'Usuario'}
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-1 uppercase tracking-wider">
              {user?.rol_nombre || 'Usuario'}
            </span>
          </div>

          <div className="size-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <User size={16} className="text-white" />
          </div>

          <Tooltip text="Cerrar Sesión" position="bottom">
            <Button
              variant="danger"
              size="sm"
              onClick={logout}
              className="p-2 bg-red-500 hover:bg-red-200 text-white shadow-lg shadow-red-200 dark:shadow-none border-none rounded-xl transition-all"
            >
              <LogOut size={18} strokeWidth={3} />
            </Button>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}

