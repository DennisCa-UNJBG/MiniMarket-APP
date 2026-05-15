// Componente de tabla genérica y reutilizable con paginación integrada.

import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface TableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  /** Si se omite, renderiza row[key] como texto */
  render?: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T extends object> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  emptyMessage?: string;
  emptyState?: ReactNode;
  /** Filas por página por defecto (default: 10) */
  defaultPageSize?: number;
  /** Opciones del selector de filas por página */
  pageSizeOptions?: number[];
  /** Indica si la paginación se maneja desde el servidor */
  serverSide?: boolean;
  /** Total de registros en la base de datos (requerido si serverSide es true) */
  totalItems?: number;
  /** Página actual controlada externamente */
  currentPage?: number;
  /** Callback cuando cambia la página */
  onPageChange?: (page: number) => void;
  /** Callback cuando cambia el tamaño de página */
  onPageSizeChange?: (size: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const alignClass = {
  left:   'text-left',
  center: 'text-center',
  right:  'text-right',
};

// ── Componente ─────────────────────────────────────────────────────────────────
export function DataTable<T extends object>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No hay registros para mostrar.',
  emptyState,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  serverSide = false,
  totalItems: totalItemsExternal,
  currentPage: currentPageExternal,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<T>) {
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(defaultPageSize);

  // Determinar valores actuales (locales o externos)
  const currentPage = serverSide ? (currentPageExternal ?? 1) : internalPage;
  const pageSize = internalPageSize; // El tamaño de página lo solemos manejar localmente o sincronizar
  const totalItems = serverSide ? (totalItemsExternal ?? 0) : data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp currentPage si los datos filtrados reducen el total de páginas
  const safePage = Math.min(currentPage, totalPages);
  
  // Sincronización si los datos cambian y la página actual queda fuera de rango
  if (!serverSide && safePage !== currentPage) setInternalPage(safePage);

  const startIndex = serverSide ? 0 : (safePage - 1) * pageSize;
  const endIndex   = serverSide ? data.length : Math.min(startIndex + pageSize, totalItems);
  const pageData   = serverSide ? data : data.slice(startIndex, endIndex);

  // Los labels de "Info" sí deben calcularse en base a la página real para server-side
  const displayStartIndex = serverSide ? (currentPage - 1) * pageSize : startIndex;
  const displayEndIndex   = serverSide ? displayStartIndex + data.length : endIndex;

  // Números de página a mostrar (máximo 5 botones)
  const getPageNumbers = (): number[] => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, safePage - delta);
      i <= Math.min(totalPages, safePage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  };

  const handlePageChange = (page: number) => {
    if (serverSide) {
      onPageChange?.(page);
    } else {
      setInternalPage(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setInternalPageSize(size);
    if (serverSide) {
      onPageSizeChange?.(size);
      onPageChange?.(1); // Reset a la primera página
    } else {
      setInternalPage(1);
    }
  };

  return (
    <div className="flex flex-col gap-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* ── Tabla ───────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide ${alignClass[col.align ?? 'left']}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500 p-0"
                >
                  {emptyState ? emptyState : (
                    <div className="py-12">
                      {emptyMessage}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              pageData.map((row, index) => (
                <tr
                  key={keyExtractor(row, startIndex + index)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${alignClass[col.align ?? 'left']}`}
                    >
                      {col.render
                        ? col.render(row, startIndex + index)
                        : ((row as Record<string, unknown>)[col.key] as ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ──────────────────────────────────────────────────────── */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
          {/* Info + selector de filas */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {totalItems > 0 ? displayStartIndex + 1 : 0}–{displayEndIndex} de{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-200">{totalItems}</span>{' '}
              registros
            </span>
            <span className="hidden sm:block text-gray-200 dark:text-gray-600">|</span>
            <div className="hidden sm:flex items-center gap-1.5">
              <span>Filas:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-1.5 py-0.5 text-xs border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Controles de página */}
          <div className="flex items-center gap-1">
            {/* Primera página */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Primera página"
            >
              <ChevronsLeft size={15} />
            </button>

            {/* Anterior */}
            <button
              onClick={() => handlePageChange(safePage - 1)}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft size={15} />
            </button>

            {/* Números de página */}
            {getPageNumbers().map((n) => (
              <button
                key={n}
                onClick={() => handlePageChange(n)}
                className={[
                  'min-w-[30px] h-[30px] px-1 text-xs font-medium rounded-lg transition-colors',
                  n === safePage
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600',
                ].join(' ')}
              >
                {n}
              </button>
            ))}

            {/* Siguiente */}
            <button
              onClick={() => handlePageChange(safePage + 1)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Página siguiente"
            >
              <ChevronRight size={15} />
            </button>

            {/* Última página */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Última página"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
