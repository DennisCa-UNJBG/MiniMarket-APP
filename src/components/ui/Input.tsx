import { type InputHTMLAttributes, type ReactNode, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, helperText, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl transition-all text-gray-900 dark:text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
              ${icon ? 'pl-10' : 'pl-4'}
              ${isPassword ? 'pr-11' : 'pr-4'}
              ${error 
                ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500/20 focus:border-red-500' 
                : 'border-gray-200 dark:border-gray-700'}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <p className="text-xs font-medium text-red-500 mt-1">{error}</p>}
        {!error && helperText && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
