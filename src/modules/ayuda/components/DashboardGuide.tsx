import { LayoutDashboard, AlertCircle, Settings } from 'lucide-react';

export function DashboardGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/dashboard.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>El <strong>Dashboard</strong> es la vista predeterminada al ingresar al sistema. Su objetivo es proporcionarte una visión panorámica y en tiempo real del estado de tu negocio.</p>

      <div className="space-y-4">
        <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">
          <LayoutDashboard size={16} className="text-blue-500" />
          Secciones del Dashboard
        </h4>

        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <h5 className="font-semibold text-xs text-blue-600 mb-2">1. Tarjetas de Indicadores Clave (KPIs)</h5>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Resumen de la operación diaria y mensual: <strong>Productos en Stock</strong> (ítems únicos), <strong>Ventas de hoy</strong> (monto acumulado), <strong>Compras del día</strong> e <strong>Ingresos del mes</strong>.</p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <h5 className="font-semibold text-xs text-blue-600 mb-2">2. Alertas de Sede Incompleta</h5>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Banner de advertencia ámbar que aparece si falta configurar datos legales como RUC o Razón Social. Es <strong>crucial</strong> completar esta información para la validez de tus boletas.</p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <h5 className="font-semibold text-xs text-blue-600 mb-2">3. Gráfico de Ventas Semanal</h5>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Visualización interactiva que muestra la tendencia de tus ingresos en los últimos 7 días, permitiéndote identificar los días de mayor demanda.</p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <h5 className="font-semibold text-xs text-blue-600 mb-2">4. Alertas de Stock Bajo</h5>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Panel crítico que lista los productos que han caído por debajo de su <strong>Stock Mínimo</strong>. Haz clic para ir al módulo de compras.</p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <h5 className="font-semibold text-xs text-blue-600 mb-2">5. Actividad Reciente</h5>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Historial cronológico de las últimas transacciones (número de ticket, fecha/hora y monto). Usa "Ver Todo" para navegar al historial completo.</p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 space-y-3">
        <h4 className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2 text-sm uppercase tracking-widest">
          <Settings size={16} />
          Cómo usar esta vista
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
          <li><strong>Revisión Matutina:</strong> Verifica productos en stock y alertas para planificar el día.</li>
          <li><strong>Monitoreo en Vivo:</strong> Observa cómo sube el indicador de ventas durante la jornada.</li>
          <li><strong>Análisis de Tendencias:</strong> Al final de la semana, utiliza el gráfico para medir el éxito de promociones o cambios de horario.</li>
        </ol>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400"><strong>TIP:</strong> Si ver una alerta de Stock Bajo, no esperes a que llegue a cero. Realiza la compra de reposición inmediatamente para no perder ventas.</p>
      </div>
    </div>
  );
}
