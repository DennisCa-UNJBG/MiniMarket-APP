import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { systemConfigService } from '../../../modules/configuracion/systemConfigService';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  path?: string;
}

export function ProtectedRoute({ children, requiredPermission, path }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: config } = useQuery({
    queryKey: ['sucursal-config'],
    queryFn: () => systemConfigService.getConfig(),
    enabled: isAuthenticated
  });

  const { data: isCentral = false } = useQuery({
    queryKey: ['server-status'],
    queryFn: () => invoke<boolean>('is_server_running'),
    enabled: isAuthenticated
  });

  // Si está cargando, podemos mostrar un spinner o nada
  if (isLoading) {
    return null;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isBranchMode = !!config?.api_url_central && !isCentral;

  // Bloquear vistas específicas en modo sucursal
  if (isBranchMode && (path === '/usuarios' || path === '/sincronizacion' || path === '/sucursales')) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-6 text-center animate-in fade-in duration-300">
        <div className="size-20 bg-amber-50 dark:bg-amber-900/10 rounded-full flex items-center justify-center mb-6 border border-amber-100 dark:border-amber-900/30">
          <ShieldAlert size={40} className="text-amber-500 dark:text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-white mb-2">Acceso Restringido</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8 text-sm leading-relaxed">
          Esta vista está deshabilitada porque la aplicación se encuentra configurada en <strong>Modo Sucursal</strong>.
        </p>
        <Button onClick={() => window.location.hash = '#/'} variant="primary" className="rounded-xl px-6">
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  // Lógica de permisos
  const hasPermission = () => {
    if (!requiredPermission) return true;
    if (!user || !user.permisos) return false;
    
    // El permiso '*' otorga acceso total (usado por Administradores)
    if (user.permisos.includes('*')) return true;
    
    // Verificar si tiene el permiso específico
    return user.permisos.includes(requiredPermission);
  };

  // Si tiene un permiso requerido y el usuario no lo cumple
  if (!hasPermission()) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-6 text-center">
        <div className="size-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert size={40} className="text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white mb-2">Acceso Denegado</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
          Lo sentimos, no tienes los permisos necesarios para acceder a esta sección. 
          Contacta con el administrador si crees que esto es un error.
        </p>
        <Button onClick={() => window.location.hash = '#/'} variant="primary">
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  // Si todo está bien, renderizar los hijos
  return <>{children}</>;
}
