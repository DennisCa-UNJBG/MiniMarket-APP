import { useState } from 'react';
import { 
  HelpCircle, Lightbulb, Monitor, 
  PieChart, MessageSquare,
  LayoutDashboard,
  History, Tag, UserCog, CloudSync,
  ShoppingCart, Truck, Users as UsersIcon, Settings,
  CheckCircle2, Info, ChevronDown, ChevronRight, Book, Receipt, LogIn, ClipboardList, AlertCircle, FileText, Plus, ShieldCheck
} from 'lucide-react';

export function Ayuda() {
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

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

  const detailedGuides = [
    {
      id: 'bienvenida',
      title: '00. Bienvenida a MiniMarket Pro',
      icon: <Book size={20} className="text-indigo-500" />,
      content: (
        <div className="space-y-6">
          <p>¡Bienvenido al manual detallado de <strong>MiniMarket Pro</strong>!</p>
          <p>Este conjunto de guías ha sido diseñado para proporcionarte una explicación exhaustiva de cada módulo del sistema. Aquí encontrarás no solo qué hace cada vista, sino cómo utilizarla paso a paso para maximizar la eficiencia de tu negocio.</p>
          
          <div className="space-y-3">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Info size={16} className="text-indigo-500" />
              🗂️ Estructura del Manual
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">El manual está dividido en 14 capítulos que cubren desde el Dashboard hasta el sistema de Sincronización y Reportes, organizados para un aprendizaje progresivo.</p>
          </div>

          <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800 space-y-4">
            <h4 className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2 text-sm uppercase tracking-widest">
              <Lightbulb size={16} />
              Consejos Generales de Navegación
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>Menú Lateral:</strong> Utiliza la barra lateral para moverte rápidamente entre los módulos.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>Modo Oscuro/Claro:</strong> El sistema se adapta a tu preferencia visual desde la esquina superior.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>Búsqueda Inteligente:</strong> La mayoría de las tablas incluyen un buscador que filtra por múltiples campos simultáneamente.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>Atajos de Teclado:</strong> En el Punto de Venta, enfócate en el campo de búsqueda para usar tu escáner de códigos de barras sin interrupciones.</span>
              </li>
            </ul>
          </div>
          <p className="text-xs italic text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4 text-center">MiniMarket Pro - Gestión Inteligente para tu Negocio.</p>
        </div>
      )
    },
    {
      id: 'dashboard',
      title: '01. Panel Principal (Dashboard)',
      icon: <LayoutDashboard size={20} className="text-blue-500" />,
      content: (
        <div className="space-y-6">
          <p>El <strong>Dashboard</strong> es la vista predeterminada al ingresar al sistema. Su objetivo es proporcionarte una visión panorámica y en tiempo real del estado de tu negocio.</p>
          
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 pb-2">
              <LayoutDashboard size={16} className="text-blue-500" />
              Secciones del Dashboard
            </h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h5 className="font-bold text-xs text-blue-600 mb-2">1. Tarjetas de Indicadores Clave (KPIs)</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Resumen de la operación diaria y mensual: <strong>Productos en Stock</strong> (ítems únicos), <strong>Ventas de hoy</strong> (monto acumulado), <strong>Compras del día</strong> e <strong>Ingresos del mes</strong>.</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h5 className="font-bold text-xs text-blue-600 mb-2">2. Alertas de Sede Incompleta</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Banner de advertencia ámbar que aparece si falta configurar datos legales como RUC o Razón Social. Es <strong>crucial</strong> completar esta información para la validez de tus boletas.</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h5 className="font-bold text-xs text-blue-600 mb-2">3. Gráfico de Ventas Semanal</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Visualización interactiva que muestra la tendencia de tus ingresos en los últimos 7 días, permitiéndote identificar los días de mayor demanda.</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h5 className="font-bold text-xs text-blue-600 mb-2">4. Alertas de Stock Bajo</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Panel crítico que lista los productos que han caído por debajo de su <strong>Stock Mínimo</strong>. Haz clic para ir al módulo de compras.</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h5 className="font-bold text-xs text-blue-600 mb-2">5. Actividad Reciente</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Historial cronológico de las últimas transacciones (número de ticket, fecha/hora y monto). Usa "Ver Todo" para navegar al historial completo.</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 space-y-3">
            <h4 className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 text-sm uppercase tracking-widest">
              <Settings size={16} />
              Cómo usar esta vista
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li><strong>Revisión Matutina:</strong> Verifica productos en stock y alertas para planificar el día.</li>
              <li><strong>Monitoreo en Vivo:</strong> Observa cómo sube el indicador de ventas durante la jornada.</li>
              <li><strong>Análisis de Tendencias:</strong> Al final de la semana, utiliza el gráfico para medir el éxito de promociones o cambios de horario.</li>
            </ol>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400"><strong>TIP:</strong> Si ves una alerta de Stock Bajo, no esperes a que llegue a cero. Realiza la compra de reposición inmediatamente para no perder ventas.</p>
          </div>
        </div>
      )
    },
    {
      id: 'productos',
      title: '02. Gestión de Productos',
      icon: <Tag size={20} className="text-rose-500" />,
      content: (
        <div className="space-y-6">
          <p>El módulo de <strong>Productos</strong> es el corazón de tu inventario. Aquí defines qué vendes, a qué precio y cómo se clasifica.</p>
          
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 pb-2">
              <Tag size={16} className="text-rose-500" />
              Pestañas del Módulo
            </h4>
            <div className="grid grid-cols-1 gap-4 text-xs">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <span className="font-bold text-rose-600 block mb-2">1. Pestaña de Productos:</span>
                <ul className="space-y-1 list-disc list-inside text-gray-500 dark:text-gray-400">
                  <li><strong>Búsqueda:</strong> Filtra por nombre o código de barras.</li>
                  <li><strong>Nuevo Producto:</strong> Genera códigos correlativos automáticos (ej. PROD-0005).</li>
                  <li><strong>Editar:</strong> Modifica precios, nombres o categorías.</li>
                  <li><strong>Desactivar:</strong> Oculta del POS pero mantiene historial.</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <span className="font-bold text-rose-600 block mb-2">2. Pestaña de Categorías:</span>
                <p className="text-gray-500 dark:text-gray-400">Organiza por familias (Lácteos, Limpieza). Asigna colores únicos para identificación visual en el POS y consulta el contador de productos por categoría.</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <span className="font-bold text-rose-600 block mb-2">3. Pestaña de Unidades de Medida:</span>
                <p className="text-gray-500 dark:text-gray-400">Define cómo cuantificas (Kilogramos, Unidades, Litros). Es esencial para que el stock se muestre correctamente (ej. "50 KG" vs "50 Unidades").</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/30 space-y-4">
            <h4 className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2 text-sm uppercase tracking-widest">
              <Plus size={16} />
              Paso a Paso: Registrar Nuevo Producto
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li>Haz clic en <strong>"+ Nuevo producto"</strong>.</li>
              <li>Escribe la <strong>Unidad de Medida</strong> (ej. "Kilo") y selecciónala.</li>
              <li>Ingresa el <strong>Nombre comercial</strong> (ej. "Arroz Costeño Extra 1kg").</li>
              <li>Elige la <strong>Categoría</strong> y define el <strong>Precio de Venta</strong>.</li>
              <li>Configura el <strong>Stock Mínimo</strong> de alerta.</li>
              <li>Guarda los cambios.</li>
            </ol>
          </div>

          <div className="space-y-2">
             <h5 className="font-bold text-xs uppercase tracking-tighter text-gray-400">Reactivación de Productos</h5>
             <p className="text-[10px] leading-relaxed text-gray-500">Si desactivaste un producto por error, ve al final de la tabla de productos a la sección <strong>"Productos desactivados"</strong> para restaurarlo.</p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
            <AlertCircle size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 dark:text-indigo-400"><strong>IMPORTANTE:</strong> Se recomienda usar el código de barras real del producto con un lector láser para agilizar las ventas.</p>
          </div>
        </div>
      )
    },
    {
      id: 'inventario',
      title: '03. Control de Inventario',
      icon: <ClipboardList size={20} className="text-emerald-500" />,
      content: (
        <div className="space-y-6">
          <p>La vista de <strong>Inventario</strong> es tu herramienta principal para la supervisión física de tu almacén. Aquí te enfocas exclusivamente en las <strong>cantidades</strong>.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center">
              <span className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Productos</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">CATÁLOGO</span>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-center">
              <span className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Stock Bajo</span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-400">REPOSICIÓN</span>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 text-center">
              <span className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Sin Stock</span>
              <span className="text-xl font-black text-red-700 dark:text-red-400">FALTA</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 pb-2">
              <Info size={16} className="text-emerald-500" />
              Exploración y Filtrado
            </h4>
            <ul className="space-y-4 text-xs">
              <li className="flex gap-3 items-start">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Buscador:</strong> Localiza productos específicos por nombre o código de barras.</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Alertas Visuales:</strong> El icono (⚠️) aparece al lado de la cantidad en stock bajo. Las filas se resaltan en rojo para faltas críticas.</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Estado Detallado:</strong> Etiquetas de colores indican "En stock", "Stock bajo" o "Sin stock".</span>
              </li>
            </ul>
          </div>

          <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-4">
            <h4 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 text-sm uppercase tracking-widest">
              <Lightbulb size={16} />
              ¿Cuándo usar esta vista?
            </h4>
            <ul className="space-y-3 text-xs text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Auditoría de Pasillo:</strong> Compara el stock del sistema con los estantes físicos usando una tablet.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Planificación de Pedidos:</strong> Filtra por "Stock Bajo" antes de contactar proveedores.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Verificación de Precios:</strong> Revisa el "Último Costo" para asegurar márgenes de ganancia.</span>
              </li>
            </ul>
          </div>

          <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
            <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 dark:text-indigo-400"><strong>NOTA:</strong> El stock se actualiza automáticamente con cada Venta y Compra. No necesitas modificarlo manualmente aquí.</p>
          </div>
        </div>
      )
    },
    {
      id: 'kardex',
      title: '04. Kardex de Movimientos',
      icon: <History size={20} className="text-amber-500" />,
      content: (
        <div className="space-y-6">
          <p>El <strong>Kardex</strong> es el registro histórico e inmutable de todos los movimientos de tu mercadería. Es la herramienta definitiva para auditorías.</p>
          
          <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30 space-y-4">
            <h4 className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2 text-sm uppercase tracking-widest">
              <Info size={16} />
              Anatomía de la Fila
            </h4>
            <ul className="grid grid-cols-1 gap-2 text-xs">
              <li>📅 <strong>Fecha y Hora:</strong> Momento exacto del movimiento.</li>
              <li>🔄 <strong>Tipo:</strong> 🟢 INGRESO, 🔴 SALIDA, 🟠 AJUSTE.</li>
              <li>📝 <strong>Concepto:</strong> Motivo (Venta #00015, Compra Factura F001).</li>
              <li>🔢 <strong>Cantidad:</strong> Unidades que entraron (+) o salieron (-).</li>
              <li>📦 <strong>Stock Resultante:</strong> Saldo después de la operación.</li>
              <li>👤 <strong>Usuario:</strong> Responsable de la operación.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 pb-2">
              <History size={16} className="text-amber-500" />
              Herramientas de Análisis
            </h4>
            <div className="space-y-4">
               <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <h5 className="font-bold text-xs text-amber-600 mb-1">1. Filtrado por Producto</h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Muestra la "hoja de vida" del ítem con resumen de entradas, salidas y balance final.</p>
               </div>
               <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <h5 className="font-bold text-xs text-amber-600 mb-1">2. Rango de Fechas</h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Audita qué pasó en un día específico, una semana o un mes completo.</p>
               </div>
               <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <h5 className="font-bold text-xs text-amber-600 mb-1">3. Exportación CSV</h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Descarga los datos para contabilidad externa o análisis avanzado en Excel.</p>
               </div>
            </div>
          </div>

          <div className="p-5 bg-amber-50 dark:bg-amber-900/20 rounded-3xl space-y-4 border border-amber-100 dark:border-amber-900/30">
             <h5 className="font-bold text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400">🕵️ ¿Cómo detectar errores?</h5>
             <ol className="list-decimal list-inside text-xs text-amber-800 dark:text-amber-200/80 space-y-2">
                <li>Busca el producto en el Kardex.</li>
                <li>Observa el Stock Resultante paso a paso.</li>
                <li>Identifica si hubo salidas sin ticket o si se omitió registrar una compra.</li>
             </ol>
          </div>

          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400"><strong>IMPORTANTE:</strong> Si el Kardex dice que hubo una salida y no hay ticket de venta, se trata de una pérdida física no registrada.</p>
          </div>
        </div>
      )
    },
    {
      id: 'ventas',
      title: '05. Historial de Ventas',
      icon: <Receipt size={20} className="text-cyan-500" />,
      content: (
        <div className="space-y-6">
          <p>Registro central de todas las transacciones comerciales. Aquí supervisas el rendimiento diario y gestionas los comprobantes emitidos.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/10 rounded-2xl border border-cyan-100 dark:border-cyan-900/30 text-center">
              <span className="block text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">Hoy</span>
              <span className="text-lg font-black text-cyan-700 dark:text-cyan-400">EFECTIVO</span>
            </div>
            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/10 rounded-2xl border border-cyan-100 dark:border-cyan-900/30 text-center">
              <span className="block text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">Histórico</span>
              <span className="text-lg font-black text-cyan-700 dark:text-cyan-400">SUMATORIA</span>
            </div>
            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/10 rounded-2xl border border-cyan-100 dark:border-cyan-900/30 text-center">
              <span className="block text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">Promedio</span>
              <span className="text-lg font-black text-cyan-700 dark:text-cyan-400">TICKET</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 pb-2">
              <FileText size={16} className="text-cyan-500" />
              Gestión de Boletas
            </h4>
            <ul className="space-y-3 text-xs text-gray-500 dark:text-gray-400">
              <li><strong>1. Buscar:</strong> Localiza por número de ticket (ej. #00015).</li>
              <li><strong>2. Ver Boleta:</strong> Abre el detalle (Fecha, Cajero, Método de pago, Desglose, Monto pagado y vuelto).</li>
              <li><strong>3. Reimprimir:</strong> Genera la versión ticket o PDF para el cliente.</li>
            </ul>
          </div>

          <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-4">
            <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-widest">💰 Métodos de Pago</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">💵 <strong className="text-emerald-600">EFECTIVO:</strong> Facilita el cuadre físico.</div>
              <div className="flex items-center gap-2">💳 <strong className="text-blue-600">TARJETA / YAPE:</strong> Control de depósitos bancarios.</div>
            </div>
          </div>

          <div className="p-5 bg-cyan-50 dark:bg-cyan-900/20 rounded-3xl space-y-4 border border-cyan-100 dark:border-cyan-900/30">
             <h5 className="font-bold text-xs uppercase tracking-widest text-cyan-600 dark:text-cyan-400">🛠️ ¿Cómo realizar el cierre de caja?</h5>
             <ol className="list-decimal list-inside text-xs text-cyan-800 dark:text-cyan-200/80 space-y-2">
                <li>Ve a esta vista al finalizar el turno.</li>
                <li>Observa el monto en <strong>"Ventas de hoy"</strong>.</li>
                <li>Compara con el dinero físico (restando fondo inicial) y recibos de tarjeta/Yape.</li>
             </ol>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400"><strong>TIP:</strong> Si un cliente pide un duplicado, busca el ticket, ábrelo y dale a "Imprimir".</p>
          </div>
        </div>
      )
    },
    {
      id: 'pos',
      title: '06. Punto de Venta (POS)',
      icon: <ShoppingCart size={20} className="text-blue-600" />,
      content: (
        <div className="space-y-6">
          <p>Interfaz diseñada para la atención rápida, optimizada para escáneres de códigos de barras o búsqueda táctil.</p>
          
          <div className="space-y-6">
            <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700">
               <h5 className="font-bold text-xs text-blue-600 uppercase tracking-widest mb-3">1. Catálogo de Productos (Izquierda)</h5>
               <ul className="space-y-3 text-xs text-gray-500 dark:text-gray-400">
                  <li><strong>Buscador Superior:</strong> Escribe nombre o escanea. Si el cursor está aquí, el producto se agrega automáticamente.</li>
                  <li><strong>Filtro Categorías:</strong> Botones rápidos para familias de productos.</li>
                  <li><strong>Tarjetas:</strong> Muestran precio y stock. Los productos "Agotados" se bloquean automáticamente.</li>
               </ul>
            </div>
            <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700">
               <h5 className="font-bold text-xs text-blue-600 uppercase tracking-widest mb-3">2. Ticket Actual (Derecha)</h5>
               <ul className="space-y-3 text-xs text-gray-500 dark:text-gray-400">
                  <li><strong>Ajustes:</strong> Usa [+] y [-] para cantidades o eliminar ítems.</li>
                  <li><strong>Totales:</strong> Cálculo automático de Subtotal, IGV y Total.</li>
               </ul>
            </div>
          </div>

          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2.5rem] space-y-5 shadow-sm border border-indigo-100 dark:border-indigo-900/30">
            <h4 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              <ShoppingCart size={16} />
              Proceso de Cobro (Paso a Paso)
            </h4>
            <ol className="list-decimal list-inside text-xs text-indigo-900/80 dark:text-indigo-200/80 space-y-3">
              <li>Agrega los productos escaneando o buscando.</li>
              <li>Haz clic en <strong>"Cobrar"</strong> para abrir el modal.</li>
              <li>Elige <strong>Efectivo</strong> o <strong>Tarjeta/Yape</strong>.</li>
              <li>Ingresa el <strong>Monto Recibido</strong> (ej. billete de S/ 50.00).</li>
              <li>Verifica el <strong>Vuelto</strong> calculado por el sistema.</li>
              <li>Confirma el pago para descontar stock y generar boleta.</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 gap-4 text-[10px] uppercase font-black tracking-tighter text-gray-400">
             <div className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500" /> Búsqueda rápida sin mouse
             </div>
             <div className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500" /> Alertas de stock en vivo
             </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400"><strong>CAUCIÓN:</strong> Verifica el total antes de confirmar. Una vez pagado, las anulaciones se hacen desde el Historial de Ventas.</p>
          </div>
        </div>
      )
    },
    {
      id: 'compras',
      title: '07. Gestión de Compras',
      icon: <Truck size={20} className="text-orange-500" />,
      content: (
        <div className="space-y-6">
          <p>El módulo de <strong>Compras</strong> es donde registras el ingreso de mercadería de tus proveedores. Es fundamental para mantener tu inventario actualizado y conocer tu inversión real.</p>
          
          <div className="space-y-5">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 pb-2">
              <Truck size={16} className="text-orange-500" />
              Pasos para registrar una compra
            </h4>
            <div className="grid grid-cols-1 gap-4 text-xs">
               <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <span className="font-bold text-orange-600 block mb-1">1. Datos del Documento:</span>
                  Ingresa el N° de Documento (Boleta o Factura del proveedor). Esto te servirá para referencias futuras. Si incluye impuestos, activa el interruptor de <strong>IGV</strong>.
               </div>
               <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <span className="font-bold text-orange-600 block mb-1">2. Agregar Productos:</span>
                  Busca el producto, ingresa la <strong>Cantidad</strong> recibida y el <strong>Costo Unitario</strong>. El sistema recordará este costo para tus reportes. Presiona [+] para agregarlo al lote.
               </div>
               <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <span className="font-bold text-orange-600 block mb-1">3. Verificación Final:</span>
                  Revisa la tabla inferior para asegurarte de que las cantidades y costos sean correctos. Puedes editar o eliminar ítems antes de finalizar.
               </div>
               <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl text-orange-700 dark:text-orange-400 font-bold text-center border border-orange-100 dark:border-orange-900/30">
                  4. Completar Registro
               </div>
            </div>
          </div>

          <div className="p-5 bg-orange-50 dark:bg-orange-900/10 rounded-3xl border border-orange-100 dark:border-orange-900/30 space-y-4">
             <h4 className="font-bold text-orange-700 dark:text-orange-300 text-sm uppercase tracking-widest flex items-center gap-2">
                <CloudSync size={16} />
                ¿Qué sucede al guardar?
             </h4>
             <ul className="space-y-2 text-xs">
                <li>• <strong>Aumenta el Stock:</strong> Las unidades se suman inmediatamente.</li>
                <li>• <strong>Genera Movimiento:</strong> Registro tipo "INGRESO" en el Kardex.</li>
                <li>• <strong>Actualiza Costos:</strong> El "Último Costo" se actualiza para calcular ganancias futuras.</li>
             </ul>
          </div>

          <div className="space-y-2">
             <h5 className="font-bold text-xs uppercase tracking-tighter text-gray-400">Consulta Histórica</h5>
             <p className="text-[10px] leading-relaxed text-gray-500">En la pantalla principal verás el historial con tarjetas resumen de inversión total. Puedes abrir cualquier compra para ver el detalle de productos.</p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
            <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 dark:text-indigo-400"><strong>NOTA:</strong> Registrar tus compras sirve para tener un control financiero real. ¡No omitas ninguna!</p>
          </div>
        </div>
      )
    },
    {
      id: 'clientes',
      title: '08. Clientes y Fidelización',
      icon: <UsersIcon size={20} className="text-violet-500" />,
      content: (
        <div className="space-y-6">
          <p>El módulo de <strong>Clientes</strong> te permite gestionar una base de datos de tus compradores recurrentes. Agiliza la venta y te permite conocer mejor a tu público.</p>
          
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 pb-2">
              <UsersIcon size={16} className="text-violet-500" />
              Información del Cliente
            </h4>
            <div className="grid grid-cols-1 gap-4 text-xs">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <span className="font-bold text-violet-600 block mb-1">Identificación:</span>
                Nombre completo y DNI/RUC (esencial para facturación legal).
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <span className="font-bold text-violet-600 block mb-1">Contacto y Stats:</span>
                Teléfono, Email, N° de Compras y <strong>Total Gastado</strong> acumulado.
              </div>
            </div>
          </div>

          <div className="p-5 bg-violet-50 dark:bg-violet-900/10 rounded-3xl border border-violet-100 dark:border-violet-900/30 space-y-4">
            <h4 className="font-bold text-violet-700 dark:text-violet-300 text-sm uppercase tracking-widest">➕ Registro de Clientes</h4>
            <ol className="list-decimal list-inside text-xs space-y-2 text-gray-600 dark:text-gray-400">
               <li>Haz clic en <strong>"+ Agregar cliente"</strong>.</li>
               <li>Ingresa los datos (DNI/RUC es muy importante para búsquedas rápidas).</li>
               <li>Guarda para que el cliente esté disponible en el sistema.</li>
            </ol>
          </div>

          <div className="space-y-3">
             <h5 className="font-bold text-xs uppercase tracking-widest text-gray-400">💡 Estrategia de Crecimiento</h5>
             <ul className="text-xs space-y-2 text-gray-500">
                <li>• <strong>Clientes Estrella:</strong> Identifica a los de mayor gasto y ofréceles descuentos.</li>
                <li>• <strong>Agilidad en el POS:</strong> Selecciona al cliente para que su nombre aparezca en la boleta automáticamente.</li>
             </ul>
          </div>

          <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
            <AlertCircle size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 dark:text-indigo-400"><strong>TIP:</strong> Mantener una base de datos es el primer paso para implementar programas de puntos o membresías.</p>
          </div>
        </div>
      )
    },
    {
      id: 'usuarios',
      title: '09. Control de Usuarios y Seguridad',
      icon: <UserCog size={20} className="text-slate-600" />,
      content: (
        <div className="space-y-6">
          <p>El módulo de <strong>Usuarios</strong> es vital para proteger la integridad de tu información. Define quién tiene permiso para entrar y qué acciones puede realizar.</p>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-xs block mb-1">1. Administrador:</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Acceso total a todas las vistas, incluyendo configuración, reportes financieros y eliminación de datos.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-xs block mb-1">2. Cajero / Vendedor:</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Acceso limitado principalmente al Punto de Venta, Inventario y sus propias ventas. No ve reportes de rentabilidad avanzada.</p>
            </div>
          </div>

          <div className="p-6 bg-slate-100 dark:bg-slate-900/40 rounded-[2.5rem] space-y-5 shadow-sm border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400">
               <Plus size={16} />
               Registro de Nuevo Usuario
            </h4>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-3">
               <li>• <strong>Username:</strong> Nombre corto para iniciar sesión (ej. jdoe).</li>
               <li>• <strong>Contraseña:</strong> Clave segura de al menos 4 caracteres.</li>
               <li>• <strong>Rol y Sede:</strong> Define sus permisos y local asignado.</li>
            </ul>
          </div>

          <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 space-y-3">
            <h4 className="font-bold text-indigo-700 dark:text-indigo-300 text-sm uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} />
              Gestión de Estados
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Si un empleado deja de trabajar, cámbialo a <strong>INACTIVO</strong>. Nunca lo elimines; esto mantiene el rastro de sus operaciones en los reportes históricos por auditoría.</p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400"><strong>IMPORTANTE:</strong> Nunca compartas tu cuenta de Administrador. Cada cajero debe tener su propio usuario para el cuadre de caja.</p>
          </div>
        </div>
      )
    },
    {
      id: 'configuracion',
      title: '10. Configuración del Sistema',
      icon: <Settings size={20} className="text-gray-600" />,
      content: (
        <div className="space-y-6">
          <p>Panel de control técnico para personalizar el funcionamiento de MiniMarket Pro y realizar mantenimiento crítico.</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
              <h5 className="font-bold text-xs text-indigo-600 uppercase mb-2">🏢 Datos del Negocio</h5>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Razón Social, RUC y contacto. Esta información aparecerá en la cabecera de tus boletas y es vital para la legalidad.</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
              <h5 className="font-bold text-xs text-indigo-600 uppercase mb-2">📡 Identidad de Sede</h5>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Configura el ID único (ej. SEDE-SUR) y la URL de la Sede Central si eres una sucursal.</p>
            </div>
          </div>

          <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
            <h4 className="font-bold text-indigo-700 dark:text-indigo-300 text-sm uppercase tracking-widest flex items-center gap-2">
               <Settings size={16} />
               Mantenimiento de Datos
            </h4>
            <ul className="text-xs space-y-3">
               <li>• <strong>Optimizar Tablas:</strong> Compacta la base de datos para mejorar la velocidad.</li>
               <li>• <strong>Respaldar Datos:</strong> Crea una copia de seguridad (Backup) recomendada semanalmente en USB.</li>
            </ul>
          </div>

          <div className="space-y-3">
             <h5 className="font-bold text-xs uppercase tracking-widest text-gray-400">🔔 Preferencias</h5>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Alertas de Stock Crítico</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Cierre de Sesión Automático</div>
             </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400"><strong>CAUCIÓN:</strong> Una URL de Central incorrecta impedirá que tu sucursal envíe sus ventas al servidor principal.</p>
          </div>
        </div>
      )
    },
    {
      id: 'sincronizacion',
      title: '11. Sincronización Multi-Sede',
      icon: <CloudSync size={20} className="text-purple-600" />,
      content: (
        <div className="space-y-6">
          <p>El panel de <strong>Sincronización</strong> conecta múltiples locales, permitiendo que la información fluya desde las sucursales hacia la Sede Central.</p>
          
          <div className="space-y-6">
            <div className="p-5 bg-purple-50 dark:bg-purple-900/10 rounded-3xl border border-purple-100 dark:border-purple-900/30">
               <h5 className="font-bold text-xs text-purple-700 uppercase tracking-widest mb-3">🏛️ Modo Sede Central (Servidor)</h5>
               <ol className="text-xs space-y-2 list-decimal list-inside text-gray-500 dark:text-gray-400">
                  <li><strong>Iniciar Servidor:</strong> Comienza la transmisión de datos.</li>
                  <li><strong>IP Local:</strong> Número al que las sucursales deben conectar (ej. 192.168.1.15).</li>
                  <li><strong>Monitoreo:</strong> Lista de locales conectados y su última actividad.</li>
               </ol>
            </div>
            <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700">
               <h5 className="font-bold text-xs text-gray-600 uppercase tracking-widest mb-3">🏬 Modo Sucursal (Local)</h5>
               <ul className="text-xs space-y-2 text-gray-500 dark:text-gray-400">
                  <li>• <strong>Ventas Pendientes:</strong> Cantidad de tickets aún no enviados.</li>
                  <li>• <strong>Sincronizar Ahora:</strong> Envía Ventas, Kardex y Stock; y descarga el nuevo Catálogo de precios.</li>
               </ul>
            </div>
          </div>

          <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-[2.5rem] space-y-5 shadow-sm border border-purple-100 dark:border-purple-900/30">
             <h5 className="font-bold text-sm uppercase tracking-widest text-purple-600 dark:text-purple-400">🔄 Flujo Recomendado</h5>
             <div className="space-y-4 text-xs text-purple-900/80 dark:text-purple-200/80">
                <p><strong>Administrador:</strong> Mantén el servidor activo todo el horario de atención.</p>
                <p><strong>Cajero:</strong> Sincroniza al abrir para actualizar precios y al cerrar para respaldar ventas.</p>
             </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
            <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 dark:text-indigo-400 italic">Si no tienes internet, puedes seguir vendiendo. El sistema sincronizará automáticamente al recuperar la conexión.</p>
          </div>
        </div>
      )
    },
    {
      id: 'reportes',
      title: '12. Reportes y Analítica',
      icon: <PieChart size={20} className="text-pink-500" />,
      content: (
        <div className="space-y-6">
          <p>Transforma los datos de ventas y compras en información estratégica para medir el éxito de tu negocio.</p>
          
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 pb-2">
              <PieChart size={16} className="text-pink-500" />
              Indicadores Mensuales (KPIs)
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                 <span className="text-pink-600 font-bold block mb-1">Ingresos:</span> Dinero total facturado en el mes.
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                 <span className="text-pink-600 font-bold block mb-1">Volumen:</span> Productos físicos vendidos.
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                 <span className="text-pink-600 font-bold block mb-1">Emisión:</span> Cantidad total de tickets emitidos.
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                 <span className="text-pink-600 font-bold block mb-1">Gasto:</span> Promedio de compra por visita.
              </div>
            </div>
          </div>

          <div className="p-5 bg-pink-50 dark:bg-pink-900/10 rounded-3xl border border-pink-100 dark:border-pink-900/30 space-y-4">
             <h4 className="font-bold text-pink-700 dark:text-pink-300 text-sm uppercase tracking-widest">📉 Análisis Visual</h4>
             <ul className="text-xs space-y-3">
                <li>• <strong>Gráfico Mensual:</strong> Evolución de ingresos (últimos 6 meses). Detecta estacionalidad.</li>
                <li>• <strong>Ranking Top 5:</strong> Productos más rentables. ¡Nunca te quedes sin stock de estos!</li>
             </ul>
          </div>

          <div className="p-6 bg-pink-50 dark:bg-pink-900/20 rounded-[2.5rem] text-center shadow-sm border border-pink-100 dark:border-pink-900/30 space-y-3">
             <h5 className="font-bold text-sm uppercase tracking-widest text-pink-600 dark:text-pink-400">📄 Exportación de Reportes</h5>
             <p className="text-xs text-pink-900/80 dark:text-pink-200/80">Genera un documento PDF profesional con todos los gráficos y tablas actuales para socios o contabilidad.</p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400"><strong>TIP:</strong> Si el Gasto Promedio baja, implementa promociones de "Combos" para incentivar ventas adicionales.</p>
          </div>
        </div>
      )
    },
    {
      id: 'ayuda',
      title: '13. Centro de Ayuda',
      icon: <HelpCircle size={20} className="text-gray-500" />,
      content: (
        <div className="space-y-6">
          <p>Recurso interactivo para resolver dudas rápidas sobre el funcionamiento del sistema y conceptos técnicos.</p>
          
          <div className="space-y-4">
             <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h5 className="font-bold text-xs mb-1">Explorador de Módulos:</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Descripción breve y concisa de las 14 vistas principales del sistema.</p>
             </div>
             <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h5 className="font-bold text-xs mb-1">Flujo de Información:</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Explicación de las fases de Abastecimiento, Operación y Auditoría.</p>
             </div>
          </div>

          <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-800 space-y-4">
             <h4 className="font-bold text-indigo-700 dark:text-indigo-300 text-sm uppercase tracking-widest">💬 FAQ y Soporte</h4>
             <ul className="text-xs space-y-3">
                <li>• <strong>¿Actualizar Stock?:</strong> Usa Compras para ingresos e Inventario para correcciones.</li>
                <li>• <strong>¿Sin internet?:</strong> Funciona 100% localmente y sincroniza después.</li>
             </ul>
             <div className="pt-3 border-t border-indigo-100 dark:border-indigo-800 text-[10px] text-gray-500 dark:text-gray-400 italic">
                Soporte: soporte@minimarketpro.com | Para asistencia inmediata contacta vía telefónica.
             </div>
          </div>
        </div>
      )
    },
    {
      id: 'login',
      title: '14. Acceso al Sistema (Login)',
      icon: <LogIn size={20} className="text-indigo-600" />,
      content: (
        <div className="space-y-6">
          <p>La seguridad de tu información comienza aquí. Solo personal autorizado puede ingresar a MiniMarket Pro.</p>
          
          <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
            <h4 className="font-bold text-indigo-700 dark:text-indigo-300 text-sm uppercase tracking-widest">🚪 Cómo Iniciar Sesión</h4>
            <ol className="text-xs list-decimal list-inside space-y-2 text-gray-500 dark:text-gray-400">
               <li>Ingresa tu <strong>Usuario</strong> asignado (ej. admin).</li>
               <li>Escribe tu <strong>Contraseña</strong> secreta (oculta por seguridad).</li>
               <li>Haz clic en "Ingresar al sistema".</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-white text-sm uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 pb-2">🔒 Seguridad y Acceso</h4>
            <ul className="text-xs space-y-3 text-gray-500 dark:text-gray-400">
               <li>• <strong>Encriptación:</strong> Claves protegidas por algoritmos avanzados.</li>
               <li>• <strong>Roles:</strong> El sistema limita funciones automáticamente según tu perfil.</li>
               <li>• <strong>Cierre de Sesión:</strong> Usa el botón en el menú lateral para salir de forma segura.</li>
            </ul>
          </div>

          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400"><strong>CAUCIÓN:</strong> Nunca dejes tu sesión abierta si te alejas. ¡La seguridad es responsabilidad de todos!</p>
          </div>
        </div>
      )
    }
  ];

  const toggleGuide = (id: string) => {
    setExpandedGuide(expandedGuide === id ? null : id);
  };

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
            Explora a detalle el funcionamiento de MiniMarket Pro a través de nuestras guías interactivas.
          </p>
        </div>
      </header>

      {/* Flujo de Información */}
      <section className="space-y-10">
        <div className="flex items-center gap-3 px-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <Info className="text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Flujo de Trabajo Detallado</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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

      {/* Directorio de Vistas - ACORDEÓN DETALLADO */}
      <section className="space-y-10">
        <div className="flex items-center gap-3 px-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <FileText className="text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Explorador de Módulos</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 px-2">
          {detailedGuides.map((guide) => (
            <div 
              key={guide.id} 
              className={`bg-white dark:bg-gray-800 rounded-3xl border transition-all duration-300 overflow-hidden ${
                expandedGuide === guide.id 
                ? 'border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-none' 
                : 'border-gray-100 dark:border-gray-700 shadow-sm'
              }`}
            >
              <button 
                onClick={() => toggleGuide(guide.id)}
                className="w-full flex items-center justify-between p-6 text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl transition-colors ${
                    expandedGuide === guide.id ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-900/50 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'
                  }`}>
                    {guide.icon}
                  </div>
                  <span className={`font-black text-lg tracking-tight ${
                    expandedGuide === guide.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-white'
                  }`}>
                    {guide.title}
                  </span>
                </div>
                {expandedGuide === guide.id ? <ChevronDown className="text-indigo-500" /> : <ChevronRight className="text-gray-400" />}
              </button>
              
              <div 
                className={`transition-all duration-500 ease-in-out ${
                  expandedGuide === guide.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-8 pt-2 border-t border-gray-50 dark:border-gray-700/50">
                  <div className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {guide.content}
                  </div>
                </div>
              </div>
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
