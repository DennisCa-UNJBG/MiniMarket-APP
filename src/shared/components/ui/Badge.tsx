// Badge reutilizable para estados, categorías y etiquetas.

interface BadgeProps {
  label: string;
  variant?: 'blue' | 'emerald' | 'amber' | 'red' | 'sky' | 'gray';
  /** Clases CSS adicionales para casos especiales */
  className?: string;
}

const variantClass: Record<NonNullable<BadgeProps['variant']>, string> = {
  blue:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  amber:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  red:     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  sky:     'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  gray:    'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300',
};

export function Badge({ label, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${variantClass[variant]} ${className}`}>
      {label}
    </span>
  );
}
