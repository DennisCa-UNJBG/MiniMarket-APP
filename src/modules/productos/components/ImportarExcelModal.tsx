// src/modules/productos/components/ImportarExcelModal.tsx
//
// Modal para importar catálogo de productos desde un archivo 001.xlsx
// Estados: idle → selecting → confirming → importing → done | error

import { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  FileWarning,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
} from 'lucide-react';
import {
  seleccionarArchivoExcel,
  importarDesdeExcel,
  crearBackup,
  type ImportResult,
} from '../importService';

type Step = 'idle' | 'confirming' | 'importing' | 'done' | 'error';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportarExcelModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showErrors, setShowErrors] = useState(false);
  const [backupPath, setBackupPath] = useState<string | null>(null);

  // ── Acciones ──────────────────────────────────────────────────────────────

  async function handleSeleccionar() {
    try {
      const path = await seleccionarArchivoExcel();
      if (!path) return; // usuario canceló
      setFilePath(path);
      setStep('confirming');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Error al abrir el selector de archivos.');
      setStep('error');
    }
  }

  async function handleImportar() {
    if (!filePath) return;
    setStep('importing');
    try {
      // 1. Crear backup primero
      const pathBackup = await crearBackup();
      setBackupPath(pathBackup);

      // 2. Importar
      const res = await importarDesdeExcel(filePath);
      setResult(res);
      setStep('done');
      if (res.insertados > 0) {
        onSuccess(); // recargar lista de productos
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Error desconocido durante la importación.');
      setStep('error');
    }
  }

  function handleReset() {
    setStep('idle');
    setFilePath(null);
    setResult(null);
    setErrorMsg('');
    setShowErrors(false);
    setBackupPath(null);
  }

  // ── Nombre del archivo (sin la ruta completa) ─────────────────────────────
  const fileName = filePath
    ? filePath.split(/[\\/]/).pop() ?? filePath
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 animate-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
              <FileSpreadsheet size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Importar Catálogo desde Excel
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Formato: Nombre · Categoría · Unidad · Stock · P.Compra · P.Venta
              </p>
            </div>
          </div>
          <button
            id="btn-cerrar-import-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Contenido por paso ── */}
        <div className="px-6 py-5 space-y-4">

          {/* ─── IDLE: botón para seleccionar ─── */}
          {step === 'idle' && (
            <>
              <div className="rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center space-y-3">
                <Upload size={32} className="mx-auto text-zinc-400" />
                <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                  Selecciona el archivo <span className="font-bold text-emerald-600 dark:text-emerald-400">catalogo_importacion.xlsx</span>
                </p>
                <p className="text-xs text-zinc-400">
                  Solo archivos .xlsx · Primera hoja · Encabezado en fila 1
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  id="btn-cancelar-import"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-seleccionar-excel"
                  onClick={handleSeleccionar}
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center gap-2"
                >
                  <FileSpreadsheet size={15} />
                  Seleccionar archivo
                </button>
              </div>
            </>
          )}

          {/* ─── CONFIRMING: mostrar ruta + advertencia + botón importar ─── */}
          {step === 'confirming' && (
            <>
              {/* archivo seleccionado */}
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <FileSpreadsheet size={20} className="text-emerald-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {fileName}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">{filePath}</p>
                </div>
              </div>

              {/* advertencia */}
              <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Se realizará un <strong>backup automático</strong> antes de importar.
                  Los productos con el mismo nombre que ya existan serán <strong>ignorados</strong> (no se sobreescribirán).
                </p>
              </div>

              <div className="flex justify-between gap-2">
                <button
                  id="btn-cambiar-archivo"
                  onClick={handleReset}
                  className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  Cambiar archivo
                </button>
                <div className="flex gap-2">
                  <button
                    id="btn-cancelar-confirming"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-importar-ahora"
                    onClick={handleImportar}
                    className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Upload size={15} />
                    Importar ahora
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ─── IMPORTING: spinner ─── */}
          {step === 'importing' && (
            <div className="py-8 text-center space-y-4">
              <div className="relative mx-auto w-12 h-12">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-200 dark:border-emerald-900" />
                <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-t-emerald-600 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Importando productos...
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Esto puede tardar unos segundos
                </p>
              </div>
            </div>
          )}

          {/* ─── DONE: resumen de resultados ─── */}
          {step === 'done' && result && (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-500" />
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Importación completada
                </p>
              </div>

              {/* estadísticas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {result.insertados}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Insertados</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-center">
                  <p className="text-2xl font-bold text-zinc-500 dark:text-zinc-300">
                    {result.ignorados}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Ya existían</p>
                </div>
                <div className={`p-3 rounded-xl text-center ${result.errores > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-zinc-50 dark:bg-zinc-800'}`}>
                  <p className={`text-2xl font-bold ${result.errores > 0 ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {result.errores}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Errores</p>
                </div>
              </div>

              {/* tabla de compras generadas */}
              {result.compras.length > 0 && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                    <ShoppingCart size={13} className="text-emerald-500" />
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Compras generadas ({result.compras.length})
                    </p>
                  </div>
                  <div className="max-h-36 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-zinc-400 uppercase tracking-wide">
                          <th className="px-3 py-1.5 text-left font-medium">Hoja</th>
                          <th className="px-3 py-1.5 text-center font-medium">Compra</th>
                          <th className="px-3 py-1.5 text-center font-medium">Prods.</th>
                          <th className="px-3 py-1.5 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {result.compras.map((c, i) => (
                          <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <td className="px-3 py-1.5 text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[120px]">{c.hoja}</td>
                            <td className="px-3 py-1.5 text-center text-zinc-400 font-mono">#{String(c.compra_id).padStart(5, '0')}</td>
                            <td className="px-3 py-1.5 text-center text-zinc-500">{c.productos}</td>
                            <td className="px-3 py-1.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                              S/ {c.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* detalle de errores (colapsable) */}
              {result.errores > 0 && result.detalle_errores.length > 0 && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
                  <button
                    id="btn-toggle-errores"
                    onClick={() => setShowErrors(!showErrors)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-900/20 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileWarning size={13} />
                      Ver detalles de errores
                    </span>
                    {showErrors ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {showErrors && (
                    <div className="max-h-32 overflow-y-auto p-2 space-y-1 bg-white dark:bg-zinc-900">
                      {result.detalle_errores.map((err, i) => (
                        <p key={i} className="text-xs text-red-600 dark:text-red-400 font-mono">
                          · {err}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mensaje de backup */}
              {backupPath && (
                <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  Backup guardado en:<br/>
                  <span className="font-mono text-zinc-400 dark:text-zinc-500 select-all">{backupPath}</span>
                </div>
              )}

              <div className="flex justify-end mt-2">
                <button
                  id="btn-cerrar-done"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </>
          )}

          {/* ─── ERROR: mensaje de fallo crítico ─── */}
          {step === 'error' && (
            <>
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Error durante la importación
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1 font-mono">
                    {errorMsg}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  id="btn-reintentar-import"
                  onClick={handleReset}
                  className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  Reintentar
                </button>
                <button
                  id="btn-cerrar-error"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
