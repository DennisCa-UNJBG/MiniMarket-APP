import { Tag, AlertCircle, Plus } from 'lucide-react';

export function ProductosGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/productos.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>El módulo de <strong>Productos</strong> es el corazón de tu inventario. Aquí defines qué vendes, a qué precio y cómo se clasifica.</p>

      <div className="space-y-4">
        <h4 className="font-semibold text-zinc-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">
          <Tag size={16} className="text-rose-500" />
          Pestañas del Módulo
        </h4>
        <div className="grid grid-cols-1 gap-4 text-xs">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="font-bold text-rose-600 block mb-2">1. Pestaña de Productos:</span>
            <ul className="space-y-1 list-disc list-inside text-zinc-500 dark:text-zinc-400">
              <li><strong>Búsqueda:</strong> Filtra por nombre o código de barras.</li>
              <li><strong>Nuevo Producto:</strong> Genera códigos correlativos automáticos (ej. PROD-0005).</li>
              <li><strong>Editar:</strong> Modifica precios, nombres o categorías.</li>
              <li><strong>Desactivar:</strong> Oculta del POS pero mantiene historial.</li>
            </ul>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="font-bold text-rose-600 block mb-2">2. Pestaña de Categorías:</span>
            <p className="text-zinc-500 dark:text-zinc-400">Organiza por familias (Lácteos, Limpieza). Asigna colores únicos para identificación visual en el POS y consulta el contador de productos por categoría.</p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
            <span className="font-bold text-rose-600 block mb-2">3. Pestaña de Unidades de Medida:</span>
            <p className="text-zinc-500 dark:text-zinc-400">Define cómo cuantificas (Kilogramos, Unidades, Litros). Es esencial para que el stock se muestre correctamente (ej. "50 KG" vs "50 Unidades").</p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/30 space-y-4">
        <h4 className="font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2 text-sm uppercase tracking-widest">
          <Plus size={16} />
          Paso a Paso: Registrar Nuevo Producto
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
          <li>Haz clic en <strong>"+ Nuevo producto"</strong>.</li>
          <li>Escribe la <strong>Unidad de Medida</strong> (ej. "Kilo") y selecciónala.</li>
          <li>Ingresa el <strong>Nombre comercial</strong> (ej. "Arroz Costeño Extra 1kg").</li>
          <li>Elige la <strong>Categoría</strong> y define el <strong>Precio de Venta</strong>.</li>
          <li>Configura el <strong>Stock Mínimo</strong> de alerta.</li>
          <li>Guarda los cambios.</li>
        </ol>
      </div>

      <div className="space-y-2">
        <h5 className="font-semibold text-xs uppercase tracking-tighter text-zinc-400">Reactivación de Productos</h5>
        <p className="text-[10px] leading-relaxed text-zinc-500">Si desactivaste un producto por error, ve al final de la tabla de productos a la sección <strong>"Productos desactivados"</strong> para restaurarlo.</p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
        <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-400"><strong>IMPORTANTE:</strong> Se recomienda usar el código de barras real del producto con un lector láser para agilizar las ventas.</p>
      </div>
    </div>
  );
}
