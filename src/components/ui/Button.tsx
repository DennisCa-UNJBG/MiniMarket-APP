import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantClasses = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 dark:shadow-none',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200 dark:shadow-none',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200
        active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  );
}
