import { FileText, AlertCircle } from 'lucide-react';

export function VentasGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/ventas.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
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
        <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">
          <FileText size={16} className="text-cyan-500" />
          Gestión de Boletas
        </h4>
        <ul className="space-y-3 text-xs text-zinc-500 dark:text-zinc-400">
          <li><strong>1. Buscar:</strong> Localiza por número de ticket (ej. #00015).</li>
          <li><strong>2. Ver Boleta:</strong> Abre el detalle (Fecha, Cajero, Método de pago, Desglose, Monto pagado y vuelto).</li>
          <li><strong>3. Reimprimir:</strong> Genera la versión ticket o PDF para el cliente.</li>
        </ul>
      </div>

      <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-700 space-y-4">
        <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm uppercase tracking-widest">💰 Métodos de Pago</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">💵 <strong className="text-emerald-600">EFECTIVO:</strong> Facilita el cuadre físico.</div>
          <div className="flex items-center gap-2">💳 <strong className="text-blue-600">TARJETA / YAPE:</strong> Control de depósitos bancarios.</div>
        </div>
      </div>

      <div className="p-5 bg-cyan-50 dark:bg-cyan-900/20 rounded-3xl space-y-4 border border-cyan-100 dark:border-cyan-900/30">
        <h5 className="font-semibold text-xs uppercase tracking-widest text-cyan-600 dark:text-cyan-400">🛠️ ¿Cómo realizar el cierre de caja?</h5>
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
  );
}
