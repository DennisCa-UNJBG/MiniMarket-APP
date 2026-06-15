import { Info, Building2 } from 'lucide-react';

export function SucursalesGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/sucursales.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>El módulo de <strong>Sucursales</strong> permite al Administrador del sistema gestionar los locales comerciales vinculados al negocio y configurar sus datos fiscales.</p>

      <div className="space-y-4">
        <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">
          <Building2 size={16} className="text-indigo-500" />
          Configuración y Sedes
        </h4>
        <div className="grid grid-cols-1 gap-4 text-xs">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="font-bold text-indigo-600 block mb-1">Datos Legales de la Sede:</span>
            Permite registrar el RUC, la Razón Social, la dirección física y el teléfono de contacto oficial de la sucursal activa.
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="font-bold text-indigo-600 block mb-1">Personalización de Comprobantes:</span>
            Sube el logo de tu empresa en formato de imagen para que aparezca automáticamente en la impresión de las boletas térmicas de 80mm.
          </div>
        </div>
      </div>

      <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 space-y-3">
        <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2 text-sm uppercase tracking-widest">
          <Info size={16} />
          Identidad de Sede
        </h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Asigna un identificador único (ej: LOCAL) que diferenciará tus existencias de stock y transacciones durante la sincronización a la central.
        </p>
      </div>
    </div>
  );
}
