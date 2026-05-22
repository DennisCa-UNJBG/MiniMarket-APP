import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sucursalService } from '../Service';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { notificationService } from '../../../shared/lib/notifications';
import { Button } from '../../../shared/components/ui/Button';

interface SedeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSede: any | null;
}

export function SedeModal({ isOpen, onClose, editingSede }: SedeModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(() => ({
    codigo: editingSede?.codigo || '',
    nombre: editingSede?.nombre || '',
    direccion: editingSede?.direccion || '',
    estado: editingSede?.estado || 'activo'
  }));

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingSede?.id) {
        return sucursalService.update(editingSede.id, data, user?.id || 1);
      } else {
        return sucursalService.create(data, user?.id || 1);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedes'] });
      notificationService.success(
        editingSede?.id ? 'Sucursal Actualizada' : 'Sucursal Registrada',
        editingSede?.id ? 'Los cambios se guardaron correctamente.' : 'La nueva sucursal ha sido creada.'
      );
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-zinc-50 dark:border-zinc-700/50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">
            {editingSede?.id ? 'Editar Sucursal' : 'Registrar Nueva Sucursal'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1"
            icon={<Plus className="rotate-45" size={24} />}
          />
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="codigo-sucursal" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Código Único (Llave de Acceso)</label>
            <input
              id="codigo-sucursal"
              required
              disabled={!!editingSede?.id}
              type="text"
              placeholder="Ej: SEDE-SUR-01"
              value={formData.codigo}
              onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
              className={`w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${editingSede?.id ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800' : ''}`}
            />
            {editingSede?.id && (
              <p className="text-[9px] text-amber-500 ml-1 font-bold italic">La llave de acceso no se puede modificar.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="nombre-sucursal" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Nombre de la Sucursal</label>
            <input
              id="nombre-sucursal"
              required
              type="text"
              placeholder="Ej: Sucursal Av. Ejercito"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="direccion-sucursal" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Dirección (Opcional)</label>
            <input
              id="direccion-sucursal"
              type="text"
              placeholder="Av. Principal 456..."
              value={formData.direccion}
              onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={saveMutation.isPending}
            className="py-3 mt-4 font-bold rounded-2xl"
          >
            {editingSede?.id ? 'Guardar Cambios' : 'Registrar y Generar Acceso'}
          </Button>
        </form>
      </div>
    </div>
  );
}
