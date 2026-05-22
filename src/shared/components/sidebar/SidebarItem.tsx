import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipCoords, setTooltipCoords] = useState({ top: 0, left: 0 });
  const itemRef = useRef<HTMLAnchorElement>(null);

  const handleMouseEnter = () => {
    if (!isCollapsed || !itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    setTooltipCoords({
      top: rect.top + rect.height / 2, // Centrado verticalmente
      left: rect.right + 12, // 12px a la derecha del ítem
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <NavLink
        ref={itemRef}
        to={to}
        end={exact}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleMouseLeave}
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
      </NavLink>

      {/* Tooltip renderizado vía Portal en el body para evitar recortes de overflow */}
      {isCollapsed && showTooltip && createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${tooltipCoords.top}px`,
            left: `${tooltipCoords.left}px`,
            transform: 'translateY(-50%)',
          }}
          className={[
            'z-[9999] px-3 py-1.5 bg-blue-600',
            'text-white text-xs font-semibold rounded-lg shadow-xl',
            'whitespace-nowrap pointer-events-none flex items-center transition-all duration-150',
            'animate-in fade-in zoom-in-95 duration-100'
          ].join(' ')}
        >
          {/* Flecha apuntadora */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-y-[5px] border-y-transparent border-r-[5px] border-blue-600 mr-[-1px]"></div>
          {label}
        </div>,
        document.body
      )}
    </>
  );
}

