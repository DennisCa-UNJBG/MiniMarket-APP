import { useState, useEffect, useRef } from 'react';
import { Package, Tag, Plus, Search, Edit2, PowerOff, RefreshCcw } from 'lucide-react';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { categoriaService, type Category } from '../services/categoriaService';
import { productoService, type Product } from '../services/productoService';
import { notificationService } from '../services/notificationService';

// ── Datos de ejemplo (Eliminados en favor de la DB) ──────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const generateProductCode = (lastCode: string | null) => {
  if (!lastCode || !lastCode.includes('-')) return 'PROD-0001';
  const parts = lastCode.split('-');
  const num = parseInt(parts[1]);
  if (isNaN(num)) return 'PROD-0001';
  return `PROD-${(num + 1).toString().padStart(4, '0')}`;
};

const units = ['unidad', 'kg', 'bolsa', 'botella', 'tarro', 'litro', 'caja', 'paquete'];

// (El componente Modal fue extraído a src/components/ui/Modal.tsx)

// ── Pestaña Productos ──────────────────────────────────────────────────────────
function TabProductos({ categories }: { categories: Category[] }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', name: '', categoryId: '', unit: 'unidad', sellPrice: '', minStock: '' });
  const [catSearch, setCatSearch] = useState('');
  const [showCatList, setShowCatList] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [showModal]);

  const loadProducts = async () => {
    const data = await productoService.getAll(false);
    setProducts(data);
  };

  const activeProducts = products.filter(p => p.estado === 'activo');
  const inactiveProducts = products.filter(p => p.estado === 'inactivo');

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.categoryId) {
      notificationService.warning('Campos incompletos', 'Por favor, completa todos los campos obligatorios.');
      return;
    }
    try {
      if (editingId) {
        await productoService.update(editingId, {
          nombre: form.name,
          categoria_id: parseInt(form.categoryId),
          unidad_medida: form.unit,
          precio_venta: parseFloat(form.sellPrice) || 0,
          stock_minimo: parseFloat(form.minStock) || 0,
          codigo_barras: form.code 
        });
        notificationService.success('Producto actualizado', 'Los cambios se han guardado correctamente.');
      } else {
        await productoService.create({
          codigo_barras: form.code,
          nombre: form.name,
          categoria_id: parseInt(form.categoryId),
          unidad_medida: form.unit,
          precio_compra: 0,
          precio_venta: parseFloat(form.sellPrice) || 0,
          stock_minimo: parseFloat(form.minStock) || 0,
          stock_actual: 0 
        });
        notificationService.success('Producto guardado', 'El producto se ha registrado correctamente.');
      }
      setForm({ code: '', name: '', categoryId: '', unit: 'unidad', sellPrice: '', minStock: '' });
      setEditingId(null);
      setShowModal(false);
      loadProducts();
    } catch (error) {
      console.error(error);
      notificationService.error('Error al guardar', 'Ocurrió un problema al guardar el producto.');
    }
  };

  const handleDeactivate = async (id: number) => {
    await productoService.updateStatus(id, 'inactivo');
    loadProducts();
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition';

  const columns: TableColumn<Product>[] = [
    { key: 'codigo_barras', header: 'Código', render: (row) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{row.codigo_barras}</span> },
    { key: 'nombre', header: 'Nombre', render: (row) => <span className="font-medium text-gray-800 dark:text-white">{row.nombre}</span> },
    { key: 'categoria_nombre', header: 'Categoría', render: (row) => <Badge label={row.categoria_nombre || 'Sin cat.'} variant="indigo" /> },
    { key: 'unidad_medida', header: 'Unidad' },
    { key: 'precio_compra', header: 'P. Compra', align: 'right', render: (row) => <span className="text-gray-600 dark:text-gray-300">S/ {(row.precio_compra || 0).toFixed(2)}</span> },
    { key: 'precio_venta', header: 'P. Venta', align: 'right', render: (row) => <span className="font-medium text-gray-800 dark:text-white">S/ {(row.precio_venta || 0).toFixed(2)}</span> },
    { key: 'stock_minimo', header: 'Stock mín.', align: 'center' },
    {
      key: 'acciones', header: '', align: 'right',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button 
            onClick={() => {
              setEditingId(row.id);
              setForm({ 
                code: row.codigo_barras, 
                name: row.nombre, 
                categoryId: row.categoria_id.toString(), 
                unit: row.unidad_medida, 
                sellPrice: (row.precio_venta || 0).toString(), 
                minStock: (row.stock_minimo || 0).toString() 
              });
              const cat = categories.find(c => c.id === row.categoria_id);
              setCatSearch(cat ? cat.nombre : '');
              setShowModal(true);
            }}
            title="Editar producto"
            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => handleDeactivate(row.id)} 
            title="Desactivar producto"
            className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 text-gray-400 hover:text-orange-500 transition-colors"
          >
            <PowerOff size={14} />
          </button>
        </div>
      ),
    },
  ];

  const filteredProducts = activeProducts.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo_barras.toLowerCase().includes(search.toLowerCase())
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
            onClick={async () => {
              const lastCode = await productoService.getLastCode();
              const nextCode = generateProductCode(lastCode);
              setForm({ code: nextCode, name: '', categoryId: '', unit: 'unidad', sellPrice: '', minStock: '' });
              setCatSearch('');
              setShowModal(true);
            }}
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

      {inactiveProducts.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
            <h3 className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Productos desactivados</h3>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>
          
          <div className="opacity-60 grayscale-[0.5]">
            <DataTable
              columns={[
                ...columns.filter(c => c.key !== 'acciones'),
                {
                  key: 'acciones', header: '', align: 'right',
                  render: (row) => (
                    <button 
                      onClick={async () => {
                        await productoService.updateStatus(row.id, 'activo');
                        notificationService.success('Producto reactivado');
                        loadProducts();
                      }}
                      title="Reactivar producto"
                      className="flex items-center gap-1 px-3 py-1 text-xs text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <RefreshCcw size={12} /> Activar
                    </button>
                  )
                }
              ]}
              data={inactiveProducts}
              keyExtractor={(row) => row.id}
            />
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editingId ? "Editar producto" : "Agregar nuevo producto"} onClose={() => { setShowModal(false); setEditingId(null); }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Código correlativo</label>
              <input 
                className={`${inputCls} font-mono bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} 
                readOnly 
                value={form.code} 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Unidad de medida</label>
              <select className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Nombre del producto *</label>
              <input 
                ref={nameInputRef}
                className={inputCls} 
                placeholder="Ej. Arroz Costeño 1kg" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5 relative">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Categoría *</label>
              <div className="relative">
                <input 
                  type="text"
                  className={inputCls}
                  placeholder="Buscar o seleccionar categoría..."
                  value={catSearch}
                  onFocus={() => setShowCatList(true)}
                  onChange={(e) => {
                    setCatSearch(e.target.value);
                    setShowCatList(true);
                    // Si el texto coincide exactamente con una categoría, seleccionarla
                    const exact = categories.find(c => c.nombre.toLowerCase() === e.target.value.toLowerCase());
                    if (exact) setForm({ ...form, categoryId: exact.id.toString() });
                    else if (form.categoryId) setForm({ ...form, categoryId: '' });
                  }}
                />
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              
              {showCatList && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowCatList(false)}></div>
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto py-1 animate-in fade-in zoom-in duration-150">
                    {categories.filter(c => c.nombre.toLowerCase().includes(catSearch.toLowerCase())).length > 0 ? (
                      categories
                        .filter(c => c.nombre.toLowerCase().includes(catSearch.toLowerCase()))
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, categoryId: c.id.toString() });
                              setCatSearch(c.nombre);
                              setShowCatList(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${form.categoryId === c.id.toString() ? 'bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                          >
                            <div style={{ backgroundColor: c.color }} className="w-2 h-2 rounded-full"></div>
                            {c.nombre}
                          </button>
                        ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-400 italic">No se encontraron categorías</div>
                    )}
                  </div>
                </>
              )}
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
              {editingId ? 'Actualizar' : 'Guardar'} producto
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Pestaña Categorías ─────────────────────────────────────────────────────────
function TabCategorias({ onUpdate }: { onUpdate: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', color: getRandomColor(), productCount: 0 });
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [showModal]);

  const loadCategories = async () => {
    const data = await categoriaService.getAll(false);
    setCategories(data);
  };

  const activeCategories = categories.filter(c => c.estado === 'activo');
  const inactiveCategories = categories.filter(c => c.estado === 'inactivo');

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      notificationService.warning('Campo incompleto', 'Por favor, ingresa un nombre para la categoría.');
      return;
    }
    try {
      if (editingId) {
        await categoriaService.update(editingId, form.name.trim(), form.color);
        notificationService.success('Categoría actualizada', 'Los cambios se han guardado correctamente.');
      } else {
        await categoriaService.create(form.name.trim(), form.color);
        notificationService.success('Categoría creada', 'La categoría se ha registrado correctamente.');
      }
      setForm({ name: '', color: getRandomColor(), productCount: 0 });
      setEditingId(null);
      setShowModal(false);
      await loadCategories();
      onUpdate(); 
    } catch (error: any) {
      console.error(error);
      const msg = error.message?.includes('UNIQUE') 
        ? 'Ya existe una categoría con ese nombre.' 
        : 'Ocurrió un problema al crear la categoría.';
      notificationService.error('Error al crear', msg);
    }
  };

  const handleDeactivate = async (id: number) => {
    await categoriaService.updateStatus(id, 'inactivo');
    loadCategories();
    onUpdate();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{categories.length} categorías registradas</p>
        <button
          id="add-category-btn"
          onClick={() => {
            setForm({ name: '', color: getRandomColor(), productCount: 0 });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={15} /> Nueva categoría
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeCategories.map((cat) => (
          <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div style={{ backgroundColor: cat.color }} className={`w-10 h-10 rounded-xl flex items-center justify-center`}>
              <Tag size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">{cat.nombre}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{cat.productCount} productos</p>
            </div>
            <div className="flex gap-1 pt-1 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={() => {
                  setEditingId(cat.id);
                  setForm({ name: cat.nombre, color: cat.color, productCount: cat.productCount || 0 });
                  setShowModal(true);
                }}
                title="Editar categoría"
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit2 size={12} /> Editar
              </button>
              <button
                onClick={() => handleDeactivate(cat.id)}
                title="Desactivar categoría"
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <PowerOff size={12} /> Desactivar
              </button>
            </div>
          </div>
        ))}
      </div>

      {inactiveCategories.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
            <h3 className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Categorías desactivadas</h3>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 opacity-70">
            {inactiveCategories.map((cat) => (
              <div key={cat.id} className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                  <Tag size={18} className="text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-500 dark:text-gray-400">{cat.nombre}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{cat.productCount} productos</p>
                </div>
                <div className="flex gap-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                  <button 
                    onClick={() => {
                      setEditingId(cat.id);
                      setForm({ name: cat.nombre, color: cat.color, productCount: cat.productCount || 0 });
                      setShowModal(true);
                    }}
                    title="Editar categoría"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit2 size={12} /> Editar
                  </button>
                  <button 
                    onClick={async () => {
                      await categoriaService.updateStatus(cat.id, 'activo');
                      notificationService.success('Categoría reactivada');
                      loadCategories();
                      onUpdate();
                    }}
                    title="Reactivar categoría"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <RefreshCcw size={12} /> Activar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editingId ? "Editar categoría" : "Nueva categoría"} onClose={() => { setShowModal(false); setEditingId(null); }}>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Nombre de la categoría *</label>
              <input
                ref={nameInputRef}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Ej. Frutas y verduras"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Color de la categoría</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-1/2 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400 uppercase">{form.color}</span>
              </div>
            </div>
            {/* Preview */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div style={{ backgroundColor: form.color }} className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Tag size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{form.name || 'Nombre de categoría'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{form.productCount} productos</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
              {editingId ? 'Actualizar' : 'Crear'} categoría
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
  const [categories, setCategories] = useState<Category[]>([]);

  const loadCategories = async () => {
    const data = await categoriaService.getAll();
    setCategories(data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

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
      {activeTab === 'categorias' && <TabCategorias onUpdate={loadCategories} />}
    </div>
  );
}
