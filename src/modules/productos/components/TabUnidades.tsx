import { useState } from 'react';
import {
  Plus,
  Edit2,
  PowerOff,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unidadMedidaService, type UnidadMedida } from '../unidadMedidaService';
import { notificationService } from '../../../shared/lib/notifications';
import { Badge } from '../../../shared/components/ui/Badge';
import { Tooltip } from '../../../shared/components/ui/Tooltip';
import { Button } from '../../../shared/components/ui/Button';
import { Modal } from '../../../shared/components/ui/Modal';
import { DataTable, type TableColumn } from '../../../shared/components/ui/DataTable';
import { useAuth } from '../../../shared/contexts/AuthContext';

export function TabUnidades() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', abreviatura: '' });

  const { data: units = [] } = useQuery({
    queryKey: ['units-full'],
    queryFn: () => unidadMedidaService.getAll(false),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingId) {
        return unidadMedidaService.update(editingId, payload.nombre, payload.abreviatura, user?.id || 1);
      } else {
        return unidadMedidaService.create(payload.nombre, payload.abreviatura);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['units-full'] });
      notificationService.success(editingId ? 'Unidad actualizada' : 'Unidad creada');
      setForm({ nombre: '', abreviatura: '' });
      setEditingId(null);
      setShowModal(false);
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'activo' | 'inactivo' }) =>
      unidadMedidaService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['units-full'] });
    }
  });

  const activeUnits = units.filter(u => u.estado === 'activo');
  const inactiveUnits = units.filter(u => u.estado === 'inactivo');

  const columns: TableColumn<UnidadMedida>[] = [
    { key: 'nombre', header: 'Nombre', render: (row) => <span className="font-bold text-zinc-800 dark:text-white">{row.nombre}</span> },
    { key: 'abreviatura', header: 'Abreviatura', render: (row) => <Badge label={row.abreviatura} variant="blue" /> },
    {
      key: 'acciones', header: '', align: 'right',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <Tooltip text="Editar unidad" position="top-right">
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit2 size={14} />}
              className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
              onClick={() => {
                setEditingId(row.id);
                setForm({ nombre: row.nombre, abreviatura: row.abreviatura });
                setShowModal(true);
              }}
            />
          </Tooltip>
          <Tooltip text="Desactivar unidad" position="top-right">
            <Button
              variant="ghost"
              size="sm"
              icon={<PowerOff size={14} />}
              className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
              onClick={() => statusMutation.mutate({ id: row.id, status: 'inactivo' })}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            setForm({ nombre: '', abreviatura: '' });
            setEditingId(null);
            setShowModal(true);
          }}
          icon={<Plus size={15} />}
        >
          Nueva unidad
        </Button>
      </div>

      <DataTable columns={columns} data={activeUnits} keyExtractor={(u) => u.id} emptyMessage="No hay unidades registradas." />

      {inactiveUnits.length > 0 && (
        <div className="mt-8 opacity-60">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-4 tracking-widest">Unidades inactivas</h4>
          <DataTable
            columns={[
              ...columns.filter(c => c.key !== 'acciones'),
              {
                key: 'acciones', header: '', align: 'right',
                render: (row) => (
                  <button onClick={() => statusMutation.mutate({ id: row.id, status: 'activo' })} className="text-xs text-green-600 font-bold hover:underline">
                    Reactivar
                  </button>
                )
              }
            ]}
            data={inactiveUnits}
            keyExtractor={(u) => u.id}
          />
        </div>
      )}

      {showModal && (
        <Modal title={editingId ? "Editar unidad" : "Nueva unidad"} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nombre-unidad" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nombre (ej. Kilogramos)</label>
              <input
                id="nombre-unidad"
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                value={form.nombre}
                onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="abreviatura-unidad" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Abreviatura (ej. KG)</label>
              <input
                id="abreviatura-unidad"
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition uppercase"
                value={form.abreviatura}
                onChange={(e) => setForm(prev => ({ ...prev, abreviatura: e.target.value.toUpperCase() }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="text-zinc-600 dark:text-zinc-300">Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} isLoading={saveMutation.isPending}>
              {editingId ? 'Guardar cambios' : 'Crear unidad'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
