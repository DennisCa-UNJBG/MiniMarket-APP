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
  type LucideIcon,
} from 'lucide-react';
import React from 'react';

// Importación de las páginas
import { Dashboard }     from '../pages/Dashboard';
import { Inventario }    from '../pages/Inventario';
import { Kardex }        from '../pages/Kardex';
import { Ventas }        from '../pages/Ventas';
import { Compras }       from '../pages/Compras';
import { Clientes }      from '../pages/Clientes';
import { Reportes }      from '../pages/Reportes';
import { Configuracion } from '../pages/Configuracion';
import { Productos }     from '../pages/Productos';
import { NuevaVenta }    from '../pages/NuevaVenta';
import { Sucursales }    from '../pages/Sucursales';
import { Usuarios }      from '../pages/Usuarios';
import { Sincronizacion } from '../pages/Sincronizacion';

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
  { icon: Package,         label: 'Inventario',  to: '/inventario',  component: Inventario,    requiredPermission: 'inventario' },
  { icon: History,         label: 'Kardex',      to: '/kardex',      component: Kardex,        requiredPermission: 'kardex' },
  { icon: Tag,             label: 'Productos',   to: '/productos',   component: Productos,     requiredPermission: 'productos'  },
  { icon: Building2,       label: 'Sucursales',  to: '/sucursales',  component: Sucursales,    requiredPermission: 'admin' },
  { icon: UserCog,         label: 'Usuarios',    to: '/usuarios',    component: Usuarios,      requiredPermission: 'admin' },
  { icon: CloudSync,       label: 'Sincronización', to: '/sincronizacion', component: Sincronizacion, requiredPermission: 'admin' },
  { icon: ShoppingCart,    label: 'Ventas',       to: '/ventas',       component: Ventas,        requiredPermission: 'ventas'     },
  { icon: Truck,           label: 'Compras',      to: '/compras',     component: Compras,       requiredPermission: 'compras'    },
  { icon: Users,           label: 'Clientes',     to: '/clientes',     component: Clientes,      requiredPermission: 'clientes'   },
  { icon: BarChart3,       label: 'Reportes',     to: '/reportes',    component: Reportes,      requiredPermission: 'reportes'   },
];

export const bottomNavItems: NavItem[] = [
  { icon: Settings, label: 'Configuración', to: '/configuracion', component: Configuracion, requiredPermission: 'configuracion' },
];

export const allNavItems = [...mainNavItems, ...bottomNavItems];
