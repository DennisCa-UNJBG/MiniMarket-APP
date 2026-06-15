import { Info, AlertCircle, Wallet } from 'lucide-react';

export function Caja_controlGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/controlcaja.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>El módulo de <strong>Control de Caja</strong> te permite supervisar el flujo de dinero en efectivo en el local, previniendo pérdidas y cuadrando los ingresos del turno.</p>

      <div className="space-y-4">
        <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">
          <Wallet size={16} className="text-emerald-500" />
          Flujo de Caja del Turno
        </h4>
        <div className="grid grid-cols-1 gap-4 text-xs">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="font-bold text-emerald-600 block mb-1">1. Apertura de Caja:</span>
            Al iniciar tu turno, debes ingresar el "Monto Inicial" (sencillo o base de efectivo para dar vuelto). La caja pasará al estado <strong>ABIERTA</strong>.
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="font-bold text-emerald-600 block mb-1">2. Registro de Ventas:</span>
            Durante el turno, cada venta cobrada en efectivo incrementará automáticamente el saldo de caja esperado por el sistema.
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="font-bold text-emerald-600 block mb-1">3. Cierre de Caja:</span>
            Al finalizar el turno, debes contar el efectivo total de la gaveta e ingresarlo. El sistema calculará diferencias entre las ventas esperadas y el monto real ingresado, reportando sobrantes o faltantes.
          </div>
        </div>
      </div>

      <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 space-y-3">
        <h4 className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-sm uppercase tracking-widest">
          <Info size={16} />
          Historial de Cierres
        </h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Conserva el histórico de aperturas, montos finales, fechas/horas exactas de cierre, y cajero a cargo.
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
        <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
        <p className="text-xs text-red-700 dark:text-red-400"><strong>IMPORTANTE:</strong> Realiza el arqueo físico minuciosamente antes de ingresar el monto final. Una caja cerrada no puede ser reabierta.</p>
      </div>
    </div>
  );
}
