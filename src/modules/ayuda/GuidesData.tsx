import { BienvenidaGuide } from './components/BienvenidaGuide';
import { DashboardGuide } from './components/DashboardGuide';
import { ProductosGuide } from './components/ProductosGuide';
import { InventarioGuide } from './components/InventarioGuide';
import { KardexGuide } from './components/KardexGuide';
import { VentasGuide } from './components/VentasGuide';
import { PosGuide } from './components/PosGuide';
import { Caja_controlGuide } from './components/Caja_controlGuide';
import { ComprasGuide } from './components/ComprasGuide';
import { ClientesGuide } from './components/ClientesGuide';
import { UsuariosGuide } from './components/UsuariosGuide';
import { ConfiguracionGuide } from './components/ConfiguracionGuide';
import { SucursalesGuide } from './components/SucursalesGuide';
import { SincronizacionGuide } from './components/SincronizacionGuide';
import { AuditoriaGuide } from './components/AuditoriaGuide';
import { ReportesGuide } from './components/ReportesGuide';
import { LoginGuide } from './components/LoginGuide';
import {
  Book,
  LayoutDashboard,
  Tag,
  ClipboardList,
  History,
  Receipt,
  ShoppingCart,
  Truck,
  Users as UsersIcon,
  Settings,
  LogIn,
  ShieldCheck,
  CloudSync,
  UserCog,
  PieChart,
  Wallet,
  Building2
} from 'lucide-react';

export const flowSteps = [
  {
    title: 'Fase 1: Abastecimiento Crítico',
    icon: <Truck size={32} className="text-orange-500" />,
    desc: <>Todo inicia con el registro de <b>Productos</b> y sigue con el registro de las <b>Compras</b>. Al registrar el ingreso de mercadería, el sistema dispara tres acciones: incrementa el <b>Stock Actual</b> de los productos, registra el movimiento en el <b>Kardex</b> como <b>INGRESO</b> y actualiza el <b>Precio de Compra</b> en el historial para recalcular rentabilidad.</>,
    details: ['Validación de facturas de proveedor', 'Actualización masiva de inventario', 'Registro de costos históricos']
  },
  {
    title: 'Fase 2: Operación de Venta',
    icon: <MonitorIcon size={32} className="text-blue-500" />,
    desc: <>Cuando un cliente realiza una compra en la <b>Caja</b>, el sistema realiza una transacción atómica: valida existencias, emite el comprobante y genera una salida en el <b>Kardex</b>. El dinero se registra en el flujo de caja del día para el cuadre final.</>,
    details: ['Escaneo de códigos de barras', 'Cálculo automático de vueltos', 'Descuento de stock en tiempo real']
  },
  {
    title: 'Fase 3: Auditoría y Resguardo',
    icon: <HistoryIcon size={32} className="text-emerald-500" />,
    desc: <>La información fluye hacia el <b>Kardex</b>, que actúa como la verdad absoluta del inventario. El administrador revisa los reportes para detectar discrepancias. Finalmente, los datos se <b>Sincronizan</b> con la base de datos central para su respaldo y análisis global.</>,
    details: ['Conciliación de saldos físicos', 'Sincronización con sede central', 'Respaldo de base de datos local']
  }
];

// We can define custom sub-icons or maps to render these inside GuidesData
function MonitorIcon({ size, className }: { size: number; className?: string }) {
  return <LayoutDashboard size={size} className={className} />;
}
function HistoryIcon({ size, className }: { size: number; className?: string }) {
  return <History size={size} className={className} />;
}

export const detailedGuides = [
  {
    id: 'bienvenida',
    title: 'Bienvenida a MiniMarket Pro',
    icon: <Book size={20} className="text-blue-500" />,
    content: <BienvenidaGuide />
  },
  {
    id: 'login',
    title: 'Acceso al Sistema (Login)',
    icon: <LogIn size={20} className="text-blue-600" />,
    content: <LoginGuide />
  },
  {
    id: 'dashboard',
    title: 'Panel Principal (Dashboard)',
    icon: <LayoutDashboard size={20} className="text-blue-500" />,
    content: <DashboardGuide />
  },
  {
    id: 'productos',
    title: 'Gestión de Productos',
    icon: <Tag size={20} className="text-rose-500" />,
    content: <ProductosGuide />
  },
  {
    id: 'inventario',
    title: 'Control de Inventario',
    icon: <ClipboardList size={20} className="text-emerald-500" />,
    content: <InventarioGuide />
  },
  {
    id: 'kardex',
    title: 'Kardex de Movimientos',
    icon: <History size={20} className="text-amber-500" />,
    content: <KardexGuide />
  },
  {
    id: 'ventas',
    title: 'Historial de Ventas',
    icon: <Receipt size={20} className="text-cyan-500" />,
    content: <VentasGuide />
  },
  {
    id: 'pos',
    title: 'Punto de Venta (POS)',
    icon: <ShoppingCart size={20} className="text-blue-600" />,
    content: <PosGuide />
  },
  {
    id: 'caja_control',
    title: 'Control de Caja',
    icon: <Wallet size={20} className="text-emerald-500" />,
    content: <Caja_controlGuide />
  },
  {
    id: 'compras',
    title: 'Gestión de Compras',
    icon: <Truck size={20} className="text-orange-500" />,
    content: <ComprasGuide />
  },
  {
    id: 'clientes',
    title: 'Clientes y Fidelización',
    icon: <UsersIcon size={20} className="text-violet-500" />,
    content: <ClientesGuide />
  },
  {
    id: 'usuarios',
    title: 'Control de Usuarios y Seguridad',
    icon: <UserCog size={20} className="text-zinc-600" />,
    content: <UsuariosGuide />
  },
  {
    id: 'configuracion',
    title: 'Configuración del Sistema',
    icon: <Settings size={20} className="text-zinc-600" />,
    content: <ConfiguracionGuide />
  },
  {
    id: 'sucursales',
    title: 'Gestión de Sucursales',
    icon: <Building2 size={20} className="text-indigo-500" />,
    content: <SucursalesGuide />
  },
  {
    id: 'sincronizacion',
    title: 'Sincronización Multi-Sede',
    icon: <CloudSync size={20} className="text-purple-600" />,
    content: <SincronizacionGuide />
  },
  {
    id: 'auditoria',
    title: 'Auditoría de Sistemas',
    icon: <ShieldCheck size={20} className="text-red-500" />,
    content: <AuditoriaGuide />
  },
  {
    id: 'reportes',
    title: 'Reportes y Analítica',
    icon: <PieChart size={20} className="text-pink-500" />,
    content: <ReportesGuide />
  }
];
