import { useState } from 'react';
import { 
  History, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeftRight, 
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type TableColumn } from '../components/ui/DataTable';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface KardexMovement {
  id: number;
  fecha: string;
  tipo: 'INGRESO' | 'SALIDA' | 'AJUSTE';
  motivo: string;
  cantidad: number;
  saldo: number;
  usuario: string;
  referencia: string;
}

// Datos de ejemplo para visualizar el diseño
const mockMovements: KardexMovement[] = [
  { id: 1, fecha: '2026-05-04 10:30', tipo: 'INGRESO', motivo: 'Compra a Proveedor', cantidad: 50, saldo: 50, usuario: 'Admin', referencia: 'OC-001' },
  { id: 2, fecha: '2026-05-04 11:15', tipo: 'SALIDA',  motivo: 'Venta al Cliente',  cantidad: 5,  saldo: 45, usuario: 'Cajero1', referencia: 'BOL-102' },
  { id: 3, fecha: '2026-05-04 12:00', tipo: 'SALIDA',  motivo: 'Venta al Cliente',  cantidad: 10, saldo: 35, usuario: 'Cajero1', referencia: 'BOL-105' },
  { id: 4, fecha: '2026-05-04 14:20', tipo: 'AJUSTE',  motivo: 'Producto Dañado',   cantidad: 2,  saldo: 33, usuario: 'Admin', referencia: 'ADJ-05' },
  { id: 5, fecha: '2026-05-04 15:00', tipo: 'INGRESO', motivo: 'Compra a Proveedor', cantidad: 20, saldo: 53, usuario: 'Admin', referencia: 'OC-005' },
];

const columns: TableColumn<KardexMovement>[] = [
  {
    key: 'fecha',
    header: 'Fecha y Hora',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">{row.fecha}</span>
      </div>
    ),
  },
  {
    key: 'tipo',
    header: 'Movimiento',
    render: (row) => {
      const config = {
        INGRESO: { variant: 'emerald' as const, icon: <TrendingUp size={12} /> },
        SALIDA:  { variant: 'red' as const,     icon: <TrendingDown size={12} /> },
        AJUSTE:  { variant: 'amber' as const,   icon: <ArrowLeftRight size={12} /> },
      };
      const { variant, icon } = config[row.tipo];
      return (
        <div className="flex items-center gap-2">
          <Badge label={row.tipo} variant={variant} />
        </div>
      );
    },
  },
  {
    key: 'motivo',
    header: 'Concepto / Motivo',
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-800 dark:text-white">{row.motivo}</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{row.referencia}</span>
      </div>
    ),
  },
  {
    key: 'cantidad',
    header: 'Cant.',
    align: 'right',
    render: (row) => (
      <span className={`font-bold ${row.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'}`}>
        {row.tipo === 'INGRESO' ? '+' : '-'}{row.cantidad}
      </span>
    ),
  },
  {
    key: 'saldo',
    header: 'Stock Resultante',
    align: 'right',
    render: (row) => (
      <span className="font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
        {row.saldo}
      </span>
    ),
  },
  {
    key: 'usuario',
    header: 'Usuario',
    render: (row) => <span className="text-xs text-gray-500">{row.usuario}</span>,
  },
];

export function Kardex() {
  const [selectedProduct, setSelectedProduct] = useState('Arroz Costeño 1kg');

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Kardex de Inventario" 
        subtitle="Historial detallado de movimientos por producto"
        icon={<History className="text-indigo-600" />}
        action={
          <Button variant="secondary" size="sm" icon={<Download size={16} />}>
            Exportar Reporte
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Selección */}
        <aside className="lg:col-span-1 space-y-4">
          <Card className="p-4">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Filter size={16} /> Filtros de Búsqueda
            </h4>
            <div className="space-y-4">
              <Input 
                label="Buscar Producto" 
                placeholder="Nombre o código..." 
                icon={<Search size={18} />}
              />
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">Producto Seleccionado</p>
                <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{selectedProduct}</p>
                <p className="text-xs text-gray-500 mt-1">Stock Actual: <span className="font-bold text-indigo-600">53</span></p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-indigo-200">
             <h4 className="text-xs font-bold opacity-80 uppercase tracking-widest mb-3">Resumen del Mes</h4>
             <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <span className="text-sm opacity-90 text-indigo-100">Entradas</span>
                 <span className="font-bold">+70 un.</span>
               </div>
               <div className="flex justify-between items-center text-red-100">
                 <span className="text-sm opacity-90">Salidas</span>
                 <span className="font-bold">-17 un.</span>
               </div>
               <div className="pt-2 border-t border-white/20 flex justify-between items-center">
                 <span className="text-sm font-bold">Balance Neto</span>
                 <span className="text-lg font-black">+53 un.</span>
               </div>
             </div>
          </Card>
        </aside>

        {/* Tabla de Movimientos */}
        <main className="lg:col-span-3">
          <Card>
            <DataTable 
              columns={columns} 
              data={mockMovements} 
              keyExtractor={(row) => row.id}
              emptyMessage="No hay movimientos registrados para este producto."
            />
          </Card>
        </main>
      </div>
    </div>
  );
}
