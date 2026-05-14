import { useState } from 'react';
import { Building2, Plus, Search, MapPin, Key, Pencil, Copy, Clock, AlertCircle, Power, RotateCcw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sucursalService } from '../services/sucursalService';
import { notificationService } from '../lib/notifications';
import { Badge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { Button } from '../components/ui/Button';
import { DataTable, type TableColumn } from '../components/ui/DataTable';

export function Sucursales() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    direccion: '',
    estado: 'activo'
  });

  // Queries
  const { data: sedes = [] } = useQuery({
    queryKey: ['sedes'],
    queryFn: () => sucursalService.getAll()
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        return sucursalService.update(editingId, data);
      } else {
        return sucursalService.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedes'] });
      notificationService.success(
        editingId ? 'Sucursal Actualizada' : 'Sucursal Registrada',
        editingId ? 'Los cambios se guardaron correctamente.' : 'La nueva sucursal ha sido creada.'
      );
      setShowModal(false);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'activo' | 'inactivo' }) => 
      sucursalService.toggleEstado(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sedes'] });
      notificationService.success(
        variables.status === 'activo' ? 'Sede Reactivada' : 'Sede Desactivada', 
        `La sucursal ahora está ${variables.status}.`
      );
    }
  });

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nuevoEstado = currentStatus === 'activo' ? 'inactivo' : 'activo';
    const confirmMsg = nuevoEstado === 'inactivo' 
      ? '¿Estás seguro de desactivar esta sucursal? No podrá sincronizar hasta que sea reactivada.'
      : '¿Deseas reactivar esta sucursal?';

    const confirmed = await notificationService.confirm(
      nuevoEstado === 'inactivo' ? 'Desactivar Sede' : 'Reactivar Sede',
      confirmMsg
    );

    if (!confirmed) return;
    toggleStatusMutation.mutate({ id, status: nuevoEstado as 'activo' | 'inactivo' });
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ codigo: '', nombre: '', direccion: '', estado: 'activo' });
    setShowModal(true);
  };

  const handleOpenEdit = (sede: any) => {
    setEditingId(sede.id);
    setFormData({
      codigo: sede.codigo,
      nombre: sede.nombre,
      direccion: sede.direccion || '',
      estado: sede.estado || 'activo'
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const getStatus = (lastSync: string | null, estado: string) => {
    if (estado !== 'activo') return { label: 'DESACTIVADO', variant: 'gray' as const };
    if (!lastSync) return { label: 'NUNCA', variant: 'gray' as const };
    
    const diff = new Date().getTime() - new Date(lastSync).getTime();
    if (diff < 300000) return { label: 'EN LÍNEA', variant: 'emerald' as const };
    return { label: 'DESCONECTADO', variant: 'amber' as const };
  };

  const activeSedes = sedes.filter(s => 
    s.estado === 'activo' && 
    (s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const inactiveSedes = sedes.filter(s => 
    s.estado !== 'activo' && 
    (s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getColumns = (onCopy: (s: any) => void, onEdit: (s: any) => void, onToggle: (id: number, st: string) => void): TableColumn<any>[] => [
    {
      key: 'nombre',
      header: 'Sucursal / Código',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Building2 size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-white">{row.nombre}</p>
            <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
              <Key size={10} />
              {row.codigo}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'direccion',
      header: 'Ubicación / Sincro',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <MapPin size={12} />
            {row.direccion || 'No especificada'}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <Clock size={10} />
            {row.ultima_sincronizacion ? new Date(row.ultima_sincronizacion).toLocaleString() : 'Sin sincronización'}
          </div>
        </div>
      )
    },
    {
      key: 'estado',
      header: 'Estado Real',
      align: 'center',
      render: (row) => {
        const { label, variant } = getStatus(row.ultima_sincronizacion, row.estado);
        return <Badge label={label} variant={variant} />;
      }
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Tooltip text="Copiar nombre y llave" position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              icon={<Copy size={16} />}
              className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800"
              onClick={() => onCopy(row)}
            />
          </Tooltip>

          <Tooltip text="Editar" position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              icon={<Pencil size={16} />}
              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800"
              onClick={() => onEdit(row)}
            />
          </Tooltip>

          <Tooltip text={row.estado === 'activo' ? 'Desactivar' : 'Reactivar'} position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              icon={row.estado === 'activo' ? <Power size={16} /> : <RotateCcw size={16} />}
              className={`p-2 rounded-xl border ${
                row.estado === 'activo' 
                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800' 
                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800'
              }`}
              onClick={() => onToggle(row.id, row.estado)}
            />
          </Tooltip>
        </div>
      )
    }
  ];

  const inactiveColumns: TableColumn<any>[] = [
    {
      key: 'nombre',
      header: 'Sucursal / Código',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Building2 size={18} className="text-gray-400" />
          <div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{row.nombre}</p>
            <p className="text-[10px] font-mono text-gray-400">{row.codigo}</p>
          </div>
        </div>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Tooltip text="Editar" position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              icon={<Pencil size={16} />}
              className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl"
              onClick={() => handleOpenEdit(row)}
            />
          </Tooltip>
          <Tooltip text="Reactivar" position="top-right">
            <Button 
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={16} />}
              className="p-2 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl"
              onClick={() => handleToggleStatus(row.id, row.estado)}
            />
          </Tooltip>
        </div>
      )
    }
  ];

  const handleCopy = (sede: any) => {
    navigator.clipboard.writeText(`Sede: ${sede.nombre}\nCódigo: ${sede.codigo}`);
    notificationService.success('Copiado', 'Datos de sede listos para configurar.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Gestión de Sucursales</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Registra y administra las sucursales del minimarket.</p>
        </div>
        <Button 
          onClick={handleOpenCreate}
          icon={<Plus size={18} />}
          className="px-4 py-2.5 font-bold rounded-2xl"
        >
          Registrar Nueva Sucursal
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
        />
      </div>

      <DataTable 
        columns={getColumns(handleCopy, handleOpenEdit, handleToggleStatus)}
        data={activeSedes}
        keyExtractor={(row) => row.id}
        emptyMessage="No hay sucursales activas."
      />

      {/* Sedes Inactivas */}
      {inactiveSedes.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl text-amber-700 dark:text-amber-400">
            <AlertCircle size={20} />
            <div>
              <p className="text-xs font-bold">Sucursales Desactivadas</p>
              <p className="text-[10px] opacity-80">Las sedes en esta lista tienen el acceso restringido y no pueden sincronizar datos con la central.</p>
            </div>
          </div>

          <div className="bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden opacity-60">
            <DataTable 
              columns={inactiveColumns}
              data={inactiveSedes}
              keyExtractor={(row) => row.id}
              emptyMessage="No hay sucursales inactivas."
            />
          </div>
        </div>
      )}

      {/* Modal de Registro/Edición */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-800 dark:text-white">
                {editingId ? 'Editar Sucursal' : 'Registrar Nueva Sucursal'}
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Código Único (Llave de Acceso)</label>
                <input
                  required
                  disabled={!!editingId}
                  type="text"
                  placeholder="Ej: SEDE-SUR-01"
                  value={formData.codigo}
                  onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                  className={`w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${editingId ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}`}
                />
                {editingId && (
                  <p className="text-[9px] text-amber-500 ml-1 font-bold italic">La llave de acceso no se puede modificar.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Nombre de la Sucursal</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Sucursal Av. Ejercito"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Dirección (Opcional)</label>
                <input
                  type="text"
                  placeholder="Av. Principal 456..."
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {/* El estado ahora se gestiona exclusivamente desde la tabla mediante handleToggleStatus */}
              <Button 
                type="submit"
                fullWidth
                isLoading={saveMutation.isPending}
                className="py-3 mt-4 font-bold rounded-2xl"
              >
                {editingId ? 'Guardar Cambios' : 'Registrar y Generar Acceso'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
