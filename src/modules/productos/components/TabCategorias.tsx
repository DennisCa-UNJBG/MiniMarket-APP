import { useState } from 'react';
import {
  Plus,
  Edit2,
  PowerOff,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriaService, type Category } from '../categoriaService';
import { notificationService } from '../../../shared/lib/notifications';
import { Badge } from '../../../shared/components/ui/Badge';
import { Tooltip } from '../../../shared/components/ui/Tooltip';
import { Button } from '../../../shared/components/ui/Button';
import { Modal } from '../../../shared/components/ui/Modal';
import { DataTable, type TableColumn } from '../../../shared/components/ui/DataTable';

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export function TabCategorias({ onUpdate }: { onUpdate: () => void }) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', color: getRandomColor(), productCount: 0 });


  // Consulta de categorías
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriaService.getAll(false),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingId) {
        return categoriaService.update(editingId, payload.name, payload.color);
      } else {
        return categoriaService.create(payload.name, payload.color);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      notificationService.success(
        editingId ? 'Categoría actualizada' : 'Categoría creada',
        editingId ? 'Los cambios se han guardado correctamente.' : 'La categoría se ha registrado correctamente.'
      );
      setForm({ name: '', color: getRandomColor(), productCount: 0 });
      setEditingId(null);
      setShowModal(false);
      onUpdate();
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'activo' | 'inactivo' }) =>
      categoriaService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (variables.status === 'activo') {
        notificationService.success('Categoría reactivada');
      }
      onUpdate();
    }
  });



  const activeCategories = categories.filter(c => c.estado === 'activo');
  const inactiveCategories = categories.filter(c => c.estado === 'inactivo');

  const handleSave = async () => {
    if (!form.name.trim()) {
      notificationService.warning('Campo incompleto', 'Por favor, ingresa un nombre para la categoría.');
      return;
    }
    saveMutation.mutate(form);
  };

  const columns: TableColumn<Category>[] = [
    {
      key: 'color', header: 'Color',
      render: (row) => <div style={{ backgroundColor: row.color }} className="size-6 rounded-lg shadow-sm"></div>
    },
    { key: 'nombre', header: 'Nombre Categoría', render: (row) => <span className="font-bold text-zinc-800 dark:text-white">{row.nombre}</span> },
    { key: 'product_count', header: 'Productos', align: 'center', render: (row) => <Badge label={`${row.productCount || 0} items`} variant="gray" /> },
    {
      key: 'acciones', header: '', align: 'right',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <Tooltip text="Editar categoría" position="top-right">
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit2 size={14} />}
              className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
              onClick={() => {
                setEditingId(row.id);
                setForm({ name: row.nombre, color: row.color || getRandomColor(), productCount: row.productCount || 0 });
                setShowModal(true);
              }}
            />
          </Tooltip>
          <Tooltip text="Desactivar categoría" position="top-right">
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
            setForm({ name: '', color: getRandomColor(), productCount: 0 });
            setEditingId(null);
            setShowModal(true);
          }}
          icon={<Plus size={15} />}
        >
          Nueva categoría
        </Button>
      </div>

      <DataTable columns={columns} data={activeCategories} keyExtractor={(row) => row.id} emptyMessage="No hay categorías registradas." />

      {inactiveCategories.length > 0 && (
        <div className="mt-8 opacity-60">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-4 tracking-widest">Categorías inactivas</h4>
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
            data={inactiveCategories}
            keyExtractor={(row) => row.id}
          />
        </div>
      )}

      {showModal && (
        <Modal title={editingId ? "Editar categoría" : "Nueva categoría"} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nombre-categoria" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nombre de categoría</label>
              <input id="nombre-categoria" autoFocus className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="color-distintivo" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Color distintivo</label>
              <div className="flex gap-2">
                <input id="color-distintivo" type="color" className="w-12 h-10 p-1 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 cursor-pointer" value={form.color} onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))} />
                <input aria-label="Código hexadecimal de color" className="flex-1 px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100" value={form.color} onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="text-zinc-600 dark:text-zinc-300">Cancelar</Button>
            <Button onClick={handleSave} isLoading={saveMutation.isPending}>
              {editingId ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
