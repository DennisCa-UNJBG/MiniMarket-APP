import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LicensePage } from '../../../modules/license/LicensePage';

interface LicenseGuardProps {
  children: React.ReactNode;
}

export function LicenseGuard({ children }: LicenseGuardProps) {
  const [isValidated, setIsValidated] = useState<boolean | null>(null);

  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    try {
      // Intentamos revisar la caché local (válida por fecha)
      const cachedKey = await invoke<string>('check_local_license');
      if (cachedKey) {
        // En background, intentamos actualizar el estado desde internet
        // pero no bloqueamos el UI si no hay internet (fail-soft).
        invoke<boolean>('verify_license', { key: cachedKey }).catch(() => {
          // Fallo silencioso si no hay internet, la caché local ya aprobó
          console.log("No se pudo verificar online, operando con caché local.");
        });
        
        setIsValidated(true);
        return;
      }
    } catch (e) {
      console.warn("Licencia local no encontrada o expirada:", e);
    }
    setIsValidated(false);
  };

  if (isValidated === null) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="size-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Verificando licencia de uso...</p>
      </div>
    );
  }

  if (!isValidated) {
    return <LicensePage onValidated={() => setIsValidated(true)} />;
  }

  return <>{children}</>;
}
