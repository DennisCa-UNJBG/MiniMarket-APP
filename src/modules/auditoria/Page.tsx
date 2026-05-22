import { useReducer } from 'react';
import {
  Search,
  Filter,
  Calendar,
  User,
  Database,
  Info,
} from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { logService } from '../../shared/lib/logService';
import { PageHeader } from '../../shared/components/ui/PageHeader';
import { DataTable, type TableColumn } from '../../shared/components/ui/DataTable';
import { Badge } from '../../shared/components/ui/Badge';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr + " UTC").toLocaleDateString();
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr + " UTC").toLocaleTimeString();
};

interface AuditoriaState {
  search: string;
  filterAccion: string;
  page: number;
  pageSize: number;
}

type AuditoriaAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER_ACCION'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number };

const initialAuditoriaState: AuditoriaState = {
  search: '',
  filterAccion: 'TODOS',
  page: 1,
  pageSize: 10
};

function auditoriaReducer(state: AuditoriaState, action: AuditoriaAction): AuditoriaState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload, page: 1 }; // Reiniciar a la primera página al buscar
    case 'SET_FILTER_ACCION':
      return { ...state, filterAccion: action.payload, page: 1 }; // Reiniciar a la primera página al filtrar
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload };
    default:
      return state;
  }
}

export function Auditoria() {
  const [state, dispatch] = useReducer(auditoriaReducer, initialAuditoriaState);
  const { search, filterAccion, page, pageSize } = state;

  // Consulta reactiva y paginada del lado del servidor
  const { data: logsRes = { data: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['logs-audit', search, filterAccion, page, pageSize],
    queryFn: () => logService.getPaginated(page, pageSize, search, filterAccion),
    placeholderData: keepPreviousData
  });

  // Consulta para obtener la lista de tipos de acciones registradas
  const { data: uniqueActions = [] } = useQuery({
    queryKey: ['logs-actions-unique'],
    queryFn: () => logService.getAccionesUnicas()
  });

  const accionesUnicas = ['TODOS', ...uniqueActions];

  const handleSearchChange = (val: string) => {
    dispatch({ type: 'SET_SEARCH', payload: val });
  };

  const handleAccionChange = (val: string) => {
    dispatch({ type: 'SET_FILTER_ACCION', payload: val });
  };

  const getActionVariant = (accion: string): any => {
    if (accion.includes('LOGIN')) return 'emerald';
    if (accion.includes('LOGOUT')) return 'rose';
    if (accion.includes('PRECIO') || accion.includes('PRODUCTO')) return 'amber';
    if (accion.includes('VENTA') || accion.includes('COMPRA')) return 'blue';
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
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1">
            <Calendar size={10} /> {formatDate(row.fecha)}
          </span>
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Info size={10} /> {formatTime(row.fecha)}
          </span>
        </div>
      )
    },
    {
      key: 'usuario_nombre',
      header: 'Usuario',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="size-7 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
            <User size={14} />
          </div>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{row.usuario_nombre}</span>
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
        <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <Database size={10} /> {row.tabla}
        </div>
      )
    },
    {
      key: 'detalles',
      header: 'Descripción del Movimiento',
      render: (row) => (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md italic">
          {row.detalles || <span className="text-zinc-300 italic">Sin descripción</span>}
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
      <div className="bg-white dark:bg-zinc-800 rounded-3xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-700 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, detalle o acción..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-zinc-100 dark:border-zinc-600 rounded-xl bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-zinc-400" />
          <select
            value={filterAccion}
            onChange={(e) => handleAccionChange(e.target.value)}
            className="flex-1 sm:w-48 px-3 py-2 text-sm border border-zinc-100 dark:border-zinc-600 rounded-xl bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {accionesUnicas.map(acc => (
              <option key={acc} value={acc}>{acc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-700 overflow-hidden">
        <DataTable
          columns={columns}
          data={logsRes.data}
          keyExtractor={(row) => row.id}
          emptyMessage={isLoading ? "Cargando registros..." : "No se han encontrado registros de auditoría."}
          serverSide={true}
          totalItems={logsRes.total}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={(p) => dispatch({ type: 'SET_PAGE', payload: p })}
          onPageSizeChange={(sz) => dispatch({ type: 'SET_PAGE_SIZE', payload: sz })}
        />
      </div>
    </div>
  );
}

