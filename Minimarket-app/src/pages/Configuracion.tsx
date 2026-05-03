import { Store, User, Database, Bell, Palette } from 'lucide-react';

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
        <Icon size={18} className="text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, defaultValue, type = 'text' }: { label: string; defaultValue: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
      />
    </div>
  );
}

export function Configuracion() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Configuración</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ajustes generales del sistema</p>
      </div>

      {/* Datos de la empresa */}
      <Section icon={Store} title="Datos de la empresa">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre del negocio"   defaultValue="Minimarket El Sol" />
          <Field label="RUC"                  defaultValue="20123456789" />
          <Field label="Dirección"            defaultValue="Av. Principal 123, Tacna" />
          <Field label="Teléfono"             defaultValue="052 123 456" />
        </div>
        <button className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
          Guardar cambios
        </button>
      </Section>

      {/* Usuario */}
      <Section icon={User} title="Cuenta de usuario">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre"         defaultValue="Administrador" />
          <Field label="Usuario"        defaultValue="admin" />
          <Field label="Contraseña"     defaultValue="••••••••" type="password" />
          <Field label="Confirmar contraseña" defaultValue="" type="password" />
        </div>
        <button className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
          Actualizar contraseña
        </button>
      </Section>

      {/* Base de datos */}
      <Section icon={Database} title="Base de datos">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Archivo de base de datos</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">minimarket.db · SQLite</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[11px] font-semibold rounded-full">
              Conectado
            </span>
          </div>
          <button className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Exportar copia de seguridad
          </button>
        </div>
      </Section>

      {/* Notificaciones */}
      <Section icon={Bell} title="Notificaciones">
        {[
          { label: 'Alertas de stock bajo',        desc: 'Notificar cuando el stock sea menor al mínimo' },
          { label: 'Resumen diario de ventas',     desc: 'Mostrar resumen al cerrar la aplicación' },
        ].map(({ label, desc }) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
            </div>
            {/* Toggle switch */}
            <button className="w-10 h-5 bg-indigo-500 rounded-full relative flex-shrink-0 transition-colors">
              <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform" />
            </button>
          </div>
        ))}
      </Section>

      {/* Apariencia */}
      <Section icon={Palette} title="Apariencia">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          El toggle de tema claro/oscuro está disponible en la parte inferior del menú lateral.
        </p>
      </Section>
    </div>
  );
}
