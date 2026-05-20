import { useReducer } from 'react';
import {
  Plus,
  Search,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Pencil,
  Banknote,
  CreditCard,
  ShoppingCart,
  Printer
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { clienteService, type Cliente } from './Service';
import { perudevsService } from '../configuracion/perudevsService';
import { ventaService } from '../ventas/Service';
import { Voucher } from '../ventas/components/Voucher';
import { dateUtils } from '../../lib/dateUtils';
import { notificationService } from '../../lib/notifications';
import { useAuth } from '../../contexts/AuthContext';

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
  isQueryingAPI: boolean;
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
  | { type: 'SET_IS_QUERYING_API'; payload: boolean }
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
    case 'SET_IS_QUERYING_API':
      return { ...state, isQueryingAPI: action.payload };
    case 'SET_EDITING_ID':
      return { ...state, editingId: action.payload };
    case 'RESET_FORM':
      return {
        ...state,
        form: { nombre: '', dni_ruc: '', telefono: '', email: '' },
        isSubmitted: false,
        isQueryingAPI: false,
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
  isQueryingAPI: false,
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
    isQueryingAPI,
    editingId,
    showHistoryModal,
    selectedHistoryClient,
    historyPage,
    selectedSale,
    saleDetails
  } = state;

  const setShowModal = (payload: boolean) => dispatch({ type: 'SET_SHOW_MODAL', payload });
  const setSearch = (payload: string) => dispatch({ type: 'SET_SEARCH', payload });
  const setPage = (payload: number) => dispatch({ type: 'SET_PAGE', payload });
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

  const handleSave = () => {
    setIsSubmitted(true);
    if (!isValid) {
      notificationService.warning('Campos incompletos', 'Por favor, corrige los errores en el formulario.');
      return;
    }
    saveMutation.mutate(form);
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

    dispatch({ type: 'SET_IS_QUERYING_API', payload: true });
    try {
      const res = await perudevsService.queryDocument(doc);
      setForm({ nombre: res.nombre });
      notificationService.success('Consulta exitosa', `Encontrado: ${res.nombre}`);
    } catch (err: any) {
      notificationService.error('Error de consulta', err.message || 'No se pudo obtener la información del cliente.');
    } finally {
      dispatch({ type: 'SET_IS_QUERYING_API', payload: false });
    }
  };

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
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Cargando clientes...</p>
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
              <div
                key={c.id}
                className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                {/* Avatar + nombre y Editar */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-800 dark:text-white truncate">{c.nombre}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">DNI/RUC: {c.dni_ruc || 'Sin Documento'}</p>
                    </div>
                  </div>
                  
                  <Tooltip text="Editar cliente" position="top-right">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                      aria-label="Editar cliente"
                    >
                      <Pencil size={15} />
                    </button>
                  </Tooltip>
                </div>

                {/* Contacto */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Phone size={12} /> {c.telefono || 'Sin teléfono'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Mail size={12} /> {c.email || 'Sin correo'}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-700">
                  <div className="text-center">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Compras</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-white">{c.compras}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Total gastado</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">S/ {(c.total_gastado || 0).toFixed(2)}</p>
                  </div>
                  <Tooltip text="Ver historial del cliente" position="top-right">
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                      onClick={() => {
                        dispatch({ type: 'SET_SELECTED_HISTORY_CLIENT', payload: c });
                        dispatch({ type: 'SET_HISTORY_PAGE', payload: 1 });
                        dispatch({ type: 'SET_SHOW_HISTORY_MODAL', payload: true });
                      }}
                    >
                      Ver historial
                    </Button>
                  </Tooltip>
                </div>
              </div>
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
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={15} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => Math.abs(n - page) <= 2 || n === 1 || n === totalPages)
                  .map((n, idx, arr) => {
                    const showEllipsis = idx > 0 && n - arr[idx - 1] > 1;
                    return (
                      <div key={n} className="flex items-center">
                        {showEllipsis && <span className="px-1 text-zinc-400 dark:text-zinc-600">...</span>}
                        <button
                          onClick={() => setPage(n)}
                          className={[
                            'min-w-[30px] h-[30px] px-1 text-xs font-medium rounded-lg transition-colors',
                            n === page
                              ? 'bg-blue-600 text-white'
                              : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 hover:text-blue-600 dark:hover:text-blue-400',
                          ].join(' ')}
                        >
                          {n}
                        </button>
                      </div>
                    );
                  })}

                <button
                  onClick={() => setPage(page + 1)}
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

      {showModal && (
        <Modal 
          title={editingId ? "Editar Cliente" : "Agregar Cliente"} 
          onClose={() => { setShowModal(false); dispatch({ type: 'RESET_FORM' }); }}
        >
          <div className="grid grid-cols-2 gap-4">
            {/* DNI / RUC al inicio */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <label htmlFor="cliente-dni" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">DNI / RUC</label>
              <div className="flex gap-2">
                <input 
                  id="cliente-dni" 
                  value={form.dni_ruc}
                  onChange={(e) => setForm({ dni_ruc: e.target.value })}
                  disabled={!!editingId}
                  className={`flex-1 min-w-0 px-3 py-2 text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:disabled:bg-zinc-800 ${isSubmitted && errors.dni_ruc ? 'border-red-500 focus:ring-red-400' : 'border-zinc-200 dark:border-zinc-600'}`} 
                  placeholder="Número de documento..." 
                />
                {!editingId && (
                  <Button 
                    type="button" 
                    onClick={handleConsultarAPI}
                    disabled={isQueryingAPI}
                    className="px-3"
                    variant="primary"
                  >
                    {isQueryingAPI ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Search size={16} />
                    )}
                  </Button>
                )}
              </div>
              {isSubmitted && errors.dni_ruc && (
                <span className="text-[11px] text-red-500">{errors.dni_ruc}</span>
              )}
            </div>

            {/* Nombre Completo / Razón Social */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <label htmlFor="cliente-nombre" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nombre Completo / Razón Social *</label>
              <input 
                id="cliente-nombre" 
                value={form.nombre}
                onChange={(e) => setForm({ nombre: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${isSubmitted && errors.nombre ? 'border-red-500 focus:ring-red-400' : 'border-zinc-200 dark:border-zinc-600'}`} 
                placeholder="Nombres y apellidos o Razón social..." 
              />
              {isSubmitted && errors.nombre && (
                <span className="text-[11px] text-red-500">{errors.nombre}</span>
              )}
            </div>

            {/* Teléfono */}
            <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
              <label htmlFor="cliente-telefono" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Teléfono</label>
              <input 
                id="cliente-telefono" 
                type="tel" 
                value={form.telefono}
                onChange={(e) => setForm({ telefono: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" 
                placeholder="Celular o teléfono fijo..." 
              />
            </div>

            {/* Correo Electrónico */}
            <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
              <label htmlFor="cliente-email" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Correo Electrónico</label>
              <input 
                id="cliente-email" 
                type="email" 
                value={form.email}
                onChange={(e) => setForm({ email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" 
                placeholder="correo@ejemplo.com" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => { setShowModal(false); dispatch({ type: 'RESET_FORM' }); }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar Cliente'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal de Historial de Compras */}
      {showHistoryModal && selectedHistoryClient && (
        <Modal
          title={`Historial de Compras: ${selectedHistoryClient.nombre}`}
          onClose={() => {
            dispatch({ type: 'SET_SHOW_HISTORY_MODAL', payload: false });
            dispatch({ type: 'SET_SELECTED_HISTORY_CLIENT', payload: null });
            dispatch({ type: 'SET_SELECTED_SALE', payload: null });
          }}
          maxWidth="3xl"
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-150 dark:border-zinc-700/60">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Documento</p>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{selectedHistoryClient.dni_ruc || 'Sin Documento'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Total Compras</p>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{selectedHistoryClient.compras} transacciones</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Monto Acumulado</p>
                <p className="text-xs font-black text-blue-600 dark:text-blue-400">S/ {(selectedHistoryClient.total_gastado || 0).toFixed(2)}</p>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-8 text-blue-600 animate-spin" />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Cargando compras...</p>
              </div>
            ) : !historyData || historyData.data.length === 0 ? (
              <div className="h-48 border border-zinc-100 dark:border-zinc-700 rounded-xl flex items-center justify-center">
                <EmptyState
                  icon={ShoppingCart}
                  title="Sin compras registradas"
                  description="Este cliente no tiene compras asociadas en el sistema todavía."
                />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-700 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-700">
                        <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider">N° Venta</th>
                        <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider">Fecha / Hora</th>
                        <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider">Pago</th>
                        <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider text-right">Total</th>
                        <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider text-right">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                      {historyData.data.map((sale: any) => (
                        <tr key={sale.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-750/30 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            #{sale.id.toString().padStart(5, '0')}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            <div className="flex flex-col">
                              <span className="font-semibold">{dateUtils.formatUTCtoLocalDateString(sale.fecha)}</span>
                              <span className="text-[10px] text-zinc-400">{dateUtils.formatUTCtoLocalTimeString(sale.fecha)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase text-zinc-700 dark:text-zinc-300">
                              {sale.metodo_pago === 'EFECTIVO' ? (
                                <Banknote size={12} className="text-emerald-500" />
                              ) : (
                                <CreditCard size={12} className="text-blue-500" />
                              )}
                              {sale.metodo_pago}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge 
                              label={sale.estado === 'anulado' ? 'ANULADO' : 'COMPLETADO'} 
                              variant={sale.estado === 'anulado' ? 'red' : 'emerald'} 
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                            S/ {sale.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[10px] font-bold uppercase tracking-tight text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 hover:bg-blue-50 px-2.5 py-1"
                              onClick={() => fetchDetailsMutation.mutate(sale.id)}
                            >
                              Ver
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación Historial */}
                {historyData.total > 5 && (
                  <div className="flex items-center justify-between px-2 pt-2 text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Página <span className="font-bold">{historyPage}</span> de {Math.ceil(historyData.total / 5)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={historyPage === 1}
                        onClick={() => dispatch({ type: 'SET_HISTORY_PAGE', payload: historyPage - 1 })}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={historyPage === Math.ceil(historyData.total / 5)}
                        onClick={() => dispatch({ type: 'SET_HISTORY_PAGE', payload: historyPage + 1 })}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Modal de Detalle de Venta */}
      {selectedSale && (
        <Modal
          onClose={() => dispatch({ type: 'SET_SELECTED_SALE', payload: null })}
          title={`Detalle de Venta #${selectedSale.id.toString().padStart(5, '0')}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Cabecera del Detalle */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Fecha</p>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{dateUtils.formatUTCtoLocalDateString(selectedSale.fecha)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Hora</p>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{dateUtils.formatUTCtoLocalTimeString(selectedSale.fecha)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Cajero</p>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{selectedSale.usuario_nombre}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Pago</p>
                <Badge label={selectedSale.metodo_pago} variant={selectedSale.metodo_pago === 'EFECTIVO' ? 'emerald' : 'blue'} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Estado</p>
                <Badge 
                  label={selectedSale.estado === 'anulado' ? 'ANULADO' : 'COMPLETADO'} 
                  variant={selectedSale.estado === 'anulado' ? 'red' : 'emerald'} 
                />
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Cliente</p>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate">
                  {selectedSale.cliente_nombre ? `${selectedSale.cliente_nombre} (${selectedSale.cliente_dni_ruc || 'S/D'})` : 'Público en General'}
                </p>
              </div>
            </div>

            {/* Tabla de Items */}
            <div className="border border-zinc-100 dark:border-zinc-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-50 dark:bg-zinc-700/50">
                  <tr>
                    <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase">Producto</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase text-center">Cant.</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase text-right">Precio</th>
                    <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700">
                  {saleDetails.map((det: any) => (
                    <tr key={det.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 font-medium">{det.producto_nombre}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 text-center">{det.cantidad} {det.unidad_medida}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 text-right">S/ {det.precio_unitario.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white font-bold text-right">S/ {det.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-50/50 dark:bg-zinc-700/20">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">IGV ({selectedSale.igv_porcentaje || 0}%):</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-zinc-700 dark:text-zinc-300">S/ {(selectedSale.igv || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">Subtotal items:</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-zinc-700 dark:text-zinc-300">S/ {selectedSale.total.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">Monto Pagado:</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">S/ {(selectedSale.monto_pagado || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-zinc-500 text-xs italic">Vuelto entregado:</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-orange-600 dark:text-orange-400">S/ {(selectedSale.vuelto || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="bg-blue-50/30 dark:bg-blue-900/10">
                    <td colSpan={3} className="p-4 text-right font-black text-zinc-700 dark:text-zinc-200 text-sm uppercase tracking-tighter">Total Final:</td>
                    <td className="p-4 text-right text-xl font-black text-blue-600 dark:text-blue-400">S/ {selectedSale.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-700">
              <Button
                variant="secondary"
                onClick={() => dispatch({ type: 'SET_SELECTED_SALE', payload: null })}
                className="font-bold"
              >
                Cerrar
              </Button>
              <Button
                onClick={handlePrint}
                icon={<Printer size={18} />}
                className="font-bold shadow-lg shadow-blue-200 dark:shadow-none"
              >
                Imprimir Boleta
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Componente de Voucher (Solo visible al imprimir) */}
      {selectedSale && (
        <Voucher venta={selectedSale} detalles={saleDetails} />
      )}
    </div>
  );
}
