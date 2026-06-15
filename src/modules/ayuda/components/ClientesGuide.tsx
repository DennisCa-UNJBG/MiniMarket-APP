import { Users as UsersIcon, AlertCircle } from 'lucide-react';

export function ClientesGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/clientes.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>El módulo de <strong>Clientes</strong> te permite gestionar una base de datos de tus compradores recurrentes. Agiliza la venta y te permite conocer mejor a tu público.</p>

      <div className="space-y-4">
        <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">
          <UsersIcon size={16} className="text-violet-500" />
          Información del Cliente
        </h4>
        <div className="grid grid-cols-1 gap-4 text-xs">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="font-bold text-violet-600 block mb-1">Identificación:</span>
            Nombre completo y DNI/RUC (esencial para facturación legal).
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="font-bold text-violet-600 block mb-1">Contacto y Stats:</span>
            Teléfono, Email, N° de Compras y <strong>Total Gastado</strong> acumulado.
          </div>
        </div>
      </div>

      <div className="p-5 bg-violet-50 dark:bg-violet-900/10 rounded-3xl border border-violet-100 dark:border-violet-900/30 space-y-4">
        <h4 className="font-semibold text-violet-700 dark:text-violet-300 text-sm uppercase tracking-widest">➕ Registro de Clientes</h4>
        <ol className="list-decimal list-inside text-xs space-y-2 text-zinc-600 dark:text-zinc-400">
          <li>Haz clic en <strong>"+ Agregar cliente"</strong>.</li>
          <li>Ingresa los datos (DNI/RUC es muy importante para búsquedas rápidas).</li>
          <li>Guarda para que el cliente esté disponible en el sistema.</li>
        </ol>
      </div>

      <div className="space-y-3">
        <h5 className="font-semibold text-xs uppercase tracking-widest text-zinc-400">💡 Estrategia de Crecimiento</h5>
        <ul className="text-xs space-y-2 text-zinc-500">
          <li>• <strong>Clientes Estrella:</strong> Identifica a los de mayor gasto y ofréceles descuentos.</li>
          <li>• <strong>Agilidad en el POS:</strong> Selecciona al cliente para que su nombre aparezca en la boleta automáticamente.</li>
        </ul>
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
        <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-400"><strong>TIP:</strong> Mantener una base de datos es el primer paso para implementar programas de puntos o membresías.</p>
      </div>
    </div>
  );
}
