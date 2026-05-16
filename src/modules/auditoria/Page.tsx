import { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  User,
  Database,
  Info,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { logService } from '../../lib/logService';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type TableColumn } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';

export function Auditoria() {
  const [search, setSearch] = useState('');
  const [filterAccion, setFilterAccion] = useState('TODOS');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['logs-audit'],
    queryFn: () => logService.getAll(200) // Traemos los últimos 200 logs
  });

  const accionesUnicas = ['TODOS', ...new Set(logs.map(l => l.accion))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.detalles?.toLowerCase().includes(search.toLowerCase()) ||
      log.usuario_nombre.toLowerCase().includes(search.toLowerCase()) ||
      log.accion.toLowerCase().includes(search.toLowerCase());
    
    const matchesAccion = filterAccion === 'TODOS' || log.accion === filterAccion;

    return matchesSearch && matchesAccion;
  });

  const getActionVariant = (accion: string): any => {
    if (accion.includes('LOGIN')) return 'emerald';
    if (accion.includes('LOGOUT')) return 'rose';
    if (accion.includes('PRECIO') || accion.includes('PRODUCTO')) return 'amber';
    if (accion.includes('VENTA') || accion.includes('COMPRA')) return 'indigo';
    if (accion.includes('CAJA')) return 'sky';
    if (accion.includes('USUARIO')) return 'violet';
    if (accion.includes('CONFIG')) return 'orange';
    if (accion.includes('EXPORT')) return 'pink';
    return 'gray';
  };

  const columns: TableColumn<any>[] = [
    {
      key: 'fecha',
      header: 'Fecha / Hora',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1">
            <Calendar size={10} /> {new Date(row.fecha + " UTC").toLocaleDateString()}
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Info size={10} /> {new Date(row.fecha + " UTC").toLocaleTimeString()}
          </span>
        </div>
      )
    },
    {
      key: 'usuario_nombre',
      header: 'Usuario',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <User size={14} />
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{row.usuario_nombre}</span>
        </div>
      )
    },
    {
      key: 'accion',
      header: 'Acción',
      render: (row) => (
        <Badge label={row.accion} variant={getActionVariant(row.accion)} />
      )
    },
    {
      key: 'tabla',
      header: 'Módulo',
      render: (row) => (
        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <Database size={10} /> {row.tabla}
        </div>
      )
    },
    {
      key: 'detalles',
      header: 'Descripción del Movimiento',
      render: (row) => (
        <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md italic">
          "{row.detalles}"
        </p>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Historial de Auditoría" 
        subtitle="Registro de actividades y cambios sensibles en el sistema" 
      />

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, detalle o acción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-100 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterAccion}
            onChange={(e) => setFilterAccion(e.target.value)}
            className="flex-1 sm:w-48 px-3 py-2 text-sm border border-gray-100 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {accionesUnicas.map(acc => (
              <option key={acc} value={acc}>{acc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredLogs}
          keyExtractor={(row) => row.id}
          emptyMessage={isLoading ? "Cargando registros..." : "No se han encontrado registros de auditoría."}
          defaultPageSize={15}
        />
      </div>
    </div>
  );
}
