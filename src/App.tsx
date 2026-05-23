import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ThemeProvider } from './shared/contexts/ThemeContext';
import { SidebarProvider } from './shared/contexts/SidebarContext';
import { allNavItems } from './config/navigation';
import { ProtectedRoute } from './shared/components/auth/ProtectedRoute';
import { MainLayout } from './shared/layouts/MainLayout';
import { Login } from './modules/login/Page';
import { AuthProvider, useAuth } from './shared/contexts/AuthContext';
import { notificationService } from './shared/lib/notifications';
import { ConnectionError } from './shared/lib/errors';
import { useGlobalShortcuts } from './shared/hooks/useGlobalShortcuts';
import { GlobalBrightnessOverlay } from './shared/hooks/useGlobalBrightnessOverlay';

function GlobalShortcutsHandler() {
  useGlobalShortcuts();
  return null;
}

// Configuración de TanStack Query con manejo de errores global
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      console.error('Global Query Error:', error);
      if (error instanceof ConnectionError) {
        notificationService.error(
          'Error de Conexión',
          'No se pudo conectar a la base de datos local. Verifica la instalación.'
        );
      } else {
        notificationService.error(
          'Error de Datos',
          error.message || 'Ocurrió un error al cargar los datos.'
        );
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      console.error('Global Mutation Error:', error);
      if (error instanceof ConnectionError) {
        notificationService.error(
          'Error de Conexión',
          'No se pudo conectar a la base de datos. La operación no se guardó.'
        );
      } else {
        notificationService.error(
          'Error de Operación',
          error.message || 'No se pudo completar la acción solicitada.'
        );
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AppContent() {
  const { isAuthenticated, login, isLoading } = useAuth();

    // Autoinicio del Servidor Central si la preferencia está activa
  useEffect(() => {
    const shouldAutoStart = localStorage.getItem('central_server_auto_start') === 'true';
    if (shouldAutoStart) {
      invoke<boolean>('toggle_server', { active: true })
        .then((started) => {
          if (started) {
            console.log('Servidor Central autoiniciado con éxito.');
          }
        })
        .catch((err) => {
          console.error('Error al autoiniciar el Servidor Central:', err);
        });
    }
  }, []);

  // Escuchar errores fatales del servidor central emitidos desde Rust
  useEffect(() => {
    const unlisten = listen<string>('server-error', (event) => {
      notificationService.error(
        '⚠️ Error del Servidor Central',
        event.payload || 'El servidor encontró un error inesperado y se detuvo.'
      );
      // Sincronizar el estado del botón toggle con la realidad
      queryClient.invalidateQueries({ queryKey: ['server-status'] });
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);


  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="size-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <GlobalShortcutsHandler />
      {!isAuthenticated ? (
        <Login onLogin={login} />
      ) : (
        <MainLayout>
          <Routes>
            {allNavItems.map((item) => (
              <Route
                key={item.to}
                path={item.to}
                element={
                  <ProtectedRoute requiredPermission={item.requiredPermission}>
                    <item.component />
                  </ProtectedRoute>
                }
              />
            ))}
          </Routes>
        </MainLayout>
      )}
    </HashRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SidebarProvider>
          <AuthProvider>
            <GlobalBrightnessOverlay />
            <AppContent />
          </AuthProvider>
        </SidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
