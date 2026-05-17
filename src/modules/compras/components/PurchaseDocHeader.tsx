interface PurchaseDocHeaderProps {
  referencia: string;
  setReferencia: (val: string) => void;
  hasIGV: boolean;
  setHasIGV: (val: boolean) => void;
  igvPercent: number;
  setIgvPercent: (val: number) => void;
  metodoPago: 'EFECTIVO' | 'BANCO';
  setMetodoPago: (val: 'EFECTIVO' | 'BANCO') => void;
  defaultDate: string;
}

export function PurchaseDocHeader({
  referencia,
  setReferencia,
  hasIGV,
  setHasIGV,
  igvPercent,
  setIgvPercent,
  metodoPago,
  setMetodoPago,
  defaultDate
}: PurchaseDocHeaderProps) {
  const inputCls = 'w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition';

  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-700/30 rounded-xl border border-zinc-100 dark:border-zinc-700">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="compra-num-doc" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex justify-between">
          <span>N° Documento <span className="text-red-500">*</span></span>
        </label>
        <input 
          id="compra-num-doc"
          className={`${inputCls} uppercase ${!referencia ? 'border-amber-200 dark:border-amber-900/50' : ''}`} 
          placeholder="Ej. F001-000123" 
          value={referencia} 
          onChange={(e) => setReferencia(e.target.value.toUpperCase())} 
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="compra-fecha" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Fecha</label>
        <input id="compra-fecha" type="date" className={inputCls} defaultValue={defaultDate} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="compra-igv-percent" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Impuestos (IGV)</label>
        <div className="flex items-center gap-3">
          <label htmlFor="compra-igv-checkbox" aria-label="Aplicar impuestos IGV" className="relative inline-flex items-center cursor-pointer shrink-0">
            <input id="compra-igv-checkbox" type="checkbox" className="sr-only peer" checked={hasIGV} onChange={(e) => setHasIGV(e.target.checked)} />
            <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
            <span className="sr-only">Aplicar impuestos IGV</span>
          </label>
          <div className="relative flex-1">
            <input 
              id="compra-igv-percent"
              type="number" 
              disabled={!hasIGV}
              className={`${inputCls} h-[34px] py-1 ${!hasIGV ? 'opacity-50 grayscale' : ''}`}
              value={igvPercent} 
              onChange={(e) => setIgvPercent(parseFloat(e.target.value))} 
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-bold">%</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="compra-metodo-pago" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pago desde…</label>
        <select 
          id="compra-metodo-pago"
          className={inputCls} 
          value={metodoPago} 
          onChange={(e) => setMetodoPago(e.target.value as any)}
        >
          <option value="BANCO">Banco</option>
          <option value="EFECTIVO">Caja (Efectivo)</option>
        </select>
      </div>
    </div>
  );
}
