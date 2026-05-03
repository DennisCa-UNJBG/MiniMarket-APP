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
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <HashRouter>
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
        </HashRouter>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
