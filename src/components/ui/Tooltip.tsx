import { ReactNode } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-right';
  className?: string;
}

export function Tooltip({ text, children, position = 'top', className = '' }: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className={`group relative inline-flex items-center justify-center ${className}`}>
      {children}
      <div
        className={`absolute z-[100] whitespace-nowrap rounded-lg bg-gray-900 dark:bg-white px-2.5 py-1 text-[11px] font-medium text-white dark:text-gray-900 opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 pointer-events-none scale-95 group-hover:scale-100 ${positionClasses[position]}`}
      >
        {text}
      </div>
    </div>
  );
}
