import { useReducer } from 'react';
import {
  Plus,
  Search,
  Shield,
  Building2,
  Pencil,
  PowerOff,
  RefreshCcw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../Service';
import { rolService } from '../RolService';
import { sucursalService } from '../../sucursales/Service';
import { useAuth } from '../../../contexts/AuthContext';
import { notificationService } from '../../../lib/notifications';
import { Badge } from '../../../components/ui/Badge';
import { Tooltip } from '../../../components/ui/Tooltip';
import { Button } from '../../../components/ui/Button';
import { DataTable, type TableColumn } from '../../../components/ui/DataTable';
import { UserModal } from './UserModal';

interface TabUsuariosState {
  showModal: boolean;
  searchTerm: string;
  editingId: number | null;
  formData: {
    username: string;
    password?: string;
    nombre_completo: string;
    rol_id: number;
    sucursal_id: string;
  };
}

type TabUsuariosAction =
  | { type: 'SET_SHOW_MODAL'; payload: boolean }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_EDITING_ID'; payload: number | null }
  | { type: 'SET_FORM_DATA'; payload: Partial<TabUsuariosState['formData']> | ((prev: TabUsuariosState['formData']) => TabUsuariosState['formData']) };

function tabUsuariosReducer(state: TabUsuariosState, action: TabUsuariosAction): TabUsuariosState {
  switch (action.type) {
    case 'SET_SHOW_MODAL':
      return { ...state, showModal: action.payload };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_EDITING_ID':
      return { ...state, editingId: action.payload };
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: typeof action.payload === 'function' ? action.payload(state.formData) : { ...state.formData, ...action.payload }
      };
    default:
      return state;
  }
}

export function TabUsuarios() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [state, dispatch] = useReducer(tabUsuariosReducer, {
    showModal: false,
    searchTerm: '',
    editingId: null,
    formData: {
      username: '',
      password: '',
      nombre_completo: '',
      rol_id: 2,
      sucursal_id: ''
    }
  });

  const { showModal, searchTerm, editingId, formData } = state;

  const setShowModal = (payload: boolean) => dispatch({ type: 'SET_SHOW_MODAL', payload });
  const setSearchTerm = (payload: string) => dispatch({ type: 'SET_SEARCH_TERM', payload });
  const setEditingId = (payload: number | null) => dispatch({ type: 'SET_EDITING_ID', payload });
  const setFormData = (payload: Partial<TabUsuariosState['formData']> | ((prev: TabUsuariosState['formData']) => TabUsuariosState['formData'])) => dispatch({ type: 'SET_FORM_DATA', payload });

  // Queries
  const { data: usuarios = [], isLoading: loading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll()
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolService.getAll()
  });

  const { data: sedes = [] } = useQuery({
    queryKey: ['sedes'],
    queryFn: () => sucursalService.getAll()
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        return userService.update(editingId, data, currentUser?.id || 1);
      } else {
        return userService.create(data, currentUser?.id || 1);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notificationService.success(
        editingId ? 'Usuario Actualizado' : 'Usuario Creado',
        editingId ? 'Los datos se guardaron correctamente.' : 'El nuevo usuario ha sido registrado.'
      );
      setShowModal(false);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, current }: { id: number, current: string }) => 
      userService.toggleEstado(id, current, currentUser?.id || 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notificationService.success('Estado Actualizado', 'El acceso del usuario ha cambiado.');
    },
    onError: (error: any) => {
      notificationService.error('Error', error.message || 'No se pudo cambiar el estado del usuario.');
    }
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ username: '', password: '', nombre_completo: '', rol_id: 2, sucursal_id: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      password: '', // No cargamos la contraseña por seguridad
      nombre_completo: user.nombre_completo,
      rol_id: user.rol_id,
      sucursal_id: user.sucursal_id || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleToggleEstado = (id: number, current: string) => {
    if (id === 1) {
      notificationService.error('Operación no permitida', 'No se puede desactivar la cuenta de administrador principal.');
      return;
    }
    if (id === currentUser?.id) {
      notificationService.error('Operación no permitida', 'No puedes desactivar tu propia cuenta.');
      return;
    }
    toggleStatusMutation.mutate({ id, current });
  };

  const filteredUsers = usuarios.filter(u => 
    u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: TableColumn<any>[] = [
    {
      key: 'username',
      header: 'Usuario',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold uppercase">
            {u.username.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-800 dark:text-white">{u.nombre_completo}</p>
            <p className="text-[10px] text-zinc-400">@{u.username}</p>
          </div>
        </div>
      )
    },
    {
      key: 'rol_nombre',
      header: 'Rol',
      render: (u) => (
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Shield size={14} className="text-zinc-400" />
          {u.rol_nombre}
        </div>
      )
    },
    {
      key: 'sucursal_nombre',
      header: 'Sede Asignada',
      render: (u) => (
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Building2 size={14} className="text-zinc-400" />
          {u.sucursal_nombre || 'Todas (Sede Central)'}
        </div>
      )
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'center',
      render: (u) => (
        u.id === 1 || u.id === currentUser?.id ? (
          <Badge 
            label={u.estado === 'activo' ? 'ACTIVO' : 'INACTIVO'} 
            variant={u.estado === 'activo' ? 'emerald' : 'gray'} 
          />
        ) : (
          <button onClick={() => handleToggleEstado(u.id, u.estado)} className="hover:scale-105 transition-transform">
            <Badge 
              label={u.estado === 'activo' ? 'ACTIVO' : 'INACTIVO'} 
              variant={u.estado === 'activo' ? 'emerald' : 'gray'} 
            />
          </button>
        )
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          <Tooltip text="Editar Usuario" position="top-right">
            <Button 
              onClick={() => handleOpenEdit(u)}
              variant="ghost"
              size="sm"
              icon={<Pencil size={16} />}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800"
            />
          </Tooltip>
          {u.id !== 1 && u.id !== currentUser?.id && (
            <Tooltip text={u.estado === 'activo' ? "Desactivar Usuario" : "Activar Usuario"} position="top-right">
              <Button 
                onClick={() => handleToggleEstado(u.id, u.estado)}
                variant="ghost"
                size="sm"
                icon={u.estado === 'activo' ? <PowerOff size={16} /> : <RefreshCcw size={16} />}
                className={`p-2 rounded-xl border ${
                  u.estado === 'activo'
                    ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800"
                    : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800"
                }`}
              />
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
          />
        </div>
        <Button 
          onClick={handleOpenCreate}
          icon={<Plus size={18} />}
          className="font-bold rounded-xl"
        >
          Nuevo Usuario
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        emptyMessage={loading ? "Cargando usuarios..." : "No hay usuarios registrados."}
      />
      {/* Modal de Usuario */}
      <UserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isPending={saveMutation.isPending}
        roles={roles}
        sedes={sedes}
      />
    </div>
  );
}
