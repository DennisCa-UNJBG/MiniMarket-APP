import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-9 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none
        ${isDark ? 'bg-indigo-600' : 'bg-gray-200'}
      `}
      aria-label="Toggle Theme"
    >
      {/* Track Icons */}
      <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none">
        <Sun size={12} className={`${isDark ? 'text-indigo-400' : 'text-amber-500'} transition-colors duration-300`} />
        <Moon size={12} className={`${isDark ? 'text-white' : 'text-gray-400'} transition-colors duration-300`} />
      </div>

      {/* Sliding Knob */}
      <span
        className={`
          inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out
          ${isDark ? 'translate-x-8' : 'translate-x-1'}
          flex items-center justify-center
        `}
      >
        {isDark ? (
          <Moon size={14} className="text-indigo-600" />
        ) : (
          <Sun size={14} className="text-amber-500" />
        )}
      </span>
    </button>
  );
}
