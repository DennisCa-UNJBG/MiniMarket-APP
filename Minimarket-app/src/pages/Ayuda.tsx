import { 
  HelpCircle, Lightbulb, Monitor, 
  PieChart, MessageSquare,
  LayoutDashboard,
  Package, History, Tag, Building2, UserCog, CloudSync,
  ShoppingCart, Truck, Users as UsersIcon, Settings,
  CheckCircle2, Info
} from 'lucide-react';

export function Ayuda() {
  const views = [
    {
      title: 'Dashboard (Panel Central)',
      icon: <LayoutDashboard size={24} className="text-indigo-500" />,
      desc: 'Es el cerebro visual del negocio. Aquí puede monitorear en tiempo real las ventas totales del día, el flujo de caja y recibir alertas críticas sobre productos que están por agotarse (Stock Bajo). Incluye gráficas comparativas de los últimos 7 días para identificar tendencias de venta.'
    },
    {
      title: 'Caja / POS (Nueva Venta)',
      icon: <Monitor size={24} className="text-blue-500" />,
      desc: 'Interfaz optimizada para la atención al cliente. Permite la búsqueda ultra-rápida por código de barras o nombre. Gestiona el carrito de compras, aplica cálculos de IGV (opcional), procesa múltiples métodos de pago (Efectivo, Tarjeta, Yape) y emite comprobantes electrónicos en formato PDF.'
    },
    {
      title: 'Inventario y Existencias',
      icon: <Package size={24} className="text-emerald-500" />,
      desc: 'Muestra la lista completa de productos y su disponibilidad física. Permite realizar ajustes directos de stock (solo admin), filtrar por categorías y exportar el listado completo. Es la herramienta principal para auditorías rápidas de almacén.'
    },
    {
      title: 'Kardex de Movimientos',
      icon: <History size={24} className="text-amber-500" />,
      desc: 'El registro histórico inmutable. Cada vez que una unidad entra o sale (por venta, compra o ajuste), el Kardex guarda el rastro: qué producto fue, qué usuario lo hizo, la cantidad, el saldo posterior y la referencia del documento. Vital para detectar pérdidas o errores humanos.'
    },
    {
      title: 'Gestión de Productos',
      icon: <Tag size={24} className="text-rose-500" />,
      desc: 'Catálogo maestro donde se definen las propiedades de cada artículo. Puede configurar códigos de barras únicos, unidades de medida, categorías personalizadas y los precios de venta. También permite activar o desactivar productos según la temporada.'
    },
    {
      title: 'Historial de Ventas',
      icon: <ShoppingCart size={24} className="text-cyan-500" />,
      desc: 'Un archivo detallado de todas las operaciones realizadas. Permite buscar ventas por fecha o número de ticket, visualizar los detalles de qué productos se llevaron, reimprimir comprobantes para clientes y realizar anulaciones de transacciones erróneas.'
    },
    {
      title: 'Gestión de Compras',
      icon: <Truck size={24} className="text-orange-500" />,
      desc: 'Módulo para registrar el abastecimiento de proveedores. Al ingresar una compra con su número de factura, el sistema actualiza automáticamente el stock físico y registra el nuevo costo unitario en el historial de precios, manteniendo sus márgenes de ganancia actualizados.'
    },
    {
      title: 'Clientes y Fidelización',
      icon: <UsersIcon size={24} className="text-violet-500" />,
      desc: 'Base de datos para gestionar a sus compradores habituales. Guarde sus datos fiscales (DNI/RUC) para agilizar la emisión de comprobantes personalizados y mantenga un registro de sus preferencias de compra.'
    },
    {
      title: 'Reportes y Analítica',
      icon: <PieChart size={24} className="text-pink-500" />,
      desc: 'Transforma los datos en decisiones. Visualice el ranking de los productos más rentables, el rendimiento mensual de ingresos y la eficiencia de sus cajeros. Los reportes pueden filtrarse por fechas y sedes para un análisis pormenorizado.'
    },
    {
      title: 'Sucursales (Multi-Sede)',
      icon: <Building2 size={24} className="text-slate-500" />,
      desc: 'Control centralizado de múltiples locales. Defina códigos únicos para cada tienda, gestione sus direcciones y supervise el estado de cada sucursal desde una sola interfaz administrativa.'
    },
    {
      title: 'Control de Usuarios',
      icon: <UserCog size={24} className="text-blue-600" />,
      desc: 'Gestión de seguridad y personal. Cree perfiles para sus cajeros y administradores con contraseñas encriptadas. Controle quién tiene acceso a funciones críticas como la eliminación de registros o la edición de precios.'
    },
    {
      title: 'Sincronización Cloud',
      icon: <CloudSync size={24} className="text-purple-600" />,
      desc: 'Puente de datos con el servidor central. Permite que las ventas locales se suban a la nube de forma segura para que el administrador general pueda ver el estado de todas las tiendas desde cualquier lugar del mundo.'
    },
    {
      title: 'Configuración y Ajustes',
      icon: <Settings size={24} className="text-gray-600" />,
      desc: 'Personalice su experiencia. Configure los datos de su negocio (RUC, logo, dirección), gestione las impresoras y defina los parámetros generales de funcionamiento del sistema.'
    }
  ];

  const flowSteps = [
    {
      title: 'Fase 1: Abastecimiento Crítico',
      icon: <Truck size={32} className="text-orange-500" />,
      desc: 'Todo inicia con el registro de **Productos** y sigue con el registro de las **Compras**. Al registrar el ingreso de mercadería, el sistema dispara tres acciones: incrementa el **Stock Actual** de los productos, registra el movimiento en el **Kardex** como "INGRESO" y actualiza el **Precio de Compra** en el historial para recalcular rentabilidad.',
      details: ['Validación de facturas de proveedor', 'Actualización masiva de inventario', 'Registro de costos históricos']
    },
    {
      title: 'Fase 2: Operación de Venta',
      icon: <Monitor size={32} className="text-blue-500" />,
      desc: 'Cuando un cliente realiza una compra en la **Caja**, el sistema realiza una transacción atómica: valida existencias, emite el comprobante y genera una salida en el **Kardex**. El dinero se registra en el flujo de caja del día para el cuadre final.',
      details: ['Escaneo de códigos de barras', 'Cálculo automático de vueltos', 'Descuento de stock en tiempo real']
    },
    {
      title: 'Fase 3: Auditoría y Resguardo',
      icon: <History size={32} className="text-emerald-500" />,
      desc: 'La información fluye hacia el **Kardex**, que actúa como la verdad absoluta del inventario. El administrador revisa los reportes para detectar discrepancias. Finalmente, los datos se **Sincronizan** con la base de datos central para su respaldo y análisis global.',
      details: ['Conciliación de saldos físicos', 'Sincronización con sede central', 'Respaldo de base de datos local']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-6">
      {/* Hero Section */}
      <header className="relative py-16 px-8 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex p-4 bg-indigo-600 rounded-2xl shadow-xl mb-4">
            <HelpCircle size={40} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Manual de Usuario Integral
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-3xl mx-auto">
            Explore a detalle el funcionamiento de cada módulo y entienda cómo MiniMarket Pro gestiona la información de su negocio de principio a fin.
          </p>
        </div>
      </header>

      {/* Flujo de Información - CARDS DETALLADAS */}
      <section className="space-y-10">
        <div className="flex items-center gap-3 px-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <Info className="text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Flujo de Trabajo Detallado</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {flowSteps.map((step, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 p-8 flex flex-col gap-6 group">
              <div className="flex items-center justify-between">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <span className="text-4xl font-black text-gray-100 dark:text-gray-700/50">0{idx + 1}</span>
              </div>
              <div className="space-y-4 flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                  {step.desc}
                </p>
              </div>
              <div className="space-y-2 pt-4 border-t border-gray-50 dark:border-gray-700">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Acciones clave:</p>
                {step.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Directorio de Vistas - GRID DE CARDS */}
      <section className="space-y-10">
        <div className="flex items-center gap-3 px-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Monitor className="text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Explorador de Módulos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
          {views.map((view, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                  {view.icon}
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{view.title}</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {view.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Soporte y Ayuda */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Lightbulb size={200} />
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <h2 className="text-4xl font-black">¿Necesita asistencia experta?</h2>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Nuestro equipo de soporte está disponible para ayudarle con la configuración técnica de sus sedes, problemas de red o personalización de comprobantes.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                <p className="text-xs opacity-70">Email Oficial</p>
                <p className="font-bold">soporte@minimarketpro.com</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                <p className="text-xs opacity-70">Soporte Técnico</p>
                <p className="font-bold">+51 900 000 000</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare size={24} />
              Preguntas Rápidas
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                <p className="font-bold mb-1">¿Cómo actualizo mi stock físico?</p>
                <p className="text-sm opacity-80">Hágalo desde el módulo de Compras para mantener el rastro histórico, o use Ajustes en Inventario para correcciones menores.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                <p className="font-bold mb-1">¿Mis datos están seguros sin internet?</p>
                <p className="text-sm opacity-80">Sí, toda la información se guarda localmente en una base de datos encriptada en su equipo. La red solo es necesaria para sincronizar sedes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center pt-8 border-t border-gray-100 dark:border-gray-800">
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          MiniMarket Pro v1.0.0 • Manual de Usuario Detallado • 2026
        </p>
      </footer>
    </div>
  );
}
