import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Si está cargando, podemos mostrar un spinner o nada
  if (isLoading) {
    return null;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
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
