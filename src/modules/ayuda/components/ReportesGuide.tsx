import { PieChart, AlertCircle, Calendar, Trophy, Download } from 'lucide-react';

export function ReportesGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/reportes.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>Transforma los datos de ventas y compras en información estratégica para medir el éxito de tu negocio. Ahora con filtros de fechas personalizados y métricas detalladas.</p>

      <div className="space-y-4">
        <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">
          <Calendar size={16} className="text-blue-500" />
          Filtros de Fechas
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Usa los accesos rápidos (<strong>Hoy, Últimos 7 Días, Este Mes, Mes Anterior</strong>) o selecciona un rango personalizado (Desde / Hasta) para analizar un período específico. Todas las gráficas y KPIs se actualizarán instantáneamente basándose en este rango temporal.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">
          <Trophy size={16} className="text-emerald-500" />
          Nuevos Indicadores Clave (KPIs)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="text-emerald-600 font-bold block mb-1">Ganancia Neta:</span> Beneficio real (Ingresos - Compras).
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="text-amber-600 font-bold block mb-1">Ticket Promedio:</span> Gasto promedio por cliente.
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="text-blue-600 font-bold block mb-1">Ingresos Totales:</span> Total facturado.
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="text-orange-600 font-bold block mb-1">Inversión Compras:</span> Dinero invertido en abastecer.
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700 col-span-1 sm:col-span-2 lg:col-span-2">
            <span className="text-zinc-600 dark:text-zinc-300 font-bold block mb-1">Comparativas (+/-):</span> Las tarjetas muestran en verde o rojo si hubo un incremento o disminución en relación al período anterior.
          </div>
        </div>
      </div>

      <div className="p-5 bg-pink-50 dark:bg-pink-900/10 rounded-3xl border border-pink-100 dark:border-pink-900/30 space-y-4">
        <h4 className="font-semibold text-pink-700 dark:text-pink-300 text-sm uppercase tracking-widest flex items-center gap-2">
          <PieChart size={16} />
          Análisis Visual Avanzado
        </h4>
        <ul className="text-xs space-y-3 text-pink-900/80 dark:text-pink-200/80">
          <li>• <strong>Rendimiento General:</strong> Gráfica comparativa de Ingresos vs Compras vs Ganancias.</li>
          <li>• <strong>Ranking Top 5:</strong> Conoce tus productos más vendidos.</li>
          <li>• <strong>Ventas por Categoría:</strong> Desglose en pastel para identificar qué líneas de negocio son más fuertes.</li>
        </ul>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] text-center shadow-sm border border-blue-100 dark:border-blue-900/30 space-y-3">
        <h5 className="font-semibold text-sm uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
          <Download size={18} />
          Exportación Dinámica PDF
        </h5>
        <p className="text-xs text-blue-900/80 dark:text-blue-200/80">
          Al hacer clic en "Exportar PDF", se generará un documento profesional con los datos y gráficos <strong>del rango de fechas exacto</strong> que tengas seleccionado, listo para enviar a contabilidad o socios.
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>TIP DE GESTIÓN:</strong> Revisa el indicador "Ganancia Neta". Si tus ingresos son altos pero la ganancia es baja, es posible que los precios de compra de tus proveedores hayan subido y debas ajustar tus precios de venta.
        </p>
      </div>
    </div>
  );
}
