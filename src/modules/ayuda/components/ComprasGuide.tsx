import { Truck, CloudSync, Info } from 'lucide-react';

export function ComprasGuide() {
   return (
      <div className="space-y-6">
         <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
            <img
               src="/docs/compras.png"
               alt="Pantalla de la guía"
               className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
            />
         </div>
         <p>El módulo de <strong>Compras</strong> es donde registras el ingreso de mercadería de tus proveedores. Es fundamental para mantener tu inventario actualizado y conocer tu inversión real.</p>

         <div className="space-y-5">
            <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">
               <Truck size={16} className="text-orange-500" />
               Pasos para registrar una compra
            </h4>
            <div className="grid grid-cols-1 gap-4 text-xs">
               <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                  <span className="font-bold text-orange-600 block mb-1">1. Datos del Documento:</span>
                  Ingresa el N° de Documento (Boleta o Factura del proveedor). Esto te servirá para referencias futuras. Si incluye impuestos, activa el interruptor de <strong>IGV</strong>.
               </div>
               <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                  <span className="font-bold text-orange-600 block mb-1">2. Agregar Productos:</span>
                  Busca el producto, ingresa la <strong>Cantidad</strong> recibida y el <strong>Costo Unitario</strong>. El sistema recordará este costo para tus reportes. Presiona [+] para agregarlo al lote.
               </div>
               <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                  <span className="font-bold text-orange-600 block mb-1">3. Verificación Final:</span>
                  Revisa la tabla inferior para asegurarte de que las cantidades y costos sean correctos. Puedes editar o eliminar ítems antes de finalizar.
               </div>
               <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl text-orange-700 dark:text-orange-400 font-bold text-center border border-orange-100 dark:border-orange-900/30">
                  4. Completar Registro
               </div>
            </div>
         </div>

         <div className="p-5 bg-orange-50 dark:bg-orange-900/10 rounded-3xl border border-orange-100 dark:border-orange-900/30 space-y-4">
            <h4 className="font-semibold text-orange-700 dark:text-orange-300 text-sm uppercase tracking-widest flex items-center gap-2">
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
            <h5 className="font-semibold text-xs uppercase tracking-tighter text-zinc-400">Consulta Histórica</h5>
            <p className="text-[10px] leading-relaxed text-zinc-500">En la pantalla principal verás el historial con tarjetas resumen de inversión total. Puedes abrir cualquier compra para ver el detalle de productos.</p>
         </div>

         <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400"><strong>NOTA:</strong> Registrar tus compras sirve para tener un control financiero real. ¡No omitas ninguna!</p>
         </div>
      </div>
   );
}
