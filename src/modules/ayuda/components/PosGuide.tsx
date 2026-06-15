import { ShoppingCart, CheckCircle2, AlertCircle } from 'lucide-react';

export function PosGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/puntoventa.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>Interfaz diseñada para la atención rápida, optimizada para escáneres de códigos de barras o búsqueda táctil.</p>

      <div className="space-y-6">
        <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-700">
          <h5 className="font-semibold text-xs text-blue-600 uppercase tracking-widest mb-3">1. Catálogo de Productos (Izquierda)</h5>
          <ul className="space-y-3 text-xs text-zinc-500 dark:text-zinc-400">
            <li><strong>Buscador Superior:</strong> Escribe nombre o escanea. Si el cursor está aquí, el producto se agrega automáticamente.</li>
            <li><strong>Filtro Categorías:</strong> Botones rápidos para familias de productos.</li>
            <li><strong>Tarjetas:</strong> Muestran precio y stock. Los productos "Agotados" se bloquean automáticamente.</li>
          </ul>
        </div>
        <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-700">
          <h5 className="font-semibold text-xs text-blue-600 uppercase tracking-widest mb-3">2. Ticket Actual (Derecha)</h5>
          <ul className="space-y-3 text-xs text-zinc-500 dark:text-zinc-400">
            <li><strong>Ajustes:</strong> Usa [+] y [-] para cantidades o eliminar ítems.</li>
            <li><strong>Totales:</strong> Cálculo automático de Subtotal, IGV y Total.</li>
          </ul>
        </div>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] space-y-5 shadow-sm border border-blue-100 dark:border-blue-900/30">
        <h4 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-widest text-blue-600 dark:text-blue-400">
          <ShoppingCart size={16} />
          Proceso de Cobro (Paso a Paso)
        </h4>
        <ol className="list-decimal list-inside text-xs text-blue-900/80 dark:text-blue-200/80 space-y-3">
          <li>Agrega los productos escaneando o buscando.</li>
          <li>Haz clic en <strong>"Cobrar"</strong> para abrir el modal.</li>
          <li>Elige <strong>Efectivo</strong> o <strong>Tarjeta/Yape</strong>.</li>
          <li>Ingresa el <strong>Monto Recibido</strong> (ej. billete de S/ 50.00).</li>
          <li>Verifica el <strong>Vuelto</strong> calculado por el sistema.</li>
          <li>Confirma el pago para descontar stock y generar boleta.</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 gap-4 text-[10px] uppercase font-black tracking-tighter text-zinc-400">
        <div className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={12} className="text-emerald-500" /> Búsqueda rápida sin mouse
        </div>
        <div className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={12} className="text-emerald-500" /> Alertas de stock en vivo
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
        <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
        <p className="text-xs text-red-700 dark:text-red-400"><strong>CAUCIÓN:</strong> Verifica el total antes de confirmar. Una vez pagado, las anulaciones se hacen desde el Historial de Ventas.</p>
      </div>
    </div>
  );
}
