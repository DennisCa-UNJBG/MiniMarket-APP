import { useState, useEffect, useRef } from 'react';
import {
  Package,
  Tag,
  Plus,
  Search,
  Edit2,
  PowerOff,
  RefreshCcw,
  Scale,
  AlertTriangle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { categoriaService, type Category } from './categoriaService';
import { productoService, type Product } from './Service';
import { unidadMedidaService, type UnidadMedida } from './unidadMedidaService';
import { notificationService } from '../../lib/notifications';
import { useAuth } from '../../contexts/AuthContext';

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

// ── Pestaña Productos ──────────────────────────────────────────────────────────
function TabProductos({ categories }: { categories: Category[] }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', name: '', categoryId: '', unitId: '', sellPrice: '', minStock: '' });
  const [catSearch, setCatSearch] = useState('');
  const [showCatList, setShowCatList] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const [showUnitList, setShowUnitList] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const errors = {
    name: !form.name.trim() ? 'El nombre es obligatorio' : null,
    categoryId: !form.categoryId ? 'Seleccione una categoría' : null,
    unitId: !form.unitId ? 'Seleccione una unidad' : null,
    sellPrice: parseFloat(form.sellPrice) < 0 ? 'El precio no puede ser negativo' : null,
    minStock: parseFloat(form.minStock) < 0 ? 'El stock no puede ser negativo' : null,
  };
  const isValid = !Object.values(errors).some(Boolean);

  // Consulta de productos
  const { data: products = [] } = useQuery({
    queryKey: ['products', false],
    queryFn: () => productoService.getAll(false),
  });

  // Consulta de unidades de medida
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => unidadMedidaService.getAll(true),
  });

  // Mutación para guardar (crear/editar)
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingId) {
        return productoService.update(editingId, payload, user?.id || 1);
      } else {
        return productoService.create(payload, user?.id || 1);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      notificationService.success(
        editingId ? 'Producto actualizado' : 'Producto guardado',
        editingId ? 'Los cambios se han guardado correctamente.' : 'El producto se ha registrado correctamente.'
      );
      resetForm();
      setShowModal(false);
    }
  });

  const resetForm = () => {
    setForm({ code: '', name: '', categoryId: '', unitId: '', sellPrice: '', minStock: '' });
    setCatSearch('');
    setUnitSearch('');
    setEditingId(null);
    setIsSubmitted(false);
  };

  // Mutación para cambiar estado
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'activo' | 'inactivo' }) => 
      productoService.updateStatus(id, status, user?.id || 1),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (variables.status === 'activo') {
        notificationService.success('Producto reactivado');
      }
    }
  });

  useEffect(() => {
    if (showModal) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [showModal]);

  const activeProducts = products.filter(p => p.estado === 'activo');
  const inactiveProducts = products.filter(p => p.estado === 'inactivo');

  const handleSave = async () => {
    setIsSubmitted(true);
    if (!isValid) {
      notificationService.warning('Campos incompletos', 'Por favor, corrige los errores en el formulario.');
      return;
    }
    
    saveMutation.mutate({
      nombre: form.name,
      categoria_id: parseInt(form.categoryId),
      unidad_id: parseInt(form.unitId),
      precio_venta: parseFloat(form.sellPrice) || 0,
      stock_minimo: parseFloat(form.minStock) || 0,
      codigo_barras: form.code,
      precio_compra: 0,
      stock_actual: 0
    });
  };

  const handleDeactivate = (id: number) => {
    statusMutation.mutate({ id, status: 'inactivo' });
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition';

  const columns: TableColumn<Product>[] = [
    { key: 'codigo_barras', header: 'Código', render: (row) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{row.codigo_barras}</span> },
    { key: 'nombre', header: 'Nombre', render: (row) => <span className="font-medium text-gray-800 dark:text-white">{row.nombre}</span> },
    { key: 'categoria_nombre', header: 'Categoría', render: (row) => <Badge label={row.categoria_nombre || 'Sin cat.'} variant="indigo" /> },
    { key: 'unidad_nombre', header: 'Unidad', render: (row) => <span className="text-gray-600 dark:text-gray-400">{row.unidad_nombre || row.unidad_medida || 'S/U'}</span> },
    { key: 'precio_compra', header: 'Precio Compra', align: 'right', render: (row) => <span className="text-gray-600 dark:text-gray-300">S/ {(row.precio_compra || 0).toFixed(2)}</span> },
    { key: 'precio_venta', header: 'Precio Venta', align: 'right', render: (row) => <span className="font-medium text-gray-800 dark:text-white">S/ {(row.precio_venta || 0).toFixed(2)}</span> },
    { key: 'stock_minimo', header: 'Stock Mínimo', align: 'center' },
    {
      key: 'acciones', header: '', align: 'right',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <Tooltip text="Editar producto" position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              icon={<Edit2 size={14} />}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700"
              onClick={() => {
                setEditingId(row.id);
                setForm({ 
                  code: row.codigo_barras, 
                  name: row.nombre, 
                  categoryId: row.categoria_id.toString(), 
                  unitId: (row.unidad_id || '').toString(), 
                  sellPrice: (row.precio_venta || 0).toString(), 
                  minStock: (row.stock_minimo || 0).toString() 
                });
                const cat = categories.find(c => c.id === row.categoria_id);
                setCatSearch(cat ? cat.nombre : '');
                const unit = units.find(u => u.id === row.unidad_id);
                setUnitSearch(unit ? `${unit.nombre} (${unit.abreviatura})` : (row.unidad_medida || ''));
                setShowModal(true);
              }}
            />
          </Tooltip>
          <Tooltip text="Desactivar producto" position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              icon={<PowerOff size={14} />}
              className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700"
              onClick={() => handleDeactivate(row.id)} 
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const filteredProducts = activeProducts.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search.toLowerCase()))
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
          <Button
            onClick={async () => {
              const lastCode = await productoService.getLastCode();
              const nextCode = generateProductCode(lastCode);
              resetForm();
              setForm(f => ({ ...f, code: nextCode }));
              setShowModal(true);
            }}
            icon={<Plus size={15} />}
          >
            Nuevo producto
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts}
        keyExtractor={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Package}
            title="Inventario vacío"
            description={search ? "No se encontraron productos que coincidan con la búsqueda." : "Aún no tienes productos registrados en tu inventario."}
            action={
              !search ? (
                <Button
                  onClick={async () => {
                    const lastCode = await productoService.getLastCode();
                    const nextCode = generateProductCode(lastCode);
                    resetForm();
                    setForm(f => ({ ...f, code: nextCode }));
                    setShowModal(true);
                  }}
                  icon={<Plus size={15} />}
                >
                  Agregar producto
                </Button>
              ) : undefined
            }
          />
        }
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
                    <Button 
                      onClick={() => statusMutation.mutate({ id: row.id, status: 'activo' })}
                      variant="ghost"
                      size="sm"
                      icon={<RefreshCcw size={12} />}
                      className="text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-gray-700 font-bold"
                    >
                      Activar
                    </Button>
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
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Unidad de medida *</label>
              <div className="relative">
                <input 
                  type="text"
                  className={`${inputCls} ${isSubmitted && errors.unitId ? 'border-red-300 dark:border-red-500/50' : ''}`}
                  placeholder="Buscar unidad..."
                  value={unitSearch}
                  onFocus={() => setShowUnitList(true)}
                  onChange={(e) => {
                    setUnitSearch(e.target.value);
                    setShowUnitList(true);
                    const exact = units.find(u => u.nombre.toLowerCase() === e.target.value.toLowerCase() || u.abreviatura.toLowerCase() === e.target.value.toLowerCase());
                    if (exact) setForm({ ...form, unitId: exact.id.toString() });
                    else if (form.unitId) setForm({ ...form, unitId: '' });
                  }}
                />
                <Scale size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {isSubmitted && errors.unitId && <p className="text-xs font-medium text-red-500 mt-1">{errors.unitId}</p>}

              {showUnitList && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUnitList(false)}></div>
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto py-1 animate-in fade-in zoom-in duration-150">
                    {units.filter(u => u.nombre.toLowerCase().includes(unitSearch.toLowerCase()) || u.abreviatura.toLowerCase().includes(unitSearch.toLowerCase())).length > 0 ? (
                      units
                        .filter(u => u.nombre.toLowerCase().includes(unitSearch.toLowerCase()) || u.abreviatura.toLowerCase().includes(unitSearch.toLowerCase()))
                        .map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, unitId: u.id.toString() });
                              setUnitSearch(`${u.nombre} (${u.abreviatura})`);
                              setShowUnitList(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${form.unitId === u.id.toString() ? 'bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                          >
                            <Scale size={12} className="opacity-50" />
                            {u.nombre} ({u.abreviatura})
                          </button>
                        ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-400 italic">No se encontraron unidades</div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Input 
                ref={nameInputRef}
                label="Nombre del producto *"
                placeholder="Ej. Arroz Costeño 1kg" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                error={isSubmitted && errors.name ? errors.name : undefined}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5 relative">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Categoría *</label>
              <div className="relative">
                <input 
                  type="text"
                  className={`${inputCls} ${isSubmitted && errors.categoryId ? 'border-red-300 dark:border-red-500/50' : ''}`}
                  placeholder="Buscar o seleccionar categoría..."
                  value={catSearch}
                  onFocus={() => setShowCatList(true)}
                  onChange={(e) => {
                    setCatSearch(e.target.value);
                    setShowCatList(true);
                    const exact = categories.find(c => c.nombre.toLowerCase() === e.target.value.toLowerCase());
                    if (exact) setForm({ ...form, categoryId: exact.id.toString() });
                    else if (form.categoryId) setForm({ ...form, categoryId: '' });
                  }}
                />
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {isSubmitted && errors.categoryId && <p className="text-xs font-medium text-red-500 mt-1">{errors.categoryId}</p>}
              
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
              <Input 
                type="number" step="0.01" 
                label="Precio de venta (S/)"
                placeholder="0.00" 
                value={form.sellPrice} 
                onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} 
                error={isSubmitted && errors.sellPrice ? errors.sellPrice : undefined}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Input 
                type="number" 
                label="Stock mínimo"
                placeholder="0" 
                value={form.minStock} 
                onChange={(e) => setForm({ ...form, minStock: e.target.value })} 
                error={isSubmitted && errors.minStock ? errors.minStock : undefined}
              />
              {!(isSubmitted && errors.minStock) && (
                <div className="flex items-start gap-1.5 mt-0.5 pl-1">
                  <AlertTriangle size={10} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 italic font-medium leading-tight">
                    Aviso: Este valor activa las alertas críticas de reabastecimiento.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="text-gray-600 dark:text-gray-300">
              Cancelar
            </Button>
            <Button onClick={handleSave} isLoading={saveMutation.isPending}>
              {editingId ? 'Actualizar' : 'Guardar'} producto
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Pestaña Categorías ─────────────────────────────────────────────────────────
function TabCategorias({ onUpdate }: { onUpdate: () => void }) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', color: getRandomColor(), productCount: 0 });
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Consulta de categorías
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriaService.getAll(false),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingId) {
        return categoriaService.update(editingId, payload.name, payload.color);
      } else {
        return categoriaService.create(payload.name, payload.color);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      notificationService.success(
        editingId ? 'Categoría actualizada' : 'Categoría creada',
        editingId ? 'Los cambios se han guardado correctamente.' : 'La categoría se ha registrado correctamente.'
      );
      setForm({ name: '', color: getRandomColor(), productCount: 0 });
      setEditingId(null);
      setShowModal(false);
      onUpdate();
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'activo' | 'inactivo' }) => 
      categoriaService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (variables.status === 'activo') {
        notificationService.success('Categoría reactivada');
      }
      onUpdate();
    }
  });

  useEffect(() => {
    if (showModal) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [showModal]);

  const activeCategories = categories.filter(c => c.estado === 'activo');
  const inactiveCategories = categories.filter(c => c.estado === 'inactivo');

  const handleSave = async () => {
    if (!form.name.trim()) {
      notificationService.warning('Campo incompleto', 'Por favor, ingresa un nombre para la categoría.');
      return;
    }
    saveMutation.mutate(form);
  };

  const columns: TableColumn<Category>[] = [
    { 
      key: 'color', header: 'Color', 
      render: (row) => <div style={{ backgroundColor: row.color }} className="w-6 h-6 rounded-lg shadow-sm"></div> 
    },
    { key: 'nombre', header: 'Nombre Categoría', render: (row) => <span className="font-bold text-gray-800 dark:text-white">{row.nombre}</span> },
    { key: 'product_count', header: 'Productos', align: 'center', render: (row) => <Badge label={`${row.productCount || 0} items`} variant="gray" /> },
    {
      key: 'acciones', header: '', align: 'right',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <Tooltip text="Editar categoría" position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              icon={<Edit2 size={14} />}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700"
              onClick={() => {
                setEditingId(row.id);
                setForm({ name: row.nombre, color: row.color || getRandomColor(), productCount: row.productCount || 0 });
                setShowModal(true);
              }}
            />
          </Tooltip>
          <Tooltip text="Desactivar categoría" position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              icon={<PowerOff size={14} />}
              className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700"
              onClick={() => statusMutation.mutate({ id: row.id, status: 'inactivo' })}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            setForm({ name: '', color: getRandomColor(), productCount: 0 });
            setEditingId(null);
            setShowModal(true);
          }}
          icon={<Plus size={15} />}
        >
          Nueva categoría
        </Button>
      </div>

      <DataTable columns={columns} data={activeCategories} keyExtractor={(row) => row.id} emptyMessage="No hay categorías registradas." />

      {inactiveCategories.length > 0 && (
        <div className="mt-8 opacity-60">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Categorías inactivas</h4>
          <DataTable 
            columns={[
              ...columns.filter(c => c.key !== 'acciones'),
              {
                key: 'acciones', header: '', align: 'right',
                render: (row) => (
                  <button onClick={() => statusMutation.mutate({ id: row.id, status: 'activo' })} className="text-xs text-green-600 font-bold hover:underline">
                    Reactivar
                  </button>
                )
              }
            ]} 
            data={inactiveCategories} 
            keyExtractor={(row) => row.id} 
          />
        </div>
      )}

      {showModal && (
        <Modal title={editingId ? "Editar categoría" : "Nueva categoría"} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Nombre de categoría</label>
              <input ref={nameInputRef} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Color distintivo</label>
              <div className="flex gap-2">
                <input type="color" className="w-12 h-10 p-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 cursor-pointer" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                <input className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="text-gray-600">Cancelar</Button>
            <Button onClick={handleSave} isLoading={saveMutation.isPending}>
              {editingId ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Pestaña Unidades de Medida ────────────────────────────────────────────────
function TabUnidades() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', abreviatura: '' });

  const { data: units = [] } = useQuery({
    queryKey: ['units-full'],
    queryFn: () => unidadMedidaService.getAll(false),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingId) {
        return unidadMedidaService.update(editingId, payload.nombre, payload.abreviatura);
      } else {
        return unidadMedidaService.create(payload.nombre, payload.abreviatura);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['units-full'] });
      notificationService.success(editingId ? 'Unidad actualizada' : 'Unidad creada');
      setForm({ nombre: '', abreviatura: '' });
      setEditingId(null);
      setShowModal(false);
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'activo' | 'inactivo' }) => 
      unidadMedidaService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['units-full'] });
    }
  });

  const activeUnits = units.filter(u => u.estado === 'activo');
  const inactiveUnits = units.filter(u => u.estado === 'inactivo');

  const columns: TableColumn<UnidadMedida>[] = [
    { key: 'nombre', header: 'Nombre', render: (row) => <span className="font-bold">{row.nombre}</span> },
    { key: 'abreviatura', header: 'Abreviatura', render: (row) => <Badge label={row.abreviatura} variant="indigo" /> },
    {
      key: 'acciones', header: '', align: 'right',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <Tooltip text="Editar unidad" position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              icon={<Edit2 size={14} />}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => {
                setEditingId(row.id);
                setForm({ nombre: row.nombre, abreviatura: row.abreviatura });
                setShowModal(true);
              }}
            />
          </Tooltip>
          <Tooltip text="Desactivar unidad" position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              icon={<PowerOff size={14} />}
              className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50"
              onClick={() => statusMutation.mutate({ id: row.id, status: 'inactivo' })}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            setForm({ nombre: '', abreviatura: '' });
            setEditingId(null);
            setShowModal(true);
          }}
          icon={<Plus size={15} />}
        >
          Nueva unidad
        </Button>
      </div>

      <DataTable columns={columns} data={activeUnits} keyExtractor={(u) => u.id} emptyMessage="No hay unidades registradas." />

      {inactiveUnits.length > 0 && (
        <div className="mt-8 opacity-60">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Unidades inactivas</h4>
          <DataTable 
            columns={[
              ...columns.filter(c => c.key !== 'acciones'),
              {
                key: 'acciones', header: '', align: 'right',
                render: (row) => (
                  <button onClick={() => statusMutation.mutate({ id: row.id, status: 'activo' })} className="text-xs text-green-600 font-bold hover:underline">
                    Reactivar
                  </button>
                )
              }
            ]} 
            data={inactiveUnits} 
            keyExtractor={(u) => u.id} 
          />
        </div>
      )}

      {showModal && (
        <Modal title={editingId ? "Editar unidad" : "Nueva unidad"} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Nombre (ej. Kilogramos)</label>
              <input 
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" 
                value={form.nombre} 
                onChange={(e) => setForm({ ...form, nombre: e.target.value })} 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Abreviatura (ej. KG)</label>
              <input 
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition uppercase" 
                value={form.abreviatura} 
                onChange={(e) => setForm({ ...form, abreviatura: e.target.value.toUpperCase() })} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="text-gray-600 dark:text-gray-300">Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} isLoading={saveMutation.isPending}>
              {editingId ? 'Guardar cambios' : 'Crear unidad'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────
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
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`tab-${key}`}
            onClick={() => setActiveTab(key as any)}
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
      {activeTab === 'unidades'   && <TabUnidades />}
    </div>
  );
}
