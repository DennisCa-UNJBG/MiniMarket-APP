import { useState, useEffect } from 'react';
import {
  Package,
  Tag,
  Scale,
  FileSpreadsheet,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { TabProductos } from './components/TabProductos';
import { TabCategorias } from './components/TabCategorias';
import { TabUnidades } from './components/TabUnidades';
import { ImportarExcelModal } from './components/ImportarExcelModal';
import { categoriaService } from './categoriaService';

// ── Componente Principal de Catálogo de Productos ────────────────────────────
export function Productos() {
  const [activeTab, setActiveTab] = useState<'productos' | 'categorias' | 'unidades'>('productos');
  const [isCentral, setIsCentral]         = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Detectar si este equipo es Sede Central (servidor activo)
  useEffect(() => {
    invoke<boolean>('is_server_running')
      .then(setIsCentral)
      .catch(() => setIsCentral(false));
  }, []);

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
      {/* ── Barra superior: tabs + botón importar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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

        {/* Botón visible SOLO en modo Sede Central */}
        {isCentral && (
          <button
            id="btn-abrir-import-excel"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl transition-colors shadow-sm"
            title="Importar catálogo de productos desde un archivo Excel"
          >
            <FileSpreadsheet size={15} />
            Importar desde Excel
          </button>
        )}
      </div>

      {/* Contenido de la pestaña activa */}
      {activeTab === 'productos'  && <TabProductos categories={categories} />}
      {activeTab === 'categorias' && <TabCategorias onUpdate={loadCategories} />}
      {activeTab === 'unidades'   && <TabUnidades />}

      {/* Modal de importación */}
      {showImportModal && (
        <ImportarExcelModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            loadCategories();
            // El TabProductos se recargará con su propio queryKey
          }}
        />
      )}
    </div>
  );
}
