import {
  Building2,
  ChevronLeft,
  Package,
  ShoppingCart,
  DollarSign,
  History,
  Wallet,
  FileText,
  BarChart3,
  Fingerprint
} from 'lucide-react';
import { Badge } from '../../../shared/components/ui/Badge';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { useSucursalDetalle } from '../hooks/useSucursalDetalle';
import { dateUtils } from '../../../shared/lib/dateUtils';

// Subcomponentes modularizados
import { TabStock } from './tabs/TabStock';
import { TabVentas } from './tabs/TabVentas';
import { TabKardex } from './tabs/TabKardex';
import { TabCompras } from './tabs/TabCompras';
import { TabCajas } from './tabs/TabCajas';
import { TabReportes } from './tabs/TabReportes';
import { TabAuditorias } from './tabs/TabAuditorias';

interface SucursalDetalleProps {
  sucursal: {
    id: number;
    codigo: string;
    nombre: string;
    direccion?: string;
    ip_ultima_conexion?: string;
    ultima_sincronizacion?: string;
    estado: string;
  };
  onBack: () => void;
}

export function SucursalDetalle({ sucursal, onBack }: SucursalDetalleProps) {
  // Custom Hook con toda la lógica de negocio y peticiones a la API
  const {
    activeTab,
    setActiveTab,
    searchTerms,
    setSearchTerms,
    fechaInicio,
    fechaFin,
    fechaShortcut,
    handleShortcutClick,
    handleFechaInicioChange,
    handleFechaFinChange,
    ventas,
    compras,
    refetchStock,
    metrics,
    filteredStock,
    filteredVentas,
    filteredKardex,
    filteredCompras,
    filteredCajas,
    filteredLogs,
    comparisonStats,
    chartData,
    maxQuantity,
    topProductos,
    loading
  } = useSucursalDetalle({ sucursalCodigo: sucursal.codigo });

  const getStatusLabel = (lastSync: string | null, estado: string) => {
    if (estado !== 'activo') return { label: 'DESACTIVADO', variant: 'gray' as const };
    if (!lastSync) return { label: 'NUNCA', variant: 'gray' as const };

    if (dateUtils.isRecentUTC(lastSync)) return { label: 'EN LÍNEA', variant: 'emerald' as const };
    return { label: 'DESCONECTADO', variant: 'amber' as const };
  };

  const currentStatus = getStatusLabel(sucursal.ultima_sincronizacion || null, sucursal.estado);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full size-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 pb-10">
      {/* Botón de Regreso y Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
            icon={<ChevronLeft size={16} />}
            className="p-2.5 rounded-2xl"
          >
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white tracking-tight">
                {sucursal.nombre}
              </h2>
              <Badge label={currentStatus.label} variant={currentStatus.variant} />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Llave única: <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400">{sucursal.codigo}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tarjeta de Información General y Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Sucursal */}
        <Card className="md:col-span-1 border border-zinc-100 dark:border-zinc-800">
          <Card.Header className="flex items-center gap-2 py-3 bg-zinc-50/50 dark:bg-zinc-900/10">
            <Building2 size={16} className="text-blue-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Datos de Conexión
            </h3>
          </Card.Header>
          <Card.Body className="space-y-3.5 py-4">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block">Ubicación</span>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{sucursal.direccion || 'Dirección no especificada'}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block">IP de Última Conexión</span>
              <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{sucursal.ip_ultima_conexion || 'Sin registros'}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block">Última Sincronización</span>
              <span suppressHydrationWarning className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold">
                {sucursal.ultima_sincronizacion ? dateUtils.formatUTCtoLocalString(sucursal.ultima_sincronizacion) : 'Nunca ha sincronizado'}
              </span>
            </div>
          </Card.Body>
        </Card>

        {/* Métricas Rápidas */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex-shrink-0">
              <Package size={20} />
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Total de Stock</p>
              <p className="text-2xl font-black text-zinc-800 dark:text-white mt-0.5">{metrics.totalStock}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Unidades registradas</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex-shrink-0">
              <ShoppingCart size={20} />
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Ventas</p>
              <p className="text-2xl font-black text-zinc-800 dark:text-white mt-0.5">{metrics.salesCount}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Boletas sincronizadas</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex-shrink-0">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Ingreso Total</p>
              <p className="text-2xl font-black text-zinc-800 dark:text-white mt-0.5">S/ {metrics.totalRevenue.toFixed(2)}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Recaudación acumulada</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de Pestañas */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'stock'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
        >
          <Package size={16} />
          Inventario
        </button>
        <button
          onClick={() => setActiveTab('ventas')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'ventas'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
        >
          <ShoppingCart size={16} />
          Ventas Sincronizadas
        </button>
        <button
          onClick={() => setActiveTab('kardex')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'kardex'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
        >
          <History size={16} />
          Movimientos de Kardex
        </button>
        <button
          onClick={() => setActiveTab('compras')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'compras'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
        >
          <FileText size={16} />
          Compras
        </button>
        <button
          onClick={() => setActiveTab('cajas')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'cajas'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
        >
          <Wallet size={16} />
          Control de Caja
        </button>
        <button
          onClick={() => setActiveTab('reportes')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'reportes'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
        >
          <BarChart3 size={16} />
          Reportes
        </button>
        <button
          onClick={() => setActiveTab('auditorias')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'auditorias'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
        >
          <Fingerprint size={16} />
          Auditoría
        </button>
      </div>

      {/* Contenido de cada pestaña */}
      <div className="space-y-4">
        {activeTab === 'stock' && (
          <TabStock
            sucursalCodigo={sucursal.codigo}
            filteredStock={filteredStock}
            stockSearchTerm={searchTerms.stock}
            onSearchTermChange={(val) => setSearchTerms((prev) => ({ ...prev, stock: val }))}
            onRefetch={refetchStock}
          />
        )}

        {activeTab === 'ventas' && (
          <TabVentas
            ventas={ventas}
            filteredVentas={filteredVentas}
            ventasSearchTerm={searchTerms.ventas}
            onSearchTermChange={(val) => setSearchTerms((prev) => ({ ...prev, ventas: val }))}
          />
        )}

        {activeTab === 'kardex' && (
          <TabKardex
            filteredKardex={filteredKardex}
            kardexSearchTerm={searchTerms.kardex}
            onSearchTermChange={(val) => setSearchTerms((prev) => ({ ...prev, kardex: val }))}
          />
        )}

        {activeTab === 'compras' && (
          <TabCompras
            compras={compras}
            filteredCompras={filteredCompras}
            comprasSearchTerm={searchTerms.compras}
            onSearchTermChange={(val) => setSearchTerms((prev) => ({ ...prev, compras: val }))}
          />
        )}

        {activeTab === 'cajas' && (
          <TabCajas
            filteredCajas={filteredCajas}
            cajasSearchTerm={searchTerms.cajas}
            onSearchTermChange={(val) => setSearchTerms((prev) => ({ ...prev, cajas: val }))}
          />
        )}

        {activeTab === 'reportes' && (
          <TabReportes
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            fechaShortcut={fechaShortcut}
            handleShortcutClick={handleShortcutClick}
            handleFechaInicioChange={handleFechaInicioChange}
            handleFechaFinChange={handleFechaFinChange}
            comparisonStats={comparisonStats}
            chartData={chartData}
            topProductos={topProductos}
            maxQuantity={maxQuantity}
          />
        )}

        {activeTab === 'auditorias' && (
          <TabAuditorias
            filteredLogs={filteredLogs}
            logsSearchTerm={searchTerms.auditorias}
            onSearchTermChange={(val) => setSearchTerms((prev) => ({ ...prev, auditorias: val }))}
          />
        )}
      </div>
    </div>
  );
}
