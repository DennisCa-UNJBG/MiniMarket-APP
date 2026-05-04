import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { allNavItems } from './config/navigation';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated, login, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <HashRouter>
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
    <ThemeProvider>
      <SidebarProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
