import { AlertCircle } from 'lucide-react';

export function LoginGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/login.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>La seguridad de tu información comienza aquí. Solo personal autorizado puede ingresar a MiniMarket Pro.</p>

      <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 space-y-4">
        <h4 className="font-semibold text-blue-700 dark:text-blue-300 text-sm uppercase tracking-widest">🚪 Cómo Iniciar Sesión</h4>
        <ol className="text-xs list-decimal list-inside space-y-2 text-zinc-500 dark:text-zinc-400">
          <li>Ingresa tu <strong>Usuario</strong> asignado (ej. admin).</li>
          <li>Escribe tu <strong>Contraseña</strong> secreta (oculta por seguridad).</li>
          <li>Haz clic en "Ingresar al sistema".</li>
        </ol>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-zinc-800 dark:text-white text-sm uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700 pb-2">🔒 Seguridad y Acceso</h4>
        <ul className="text-xs space-y-3 text-zinc-500 dark:text-zinc-400">
          <li>• <strong>Encriptación:</strong> Claves protegidas por algoritmos avanzados.</li>
          <li>• <strong>Roles:</strong> El sistema limita funciones automáticamente según tu perfil.</li>
          <li>• <strong>Cierre de Sesión:</strong> Usa el botón en el menú lateral para salir de forma segura.</li>
        </ul>
      </div>

      <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
        <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
        <p className="text-xs text-red-700 dark:text-red-400"><strong>CAUCIÓN:</strong> Nunca dejes tu sesión abierta si te alejas. ¡La seguridad es responsabilidad de todos!</p>
      </div>
    </div>
  );
}
