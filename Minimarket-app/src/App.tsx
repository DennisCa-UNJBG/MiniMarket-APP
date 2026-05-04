import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard }     from './pages/Dashboard';
import { Inventario }    from './pages/Inventario';
import { Ventas }        from './pages/Ventas';
import { Compras }       from './pages/Compras';
import { Clientes }      from './pages/Clientes';
import { Reportes }      from './pages/Reportes';
import { Configuracion } from './pages/Configuracion';
import { Productos }     from './pages/Productos';
import { NuevaVenta }    from './pages/NuevaVenta';
import { Login }         from './pages/Login';
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
            <Route path="/"              element={<Dashboard />}     />
            <Route path="/inventario"    element={<Inventario />}    />
            <Route path="/productos"     element={<Productos />}     />
            <Route path="/nueva-venta"   element={<NuevaVenta />}    />
            <Route path="/ventas"        element={<Ventas />}        />
            <Route path="/compras"       element={<Compras />}       />
            <Route path="/clientes"      element={<Clientes />}      />
            <Route path="/reportes"      element={<Reportes />}      />
            <Route path="/configuracion" element={<Configuracion />} />
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
