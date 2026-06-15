import { Info, Lightbulb, CheckCircle2 } from 'lucide-react';

export function BienvenidaGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/bienvenida.jpg"
          alt="Pantalla de Bienvenida a MiniMarket Pro"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>¡Bienvenido al manual detallado de <strong>MiniMarket Pro</strong>!</p>
      <p>Este conjunto de guías ha sido diseñado para proporcionarte una explicación exhaustiva de cada módulo del sistema. Aquí encontrarás no solo qué hace cada vista, sino cómo utilizarla paso a paso para maximizar la eficiencia de tu negocio.</p>

      <div className="space-y-3">
        <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
          <Info size={16} className="text-blue-500" />
          🗂️ Estructura del Manual
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">El manual está dividido en 18 capítulos que cubren desde el Dashboard hasta el sistema de Auditoría de Sistemas y Reportes, organizados para un aprendizaje progresivo.</p>
      </div>

      <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800 space-y-4">
        <h4 className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2 text-sm uppercase tracking-widest">
          <Lightbulb size={16} />
          Consejos Generales de Navegación
        </h4>
        <ul className="space-y-3 text-xs">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <span><strong>Menú Lateral:</strong> Utiliza la barra lateral para moverte rápidamente entre los módulos.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <span><strong>Modo Oscuro/Claro:</strong> El sistema se adapta a tu preferencia visual desde la esquina superior.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <span><strong>Búsqueda Inteligente:</strong> La mayoría de las tablas incluyen un buscador que filtra por múltiples campos simultáneamente.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <span><strong>Atajos de Teclado:</strong> En el Punto de Venta, enfócate en el campo de búsqueda para usar tu escáner de códigos de barras sin interrupciones.</span>
          </li>
        </ul>
      </div>
      <p className="text-xs italic text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-700 pt-4 text-center">MiniMarket Pro - Gestión Inteligente para tu Negocio.</p>
    </div>
  );
}
