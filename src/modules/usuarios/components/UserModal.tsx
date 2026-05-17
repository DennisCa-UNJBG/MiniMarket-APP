import { useState } from 'react';
import { Eye, EyeOff, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: number | null;
  formData: {
    username: string;
    password?: string;
    nombre_completo: string;
    rol_id: number;
    sucursal_id: string;
  };
  setFormData: (payload: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  roles: any[];
  sedes: any[];
}

export function UserModal({
  isOpen,
  onClose,
  editingId,
  formData,
  setFormData,
  onSubmit,
  isPending,
  roles,
  sedes
}: UserModalProps) {
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-50 dark:border-zinc-700/50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">
            {editingId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose} 
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1"
            icon={<Plus className="rotate-45" size={24} />}
          />
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
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
                onChange={(e) => setFormData((prev: any) => ({...prev, username: e.target.value.toLowerCase()}))}
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
                  value={formData.password || ''}
                  onChange={(e) => setFormData((prev: any) => ({...prev, password: e.target.value}))}
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
              onChange={(e) => setFormData((prev: any) => ({...prev, nombre_completo: e.target.value}))}
              className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="usuario-rol" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Rol</label>
              <select 
                id="usuario-rol"
                value={formData.rol_id}
                onChange={(e) => setFormData((prev: any) => ({...prev, rol_id: parseInt(e.target.value)}))}
                className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                {roles.flatMap((r: any) => r.estado === 'activo' ? [
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ] : [])}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="usuario-sede" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Sede de Trabajo</label>
              <select 
                id="usuario-sede"
                value={formData.sucursal_id}
                onChange={(e) => setFormData((prev: any) => ({...prev, sucursal_id: e.target.value}))}
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
            isLoading={isPending}
            className="py-3 mt-4 font-bold rounded-xl"
          >
            {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </form>
      </div>
    </div>
  );
}
