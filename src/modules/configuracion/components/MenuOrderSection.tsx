import { useState, useEffect } from 'react';
import { ListOrdered, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { preferenciasService, type AppPreferences } from '../preferenciasService';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { mainNavItems } from '../../../config/navigation';
import { notificationService } from '../../../shared/lib/notifications';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableMenuItemProps {
  path: string;
  item: any;
  index: number;
  totalItems: number;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
}

function SortableMenuItem({ path, item, index, totalItems, moveUp, moveDown }: SortableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: path });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-xl border transition-colors
        ${isDragging ? 'opacity-80 border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg z-10 relative' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900 shadow-sm'}
      `}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="flex items-center gap-3 flex-1 cursor-grab active:cursor-grabbing outline-none"
      >
        {/* Grip handle for dragging */}
        <div className="text-zinc-400 dark:text-zinc-500 p-1.5 -ml-1.5 rounded-md transition-colors">
          <GripVertical size={18} />
        </div>
        <div className="p-1.5 bg-white dark:bg-zinc-800 rounded-md shadow-sm border border-zinc-100 dark:border-zinc-700">
          <Icon size={16} className="text-zinc-600 dark:text-zinc-400" />
        </div>
        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 select-none">{item.label}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => moveUp(index)}
          disabled={index === 0}
          className="p-1.5 text-zinc-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <ArrowUp size={16} />
        </button>
        <button
          onClick={() => moveDown(index)}
          disabled={index === totalItems - 1}
          className="p-1.5 text-zinc-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <ArrowDown size={16} />
        </button>
      </div>
    </div>
  );
}

export function MenuOrderSection() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<AppPreferences>(() => preferenciasService.get());
  const [orderedPaths, setOrderedPaths] = useState<string[]>([]);

  // Configuración de sensores para dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requiere mover 5px antes de arrastrar (evita clics accidentales)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!user) return;
    
    const currentOrders = prefs.userMenuOrder || {};
    const savedOrder = currentOrders[user.username] || [];
    
    const defaultPaths = mainNavItems.map(item => item.to);
    const validSaved = savedOrder.filter(path => defaultPaths.includes(path));
    const missing = defaultPaths.filter(path => !validSaved.includes(path));
    
    setOrderedPaths([...validSaved, ...missing]);
  }, [user, prefs.userMenuOrder]);

  const saveOrder = (newPaths: string[]) => {
    if (!user) return;
    
    setOrderedPaths(newPaths);
    
    const current = preferenciasService.get();
    const currentOrders = current.userMenuOrder || {};
    
    const updated = {
      ...current,
      userMenuOrder: {
        ...currentOrders,
        [user.username]: newPaths
      }
    };
    
    preferenciasService.save(updated as AppPreferences);
    setPrefs(updated as AppPreferences);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newPaths = [...orderedPaths];
    const temp = newPaths[index];
    newPaths[index] = newPaths[index - 1];
    newPaths[index - 1] = temp;
    saveOrder(newPaths);
  };

  const moveDown = (index: number) => {
    if (index === orderedPaths.length - 1) return;
    const newPaths = [...orderedPaths];
    const temp = newPaths[index];
    newPaths[index] = newPaths[index + 1];
    newPaths[index + 1] = temp;
    saveOrder(newPaths);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = orderedPaths.indexOf(active.id as string);
      const newIndex = orderedPaths.indexOf(over.id as string);
      const newOrder = arrayMove(orderedPaths, oldIndex, newIndex);
      saveOrder(newOrder);
    }
  };

  const resetOrder = () => {
    if (!user) return;
    
    const current = preferenciasService.get();
    const currentOrders = { ...current.userMenuOrder };
    delete currentOrders[user.username];
    
    const updated = {
      ...current,
      userMenuOrder: currentOrders
    };
    
    preferenciasService.save(updated as AppPreferences);
    setPrefs(updated as AppPreferences);
    notificationService.success('Restablecido', 'El menú ha vuelto a su orden por defecto.');
  };

  if (!user) return null;

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6 border-b border-zinc-50 dark:border-zinc-700/50 bg-zinc-50/30 dark:bg-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
              <ListOrdered size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-800 dark:text-white tracking-tight">Orden del Menú Lateral</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Personaliza cómo se muestran las opciones para tu cuenta ({user.username}).</p>
            </div>
          </div>
          <button
            onClick={resetOrder}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Restaurar Original
          </button>
        </div>
      </div>
      <div className="p-6">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={orderedPaths}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {orderedPaths.map((path, index) => {
                const item = mainNavItems.find(i => i.to === path);
                if (!item) return null;
                return (
                  <SortableMenuItem 
                    key={path} 
                    path={path} 
                    item={item} 
                    index={index} 
                    totalItems={orderedPaths.length}
                    moveUp={moveUp} 
                    moveDown={moveDown}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
