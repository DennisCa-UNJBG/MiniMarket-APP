import { useState } from 'react';
import {
  Plus,
  Pencil,
  PowerOff,
  CheckSquare
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolService } from '../RolService';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { notificationService } from '../../../shared/lib/notifications';
import { Badge } from '../../../shared/components/ui/Badge';
import { Tooltip } from '../../../shared/components/ui/Tooltip';
import { Button } from '../../../shared/components/ui/Button';
import { DataTable, type TableColumn } from '../../../shared/components/ui/DataTable';

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

export function TabRoles() {
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
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
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
