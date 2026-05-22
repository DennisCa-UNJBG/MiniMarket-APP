import { type InputHTMLAttributes, type ReactNode, useState, type Ref } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  helperText?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Input({ label, icon, error, helperText, className = '', type, ref, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`
            w-full py-3 bg-zinc-50 dark:bg-zinc-900 border rounded-xl transition-all text-zinc-900 dark:text-white placeholder-zinc-400
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
            ${icon ? 'pl-10' : 'pl-4'}
            ${isPassword ? 'pr-11' : 'pr-4'}
            ${error 
              ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500/20 focus:border-red-500' 
              : 'border-zinc-200 dark:border-zinc-700'}
            ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600 transition-colors p-1"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-500 mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{helperText}</p>}
    </div>
  );
}
