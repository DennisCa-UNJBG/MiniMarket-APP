import { History, Info, AlertCircle } from 'lucide-react';

export function KardexGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/kardex.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>El <strong>Kardex</strong> es el registro histórico e inmutable de todos los movimientos de tu mercadería. Es la herramienta definitiva para auditorías.</p>

      <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30 space-y-4">
        <h4 className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2 text-sm uppercase tracking-widest">
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
        <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">
          <History size={16} className="text-amber-500" />
          Herramientas de Análisis
        </h4>
        <div className="space-y-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <h5 className="font-semibold text-xs text-amber-600 mb-1">1. Filtrado por Producto</h5>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Muestra la "hoja de vida" del ítem con resumen de entradas, salidas y balance final.</p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <h5 className="font-semibold text-xs text-amber-600 mb-1">2. Rango de Fechas</h5>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Audita qué pasó en un día específico, una semana o un mes completo.</p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <h5 className="font-semibold text-xs text-amber-600 mb-1">3. Exportación Excel</h5>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Descarga los datos para contabilidad externa o análisis avanzado en Excel.</p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-amber-50 dark:bg-amber-900/20 rounded-3xl space-y-4 border border-amber-100 dark:border-amber-900/30">
        <h5 className="font-semibold text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400">🕵️ ¿Cómo detectar errores?</h5>
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
  );
}
