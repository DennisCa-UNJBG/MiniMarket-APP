import { useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Download, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';

export function UpdaterSection() {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'up-to-date' | 'error' | 'success'>('idle');
  const [message, setMessage] = useState('');

  const checkForUpdates = async () => {
    try {
      setIsChecking(true);
      setStatus('idle');
      setMessage('');

      const update = await check();

      if (update) {
        // Hay una actualización disponible
        const confirm = window.confirm(
          `¡Nueva versión encontrada! (${update.version})\n\n¿Deseas descargar e instalar la actualización ahora?`
        );

        if (confirm) {
          setIsDownloading(true);
          
          let downloaded = 0;
          let contentLength = 0;
          
          // Descargar e instalar
          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case 'Started':
                contentLength = event.data.contentLength || 0;
                setMessage(`Descargando... 0%`);
                break;
              case 'Progress':
                downloaded += event.data.chunkLength;
                if (contentLength > 0) {
                  const percent = Math.round((downloaded / contentLength) * 100);
                  setMessage(`Descargando... ${percent}%`);
                }
                break;
              case 'Finished':
                setMessage('Instalando actualización...');
                break;
            }
          });

          setStatus('success');
          setMessage('Actualización completada. Reiniciando...');
          
          // Reiniciar la app
          setTimeout(async () => {
            await relaunch();
          }, 2000);
        }
      } else {
        // No hay actualizaciones
        setStatus('up-to-date');
        setMessage('Tienes la última versión instalada.');
      }
    } catch (error: any) {
      console.error('Error al buscar actualizaciones:', error);
      setStatus('error');
      setMessage('Ocurrió un error al buscar actualizaciones. Revisa tu conexión a internet.');
    } finally {
      setIsChecking(false);
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Download size={20} className="text-blue-500" />
            Actualizaciones
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Busca e instala nuevas versiones del sistema.
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={checkForUpdates}
          disabled={isChecking || isDownloading}
          className="gap-2"
        >
          <RefreshCw size={16} className={isChecking || isDownloading ? 'animate-spin' : ''} />
          {isChecking ? 'Buscando...' : isDownloading ? 'Actualizando...' : 'Buscar'}
        </Button>
      </div>

      {status !== 'idle' && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          status === 'up-to-date' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
          status === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
          status === 'success' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : ''
        }`}>
          {status === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-medium text-sm">{message}</span>
        </div>
      )}
      
      {isDownloading && status === 'idle' && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 flex items-center gap-3">
          <Download size={20} className="animate-bounce" />
          <span className="font-medium text-sm">{message}</span>
        </div>
      )}
    </div>
  );
}
