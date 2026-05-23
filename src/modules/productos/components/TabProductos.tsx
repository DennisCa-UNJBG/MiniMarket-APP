import { useReducer } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  PowerOff,
  RefreshCcw,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, type TableColumn } from '../../../shared/components/ui/DataTable';
import { Badge } from '../../../shared/components/ui/Badge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Tooltip } from '../../../shared/components/ui/Tooltip';
import { Button } from '../../../shared/components/ui/Button';
import { type Category } from '../categoriaService';
import { productoService, type Product } from '../Service';
import { unidadMedidaService } from '../unidadMedidaService';
import { notificationService } from '../../../shared/lib/notifications';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ProductModal } from './ProductModal';

const generateProductCode = (lastCode: string | null) => {
  if (!lastCode || !lastCode.includes('-')) return 'PROD-0001';
  const parts = lastCode.split('-');
  const num = parseInt(parts[1]);
  if (isNaN(num)) return 'PROD-0001';
  return `PROD-${(num + 1).toString().padStart(4, '0')}`;
};

interface TabProductosState {
  showModal: boolean;
  editingId: number | null;
  search: string;
  form: { code: string; name: string; categoryId: string; unitId: string; sellPrice: string; minStock: string };
  catSearch: string;
  unitSearch: string;
  isSubmitted: boolean;
}

type TabProductosAction =
  | { type: 'SET_SHOW_MODAL'; payload: boolean }
  | { type: 'SET_EDITING_ID'; payload: number | null }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FORM'; payload: Partial<TabProductosState['form']> | ((prev: TabProductosState['form']) => TabProductosState['form']) }
  | { type: 'SET_CAT_SEARCH'; payload: string }
  | { type: 'SET_UNIT_SEARCH'; payload: string }
  | { type: 'SET_IS_SUBMITTED'; payload: boolean };

function tabProductosReducer(state: TabProductosState, action: TabProductosAction): TabProductosState {
  switch (action.type) {
    case 'SET_SHOW_MODAL':
      return { ...state, showModal: action.payload };
    case 'SET_EDITING_ID':
      return { ...state, editingId: action.payload };
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_FORM':
      return {
        ...state,
        form: typeof action.payload === 'function'
          ? action.payload(state.form)
          : { ...state.form, ...action.payload }
      };
    case 'SET_CAT_SEARCH':
      return { ...state, catSearch: action.payload };
    case 'SET_UNIT_SEARCH':
      return { ...state, unitSearch: action.payload };
    case 'SET_IS_SUBMITTED':
      return { ...state, isSubmitted: action.payload };
    default:
      return state;
  }
}

const initialTabProductosState: TabProductosState = {
  showModal: false,
  editingId: null,
  search: '',
  form: { code: '', name: '', categoryId: '', unitId: '', sellPrice: '', minStock: '' },
  catSearch: '',
  unitSearch: '',
  isSubmitted: false
};

export function TabProductos({ categories }: { categories: Category[] }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [state, dispatch] = useReducer(tabProductosReducer, initialTabProductosState);

  const {
    showModal,
    editingId,
    search,
    form,
    catSearch,
    unitSearch,
    isSubmitted
  } = state;

  const setShowModal = (payload: boolean) => dispatch({ type: 'SET_SHOW_MODAL', payload });
  const setEditingId = (payload: number | null) => dispatch({ type: 'SET_EDITING_ID', payload });
  const setSearch = (payload: string) => dispatch({ type: 'SET_SEARCH', payload });
  const setForm = (payload: Partial<TabProductosState['form']> | ((prev: TabProductosState['form']) => TabProductosState['form'])) => dispatch({ type: 'SET_FORM', payload });
  const setCatSearch = (payload: string) => dispatch({ type: 'SET_CAT_SEARCH', payload });
  const setUnitSearch = (payload: string) => dispatch({ type: 'SET_UNIT_SEARCH', payload });
  const setIsSubmitted = (payload: boolean) => dispatch({ type: 'SET_IS_SUBMITTED', payload });


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

  const columns: TableColumn<Product>[] = [
    { key: 'codigo_barras', header: 'Código', render: (row) => <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{row.codigo_barras}</span> },
    { key: 'nombre', header: 'Nombre', render: (row) => <span className="font-medium text-zinc-800 dark:text-white">{row.nombre}</span> },
    { key: 'categoria_nombre', header: 'Categoría', render: (row) => <Badge label={row.categoria_nombre || 'Sin cat.'} variant="blue" /> },
    { key: 'unidad_nombre', header: 'Unidad', render: (row) => <span className="text-zinc-600 dark:text-zinc-400">{row.unidad_nombre || row.unidad_medida || 'S/U'}</span> },
    { key: 'precio_compra', header: 'Precio Compra', align: 'right', render: (row) => <span className="text-zinc-600 dark:text-zinc-300">S/ {(row.precio_compra || 0).toFixed(2)}</span> },
    { key: 'precio_venta', header: 'Precio Venta', align: 'right', render: (row) => <span className="font-medium text-zinc-800 dark:text-white">S/ {(row.precio_venta || 0).toFixed(2)}</span> },
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
              className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
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
              className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
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

  const filteredUnits = units.filter(u =>
    u.nombre.toLowerCase().includes(unitSearch.toLowerCase()) ||
    u.abreviatura.toLowerCase().includes(unitSearch.toLowerCase())
  );

  const filteredCategories = categories.filter(c =>
    c.nombre.toLowerCase().includes(catSearch.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-400">{filteredProducts.length} productos</p>
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
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
            <h3 className="text-sm font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Productos desactivados</h3>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
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
                      className="text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-zinc-700 font-bold"
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

      {/* Modal de Producto */}
      <ProductModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingId(null); }}
        editingId={editingId}
        form={form}
        setForm={setForm}
        isSubmitted={isSubmitted}
        errors={errors}
        unitSearch={unitSearch}
        setUnitSearch={setUnitSearch}
        units={units}
        filteredUnits={filteredUnits}
        catSearch={catSearch}
        setCatSearch={setCatSearch}
        categories={categories}
        filteredCategories={filteredCategories}
        onSave={handleSave}
        isPending={saveMutation.isPending}
      />
    </>
  );
}
