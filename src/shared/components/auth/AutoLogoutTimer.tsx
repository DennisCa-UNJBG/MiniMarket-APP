import { useReducer, useEffect } from 'react';
import { preferenciasService } from '../../../modules/configuracion/preferenciasService';
import { Timer } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type TimerState = number | null;
type TimerAction = { type: 'SET_TIME_LEFT'; payload: number | null };

function timerReducer(_state: TimerState, action: TimerAction): TimerState {
  return action.payload;
}

export function AutoLogoutTimer() {
  const { user } = useAuth();
  const [timeLeft, dispatch] = useReducer(timerReducer, null);

  useEffect(() => {
    if (!user) return;
    let prefs = preferenciasService.get();

    const check = () => {
      if (!prefs.enableAutoLogout) {
        dispatch({ type: 'SET_TIME_LEFT', payload: null });
        return;
      }
      // @ts-ignore
      const last = window.__lastActivityTime ||= Date.now();
      const nextTimeLeft = Math.max(0, Math.floor((prefs.inactivityTimeout * 60000 - (Date.now() - last)) / 1000));
      dispatch({ type: 'SET_TIME_LEFT', payload: nextTimeLeft });
    };

    const update = () => {
      prefs = preferenciasService.get();
      check();
    };

    const id = setInterval(check, 1000);
    window.addEventListener('preferences-updated', update);
    check();

    return () => {
      clearInterval(id);
      window.removeEventListener('preferences-updated', update);
    };
  }, [user]);

  if (timeLeft === null) return null;

  const warn = timeLeft <= 60;
  const format = (n: number) => n.toString().padStart(2, '0');

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm border ${warn ? 'bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400 animate-pulse'
          : 'bg-white border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'
        }`}
      title="Cierre de sesión automático"
    >
      <Timer size={14} className={warn ? 'text-red-500' : 'text-zinc-400'} />
      <span>{format(Math.floor(timeLeft / 60))}:{format(timeLeft % 60)}</span>
    </div>
  );
}
