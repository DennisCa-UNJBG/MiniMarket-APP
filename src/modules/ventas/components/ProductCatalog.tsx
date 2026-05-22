import { Search, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { productoService, type Product } from '../../productos/Service';
import { categoriaService } from '../../productos/categoriaService';
import { notificationService } from '../../../shared/lib/notifications';

interface ProductCatalogProps {
  search: string;
  setSearch: (s: string) => void;
  activeCategory: number | 'Todos';
  setActiveCategory: (c: number | 'Todos') => void;
  addToCart: (product: Product) => void;
}

export function ProductCatalog({
  search,
  setSearch,
  activeCategory,
  setActiveCategory,
  addToCart
}: ProductCatalogProps) {
  const { data: products = [] } = useQuery({
    queryKey: ['products', true],
    queryFn: () => productoService.getAll(true)
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriaService.getAll()
  });

  const filteredCatalog = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === 'Todos' || p.categoria_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col h-full lg:border-r border-zinc-200 dark:border-zinc-700">
      {/* Búsqueda y Categorías */}
      <div className="p-4 bg-white dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700 shrink-0 space-y-3">
        <Input
          placeholder="Buscar por código o nombre del producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={18} />}
        />

        {/* Scroll horizontal de categorías */}
        <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
          <Button
            variant={activeCategory === 'Todos' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveCategory('Todos')}
            className={`px-4 py-1.5 rounded-full whitespace-nowrap border-none ${activeCategory === 'Todos'
                ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
              }`}
          >
            Todos
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full whitespace-nowrap border-none ${activeCategory === cat.id
                  ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
                }`}
            >
              {cat.nombre}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCatalog.map(product => (
            <Card
              key={product.id}
              onClick={() => (product.stock_actual || 0) > 0 ? addToCart(product) : notificationService.warning('Sin Stock', 'Este producto no tiene existencias.')}
              hoverable
              className={`p-4 text-left flex flex-col h-full group ${(product.stock_actual || 0) <= 0 ? 'opacity-60 grayscale-[0.5]' : ''}`}
            >
              <div className="w-full h-24 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl mb-3 flex items-center justify-center text-zinc-300 dark:text-zinc-600 group-hover:scale-105 transition-transform relative overflow-hidden">
                <ShoppingBag size={32} />
                {(product.stock_actual || 0) <= 0 && (
                  <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter shadow-lg">Agotado</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Badge label={product.categoria_nombre || 'General'} variant="blue" className="mb-1" />
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-tight mb-2 line-clamp-2">{product.nombre}</p>
              </div>
              <div className="flex items-end justify-between mt-auto pt-2">
                <p className="text-lg font-bold text-zinc-900 dark:text-white">S/ {(product.precio_venta || 0).toFixed(2)}</p>
                <p className={`text-[10px] font-medium ${product.stock_actual <= (product.stock_minimo || 0) ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                  {product.stock_actual} {product.unidad_medida}
                </p>
              </div>
            </Card>
          ))}
        </div>
        {filteredCatalog.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500">
            <ShoppingBag size={48} className="mb-3 opacity-20" />
            <p>No se encontraron productos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
