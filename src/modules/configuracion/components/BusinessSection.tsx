import { useState } from 'react';
import { Store, Save, Eye, EyeOff } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { negocioService, type DatosNegocio } from '../negocioService';
import { perudevsService } from '../perudevsService';
import { notificationService } from '../../../shared/lib/notifications';
import { Button } from '../../../shared/components/ui/Button';

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const inputId = `business-field-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
      />
    </div>
  );
}

export function BusinessSection({ initialData }: { initialData: DatosNegocio }) {
  const queryClient = useQueryClient();

  const [localNegocio, setLocalNegocio] = useState<DatosNegocio>(() => initialData);
  const [apiKey, setApiKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { data: hasKey, refetch: refetchHasKey } = useQuery({
    queryKey: ['perudevs-has-key'],
    queryFn: () => perudevsService.hasKey()
  });

  const saveNegocioMutation = useMutation({
    mutationFn: (data: DatosNegocio) => negocioService.save(data),
    onSuccess: () => {
      notificationService.success('Datos Actualizados', 'La información del negocio se guardó correctamente.');
      queryClient.invalidateQueries({ queryKey: ['negocio'] });
    }
  });

  const handleNegocioSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveNegocioMutation.mutateAsync(localNegocio);

      if (apiKey.trim()) {
        await perudevsService.saveKey(apiKey.trim());
        setApiKey('');
        refetchHasKey();
        notificationService.success('Clave API Guardada', 'La clave API de PeruDevs se registró de forma segura en el almacenamiento local.');
      }
    } catch (err: any) {
      notificationService.error('Error al guardar', err.message || 'No se pudo guardar la configuración.');
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6 border-b border-zinc-50 dark:border-zinc-700/50 bg-zinc-50/30 dark:bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
            <Store size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-white tracking-tight">Datos del Negocio</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Información que aparecerá en tus comprobantes.</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <form onSubmit={handleNegocioSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Razón Social" value={localNegocio.razon_social} onChange={val => setLocalNegocio(prev => ({ ...prev, razon_social: val }))} placeholder="Ej: Minimarket El Sol S.A.C." />
            <Field label="RUC / Identificación" value={localNegocio.ruc} onChange={val => setLocalNegocio(prev => ({ ...prev, ruc: val }))} placeholder="Ej: 20123456789" />
            <div className="sm:col-span-2">
              <Field label="Dirección Fiscal" value={localNegocio.direccion} onChange={val => setLocalNegocio(prev => ({ ...prev, direccion: val }))} placeholder="Av. Principal 123, Tacna" />
            </div>
            <Field label="Teléfono de Contacto" value={localNegocio.telefono} onChange={val => setLocalNegocio(prev => ({ ...prev, telefono: val }))} placeholder="Ej: 052 123 456" />
            <Field label="Correo Electrónico" value={localNegocio.email} onChange={val => setLocalNegocio(prev => ({ ...prev, email: val }))} placeholder="contacto@empresa.com" />
            <div className="sm:col-span-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="api-key-perudevs" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
                    Clave API PeruDevs (Consulta RUC/DNI)
                  </label>
                  {hasKey ? (
                    <span className="text-[10px] px-2 py-0.5 font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                      Configurada y Protegida
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 rounded-full border border-amber-100 dark:border-amber-900/30">
                      Sin Configurar
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="api-key-perudevs"
                    type={showPassword ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={hasKey ? "Escribe una nueva clave para reemplazar la existente o deja en blanco..." : "Ingresa la clave API..."}
                    className="w-full pl-4 pr-12 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 ml-1">
                  Esta clave se almacena en el almacenamiento seguro local de la aplicación y nunca en la base de datos SQL ni en el navegador.
                </p>
              </div>
            </div>
          </div>
          <Button
            type="submit"
            isLoading={saveNegocioMutation.isPending}
            className="w-full sm:w-auto px-6 py-2.5 font-bold rounded-2xl"
            icon={<Save size={18} />}
          >
            Guardar Datos del Negocio
          </Button>
        </form>
      </div>
    </div>
  );
}
