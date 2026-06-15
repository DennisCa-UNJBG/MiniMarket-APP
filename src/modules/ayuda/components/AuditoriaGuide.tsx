import { ShieldCheck, Info } from 'lucide-react';

export function AuditoriaGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/auditoria.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>El módulo de <strong>Auditoría</strong> es una herramienta de seguridad avanzada para administradores que registra todas las operaciones críticas realizadas en la aplicación.</p>

      <div className="space-y-4">
        <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">
          <ShieldCheck size={16} className="text-red-500" />
          Trazabilidad Completa
        </h4>
        <div className="grid grid-cols-1 gap-4 text-xs">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="font-bold text-red-600 block mb-1">Registro Automatizado (Logs):</span>
            Cada vez que un cajero abre la caja, realiza un cierre, inicia sesión, agrega un producto o hace una sincronización, el sistema genera de forma transparente un registro con la fecha, hora UTC y local exacta, el id del usuario y la tabla afectada.
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="font-bold text-red-600 block mb-1">Filtros Inteligentes de Auditoría:</span>
            Filtra por tipo de acción (APERTURA_CAJA, CIERRE_CAJA, LOGIN, INGRESO_PRODUCTO) o busca términos específicos dentro de los detalles del evento.
          </div>
        </div>
      </div>

      <div className="p-5 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30 space-y-3">
        <h4 className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-2 text-sm uppercase tracking-widest">
          <Info size={16} />
          Paginación Eficiente
        </h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Utiliza paginación en el servidor con SQLite (LIMIT y OFFSET) para cargar cientos de miles de logs instantáneamente sin ralentizar la aplicación.
        </p>
      </div>
    </div>
  );
}
