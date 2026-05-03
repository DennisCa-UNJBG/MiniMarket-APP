import { useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { mainNavItems, bottomNavItems } from '../../config/navigation';

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

  return (
    <header className="h-14 flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Título de la página actual */}
      <h1 className="text-base font-semibold text-gray-700 dark:text-gray-200">
        {pageTitle}
      </h1>

      {/* Acciones del lado derecho */}
      <div className="flex items-center gap-2">
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

        {/* Avatar usuario */}
        <button
          id="user-avatar-btn"
          aria-label="Perfil de usuario"
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
            Admin
          </span>
        </button>
      </div>
    </header>
  );
}
