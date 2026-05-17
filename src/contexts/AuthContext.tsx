import { createContext, use, useState, ReactNode, useEffect } from 'react';
import type { UserData } from '../modules/login/Service';
import { preferenciasService } from '../modules/configuracion/preferenciasService';
import { notificationService } from '../lib/notifications';
import { logService } from '../lib/logService';

interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  login: (userData: UserData) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error al cargar usuario de localStorage", e);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Lógica de Cierre de Sesión Automático por Inactividad
  useEffect(() => {
    if (!user) return;

    // @ts-ignore
    window.__lastActivityTime = Date.now();
    
    // Eventos que reinician el temporizador
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Solo actualizamos el timestamp global si ha pasado al menos 1 segundo
    // para no sobrecargar el CPU con eventos como mousemove
    const updateActivity = () => {
      const now = Date.now();
      // @ts-ignore
      if (now - (window.__lastActivityTime || 0) > 1000) {
        // @ts-ignore
        window.__lastActivityTime = now;
      }
    };

    let currentPrefs = preferenciasService.get();
    const handlePrefsUpdate = () => {
      currentPrefs = preferenciasService.get();
    };

    const checkInactivity = () => {
      if (!currentPrefs.enableAutoLogout) return;
      
      // @ts-ignore
      const lastActivity = window.__lastActivityTime;
      const timeoutMs = currentPrefs.inactivityTimeout * 60 * 1000;
      
      if (Date.now() - lastActivity >= timeoutMs) {
        logout().catch(console.error);
        notificationService.info('Seguridad', 'Tu sesión se ha cerrado por inactividad.');
      }
    };

    // Comprobar la inactividad cada segundo de manera robusta
    const intervalId = setInterval(checkInactivity, 1000);

    // Escuchar eventos pasivamente para mejor rendimiento
    events.forEach(event => document.addEventListener(event, updateActivity, { passive: true }));
    window.addEventListener('preferences-updated', handlePrefsUpdate);

    return () => {
      clearInterval(intervalId);
      events.forEach(event => document.removeEventListener(event, updateActivity));
      window.removeEventListener('preferences-updated', handlePrefsUpdate);
    };
  }, [user]);

  const login = (userData: UserData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    if (user) {
      try {
        await logService.register({
          usuario_id: user.id,
          accion: 'LOGOUT',
          tabla: 'usuarios',
          registro_id: user.id,
          detalles: `El usuario ${user.username} ha cerrado sesión.`
        });
      } catch (e) {
        console.error("Error al registrar log de logout:", e);
      }
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = use(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
