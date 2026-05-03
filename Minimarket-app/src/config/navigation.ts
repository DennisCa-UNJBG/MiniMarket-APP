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
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  icon: LucideIcon;
  label: string;
  to: string;
  exact?: boolean;
}

export const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',   to: '/',            exact: true },
  { icon: MonitorPlay,     label: 'Caja / POS',  to: '/nueva-venta' },
  { icon: Package,         label: 'Inventario',  to: '/inventario' },
  { icon: Tag,             label: 'Productos',   to: '/productos'  },
  { icon: ShoppingCart,    label: 'Ventas',       to: '/ventas'     },
  { icon: Truck,           label: 'Compras',      to: '/compras'    },
  { icon: Users,           label: 'Clientes',     to: '/clientes'   },
  { icon: BarChart3,       label: 'Reportes',     to: '/reportes'   },
];

export const bottomNavItems: NavItem[] = [
  { icon: Settings, label: 'Configuración', to: '/configuracion' },
];
