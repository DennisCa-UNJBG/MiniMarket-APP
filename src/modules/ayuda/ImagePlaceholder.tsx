import { ImagePlus } from 'lucide-react';

interface ImagePlaceholderProps {
  title: string;
}

export function ImagePlaceholder({ title }: ImagePlaceholderProps) {
  return (
    <div className="my-6 p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer group">
      <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
        <ImagePlus size={24} className="text-zinc-400 dark:text-zinc-500" />
      </div>
      <div className="text-center">
        <p className="font-medium text-sm text-zinc-600 dark:text-zinc-300">
          Espacio para imagen: {title}
        </p>
        <p className="text-xs opacity-70 mt-1">
          Reemplaza este componente con la etiqueta &lt;img src="..." /&gt; cuando tengas la captura.
        </p>
      </div>
    </div>
  );
}
