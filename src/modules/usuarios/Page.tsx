import { useState, useReducer } from 'react';
import {
  Plus,
  Search,
  Shield,
  Building2,
  Pencil,
  Eye,
  EyeOff,
  Users as UsersIcon,
  CheckSquare,
  PowerOff,
  RefreshCcw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from './Service';
import { rolService } from './RolService';
import { sucursalService } from '../sucursales/Service';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../lib/notifications';
import { Badge } from '../../components/ui/Badge';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';

const AVAILABLE_PERMISSIONS = [
  { id: 'pos', label: 'Caja / POS' },
  { id: 'ventas', label: 'Ventas y Control de Caja' },
  { id: 'inventario', label: 'Gestión de Inventario' },
  { id: 'productos', label: 'Gestión de Productos' },
  { id: 'compras', label: 'Registro de Compras' },
  { id: 'clientes', label: 'Gestión de Clientes' },
  { id: 'kardex', label: 'Kardex de Movimientos' },
  { id: 'reportes', label: 'Generación de Reportes' },
  { id: 'admin', label: 'Ajustes y Administración (Usuarios, Sucursales, etc)' },
  { id: 'configuracion', label: 'Configuración del Sistema' },
  { id: '*', label: 'Acceso Total (Superadmin)' }
];

// ── Tab Usuarios ─────────────────────────────────────────────────────────────
interface TabUsuariosState {
  showModal: boolean;
  searchTerm: string;
  editingId: number | null;
  showPassword: boolean;
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
  | { type: 'SET_SHOW_PASSWORD'; payload: boolean }
  | { type: 'SET_FORM_DATA'; payload: Partial<TabUsuariosState['formData']> | ((prev: TabUsuariosState['formData']) => TabUsuariosState['formData']) };

function tabUsuariosReducer(state: TabUsuariosState, action: TabUsuariosAction): TabUsuariosState {
  switch (action.type) {
    case 'SET_SHOW_MODAL':
      return { ...state, showModal: action.payload };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_EDITING_ID':
      return { ...state, editingId: action.payload };
    case 'SET_SHOW_PASSWORD':
      return { ...state, showPassword: action.payload };
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: typeof action.payload === 'function' ? action.payload(state.formData) : { ...state.formData, ...action.payload }
      };
    default:
      return state;
  }
}

function TabUsuarios() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [state, dispatch] = useReducer(tabUsuariosReducer, {
    showModal: false,
    searchTerm: '',
    editingId: null,
    showPassword: false,
    formData: {
      username: '',
      password: '',
      nombre_completo: '',
      rol_id: 2,
      sucursal_id: ''
    }
  });

  const { showModal, searchTerm, editingId, showPassword, formData } = state;

  const setShowModal = (payload: boolean) => dispatch({ type: 'SET_SHOW_MODAL', payload });
  const setSearchTerm = (payload: string) => dispatch({ type: 'SET_SEARCH_TERM', payload });
  const setEditingId = (payload: number | null) => dispatch({ type: 'SET_EDITING_ID', payload });
  const setShowPassword = (payload: boolean) => dispatch({ type: 'SET_SHOW_PASSWORD', payload });
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
    setShowPassword(false);
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
    setShowPassword(false);
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-50 dark:border-zinc-700/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">
                {editingId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowModal(false)} 
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1"
                icon={<Plus className="rotate-45" size={24} />}
              />
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="usuario-username" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Usuario</label>
                  <input
                    id="usuario-username"
                    required
                    disabled={!!editingId}
                    type="text"
                    placeholder="ej: jsmith"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({...prev, username: e.target.value.toLowerCase()}))}
                    className={`w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="usuario-password" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
                    {editingId ? 'Nueva Password (Opcional)' : 'Contraseña'}
                  </label>
                  <div className="relative">
                    <input
                      id="usuario-password"
                      required={!editingId}
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editingId ? '••••••••' : 'Password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                      className="w-full px-4 py-2.5 pr-11 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600 p-1"
                      icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="usuario-fullname" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input
                  id="usuario-fullname"
                  required
                  type="text"
                  placeholder="Ej: John Smith Doe"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData(prev => ({...prev, nombre_completo: e.target.value}))}
                  className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="usuario-rol" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Rol</label>
                  <select 
                    id="usuario-rol"
                    value={formData.rol_id}
                    onChange={(e) => setFormData(prev => ({...prev, rol_id: parseInt(e.target.value)}))}
                    className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    {roles.filter(r => r.estado === 'activo').map((r: any) => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="usuario-sede" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Sede de Trabajo</label>
                  <select 
                    id="usuario-sede"
                    value={formData.sucursal_id}
                    onChange={(e) => setFormData(prev => ({...prev, sucursal_id: e.target.value}))}
                    className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Todas (Central)</option>
                    {sedes.map((s: any) => (
                      <option key={s.codigo} value={s.codigo}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button 
                type="submit"
                fullWidth
                isLoading={saveMutation.isPending}
                className="py-3 mt-4 font-bold rounded-xl"
              >
                {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab Roles ────────────────────────────────────────────────────────────────
function TabRoles() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    permisos: [] as string[]
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolService.getAll()
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        return rolService.update(editingId, data.nombre, data.descripcion, data.permisos, currentUser?.id || 1);
      } else {
        return rolService.create(data.nombre, data.descripcion, data.permisos, currentUser?.id || 1);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      notificationService.success(
        editingId ? 'Rol Actualizado' : 'Rol Creado',
        editingId ? 'Los permisos han sido guardados.' : 'El nuevo rol ha sido registrado.'
      );
      setShowModal(false);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, current }: { id: number, current: string }) => 
      rolService.toggleEstado(id, current, currentUser?.id || 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      notificationService.success('Estado Actualizado', 'El acceso del rol ha cambiado.');
    },
    onError: (error: any) => {
      notificationService.error('No se pudo desactivar', error.message || 'Error al cambiar estado.');
    }
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ nombre: '', descripcion: '', permisos: [] });
    setShowModal(true);
  };

  const handleOpenEdit = (rol: any) => {
    setEditingId(rol.id);
    setFormData({
      nombre: rol.nombre,
      descripcion: rol.descripcion || '',
      permisos: rol.permisos || []
    });
    setShowModal(true);
  };

  const handleTogglePermiso = (permisoId: string) => {
    setFormData(prev => {
      // Si eligen acceso total, desmarcan el resto y viceversa
      if (permisoId === '*') {
        return { ...prev, permisos: prev.permisos.includes('*') ? [] : ['*'] };
      }
      
      const newPermisos = prev.permisos.filter(p => p !== '*'); // Quitar acceso total si seleccionan otro
      if (newPermisos.includes(permisoId)) {
        return { ...prev, permisos: newPermisos.filter(p => p !== permisoId) };
      } else {
        return { ...prev, permisos: [...newPermisos, permisoId] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.permisos.length === 0) {
      notificationService.warning('Permisos vacíos', 'Debes seleccionar al menos un permiso para el rol.');
      return;
    }
    saveMutation.mutate(formData);
  };

  const activeRoles = roles.filter((r: any) => r.estado === 'activo');
  const inactiveRoles = roles.filter((r: any) => r.estado === 'inactivo');

  const columns: TableColumn<any>[] = [
    {
      key: 'nombre',
      header: 'Nombre del Rol',
      render: (r) => (
        <div>
          <p className="font-bold text-zinc-800 dark:text-white">{r.nombre}</p>
          {r.descripcion && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{r.descripcion}</p>}
        </div>
      )
    },
    {
      key: 'permisos',
      header: 'Permisos',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.permisos.includes('*') ? (
            <Badge label="Acceso Total" variant="blue" />
          ) : (
            r.permisos.map((p: string) => (
              <span key={p} className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded">
                {p}
              </span>
            ))
          )}
        </div>
      )
    },
    {
      key: 'usuarios',
      header: 'Usuarios Activos',
      align: 'center',
      render: (r) => (
        <Badge label={`${r.usuarios_count || 0} usuarios`} variant={r.usuarios_count > 0 ? 'blue' : 'gray'} />
      )
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip text="Editar Rol" position="top-right">
            <Button 
              onClick={() => handleOpenEdit(r)}
              variant="ghost"
              size="sm"
              icon={<Pencil size={14} />}
              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            />
          </Tooltip>
          <Tooltip text="Desactivar Rol" position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              icon={<PowerOff size={14} />}
              className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
              onClick={() => toggleStatusMutation.mutate({ id: r.id, current: 'activo' })}
            />
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-end mb-4">
        <Button 
          onClick={handleOpenCreate}
          icon={<Plus size={18} />}
          className="font-bold rounded-xl"
        >
          Nuevo Rol
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={activeRoles}
        keyExtractor={(r) => r.id}
        emptyMessage="No hay roles activos."
      />

      {inactiveRoles.length > 0 && (
        <div className="mt-8 opacity-60">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-4 tracking-widest">Roles Inactivos</h4>
          <DataTable 
            columns={[
              ...columns.filter(c => c.key !== 'acciones'),
              {
                key: 'acciones', header: '', align: 'right',
                render: (row) => (
                  <button onClick={() => toggleStatusMutation.mutate({ id: row.id, current: 'inactivo' })} className="text-xs text-green-600 font-bold hover:underline">
                    Reactivar
                  </button>
                )
              }
            ]} 
            data={inactiveRoles} 
            keyExtractor={(u) => u.id} 
          />
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-50 dark:border-zinc-700/50 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">
                {editingId ? 'Editar Rol' : 'Crear Nuevo Rol'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowModal(false)} 
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1"
                icon={<Plus className="rotate-45" size={24} />}
              />
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-1.5">
                  <label htmlFor="rol-nombre" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Nombre del Rol *</label>
                  <input
                    id="rol-nombre"
                    required
                    type="text"
                    placeholder="ej: Cajero Principal"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({...prev, nombre: e.target.value}))}
                    className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="rol-descripcion" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Descripción</label>
                  <input
                    id="rol-descripcion"
                    type="text"
                    placeholder="Breve descripción del rol"
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({...prev, descripcion: e.target.value}))}
                    className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">
                    Permisos de Acceso
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700">
                    {AVAILABLE_PERMISSIONS.map(p => {
                      const isSelected = formData.permisos.includes(p.id);
                      return (
                        <label 
                          key={p.id} 
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'}`}
                        >
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={isSelected}
                            onChange={() => handleTogglePermiso(p.id)}
                          />
                          <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'border border-zinc-300 dark:border-zinc-600'}`}>
                            {isSelected && <CheckSquare size={12} />}
                          </div>
                          <span className={`text-xs ${isSelected ? 'text-blue-900 dark:text-blue-300 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                            {p.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-zinc-50 dark:border-zinc-700/50 bg-zinc-50/30 dark:bg-zinc-800/30 shrink-0">
                <Button 
                  type="submit"
                  fullWidth
                  isLoading={saveMutation.isPending}
                  className="py-3 font-bold rounded-xl"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Rol'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export function Usuarios() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'roles'>('usuarios');

  const tabs = [
    { key: 'usuarios', label: 'Usuarios', icon: UsersIcon },
    { key: 'roles', label: 'Roles y Permisos', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white tracking-tight">Personal y Accesos</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Administra usuarios, asigna sucursales y configura permisos.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`tab-${key}`}
            onClick={() => setActiveTab(key as any)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === key
                ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
            ].join(' ')}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'usuarios' && <TabUsuarios />}
      {activeTab === 'roles'    && <TabRoles />}
    </div>
  );
}
