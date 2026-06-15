import { Info, Lightbulb, CheckCircle2, Eye, PowerOff } from 'lucide-react';

export function InventarioGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/inventario.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>La vista de <strong>Inventario</strong> es tu herramienta principal para la supervisión física de tu almacén. Aquí te enfocas exclusivamente en las <strong>cantidades</strong> y en la gestión rápida de cada producto.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center">
          <span className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Productos</span>
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">CATÁLOGO</span>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-center">
          <span className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Stock Bajo</span>
          <span className="text-xl font-black text-amber-700 dark:text-amber-400">REPOSICIÓN</span>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 text-center">
          <span className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Sin Stock</span>
          <span className="text-xl font-black text-red-700 dark:text-red-400">FALTA</span>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">
          <Info size={16} className="text-emerald-500" />
          Exploración y Filtrado
        </h4>
        <ul className="space-y-4 text-xs">
          <li className="flex gap-3 items-start">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>Buscador:</strong> Localiza productos específicos por nombre o código de barras.</span>
          </li>
          <li className="flex gap-3 items-start">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>Alertas Visuales:</strong> El icono (⚠️) aparece al lado de la cantidad en stock bajo. Las filas se resaltan en rojo para faltas críticas.</span>
          </li>
          <li className="flex gap-3 items-start">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>Estado Detallado:</strong> Etiquetas de colores indican "En stock", "Stock bajo" o "Sin stock".</span>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">
          <Eye size={16} className="text-blue-500" />
          Acciones de Producto
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={14} className="text-zinc-600 dark:text-zinc-400" />
              <strong className="text-zinc-800 dark:text-zinc-200">Ver Detalle:</strong>
            </div>
            Visualiza el historial de entradas y salidas y el rendimiento específico de un solo producto a lo largo del tiempo.
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
            <div className="flex items-center gap-2 mb-2">
              <PowerOff size={14} className="text-orange-500" />
              <strong className="text-orange-700 dark:text-orange-400">Desactivar Producto:</strong>
            </div>
            Oculta el producto del inventario activo y del punto de venta sin eliminar su historial. Perfecto para productos descontinuados.
          </div>
        </div>
      </div>

      <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-700 space-y-4">
        <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 text-sm uppercase tracking-widest">
          <Lightbulb size={16} />
          ¿Cuándo usar esta vista?
        </h4>
        <ul className="space-y-3 text-xs text-zinc-500 dark:text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">•</span>
            <span><strong>Auditoría de Pasillo:</strong> Compara el stock del sistema con los estantes físicos usando una tablet.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">•</span>
            <span><strong>Planificación de Pedidos:</strong> Filtra por "Stock Bajo" antes de contactar proveedores.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">•</span>
            <span><strong>Limpieza de Catálogo:</strong> Usa el botón de Desactivar para limpiar productos que ya no vendes.</span>
          </li>
        </ul>
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-400"><strong>NOTA:</strong> El stock se actualiza automáticamente con cada Venta y Compra. No necesitas modificarlo manualmente aquí.</p>
      </div>
    </div>
  );
}
