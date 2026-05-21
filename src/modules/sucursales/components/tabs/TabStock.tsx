import React, { useState } from 'react';
import { Search, SlidersHorizontal, Package } from 'lucide-react';
import { DataTable, type TableColumn } from '../../../../components/ui/DataTable';
import { Button } from '../../../../components/ui/Button';
import { Tooltip } from '../../../../components/ui/Tooltip';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { AjustarStockModal } from '../AjustarStockModal';

interface TabStockProps {
  sucursalCodigo: string;
  filteredStock: any[];
  stockSearchTerm: string;
  onSearchTermChange: (val: string) => void;
  onRefetch: () => void;
}

export const TabStock: React.FC<TabStockProps> = ({
  sucursalCodigo,
  filteredStock,
  stockSearchTerm,
  onSearchTermChange,
  onRefetch
}) => {
  const [selectedStockProduct, setSelectedStockProduct] = useState<any | null>(null);

  // Columnas para tabla de stock
  const stockColumns: TableColumn<any>[] = [
    {
      key: 'producto',
      header: 'Producto',
      render: (row) => (
        <div>
          <p className="text-sm font-bold text-zinc-800 dark:text-white">{row.producto_nombre || 'Producto Desconocido'}</p>
          <span className="text-[10px] font-mono text-zinc-400">{row.codigo_barras}</span>
        </div>
      )
    },
    {
      key: 'categoria_nombre',
      header: 'Categoría',
      render: (row) => (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {row.categoria_nombre || 'Sin categoría'}
        </span>
      )
    },
    {
      key: 'stock',
      header: 'Stock en Sucursal',
      align: 'center',
      render: (row) => {
        const isLow = row.stock <= (row.stock_minimo || 0);
        return (
          <div className="flex flex-col items-center">
            <span className={`text-sm font-bold ${isLow ? 'text-rose-500 dark:text-rose-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
              {row.stock} {row.unidad_medida || 'UND'}
            </span>
            {isLow && (
              <span className="text-[9px] font-semibold text-rose-400 uppercase tracking-widest leading-none mt-0.5">
                Bajo Stock Mín.
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'stock_minimo',
      header: 'Stock Mín.',
      align: 'center',
      render: (row) => (
        <span className="text-xs text-zinc-400">
          {row.stock_minimo || 0} {row.unidad_medida || 'UND'}
        </span>
      )
    },
    {
      key: 'ultima_actualizacion',
      header: 'Última Actualización',
      render: (row) => (
        <span suppressHydrationWarning className="text-xs text-zinc-400">
          {row.ultima_actualizacion ? new Date(row.ultima_actualizacion).toLocaleString() : 'Sin fecha'}
        </span>
      )
    },
    {
      key: 'acciones',
      header: 'Acción',
      align: 'right',
      render: (row) => (
        <Tooltip text="Ajustar Stock Manualmente" position="top-right">
          <Button
            variant="ghost"
            size="sm"
            icon={<SlidersHorizontal size={14} />}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800"
            onClick={() => setSelectedStockProduct(row)}
          />
        </Tooltip>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Buscador de Stock */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Buscar en inventario..."
          value={stockSearchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
        />
      </div>

      <DataTable
        columns={stockColumns}
        data={filteredStock}
        keyExtractor={(row) => row.codigo_barras}
        emptyState={
          <EmptyState
            icon={Package}
            title="Sin datos de stock"
            description="Esta sucursal aún no ha sincronizado su inventario con la central."
          />
        }
      />

      {/* Modal de ajuste de stock */}
      {selectedStockProduct && (
        <AjustarStockModal
          isOpen={!!selectedStockProduct}
          onClose={() => setSelectedStockProduct(null)}
          sucursalId={sucursalCodigo}
          producto={selectedStockProduct}
          onSuccess={() => {
            setSelectedStockProduct(null);
            onRefetch();
          }}
        />
      )}
    </div>
  );
};
