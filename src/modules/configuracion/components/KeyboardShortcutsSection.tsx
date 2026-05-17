import { useState } from 'react';
import { Keyboard, Plus, Trash2, ArrowRight } from 'lucide-react';
import { preferenciasService, type AppPreferences } from '../preferenciasService';
import { notificationService } from '../../../lib/notifications';
import { Button } from '../../../components/ui/Button';
import { allNavItems } from '../../../config/navigation';

export function KeyboardShortcutsSection() {
  const [prefs, setPrefs] = useState<AppPreferences>(preferenciasService.get());
  const [newShortcutCombo, setNewShortcutCombo] = useState('');
  const [newShortcutPath, setNewShortcutPath] = useState(allNavItems[0].to);
  const [isRecordingCombo, setIsRecordingCombo] = useState(false);

  const handleAddShortcut = () => {
    if (!newShortcutCombo) {
      notificationService.warning('Atajo incompleto', 'Debes presionar una combinación de teclas primero.');
      return;
    }
    
    const current = preferenciasService.get();
    const currentShortcuts = current.shortcuts || {};

    const existingComboForPath = Object.keys(currentShortcuts).find(key => currentShortcuts[key] === newShortcutPath);
    if (existingComboForPath) {
      notificationService.warning('Vista ya asignada', `Esta vista ya tiene el atajo ${existingComboForPath}. Elimínalo primero.`);
      return;
    }

    if (currentShortcuts[newShortcutCombo]) {
      notificationService.warning('Atajo en uso', 'Esta combinación de teclas ya está asignada a otra vista.');
      return;
    }

    const updatedShortcuts = { ...currentShortcuts, [newShortcutCombo]: newShortcutPath };
    const updated = { ...current, shortcuts: updatedShortcuts };
    
    preferenciasService.save(updated as AppPreferences);
    setPrefs(updated as AppPreferences);
    
    setNewShortcutCombo('');
    setIsRecordingCombo(false);
    notificationService.success('Atajo Guardado', `La combinación ${newShortcutCombo} ahora abre una nueva vista.`);
  };

  const handleRemoveShortcut = (combo: string) => {
    const current = preferenciasService.get();
    const updatedShortcuts = { ...current.shortcuts };
    delete updatedShortcuts[combo];
    const updated = { ...current, shortcuts: updatedShortcuts };
    
    preferenciasService.save(updated as AppPreferences);
    setPrefs(updated as AppPreferences);
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6 border-b border-zinc-50 dark:border-zinc-700/50 bg-zinc-50/30 dark:bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
            <Keyboard size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-white tracking-tight">Atajos de Teclado</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Configura atajos rápidos para navegar entre las vistas.</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div className="bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="select-vista-shortcut" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Seleccionar Vista</label>
              <select 
                id="select-vista-shortcut"
                value={newShortcutPath}
                onChange={(e) => setNewShortcutPath(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-medium border border-zinc-100 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {allNavItems.map(item => {
                  const isAssigned = Object.values(prefs.shortcuts || {}).includes(item.to);
                  return (
                    <option key={item.to} value={item.to}>
                      {item.label} {isAssigned ? '(Ya asignado)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="combo-teclas-shortcut" className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Combinación de Teclas</label>
              <div className="flex gap-2">
                <button 
                  id="combo-teclas-shortcut"
                  type="button"
                  onClick={() => {
                    setIsRecordingCombo(true);
                    setNewShortcutCombo('');
                  }}
                  onKeyDown={(e) => {
                    if (!isRecordingCombo) return;
                    e.preventDefault();
                    
                    const keys = [];
                    if (e.ctrlKey) keys.push('Ctrl');
                    if (e.altKey) keys.push('Alt');
                    if (e.shiftKey) keys.push('Shift');
                    
                    if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
                      const keyName = e.key === ' ' ? 'Space' : e.key.toUpperCase();
                      keys.push(keyName);
                    }

                    if (keys.length > 0) {
                      setNewShortcutCombo(keys.join('+'));
                      if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
                        setIsRecordingCombo(false);
                      }
                    }
                  }}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium border rounded-2xl transition-all text-left ${isRecordingCombo ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]' : 'border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500'}`}
                >
                  {isRecordingCombo ? 'Presiona una combinación...' : (newShortcutCombo || 'Haz clic aquí para grabar')}
                </button>
                <Button 
                  onClick={handleAddShortcut}
                  disabled={!newShortcutCombo}
                  className="px-4 py-2.5 rounded-2xl"
                  icon={<Plus size={18} />}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {Object.entries(prefs.shortcuts || {}).length > 0 ? (
              Object.entries(prefs.shortcuts || {}).map(([combo, path]) => {
                const viewLabel = allNavItems.find(i => i.to === path)?.label || path;
                return (
                  <div key={combo} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold rounded-lg border border-zinc-200 dark:border-zinc-600">
                        {combo}
                      </div>
                      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <ArrowRight size={14} />
                        {viewLabel}
                      </span>
                    </div>
                    <Button 
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      onClick={() => handleRemoveShortcut(combo)}
                      className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                    />
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 italic text-center py-4">No hay atajos configurados.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
