import { useState, useEffect } from 'react';
import { ShieldAlert, Key, ArrowRight } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { notificationService } from '../../shared/lib/notifications';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';

interface LicensePageProps {
  onValidated: () => void;
}

export function LicensePage({ onValidated }: LicensePageProps) {
  const [key, setKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hardwareId, setHardwareId] = useState('');

  useEffect(() => {
    invoke<string>('get_hardware_id')
      .then(setHardwareId)
      .catch(console.error);
  }, []);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setIsLoading(true);
    try {
      const isValid = await invoke<boolean>('verify_license', { key: key.trim() });
      if (isValid) {
        notificationService.success('Licencia activada', 'Gracias por adquirir MiniMarket-App.');
        onValidated();
      }
    } catch (error: any) {
      notificationService.error('Error de Activación', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 overflow-hidden relative p-4">
      <div className="absolute top-[-10%] left-[-10%] size-96 bg-red-500/20 rounded-full blur-3xl opacity-50 dark:opacity-20 animate-pulse"></div>

      <div className="relative w-full max-w-md bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl p-8 border border-zinc-200 dark:border-zinc-700">

        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
            <ShieldAlert size={40} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Activación Requerida</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Tu sistema requiere una licencia válida para operar. Por favor, ingresa tu clave de activación.
          </p>
        </div>

        <form onSubmit={handleValidate} className="space-y-6">
          <Input
            label="Clave de Licencia"
            placeholder="Ej: MM-2026-ABCD-1234"
            icon={<Key size={18} />}
            required
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />

          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
            size="lg"
            icon={<ArrowRight size={18} />}
            iconPosition="right"
            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900"
          >
            Activar Sistema
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-700/50 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            Identificador de este equipo (Hardware ID):
          </p>
          <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 break-all select-all">
            {hardwareId || 'Cargando...'}
          </code>
        </div>
      </div>
    </div>
  );
}
