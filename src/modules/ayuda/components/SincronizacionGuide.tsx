import { Info } from 'lucide-react';

export function SincronizacionGuide() {
   return (
      <div className="space-y-6">
         <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
            <img
               src="/docs/sincronizacion.png"
               alt="Pantalla de la guía"
               className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
            />
         </div>
         <p>El panel de <strong>Sincronización</strong> conecta múltiples locales, permitiendo que la información fluya desde las sucursales hacia la Sede Central.</p>

         <div className="space-y-6">
            <div className="p-5 bg-purple-50 dark:bg-purple-900/10 rounded-3xl border border-purple-100 dark:border-purple-900/30">
               <h5 className="font-semibold text-xs text-purple-700 uppercase tracking-widest mb-3">🏛️ Modo Sede Central (Servidor)</h5>
               <ol className="text-xs space-y-2 list-decimal list-inside text-zinc-500 dark:text-zinc-400">
                  <li><strong>Iniciar Servidor:</strong> Comienza la transmisión de datos.</li>
                  <li><strong>IP Local:</strong> Número al que las sucursales deben conectar (ej. 192.168.1.15).</li>
                  <li><strong>Monitoreo:</strong> Lista de locales conectados y su última actividad.</li>
               </ol>
            </div>
            <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-700">
               <h5 className="font-semibold text-xs text-zinc-600 uppercase tracking-widest mb-3">🏬 Modo Sucursal (Local)</h5>
               <ul className="text-xs space-y-2 text-zinc-500 dark:text-zinc-400">
                  <li>• <strong>Ventas Pendientes:</strong> Cantidad de tickets aún no enviados.</li>
                  <li>• <strong>Sincronizar Ahora:</strong> Envía Ventas, Kardex y Stock; y descarga el nuevo Catálogo de precios.</li>
               </ul>
            </div>
         </div>

         <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-[2.5rem] space-y-5 shadow-sm border border-purple-100 dark:border-purple-900/30">
            <h5 className="font-semibold text-sm uppercase tracking-widest text-purple-600 dark:text-purple-400">🔄 Flujo Recomendado</h5>
            <div className="space-y-4 text-xs text-purple-900/80 dark:text-purple-200/80">
               <p><strong>Administrador:</strong> Mantén el servidor activo todo el horario de atención.</p>
               <p><strong>Cajero:</strong> Sincroniza al abrir para actualizar precios y al cerrar para respaldar ventas.</p>
            </div>
         </div>

         <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400 italic">Si no tienes internet, puedes seguir vendiendo. El sistema sincronizará automáticamente al recuperar la conexión.</p>
         </div>
      </div>
   );
}
