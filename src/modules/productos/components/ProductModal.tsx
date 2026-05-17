import { Scale, Search, AlertTriangle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { type Category } from '../categoriaService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: number | null;
  form: { code: string; name: string; categoryId: string; unitId: string; sellPrice: string; minStock: string };
  setForm: (payload: any) => void;
  isSubmitted: boolean;
  errors: { name: string | null; sellPrice: string | null; minStock: string | null; categoryId: string | null; unitId: string | null };
  unitSearch: string;
  setUnitSearch: (val: string) => void;
  showUnitList: boolean;
  setShowUnitList: (val: boolean) => void;
  units: any[];
  filteredUnits: any[];
  catSearch: string;
  setCatSearch: (val: string) => void;
  showCatList: boolean;
  setShowCatList: (val: boolean) => void;
  categories: Category[];
  filteredCategories: any[];
  onSave: () => void;
  isPending: boolean;
}

export function ProductModal({
  isOpen,
  onClose,
  editingId,
  form,
  setForm,
  isSubmitted,
  errors,
  unitSearch,
  setUnitSearch,
  showUnitList,
  setShowUnitList,
  units,
  filteredUnits,
  catSearch,
  setCatSearch,
  showCatList,
  setShowCatList,
  categories,
  filteredCategories,
  onSave,
  isPending
}: ProductModalProps) {
  const inputCls = 'w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition';

  if (!isOpen) return null;

  return (
    <Modal title={editingId ? "Editar producto" : "Agregar nuevo producto"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="codigo-correlativo" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Código correlativo</label>
          <input 
            id="codigo-correlativo"
            className={`${inputCls} font-mono bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed`} 
            readOnly 
            value={form.code} 
          />
        </div>
        <div className="flex flex-col gap-1.5 relative">
          <label htmlFor="unidad-medida" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Unidad de medida *</label>
          <div className="relative">
            <input 
              id="unidad-medida"
              type="text"
              className={`${inputCls} ${isSubmitted && errors.unitId ? 'border-red-300 dark:border-red-500/50' : ''}`}
              placeholder="Buscar unidad..."
              value={unitSearch}
              onFocus={() => setShowUnitList(true)}
              onChange={(e) => {
                setUnitSearch(e.target.value);
                setShowUnitList(true);
                const exact = units.find(u => u.nombre.toLowerCase() === e.target.value.toLowerCase() || u.abreviatura.toLowerCase() === e.target.value.toLowerCase());
                if (exact) setForm((prev: any) => ({ ...prev, unitId: exact.id.toString() }));
                else if (form.unitId) setForm((prev: any) => ({ ...prev, unitId: '' }));
              }}
            />
            <Scale size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
          {isSubmitted && errors.unitId && <p className="text-xs font-medium text-red-500 mt-1">{errors.unitId}</p>}

          {showUnitList && (
            <>
              <button
                type="button"
                aria-label="Cerrar lista de unidades"
                className="fixed inset-0 z-10 w-full h-full cursor-default bg-transparent border-none outline-none"
                onClick={() => setShowUnitList(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto py-1 animate-in fade-in zoom-in duration-150">
                {filteredUnits.length > 0 ? (
                  filteredUnits.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setForm((prev: any) => ({ ...prev, unitId: u.id.toString() }));
                        setUnitSearch(`${u.nombre} (${u.abreviatura})`);
                        setShowUnitList(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 ${form.unitId === u.id.toString() ? 'bg-blue-50 dark:bg-zinc-700 text-blue-600 dark:text-blue-400 font-medium' : 'text-zinc-700 dark:text-zinc-300'}`}
                    >
                      <Scale size={12} className="opacity-50" />
                      {u.nombre} ({u.abreviatura})
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-zinc-400 italic">No se encontraron unidades</div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="col-span-2 flex flex-col gap-1.5">
          <Input 
            autoFocus
            label="Nombre del producto *"
            placeholder="Ej. Arroz Costeño 1kg" 
            value={form.name} 
            onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value }))} 
            error={(isSubmitted && errors.name) || undefined}
          />
        </div>

        <div className="col-span-2 flex flex-col gap-1.5 relative">
          <label htmlFor="buscar-categoria" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Categoría *</label>
          <div className="relative">
            <input 
              id="buscar-categoria"
              type="text"
              className={`${inputCls} ${isSubmitted && errors.categoryId ? 'border-red-300 dark:border-red-500/50' : ''}`}
              placeholder="Buscar o seleccionar categoría..."
              value={catSearch}
              onFocus={() => setShowCatList(true)}
              onChange={(e) => {
                setCatSearch(e.target.value);
                setShowCatList(true);
                const exact = categories.find(c => c.nombre.toLowerCase() === e.target.value.toLowerCase());
                if (exact) setForm((prev: any) => ({ ...prev, categoryId: exact.id.toString() }));
                else if (form.categoryId) setForm((prev: any) => ({ ...prev, categoryId: '' }));
              }}
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
          {isSubmitted && errors.categoryId && <p className="text-xs font-medium text-red-500 mt-1">{errors.categoryId}</p>}
          
          {showCatList && (
            <>
              <button
                type="button"
                aria-label="Cerrar lista de categorías"
                className="fixed inset-0 z-10 w-full h-full cursor-default bg-transparent border-none outline-none"
                onClick={() => setShowCatList(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto py-1 animate-in fade-in zoom-in duration-150">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setForm((prev: any) => ({ ...prev, categoryId: c.id.toString() }));
                        setCatSearch(c.nombre);
                        setShowCatList(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 ${form.categoryId === c.id.toString() ? 'bg-blue-50 dark:bg-zinc-700 text-blue-600 dark:text-blue-400 font-medium' : 'text-zinc-700 dark:text-zinc-300'}`}
                    >
                      <div style={{ backgroundColor: c.color }} className="size-2 rounded-full"></div>
                      {c.nombre}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-zinc-400 italic">No se encontraron categorías</div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Input 
            type="number" step="0.01" 
            label="Precio de venta (S/)"
            placeholder="0.00" 
            value={form.sellPrice} 
            onChange={(e) => setForm((prev: any) => ({ ...prev, sellPrice: e.target.value }))} 
            error={(isSubmitted && errors.sellPrice) || undefined}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Input 
            type="number" 
            label="Stock mínimo"
            placeholder="0" 
            value={form.minStock} 
            onChange={(e) => setForm((prev: any) => ({ ...prev, minStock: e.target.value }))} 
            error={(isSubmitted && errors.minStock) || undefined}
          />
          {!(isSubmitted && errors.minStock) && (
            <div className="flex items-start gap-1.5 mt-0.5 pl-1">
              <AlertTriangle size={10} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-600 dark:text-amber-500 italic font-medium leading-tight">
                Aviso: Este valor activa las alertas críticas de reabastecimiento.
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose} className="text-zinc-600 dark:text-zinc-300">
          Cancelar
        </Button>
        <Button onClick={onSave} isLoading={isPending}>
          {editingId ? 'Actualizar' : 'Guardar'} producto
        </Button>
      </div>
    </Modal>
  );
}
