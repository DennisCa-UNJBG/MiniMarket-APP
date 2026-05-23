import { useReducer } from 'react';
import {
  Plus,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../shared/components/ui/PageHeader';
import { Button } from '../../shared/components/ui/Button';
import { EmptyState } from '../../shared/components/ui/EmptyState';
import { clienteService, type Cliente } from './Service';
import { perudevsService } from '../configuracion/perudevsService';
import { ventaService } from '../ventas/Service';
import { Voucher } from '../ventas/components/Voucher';
import { notificationService } from '../../shared/lib/notifications';
import { useAuth } from '../../shared/contexts/AuthContext';

// Componentes secundarios modularizados
import { ClienteCard } from './components/ClienteCard';
import { ClienteFormModal } from './components/ClienteFormModal';
import { ClienteHistoryModal } from './components/ClienteHistoryModal';
import { ClienteSaleDetailModal } from './components/ClienteSaleDetailModal';

interface ClientesState {
  showModal: boolean;
  search: string;
  page: number;
  pageSize: number;
  form: {
    nombre: string;
    dni_ruc: string;
    telefono: string;
    email: string;
  };
  isSubmitted: boolean;
  editingId: number | null;
  // Historial
  showHistoryModal: boolean;
  selectedHistoryClient: Cliente | null;
  historyPage: number;
  selectedSale: any | null;
  saleDetails: any[];
}

type ClientesAction =
  | { type: 'SET_SHOW_MODAL'; payload: boolean }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'SET_FORM'; payload: Partial<ClientesState['form']> | ((prev: ClientesState['form']) => ClientesState['form']) }
  | { type: 'SET_IS_SUBMITTED'; payload: boolean }
  | { type: 'SET_EDITING_ID'; payload: number | null }
  | { type: 'RESET_FORM' }
  // Historial
  | { type: 'SET_SHOW_HISTORY_MODAL'; payload: boolean }
  | { type: 'SET_SELECTED_HISTORY_CLIENT'; payload: Cliente | null }
  | { type: 'SET_HISTORY_PAGE'; payload: number }
  | { type: 'SET_SELECTED_SALE'; payload: any | null }
  | { type: 'SET_SALE_DETAILS'; payload: any[] };

function clientesReducer(state: ClientesState, action: ClientesAction): ClientesState {
  switch (action.type) {
    case 'SET_SHOW_MODAL':
      return { ...state, showModal: action.payload };
    case 'SET_SEARCH':
      return { ...state, search: action.payload, page: 1 };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload, page: 1 };
    case 'SET_FORM':
      return {
        ...state,
        form: typeof action.payload === 'function'
          ? action.payload(state.form)
          : { ...state.form, ...action.payload }
      };
    case 'SET_IS_SUBMITTED':
      return { ...state, isSubmitted: action.payload };
    case 'SET_EDITING_ID':
      return { ...state, editingId: action.payload };
    case 'RESET_FORM':
      return {
        ...state,
        form: { nombre: '', dni_ruc: '', telefono: '', email: '' },
        isSubmitted: false,
        editingId: null
      };
    case 'SET_SHOW_HISTORY_MODAL':
      return { ...state, showHistoryModal: action.payload };
    case 'SET_SELECTED_HISTORY_CLIENT':
      return { ...state, selectedHistoryClient: action.payload };
    case 'SET_HISTORY_PAGE':
      return { ...state, historyPage: action.payload };
    case 'SET_SELECTED_SALE':
      return { ...state, selectedSale: action.payload };
    case 'SET_SALE_DETAILS':
      return { ...state, saleDetails: action.payload };
    default:
      return state;
  }
}

const initialClientesState: ClientesState = {
  showModal: false,
  search: '',
  page: 1,
  pageSize: 6,
  form: { nombre: '', dni_ruc: '', telefono: '', email: '' },
  isSubmitted: false,
  editingId: null,
  showHistoryModal: false,
  selectedHistoryClient: null,
  historyPage: 1,
  selectedSale: null,
  saleDetails: []
};

export function Clientes() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [state, dispatch] = useReducer(clientesReducer, initialClientesState);

  const {
    showModal,
    search,
    page,
    pageSize,
    form,
    isSubmitted,
    editingId,
    showHistoryModal,
    selectedHistoryClient,
    historyPage,
    selectedSale,
    saleDetails
  } = state;

  const setShowModal = (payload: boolean) => dispatch({ type: 'SET_SHOW_MODAL', payload });
  const setSearch = (payload: string) => dispatch({ type: 'SET_SEARCH', payload });
  const setPage = (payload: number | ((prev: number) => number)) => {
    const nextVal = typeof payload === 'function' ? payload(state.page) : payload;
    dispatch({ type: 'SET_PAGE', payload: nextVal });
  };
  const setPageSize = (payload: number) => dispatch({ type: 'SET_PAGE_SIZE', payload });
  const setForm = (payload: Partial<ClientesState['form']> | ((prev: ClientesState['form']) => ClientesState['form'])) => dispatch({ type: 'SET_FORM', payload });
  const setIsSubmitted = (payload: boolean) => dispatch({ type: 'SET_IS_SUBMITTED', payload });

  const pageSizeOptions = [6, 12, 18, 24, 30];

  const docTrimmed = form.dni_ruc.trim();
  const errors = {
    nombre: !form.nombre.trim() ? 'El nombre es obligatorio' : null,
    dni_ruc: docTrimmed && !/^\d+$/.test(docTrimmed)
      ? 'El documento debe contener solo números'
      : docTrimmed && docTrimmed.length !== 8 && docTrimmed.length !== 11
        ? 'El documento debe tener 8 dígitos (DNI) o 11 dígitos (RUC)'
        : null,
  };
  const isValid = !Object.values(errors).some(Boolean);

  // Fetch clients via React Query
  const { data, isLoading } = useQuery({
    queryKey: ['clientes', page, search],
    queryFn: () => clienteService.getClientes(page, pageSize, search),
  });

  // Fetch client purchase history via React Query
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['cliente-historial', selectedHistoryClient?.id, historyPage],
    queryFn: () => ventaService.getVentasPorCliente(selectedHistoryClient!.id, historyPage, 5),
    enabled: !!selectedHistoryClient,
  });

  const fetchDetailsMutation = useMutation({
    mutationFn: (id: number) => ventaService.getVentaDetalles(id),
    onSuccess: (details, id) => {
      queryClient.setQueryData(['sale-details', id], details);
      dispatch({ type: 'SET_SALE_DETAILS', payload: details });
      const sale = historyData?.data.find((s: any) => s.id === id);
      if (sale) {
        dispatch({ type: 'SET_SELECTED_SALE', payload: sale });
      }
    }
  });

  const handlePrint = () => {
    if (!selectedSale) return;
    window.print();
  };

  const clients = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Save/Create/Edit client mutation
  const saveMutation = useMutation({
    mutationFn: async (newCliente: typeof form) => {
      const doc = newCliente.dni_ruc.trim();
      if (doc) {
        const exists = await clienteService.existsDniRuc(doc, editingId || undefined);
        if (exists) {
          throw new Error(`El DNI/RUC "${doc}" ya se encuentra registrado.`);
        }
      }

      if (editingId) {
        return clienteService.update(editingId, newCliente, user?.id || 1);
      } else {
        return clienteService.create(newCliente, user?.id || 1);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      notificationService.success(
        editingId ? 'Cliente Actualizado' : 'Cliente Guardado',
        editingId ? 'El cliente ha sido actualizado correctamente.' : 'El cliente ha sido registrado correctamente.'
      );
      setShowModal(false);
      dispatch({ type: 'RESET_FORM' });
    }
  });

  const handleSave = async () => {
    setIsSubmitted(true);
    if (!isValid) {
      notificationService.warning('Campos incompletos', 'Por favor, corrige los errores en el formulario.');
      return;
    }
    await saveMutation.mutateAsync(form);
  };

  const handleEdit = (c: Cliente) => {
    dispatch({ type: 'SET_EDITING_ID', payload: c.id });
    dispatch({
      type: 'SET_FORM',
      payload: {
        nombre: c.nombre,
        dni_ruc: c.dni_ruc || '',
        telefono: c.telefono || '',
        email: c.email || ''
      }
    });
    dispatch({ type: 'SET_SHOW_MODAL', payload: true });
  };

  const handleConsultarAPI = async () => {
    const doc = form.dni_ruc.trim();
    if (!doc) {
      notificationService.warning('Documento requerido', 'Por favor, ingresa un número de DNI o RUC.');
      return;
    }
    if (doc.length !== 8 && doc.length !== 11) {
      notificationService.warning('Longitud inválida', 'El documento debe tener 8 dígitos (DNI) u 11 dígitos (RUC).');
      return;
    }

    try {
      const res = await perudevsService.queryDocument(doc);
      setForm({ nombre: res.nombre });
      notificationService.success('Consulta exitosa', `Encontrado: ${res.nombre}`);
    } catch (err: any) {
      notificationService.error('Error de consulta', err.message || 'No se pudo obtener la información del cliente.');
    }
  };

  // Generar botones de paginación en una sola pasada para evitar doble iteración (.filter().map())
  const pageButtons: React.ReactNode[] = [];
  let lastAddedPage = 0;
  for (let i = 1; i <= totalPages; i++) {
    if (Math.abs(i - page) <= 2 || i === 1 || i === totalPages) {
      const showEllipsis = lastAddedPage > 0 && i - lastAddedPage > 1;
      pageButtons.push(
        <div key={i} className="flex items-center">
          {showEllipsis && <span className="px-1 text-zinc-400 dark:text-zinc-600">...</span>}
          <button
            onClick={() => setPage(i)}
            className={[
              'min-w-[30px] h-[30px] px-1 text-xs font-medium rounded-lg transition-colors',
              i === page
                ? 'bg-blue-600 text-white'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 hover:text-blue-600 dark:hover:text-blue-400',
            ].join(' ')}
          >
            {i}
          </button>
        </div>
      );
      lastAddedPage = i;
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes"
        subtitle={`${totalItems} clientes registrados`}
        action={
          <Button
            id="add-client-btn"
            onClick={() => {
              dispatch({ type: 'RESET_FORM' });
              setShowModal(true);
            }}
            icon={<Plus size={16} />}
          >
            Agregar cliente
          </Button>
        }
      />

      {/* Búsqueda */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            id="search-clients"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o DNI/RUC..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        </div>
      </div>

      {/* Cards de clientes o Loader */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
          <Loader2 className="size-8 text-blue-600 animate-spin" />
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Cargando clientes…</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
          <EmptyState
            icon={User}
            title="No se encontraron clientes registrados."
            description={search ? `No se encontró ningún cliente con la búsqueda "${search}".` : "No hay clientes registrados en el sistema todavía. Agrega tu primer cliente para comenzar."}
            action={
              !search ? (
                <Button
                  onClick={() => {
                    dispatch({ type: 'RESET_FORM' });
                    setShowModal(true);
                  }}
                  icon={<Plus size={16} />}
                >
                  Crear mi primer cliente
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map((c) => (
              <ClienteCard
                key={c.id}
                cliente={c}
                onEdit={handleEdit}
                onViewHistory={(selectedClient) => {
                  dispatch({ type: 'SET_SELECTED_HISTORY_CLIENT', payload: selectedClient });
                  dispatch({ type: 'SET_HISTORY_PAGE', payload: 1 });
                  dispatch({ type: 'SET_SHOW_HISTORY_MODAL', payload: true });
                }}
              />
            ))}
          </div>

          {/* Paginación */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm mt-4">
              {/* Info de registros */}
              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span>
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} de{' '}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">{totalItems}</span>{' '}
                  registros
                </span>
                <span className="hidden sm:block text-zinc-200 dark:text-zinc-600">|</span>
                <div className="hidden sm:flex items-center gap-1.5">
                  <span>Filas:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                    }}
                    className="px-1.5 py-0.5 text-xs border border-zinc-200 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    {pageSizeOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Controles de página */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Primera página"
                >
                  <ChevronsLeft size={15} />
                </button>

                <button
                  onClick={() => setPage(prev => prev - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={15} />
                </button>

                {pageButtons}

                <button
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={15} />
                </button>

                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Última página"
                >
                  <ChevronsRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ClienteFormModal
        showModal={showModal}
        editingId={editingId}
        form={form}
        isSubmitted={isSubmitted}
        errors={errors}
        setForm={(payload) => setForm(payload)}
        onClose={() => {
          setShowModal(false);
          dispatch({ type: 'RESET_FORM' });
        }}
        onConsultarAPI={handleConsultarAPI}
        onSave={handleSave}
      />

      <ClienteHistoryModal
        showHistoryModal={showHistoryModal}
        selectedHistoryClient={selectedHistoryClient}
        isLoadingHistory={isLoadingHistory}
        historyData={historyData}
        historyPage={historyPage}
        onClose={() => {
          dispatch({ type: 'SET_SHOW_HISTORY_MODAL', payload: false });
          dispatch({ type: 'SET_SELECTED_HISTORY_CLIENT', payload: null });
          dispatch({ type: 'SET_SELECTED_SALE', payload: null });
        }}
        onPageChange={(page) => dispatch({ type: 'SET_HISTORY_PAGE', payload: page })}
        onFetchDetails={(saleId) => fetchDetailsMutation.mutate(saleId)}
      />

      <ClienteSaleDetailModal
        selectedSale={selectedSale}
        saleDetails={saleDetails}
        onClose={() => dispatch({ type: 'SET_SELECTED_SALE', payload: null })}
        onPrint={handlePrint}
      />

      {/* Componente de Voucher (Solo visible al imprimir) */}
      {selectedSale && (
        <Voucher venta={selectedSale} detalles={saleDetails} />
      )}
    </div>
  );
}
