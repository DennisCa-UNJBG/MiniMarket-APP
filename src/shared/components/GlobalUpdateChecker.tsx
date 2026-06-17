import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Download, RefreshCw, X } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export function GlobalUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Buscar actualizaciones al iniciar la aplicación, retrasado unos segundos
    // para no bloquear la interfaz principal durante la carga inicial.
    const timer = setTimeout(() => {
      checkForUpdatesSilent();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const checkForUpdatesSilent = async () => {
    try {
      const update = await check();
      if (update) {
        setUpdateAvailable(update);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Error silencioso al buscar actualizaciones:', error);
    }
  };

  const handleUpdate = async () => {
    if (!updateAvailable) return;
    
    setIsDownloading(true);
    let downloaded = 0;
    let contentLength = 0;
    
    try {
      await updateAvailable.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            setStatusText(`Iniciando descarga...`);
            setProgress(0);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              const percent = Math.round((downloaded / contentLength) * 100);
              setProgress(percent);
              setStatusText(`Descargando... ${percent}%`);
            }
            break;
          case 'Finished':
            setStatusText('Instalando actualización...');
            setProgress(100);
            break;
        }
      });

      setStatusText('¡Actualización completada! Reiniciando la aplicación...');
      
      setTimeout(async () => {
        await relaunch();
      }, 2000);
      
    } catch (error) {
      console.error('Error al actualizar:', error);
      setStatusText('Error al instalar la actualización. Inténtalo más tarde.');
      setIsDownloading(false);
    }
  };

  if (!isOpen || !updateAvailable) return null;

  return (
    <Modal
      title="¡Nueva versión disponible!"
      onClose={() => !isDownloading && setIsOpen(false)}
      maxWidth="md"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-4">
          <div className="bg-blue-500 text-white p-3 rounded-full shrink-0">
            <Download size={24} />
          </div>
          <div>
            <h4 className="text-blue-900 dark:text-blue-200 font-bold text-lg">
              Versión {updateAvailable.version}
            </h4>
            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
              Hemos lanzado una nueva actualización con mejoras y correcciones. Te recomendamos instalarla para disfrutar de la mejor experiencia.
            </p>
          </div>
        </div>

        {updateAvailable.body && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <h5 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Notas de la versión:</h5>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
              {updateAvailable.body || "Mejoras de rendimiento y corrección de errores menores."}
            </p>
          </div>
        )}

        {isDownloading ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-zinc-700 dark:text-zinc-300">{statusText}</span>
              <span className="text-blue-600 dark:text-blue-400">{progress}%</span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              variant="secondary"
              onClick={() => setIsOpen(false)}
            >
              Recordarme después
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdate}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw size={18} />
              Actualizar ahora
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
