import { ShieldCheck, Plus, AlertCircle } from 'lucide-react';

export function UsuariosGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl my-6">
        <img
          src="/docs/usuarios.png"
          alt="Pantalla de la guía"
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
      <p>El módulo de <strong>Usuarios</strong> es vital para proteger la integridad de tu información. Define quién tiene permiso para entrar y qué acciones puede realizar.</p>

      <div className="grid grid-cols-1 gap-4">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/20 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <span className="font-bold text-zinc-700 dark:text-zinc-300 text-xs block mb-1">1. Administrador:</span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Acceso total a todas las vistas, incluyendo configuración, reportes financieros y eliminación de datos.</p>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/20 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <span className="font-bold text-zinc-700 dark:text-zinc-300 text-xs block mb-1">2. Cajero / Vendedor:</span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Acceso limitado principalmente al Punto de Venta, Inventario y sus propias ventas. No ve reportes de rentabilidad avanzada.</p>
        </div>
      </div>

      <div className="p-6 bg-zinc-100 dark:bg-zinc-900/40 rounded-[2.5rem] space-y-5 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <h4 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
          <Plus size={16} />
          Registro de Nuevo Usuario
        </h4>
        <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-3">
          <li>• <strong>Username:</strong> Nombre corto para iniciar sesión (ej. jdoe).</li>
          <li>• <strong>Contraseña:</strong> Clave segura de al menos 4 caracteres.</li>
          <li>• <strong>Rol y Sede:</strong> Define sus permisos y local asignado.</li>
        </ul>
      </div>

      <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 space-y-3">
        <h4 className="font-semibold text-blue-700 dark:text-blue-300 text-sm uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck size={16} />
          Gestión de Estados
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Si un empleado deja de trabajar, cámbialo a <strong>INACTIVO</strong>. Nunca lo elimines; esto mantiene el rastro de sus operaciones en los reportes históricos por auditoría.</p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
        <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
        <p className="text-xs text-red-700 dark:text-red-400"><strong>IMPORTANTE:</strong> Nunca compartas tu cuenta de Administrador. Cada cajero debe tener su propio usuario para el cuadre de caja.</p>
      </div>
    </div>
  );
}
