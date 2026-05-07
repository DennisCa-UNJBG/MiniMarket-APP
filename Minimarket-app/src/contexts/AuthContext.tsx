import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { UserData } from '../services/authService';
import { preferenciasService } from '../services/preferenciasService';
import { notificationService } from '../lib/notifications';

interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  login: (userData: UserData) => void;
  logout: () => void;
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

    const prefs = preferenciasService.get();
    if (!prefs.enableAutoLogout) return;

    let timeoutId: number;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      // Convertir minutos a milisegundos
      const ms = prefs.inactivityTimeout * 60 * 1000;
      
      timeoutId = window.setTimeout(() => {
        logout();
        notificationService.info('Seguridad', 'Tu sesión se ha cerrado por inactividad.');
      }, ms);
    };

    // Eventos que reinician el temporizador
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Iniciar el primer temporizador
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  const login = (userData: UserData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
