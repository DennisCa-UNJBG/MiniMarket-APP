import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { allNavItems } from './config/navigation';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './modules/login/Page';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { notificationService } from './lib/notifications';
import { ConnectionError } from './lib/errors';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { GlobalBrightnessOverlay } from './hooks/useGlobalBrightnessOverlay';

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
