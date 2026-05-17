import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  to: string;
  isCollapsed: boolean;
  exact?: boolean;
}

export function SidebarItem({ icon: Icon, label, to, isCollapsed, exact }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group w-full',
          isCollapsed ? 'justify-center' : '',
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-zinc-700/60 hover:text-blue-600 dark:hover:text-blue-400',
        ].join(' ')
      }
    >
      <Icon size={20} className="flex-shrink-0" />

      {!isCollapsed && (
        <span className="text-sm font-medium whitespace-nowrap">{label}</span>
      )}

      {/* Tooltip visible solo cuando está colapsado */}
      {isCollapsed && (
        <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 dark:bg-zinc-700 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
          {label}
        </span>
      )}
    </NavLink>
  );
}
