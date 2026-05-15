import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Truck,
  Users,
  BarChart3,
  Settings,
  MonitorPlay,
  History,
  Building2,
  UserCog,
  CloudSync,
  HelpCircle,
  Wallet,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import React from 'react';

// Importación de las páginas
import { Dashboard }     from '../modules/dashboard/Page';
import { Inventario }    from '../modules/inventario/Page';
import { Kardex }        from '../modules/kardex/Page';
import { Ventas }        from '../modules/ventas/Page';
import { Compras }       from '../modules/compras/Page';
import { Clientes }      from '../modules/clientes/Page';
import { Reportes }      from '../modules/reportes/Page';
import { Configuracion } from '../modules/configuracion/Page';
import { Productos }     from '../modules/productos/Page';
import { NuevaVenta }    from '../modules/ventas/NuevaVenta';
import { Sucursales }    from '../modules/sucursales/Page';
import { Usuarios }      from '../modules/usuarios/Page';
import { Sincronizacion } from '../modules/sincronizacion/Page';
import { Ayuda } from '../modules/ayuda/Page';
import { Caja } from '../modules/caja/Page';
import { Auditoria } from '../modules/auditoria/Page';

export interface NavItem {
  icon: LucideIcon;
  label: string;
  to: string;
  component: React.ComponentType; // El componente que se renderizará
  exact?: boolean;
  requiredPermission?: string;
}

export const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',   to: '/',            component: Dashboard,     exact: true },
  { icon: MonitorPlay,     label: 'Caja / POS',  to: '/nueva-venta', component: NuevaVenta,    requiredPermission: 'pos' },
  { icon: Wallet,          label: 'Control de Caja', to: '/caja',      component: Caja,          requiredPermission: 'ventas' },
  { icon: ShoppingCart,    label: 'Ventas',       to: '/ventas',       component: Ventas,        requiredPermission: 'ventas'     },
  { icon: Package,         label: 'Inventario',  to: '/inventario',  component: Inventario,    requiredPermission: 'inventario' },
  { icon: Tag,             label: 'Productos',   to: '/productos',   component: Productos,     requiredPermission: 'productos'  },
  { icon: Truck,           label: 'Compras',      to: '/compras',     component: Compras,       requiredPermission: 'compras'    },
  { icon: Users,           label: 'Clientes',     to: '/clientes',     component: Clientes,      requiredPermission: 'clientes'   },
  { icon: History,         label: 'Kardex',      to: '/kardex',      component: Kardex,        requiredPermission: 'kardex' },
  { icon: BarChart3,       label: 'Reportes',     to: '/reportes',    component: Reportes,      requiredPermission: 'reportes'   },
  { icon: Building2,       label: 'Sucursales',  to: '/sucursales',  component: Sucursales,    requiredPermission: 'admin' },
  { icon: UserCog,         label: 'Usuarios',    to: '/usuarios',    component: Usuarios,      requiredPermission: 'admin' },
  { icon: CloudSync,       label: 'Sincronización', to: '/sincronizacion', component: Sincronizacion, requiredPermission: 'admin' },
  { icon: ShieldCheck,     label: 'Auditoría',   to: '/auditoria',   component: Auditoria,      requiredPermission: 'admin' },
];

export const bottomNavItems: NavItem[] = [
  { icon: HelpCircle, label: 'Ayuda', to: '/ayuda', component: Ayuda },
  { icon: Settings, label: 'Configuración', to: '/configuracion', component: Configuracion, requiredPermission: 'configuracion' },
];

export const allNavItems = [...mainNavItems, ...bottomNavItems];
