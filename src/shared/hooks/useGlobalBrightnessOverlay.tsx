import { useEffect, useState } from 'react';
import { preferenciasService } from '../../modules/configuracion/preferenciasService';

export function GlobalBrightnessOverlay() {
  const [brightness, setBrightness] = useState(100);

  useEffect(() => {
    const updateBrightness = () => {
      const prefs = preferenciasService.get();
      setBrightness(prefs.brightness ?? 100);
    };

    updateBrightness();
    window.addEventListener('preferences-updated', updateBrightness);

    return () => window.removeEventListener('preferences-updated', updateBrightness);
  }, []);

  if (brightness >= 100) return null;

  const opacity = 1 - (brightness / 100);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        pointerEvents: 'none',
        zIndex: 99999,
        transition: 'background-color 0.3s ease'
      }}
    />
  );
}
