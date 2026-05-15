import { useState } from 'react';
import {
  Plus,
  Search,
  Shield,
  Building2,
  Pencil,
  Eye,
  EyeOff
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from './Service';
import { sucursalService } from '../sucursales/Service';
import { notificationService } from '../../lib/notifications';
import { Badge } from '../../components/ui/Badge';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';

export function Usuarios() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    rol_id: 2, // Vendedor por defecto
    sucursal_id: ''
  });

  // Queries
  const { data: usuarios = [], isLoading: loading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll()
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => userService.getRoles()
  });

  const { data: sedes = [] } = useQuery({
    queryKey: ['sedes'],
    queryFn: () => sucursalService.getAll()
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        return userService.update(editingId, data);
      } else {
        return userService.create(data);
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
      userService.toggleEstado(id, current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notificationService.success('Estado Actualizado', 'El acceso del usuario ha cambiado.');
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
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold uppercase">
            {u.username.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-white">{u.nombre_completo}</p>
            <p className="text-[10px] text-gray-400">@{u.username}</p>
          </div>
        </div>
      )
    },
    {
      key: 'rol_nombre',
      header: 'Rol',
      render: (u) => (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Shield size={14} className="text-gray-400" />
          {u.rol_nombre}
        </div>
      )
    },
    {
      key: 'sucursal_nombre',
      header: 'Sede Asignada',
      render: (u) => (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Building2 size={14} className="text-gray-400" />
          {u.sucursal_nombre || 'Todas (Sede Central)'}
        </div>
      )
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'center',
      render: (u) => (
        <button onClick={() => handleToggleEstado(u.id, u.estado)} className="hover:scale-105 transition-transform">
          <Badge 
            label={u.estado === 'activo' ? 'ACTIVO' : 'INACTIVO'} 
            variant={u.estado === 'activo' ? 'emerald' : 'gray'} 
          />
        </button>
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
              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800"
            />
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Administra el personal y sus permisos de acceso.</p>
        </div>
        <Button 
          onClick={handleOpenCreate}
          icon={<Plus size={18} />}
          className="px-4 py-2.5 font-bold rounded-2xl"
        >
          Nuevo Usuario
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre o usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
        />
      </div>

      <DataTable 
        columns={columns}
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        emptyMessage={loading ? "Cargando usuarios..." : "No hay usuarios registrados."}
      />

      {/* Modal de Usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-800 dark:text-white">
                {editingId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1"
                icon={<Plus className="rotate-45" size={24} />}
              />
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Usuario</label>
                  <input
                    required
                    disabled={!!editingId}
                    type="text"
                    placeholder="ej: jsmith"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase()})}
                    className={`w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                    {editingId ? 'Nueva Password (Opcional)' : 'Contraseña'}
                  </label>
                  <div className="relative">
                    <input
                      required={!editingId}
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editingId ? '••••••••' : 'Password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-2.5 pr-11 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 p-1"
                      icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: John Smith Doe"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                  className="w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Rol</label>
                  <select 
                    value={formData.rol_id}
                    onChange={(e) => setFormData({...formData, rol_id: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Sede de Trabajo</label>
                  <select 
                    value={formData.sucursal_id}
                    onChange={(e) => setFormData({...formData, sucursal_id: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="">Todas (Central)</option>
                    {sedes.map(s => (
                      <option key={s.codigo} value={s.codigo}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button 
                type="submit"
                fullWidth
                isLoading={saveMutation.isPending}
                className="py-3 mt-4 font-bold rounded-2xl"
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
