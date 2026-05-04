import { useLocation } from 'react-router-dom';
import { Bell, User, LogOut } from 'lucide-react';
import { mainNavItems, bottomNavItems } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from './Button';

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

  return (
    <header className="h-14 flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Título de la página actual */}
      <h1 className="text-base font-semibold text-gray-700 dark:text-gray-200">
        {pageTitle}
      </h1>

      {/* Acciones del lado derecho */}
      <div className="flex items-center gap-4">
        {/* Notificaciones */}
        <button
          id="notifications-btn"
          aria-label="Notificaciones"
          className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Bell size={18} />
          {/* Badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        {/* Info Usuario y Logout */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-gray-700">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-none">
              {user?.nombre_completo || 'Usuario'}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1 uppercase tracking-wider">
              {user?.rol_id === 1 ? 'Administrador' : 'Vendedor'}
            </span>
          </div>

          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <User size={16} className="text-white" />
          </div>

          <Button 
            variant="danger" 
            size="sm" 
            onClick={logout}
            className="p-2 bg-red-500 hover:bg-red-200 text-white shadow-lg shadow-red-200 dark:shadow-none border-none rounded-xl transition-all"
            title="Cerrar Sesión"
          >
            <LogOut size={18} strokeWidth={3} />
          </Button>
        </div>
      </div>
    </header>
  );
}

