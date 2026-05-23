import { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Key,
  Pencil,
  Copy,
  Clock,
  AlertCircle,
  Power,
  RotateCcw,
  Eye
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sucursalService } from './Service';
import { useAuth } from '../../shared/contexts/AuthContext';
import { notificationService } from '../../shared/lib/notifications';
import { Badge } from '../../shared/components/ui/Badge';
import { Tooltip } from '../../shared/components/ui/Tooltip';
import { Button } from '../../shared/components/ui/Button';
import { DataTable, type TableColumn } from '../../shared/components/ui/DataTable';
import { SedeModal } from './components/SedeModal';
import { EmptyState } from '../../shared/components/ui/EmptyState';
import { SucursalDetalle } from './components/SucursalDetalle';

export function Sucursales() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSede, setEditingSede] = useState<any | null>(null);
  const [selectedSedeForDetail, setSelectedSedeForDetail] = useState<any | null>(null);

  // Queries
  const { data: sedes = [] } = useQuery({
    queryKey: ['sedes'],
    queryFn: () => sucursalService.getAll()
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'activo' | 'inactivo' }) =>
      sucursalService.toggleEstado(id, status, user?.id || 1),
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
    setEditingSede(null);
    setShowModal(true);
  };

  const handleOpenEdit = (sede: any) => {
    setEditingSede(sede);
    setShowModal(true);
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

  const getColumns = (
    onCopy: (s: any) => void,
    onEdit: (s: any) => void,
    onToggle: (id: number, st: string) => void,
    onViewDetail: (s: any) => void
  ): TableColumn<any>[] => [
      {
        key: 'nombre',
        header: 'Sucursal / Código',
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-800 dark:text-white">{row.nombre}</p>
              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
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
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <MapPin size={12} />
              {row.direccion || 'No especificada'}
            </div>
            <div suppressHydrationWarning className="flex items-center gap-2 text-[10px] text-zinc-400">
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
            <Tooltip text="Ver Detalle" position="top-right">
              <Button
                variant="ghost"
                size="sm"
                icon={<Eye size={16} />}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800"
                onClick={() => onViewDetail(row)}
              />
            </Tooltip>

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
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800"
                onClick={() => onEdit(row)}
              />
            </Tooltip>

            <Tooltip text={row.estado === 'activo' ? 'Desactivar' : 'Reactivar'} position="top-right">
              <Button
                variant="ghost"
                size="sm"
                icon={row.estado === 'activo' ? <Power size={16} /> : <RotateCcw size={16} />}
                className={`p-2 rounded-xl border ${row.estado === 'activo'
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
          <Building2 size={18} className="text-zinc-400" />
          <div>
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{row.nombre}</p>
            <p className="text-[10px] font-mono text-zinc-400">{row.codigo}</p>
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
              className="p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl"
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
    navigator.clipboard.writeText(`ID: ${sede.codigo}\nNombre: ${sede.nombre}`);
    notificationService.success('Copiado', 'Datos de sede listos para configurar.');
  };

  if (selectedSedeForDetail) {
    return (
      <SucursalDetalle
        sucursal={selectedSedeForDetail}
        onBack={() => setSelectedSedeForDetail(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white tracking-tight">Gestión de Sucursales</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Registra y administra las sucursales del minimarket.</p>
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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
        />
      </div>

      <DataTable
        columns={getColumns(handleCopy, handleOpenEdit, handleToggleStatus, setSelectedSedeForDetail)}
        data={activeSedes}
        keyExtractor={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Building2}
            title={!searchTerm ? "No hay sucursales registradas" : "No se encontraron sucursales"}
            description={!searchTerm ? "Agrega tu primera sucursal para comenzar." : "Intenta ajustar los términos de tu búsqueda."}
            action={
              !searchTerm ? (
                <Button
                  onClick={handleOpenCreate}
                  icon={<Plus size={18} />}
                >
                  Registrar mi primera sucursal
                </Button>
              ) : undefined
            }
          />
        }
      />

      {/* Sedes Inactivas */}
      {inactiveSedes.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl text-amber-700 dark:text-amber-400">
            <AlertCircle size={20} />
            <div>
              <p className="text-xs font-bold">Sucursales Desactivadas</p>
              <p className="text-[10px] opacity-80">Las sedes en esta lista tienen el acceso restringido y no pueden sincronizar datos con la central.</p>
            </div>
          </div>

          <div className="bg-zinc-50/50 dark:bg-zinc-900/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden opacity-60">
            <DataTable
              columns={inactiveColumns}
              data={inactiveSedes}
              keyExtractor={(row) => row.id}
              emptyMessage="No hay sucursales inactivas."
            />
          </div>
        </div>
      )}

      {showModal && (
        <SedeModal
          key={editingSede?.id || 'new'}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          editingSede={editingSede}
        />
      )}
    </div>
  );
}
