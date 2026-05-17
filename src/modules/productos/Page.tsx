import { useState } from 'react';
import {
  Package,
  Tag,
  Scale,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { TabProductos } from './components/TabProductos';
import { TabCategorias } from './components/TabCategorias';
import { TabUnidades } from './components/TabUnidades';
import { categoriaService } from './categoriaService';

// ── Componente Principal de Catálogo de Productos ────────────────────────────
export function Productos() {
  const [activeTab, setActiveTab] = useState<'productos' | 'categorias' | 'unidades'>('productos');

  // Cargamos categorías aquí para compartirlas entre pestañas (especialmente para TabProductos)
  const { data: categories = [], refetch: loadCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriaService.getAll(false),
  });

  const tabs = [
    { key: 'productos', label: 'Productos', icon: Package },
    { key: 'categorias', label: 'Categorías', icon: Tag },
    { key: 'unidades', label: 'Unidades', icon: Scale },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`tab-${key}`}
            onClick={() => setActiveTab(key as any)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === key
                ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
            ].join(' ')}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña activa */}
      {activeTab === 'productos'  && <TabProductos categories={categories} />}
      {activeTab === 'categorias' && <TabCategorias onUpdate={loadCategories} />}
      {activeTab === 'unidades'   && <TabUnidades />}
    </div>
  );
}
