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
  Pencil
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import { clienteService, type Cliente } from './Service';
import { perudevsService } from '../configuracion/perudevsService';
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
  | { type: 'RESET_FORM' };

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
  editingId: null
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
    editingId
  } = state;

  const setShowModal = (payload: boolean) => dispatch({ type: 'SET_SHOW_MODAL', payload });
  const setSearch = (payload: string) => dispatch({ type: 'SET_SEARCH', payload });
  const setPage = (payload: number) => dispatch({ type: 'SET_PAGE', payload });
  const setPageSize = (payload: number) => dispatch({ type: 'SET_PAGE_SIZE', payload });
  const setForm = (payload: Partial<ClientesState['form']> | ((prev: ClientesState['form']) => ClientesState['form'])) => dispatch({ type: 'SET_FORM', payload });
  const setIsSubmitted = (payload: boolean) => dispatch({ type: 'SET_IS_SUBMITTED', payload });

  const pageSizeOptions = [6, 12, 18, 24, 30];

  const errors = {
    nombre: !form.nombre.trim() ? 'El nombre es obligatorio' : null,
  };
  const isValid = !Object.values(errors).some(Boolean);

  // Fetch clients via React Query
  const { data, isLoading } = useQuery({
    queryKey: ['clientes', page, search],
    queryFn: () => clienteService.getClientes(page, pageSize, search),
  });

  const clients = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Save/Create/Edit client mutation
  const saveMutation = useMutation({
    mutationFn: (newCliente: typeof form) => {
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
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
          <p className="text-zinc-400 dark:text-zinc-500 text-sm">No se encontraron clientes registrados.</p>
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
                      onClick={() => notificationService.info('Próximamente', `El historial de compras para ${c.nombre} estará disponible en una versión futura.`)}
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
                  className="flex-1 min-w-0 px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:disabled:bg-zinc-800" 
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
    </div>
  );
}
