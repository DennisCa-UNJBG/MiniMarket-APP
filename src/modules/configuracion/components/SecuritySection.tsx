import { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { authService } from '../../login/Service';
import { notificationService } from '../../../shared/lib/notifications';
import { Button } from '../../../shared/components/ui/Button';

function PasswordField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (val: string) => void; placeholder?: string }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400"
          title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          icon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        />
      </div>
    </div>
  );
}

export function SecuritySection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [securityData, setSecurityData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (password: string) => authService.updatePassword(user!.id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notificationService.success('Contraseña Actualizada', 'Tu acceso ha sido actualizado correctamente.');
      setSecurityData({ newPassword: '', confirmPassword: '' });
    }
  });

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!securityData.newPassword) {
      notificationService.warning('Campo Incompleto', 'Debes ingresar la nueva contraseña.');
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      notificationService.error('Error', 'Las nuevas contraseñas no coinciden.');
      return;
    }

    if (securityData.newPassword.length < 4) {
      notificationService.warning('Contraseña muy corta', 'La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    updatePasswordMutation.mutate(securityData.newPassword);
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6 border-b border-zinc-50 dark:border-zinc-700/50 bg-zinc-50/30 dark:bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-white tracking-tight">Seguridad y Acceso</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Gestiona tus credenciales de administrador.</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="config-usuario" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Usuario</label>
              <input id="config-usuario" disabled value={user?.username || 'admin'} className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="config-rol" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Rol del Sistema</label>
              <input id="config-rol" disabled value={user?.rol_id === 1 ? 'Administrador' : 'Cajero'} className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed" />
            </div>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordField label="Nueva Contraseña" value={securityData.newPassword} onChange={val => setSecurityData(prev => ({ ...prev, newPassword: val }))} placeholder="Nueva clave" />
              <PasswordField label="Confirmar Nueva" value={securityData.confirmPassword} onChange={val => setSecurityData(prev => ({ ...prev, confirmPassword: val }))} placeholder="Repite clave" />
            </div>
          </div>
          <Button
            type="submit"
            isLoading={updatePasswordMutation.isPending}
            className="w-full sm:w-auto px-6 py-2.5 font-bold rounded-2xl bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-900 text-white"
          >
            Actualizar Credenciales
          </Button>
        </form>
      </div>
    </div>
  );
}
