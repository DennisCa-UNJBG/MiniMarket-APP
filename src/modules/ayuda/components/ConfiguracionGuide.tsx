import { CheckCircle2, AlertCircle, Settings } from 'lucide-react';

export function ConfiguracionGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/configuracion.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>Panel de control técnico para personalizar el funcionamiento de MiniMarket Pro y realizar mantenimiento crítico.</p>

      <div className="space-y-4">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
          <h5 className="font-semibold text-xs text-blue-600 uppercase mb-2">🏢 Datos del Negocio</h5>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Razón Social, RUC y contacto. Esta información aparecerá en la cabecera de tus boletas y es vital para la legalidad.</p>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
          <h5 className="font-semibold text-xs text-blue-600 uppercase mb-2">📡 Identidad de Sede</h5>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Configura el ID único (ej. SEDE-SUR) y la URL de la Sede Central si eres una sucursal.</p>
        </div>
      </div>

      <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 space-y-4">
        <h4 className="font-semibold text-blue-700 dark:text-blue-300 text-sm uppercase tracking-widest flex items-center gap-2">
          <Settings size={16} />
          Mantenimiento de Datos
        </h4>
        <ul className="text-xs space-y-3">
          <li>• <strong>Optimizar Tablas:</strong> Compacta la base de datos para mejorar la velocidad.</li>
          <li>• <strong>Respaldar Datos:</strong> Crea una copia de seguridad (Backup) recomendada semanalmente en USB.</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h5 className="font-semibold text-xs uppercase tracking-widest text-zinc-400">🔔 Preferencias</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Alertas de Stock Crítico</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Cierre de Sesión Automático</div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
        <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
        <p className="text-xs text-red-700 dark:text-red-400"><strong>CAUCIÓN:</strong> Una URL de Central incorrecta impedirá que tu sucursal envíe sus ventas al servidor principal.</p>
      </div>
    </div>
  );
}
