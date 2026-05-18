import { useReducer } from 'react';
import {
  Plus,
  Truck,
  Search,
  Calendar,
  FileText,
  CircleSlash2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import { inventarioService } from '../inventario/Service';
import { notificationService } from '../../lib/notifications';
import { NewPurchaseModal } from './components/NewPurchaseModal';
import { PurchaseDetailsModal } from './components/PurchaseDetailsModal';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr + " UTC").toLocaleDateString();
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr + " UTC").toLocaleTimeString();
};

interface PurchaseRecord {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  fecha: string;
  documento_referencia: string;
  total: number;
  estado: string;
}

interface ComprasState {
  search: string;
  page: number;
  showModal: boolean;
  showDetailModal: boolean;
  selectedPurchase: PurchaseRecord | null;
}

type ComprasAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_SHOW_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_DETAIL_MODAL'; payload: boolean }
  | { type: 'SELECT_PURCHASE'; payload: PurchaseRecord | null };

const initialComprasState: ComprasState = {
  search: '',
  page: 1,
  showModal: false,
  showDetailModal: false,
  selectedPurchase: null
};

function comprasReducer(state: ComprasState, action: ComprasAction): ComprasState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_SHOW_MODAL':
      return { ...state, showModal: action.payload };
    case 'SET_SHOW_DETAIL_MODAL':
      return { ...state, showDetailModal: action.payload };
    case 'SELECT_PURCHASE':
      return { ...state, selectedPurchase: action.payload };
    default:
      return state;
  }
}

export function Compras() {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(comprasReducer, initialComprasState);
  const { search, page, showModal, showDetailModal, selectedPurchase } = state;

  const pageSize = 10;

  // Queries
  const { data: purchasesRes = { data: [], total: 0 } } = useQuery({
    queryKey: ['purchases', page, pageSize],
    queryFn: () => inventarioService.getCompras(page, pageSize)
  });

  const annulPurchaseMutation = useMutation({
    mutationFn: (id: number) => inventarioService.anularCompra(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      notificationService.successWithConfirm('Compra anulada', 'El stock ha sido revertido y el movimiento eliminado del kardex.');
    }
  });

  const handleAnular = async (purchase: PurchaseRecord) => {
    const ok = await notificationService.confirm(
      '¿Anular compra?',
      `¿Estás seguro de anular la compra #${purchase.id}? Esta acción revertirá el stock y anulará el registro del Kardex.`
    );
    
    if (ok) {
      annulPurchaseMutation.mutate(purchase.id);
    }
  };

  const handleViewDetail = (purchase: PurchaseRecord) => {
    dispatch({ type: 'SELECT_PURCHASE', payload: purchase });
    dispatch({ type: 'SET_SHOW_DETAIL_MODAL', payload: true });
  };

  const totalInvertido = purchasesRes.data.reduce((acc: number, p: any) => acc + (p.estado === 'anulado' ? 0 : p.total), 0);
  
  const filtered = purchasesRes.data.filter((p: any) => 
    (p.documento_referencia || '').toLowerCase().includes(search.toLowerCase()) ||
    p.id.toString().includes(search.toLowerCase()) ||
    p.usuario_nombre.toLowerCase().includes(search.toLowerCase())
  );

  const columns: TableColumn<PurchaseRecord>[] = [
    {
      key: 'id',
      header: 'N° Compra',
      render: (row) => <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">#{row.id.toString().padStart(4, '0')}</span>,
    },
    { 
      key: 'fecha', 
      header: 'Fecha',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm text-zinc-800 dark:text-zinc-200">{formatDate(row.fecha)}</span>
          <span className="text-[10px] text-zinc-400">{formatTime(row.fecha)}</span>
        </div>
      )
    },
    { 
      key: 'documento_referencia', 
      header: 'Documento',
      render: (row) => <Badge label={row.documento_referencia || 'Sin ref.'} variant="blue" />
    },
    { 
      key: 'usuario_nombre', 
      header: 'Responsable',
      render: (row) => <span className="text-sm text-zinc-600 dark:text-zinc-400">{row.usuario_nombre}</span>
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <Badge 
          label={row.estado === 'anulado' ? 'ANULADO' : 'COMPLETADO'} 
          variant={row.estado === 'anulado' ? 'red' : 'emerald'} 
        />
      )
    },
    {
      key: 'total',
      header: 'Total Invertido',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-zinc-800 dark:text-white">S/ {row.total.toFixed(2)}</span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex items-center gap-3 justify-end">
          <Tooltip text="Ver detalle de la compra" position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetail(row)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline p-0 h-auto"
            >
              Ver detalle
            </Button>
          </Tooltip>
          {row.estado !== 'anulado' && (
            <Tooltip text="Anular compra" position="top-right">
              <Button 
                variant="ghost"
                size="sm"
                icon={<CircleSlash2 size={14} />}
                onClick={() => handleAnular(row)}
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              />
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <PageHeader
        title="Gestión de Compras"
        subtitle="Registro masivo de mercadería e inversión"
        action={
          <Button
            onClick={() => {
              dispatch({ type: 'SET_SHOW_MODAL', payload: true });
            }}
            icon={<Plus size={16} />}
          >
            Registrar Nueva Compra
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-xl flex-shrink-0">
            <Truck size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Compras</p>
            <p className="text-lg font-bold text-zinc-800 dark:text-white">{purchasesRes.total}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-xl flex-shrink-0">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Inversión Total</p>
            <p className="text-lg font-bold text-zinc-800 dark:text-white">
              S/ {totalInvertido.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center gap-4">
          <div className="bg-amber-500 p-3 rounded-xl flex-shrink-0">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Compras del Mes</p>
            <p suppressHydrationWarning className="text-lg font-bold text-zinc-800 dark:text-white">
              {purchasesRes.data.filter((p: any) => new Date(p.fecha).getMonth() === new Date().getMonth()).length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 p-4 shadow-sm flex justify-between items-center">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por documento o responsable..."
            value={search}
            onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        serverSide={true}
        totalItems={purchasesRes.total}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={(p) => dispatch({ type: 'SET_PAGE', payload: p })}
        keyExtractor={(row) => row.id}
        emptyMessage="No se encontraron registros de compras."
      />

      <NewPurchaseModal isOpen={showModal} onClose={() => dispatch({ type: 'SET_SHOW_MODAL', payload: false })} />
      <PurchaseDetailsModal isOpen={showDetailModal} onClose={() => dispatch({ type: 'SET_SHOW_DETAIL_MODAL', payload: false })} purchase={selectedPurchase} />
    </div>
  );
}
