import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { preferenciasService } from '../../modules/configuracion/preferenciasService';

export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const [shortcuts, setShortcuts] = useState<Record<string, string>>({});

  const loadShortcuts = useCallback(() => {
    const prefs = preferenciasService.get();
    setShortcuts(prefs.shortcuts || {});
  }, []);

  useEffect(() => {
    // Cargar atajos al inicializar
    loadShortcuts();

    // Escuchar actualizaciones
    const handleUpdate = () => loadShortcuts();
    window.addEventListener('preferences-updated', handleUpdate);

    return () => {
      window.removeEventListener('preferences-updated', handleUpdate);
    };
  }, [loadShortcuts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input, textarea, etc.
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Construir la representación de la combinación de teclas presionada
      const keys = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');

      // Añadir la tecla principal si no es modificadora
      if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
        const keyName = e.key === ' ' ? 'Space' : e.key.toUpperCase();
        keys.push(keyName);
      }

      if (keys.length === 0) return;

      const combo = keys.join('+');

      // Buscar si el atajo existe en la configuración
      if (shortcuts[combo]) {
        e.preventDefault(); // Evitar el comportamiento por defecto del navegador (si aplica)
        navigate(shortcuts[combo]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, navigate]);
}
