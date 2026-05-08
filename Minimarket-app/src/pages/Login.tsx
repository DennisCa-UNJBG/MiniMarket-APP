import { useState, useEffect, useRef } from 'react';
import { Package2, Lock, User, ArrowRight } from 'lucide-react';
import { authService, type UserData } from '../services/authService';
import { notificationService } from '../lib/notifications';
import { AuthError, ConnectionError } from '../lib/errors';

import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

import { ThemeToggle } from '../components/ui/ThemeToggle';

interface LoginProps {
  onLogin: (user: UserData) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enfocar el input de cuenta al montar el componente
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const userData = await authService.login(account, password);
      onLogin(userData);
    } catch (error) {
      if (error instanceof AuthError) {
        notificationService.error('Credenciales inválidas', 'El usuario o la contraseña son incorrectos, o la cuenta está inactiva.');
      } else if (error instanceof ConnectionError) {
        notificationService.error('Error de conexión', 'No se pudo conectar a la base de datos local.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
      {/* ── Elementos decorativos de fondo ──────────────────────────────────── */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-violet-500/20 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* ── Contenedor Principal ────────────────────────────────────────────── */}
      <div className="relative w-full max-w-5xl h-[600px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/50 flex z-10 m-4">
        
        {/* Lado Izquierdo: Branding y Decoración (Oculto en móviles) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-violet-700 p-12 flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
              <Package2 size={28} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">MiniMarket Pro</span>
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-4 leading-tight">
              Gestiona tu inventario con <span className="text-indigo-200">inteligencia</span>.
            </h2>
            <p className="text-indigo-100/80 text-lg max-w-sm">
              Control total de tus ventas, compras y productos desde una sola plataforma.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-sm text-indigo-200/80">
            <span>© 2026 Sistema de Inventario</span>
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
            <span>Versión 1.0.0</span>
          </div>
        </div>

        {/* Lado Derecho: Formulario de Login */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 md:p-16 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-8">
            
            {/* Cabecera Móvil */}
            <div className="flex items-center justify-between mb-8">
              {/* Logo visible solo en móvil (en escritorio ya está a la izquierda) */}
              <div className="flex lg:hidden items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl">
                  <Package2 size={24} className="text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">MiniMarket Pro</span>
              </div>
              
              {/* Espaciador para escritorio */}
              <div className="hidden lg:block"></div>

              <ThemeToggle />
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Bienvenido de nuevo</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Ingresa tus credenciales para acceder al sistema.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <Input
                label="Cuenta"
                placeholder="Usuario de personal"
                icon={<User size={18} />}
                required
                ref={inputRef}
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              />

              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={18} />}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button
                type="submit"
                isLoading={isLoading}
                fullWidth
                size="lg"
                className="mt-2"
                icon={<ArrowRight size={18} />}
                iconPosition="right"
              >
                Ingresar al sistema
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Solo personal autorizado.</p>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
