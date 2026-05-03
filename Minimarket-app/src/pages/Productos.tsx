import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Package, Search } from 'lucide-react';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Category {
  id: number;
  name: string;
  color: string;
  productCount: number;
}

interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  minStock: number;
}

// ── Datos de ejemplo ───────────────────────────────────────────────────────────
const initialCategories: Category[] = [
  { id: 1, name: 'Abarrotes',  color: 'bg-amber-500',   productCount: 45 },
  { id: 2, name: 'Bebidas',    color: 'bg-sky-500',      productCount: 18 },
  { id: 3, name: 'Lácteos',    color: 'bg-blue-400',     productCount: 12 },
  { id: 4, name: 'Limpieza',   color: 'bg-emerald-500',  productCount: 22 },
  { id: 5, name: 'Panadería',  color: 'bg-orange-400',   productCount: 8  },
  { id: 6, name: 'Snacks',     color: 'bg-purple-500',   productCount: 15 },
];

const initialProducts: Product[] = [
  { id: 1, code: 'P001', name: 'Arroz Costeño 1kg',       category: 'Abarrotes', unit: 'bolsa',   buyPrice: 2.80,  sellPrice: 3.50,  minStock: 20 },
  { id: 2, code: 'P002', name: 'Aceite Primor 1L',         category: 'Abarrotes', unit: 'botella', buyPrice: 5.50,  sellPrice: 7.00,  minStock: 15 },
  { id: 3, code: 'P003', name: 'Leche Gloria 400g',        category: 'Lácteos',   unit: 'tarro',   buyPrice: 3.20,  sellPrice: 4.00,  minStock: 10 },
  { id: 4, code: 'P004', name: 'Inka Kola 1.5L',           category: 'Bebidas',   unit: 'botella', buyPrice: 3.80,  sellPrice: 5.00,  minStock: 12 },
  { id: 5, code: 'P005', name: 'Jabón Bolívar',            category: 'Limpieza',  unit: 'unidad',  buyPrice: 1.20,  sellPrice: 1.80,  minStock: 10 },
];

const units = ['unidad', 'kg', 'bolsa', 'botella', 'tarro', 'litro', 'caja', 'paquete'];

const colorOptions = [
  { label: 'Ámbar',    value: 'bg-amber-500'   },
  { label: 'Cielo',    value: 'bg-sky-500'     },
  { label: 'Azul',     value: 'bg-blue-400'    },
  { label: 'Verde',    value: 'bg-emerald-500' },
  { label: 'Naranja',  value: 'bg-orange-400'  },
  { label: 'Morado',   value: 'bg-purple-500'  },
  { label: 'Rosa',     value: 'bg-pink-500'    },
  { label: 'Rojo',     value: 'bg-red-500'     },
];

// (El componente Modal fue extraído a src/components/ui/Modal.tsx)

// ── Pestaña Productos ──────────────────────────────────────────────────────────
function TabProductos({ categories }: { categories: Category[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', name: '', category: '', unit: 'unidad', buyPrice: '', sellPrice: '', minStock: '' });

  const handleSave = () => {
    if (!form.name || !form.category) return;
    const next: Product = {
      id: Date.now(),
      code: form.code || `P${String(products.length + 1).padStart(3, '0')}`,
      name: form.name,
      category: form.category,
      unit: form.unit,
      buyPrice: parseFloat(form.buyPrice) || 0,
      sellPrice: parseFloat(form.sellPrice) || 0,
      minStock: parseInt(form.minStock) || 0,
    };
    setProducts([...products, next]);
    setForm({ code: '', name: '', category: '', unit: 'unidad', buyPrice: '', sellPrice: '', minStock: '' });
    setShowModal(false);
  };

  const handleDelete = (id: number) => setProducts(products.filter((p) => p.id !== id));

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition';

  const columns: TableColumn<Product>[] = [
    { key: 'code', header: 'Código', render: (row) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{row.code}</span> },
    { key: 'name', header: 'Nombre', render: (row) => <span className="font-medium text-gray-800 dark:text-white">{row.name}</span> },
    { key: 'category', header: 'Categoría', render: (row) => <Badge label={row.category} variant="indigo" /> },
    { key: 'unit', header: 'Unidad' },
    { key: 'buyPrice', header: 'P. Compra', align: 'right', render: (row) => <span className="text-gray-600 dark:text-gray-300">S/ {row.buyPrice.toFixed(2)}</span> },
    { key: 'sellPrice', header: 'P. Venta', align: 'right', render: (row) => <span className="font-medium text-gray-800 dark:text-white">S/ {row.sellPrice.toFixed(2)}</span> },
    { key: 'minStock', header: 'Stock mín.', align: 'center' },
    {
      key: 'acciones', header: '', align: 'right',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600 transition-colors"><Edit2 size={14} /></button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">{filteredProducts.length} productos</p>
          <button
            id="add-product-modal-btn"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus size={15} /> Nuevo producto
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts}
        keyExtractor={(row) => row.id}
        emptyMessage="No hay productos registrados."
        defaultPageSize={5}
      />

      {/* Modal nuevo producto */}
      {showModal && (
        <Modal title="Agregar nuevo producto" onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Código (opcional)</label>
              <input className={inputCls} placeholder="Ej. P009" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Unidad de medida</label>
              <select className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Nombre del producto *</label>
              <input className={inputCls} placeholder="Ej. Arroz Costeño 1kg" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Categoría *</label>
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Seleccionar categoría...</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Precio de compra (S/)</label>
              <input type="number" step="0.01" className={inputCls} placeholder="0.00" value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Precio de venta (S/)</label>
              <input type="number" step="0.01" className={inputCls} placeholder="0.00" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Stock mínimo</label>
              <input type="number" className={inputCls} placeholder="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
              Guardar producto
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Pestaña Categorías ─────────────────────────────────────────────────────────
function TabCategorias() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', color: 'bg-amber-500' });

  const handleSave = () => {
    if (!form.name.trim()) return;
    setCategories([...categories, { id: Date.now(), name: form.name, color: form.color, productCount: 0 }]);
    setForm({ name: '', color: 'bg-amber-500' });
    setShowModal(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{categories.length} categorías registradas</p>
        <button
          id="add-category-btn"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={15} /> Nueva categoría
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className={`${cat.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
              <Tag size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">{cat.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{cat.productCount} productos</p>
            </div>
            <div className="flex gap-1 pt-1 border-t border-gray-100 dark:border-gray-700">
              <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Edit2 size={12} /> Editar
              </button>
              <button
                onClick={() => setCategories(categories.filter((c) => c.id !== cat.id))}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Trash2 size={12} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Nueva categoría" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Nombre de la categoría *</label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Ej. Frutas y verduras"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Color de la categoría</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c.value}
                    title={c.label}
                    onClick={() => setForm({ ...form, color: c.value })}
                    className={`w-8 h-8 rounded-lg ${c.value} transition-transform hover:scale-110 ${form.color === c.value ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''}`}
                  />
                ))}
              </div>
            </div>
            {/* Preview */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className={`${form.color} w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Tag size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{form.name || 'Nombre de categoría'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">0 productos</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
              Crear categoría
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Página principal Productos ─────────────────────────────────────────────────
type Tab = 'productos' | 'categorias';

export function Productos() {
  const [activeTab, setActiveTab] = useState<Tab>('productos');
  const [categories] = useState<Category[]>(initialCategories);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'productos',  label: 'Productos',   icon: Package },
    { key: 'categorias', label: 'Categorías',  icon: Tag     },
  ];

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Productos</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Gestión de catálogo de productos y categorías</p>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit border border-gray-200 dark:border-gray-700">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`tab-${key}`}
            onClick={() => setActiveTab(key)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === key
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            ].join(' ')}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña activa */}
      {activeTab === 'productos'  && <TabProductos categories={categories} />}
      {activeTab === 'categorias' && <TabCategorias />}
    </div>
  );
}
