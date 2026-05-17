import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = '', onClick, hoverable = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl shadow-sm overflow-hidden
        ${hoverable ? 'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/50 transition-all cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

Card.Header = ({ children, className = '' }: CardHeaderProps) => (
  <div className={`px-6 py-4 border-b border-zinc-100 dark:border-zinc-700 ${className}`}>
    {children}
  </div>
);

Card.Body = ({ children, className = '' }: CardHeaderProps) => (
  <div className={`px-6 py-5 ${className}`}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '' }: CardHeaderProps) => (
  <div className={`px-6 py-4 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 ${className}`}>
    {children}
  </div>
);
