import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter, AlertTriangle, ArrowUpRight, History } from 'lucide-react';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { productoService, type Product } from '../services/productoService';
import { inventarioService } from '../services/inventarioService';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

type StockStatus = 'ok' | 'low' | 'out';

function getStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return 'out';
  if (stock < minStock) return 'low';
  return 'ok';
}

const statusBadge: Record<StockStatus, { label: string; variant: 'emerald' | 'amber' | 'red' }> = {
  ok:  { label: 'En stock',   variant: 'emerald' },
  low: { label: 'Stock bajo', variant: 'amber'   },
  out: { label: 'Sin stock',  variant: 'red'     },
};

export function Inventario() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estado para el formulario de ingreso
  const [form, setForm] = useState({
    productoId: '',
    cantidad: '',
    precioCompra: '',
    referencia: ''
  });
  const [catSearch, setCatSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productoService.getAll(true);
      setProducts(data);
    } catch (error) {
      notificationService.error('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (showModal && form.productoId) {
       setTimeout(() => qtyInputRef.current?.focus(), 100);
    }
  }, [showModal, form.productoId]);

  const handleRegistrarIngreso = async () => {
    if (!form.productoId || !form.cantidad || !form.precioCompra) {
      notificationService.warning('Campos incompletos', 'Por favor completa los datos obligatorios.');
      return;
    }

    try {
      await inventarioService.registrarIngreso({
        producto_id: parseInt(form.productoId),
        usuario_id: user?.id || 1,
        cantidad: parseFloat(form.cantidad),
        precio_compra: parseFloat(form.precioCompra),
        referencia: form.referencia
      });

      notificationService.success('Ingreso registrado', 'El stock ha sido actualizado correctamente.');
      setShowModal(false);
      setForm({ productoId: '', cantidad: '', precioCompra: '', referencia: '' });
      setCatSearch('');
      loadProducts();
    } catch (error) {
      notificationService.error('Error', 'No se pudo registrar el ingreso de mercadería.');
    }
  };

  const columns: TableColumn<Product>[] = [
    {
      key: 'codigo_barras',
      header: 'Código',
      render: (row) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{row.codigo_barras}</span>,
    },
    {
      key: 'nombre',
      header: 'Producto',
      render: (row) => <span className="font-medium text-gray-800 dark:text-white">{row.nombre}</span>,
    },
    { key: 'categoria_nombre', header: 'Categoría', render: (row) => <Badge label={row.categoria_nombre || 'General'} variant="indigo" /> },
    {
      key: 'stock_actual',
      header: 'Stock',
      align: 'right',
      render: (row) => {
        const status = getStatus(row.stock_actual, row.stock_minimo);
        return (
          <div className="flex items-center justify-end gap-1.5">
            {status === 'low' && <AlertTriangle size={13} className="text-amber-500" />}
            <span className={`font-semibold ${status === 'out' ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
              {row.stock_actual} {row.unidad_medida}
            </span>
          </div>
        );
      },
    },
    {
      key: 'precio_compra',
      header: 'Último Costo',
      align: 'right',
      render: (row) => <span className="text-gray-600 dark:text-gray-300">S/ {(row.precio_compra || 0).toFixed(2)}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (row) => {
        const { label, variant } = statusBadge[getStatus(row.stock_actual, row.stock_minimo)];
        return <Badge label={label} variant={variant} />;
      },
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (row) => (
        <button 
          onClick={() => {
            setForm({ ...form, productoId: row.id.toString(), precioCompra: (row.precio_compra || '').toString() });
            setCatSearch(row.nombre);
            setShowModal(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
        >
          <Plus size={14} /> Ingreso
        </button>
      ),
    },
  ];

  const filtered = products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo_barras.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Control de Inventario"
        subtitle="Monitoreo de existencias y niveles de stock"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Total Productos</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{products.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Stock Bajo</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{products.filter(p => getStatus(p.stock_actual, p.stock_minimo) === 'low').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Sin Stock</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{products.filter(p => p.stock_actual <= 0).length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex gap-3 flex-wrap shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Filter size={15} /> Filtros
        </button>
      </div>

      <DataTable
        columns={columns.filter(c => c.key !== 'acciones')}
        data={filtered}
        keyExtractor={(row) => row.id}
        emptyMessage="No se encontraron productos en el inventario."
        defaultPageSize={10}
      />
    </div>
  );
}
