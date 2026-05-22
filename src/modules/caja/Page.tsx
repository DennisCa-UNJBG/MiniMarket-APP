import { useState } from 'react';
import {
  Wallet,
  Unlock,
  Lock,
  History,
  Banknote,
  TrendingUp,
  User,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cajaService } from './Service';
import { ventaService } from '../ventas/Service';
import { useAuth } from '../../shared/contexts/AuthContext';
import { PageHeader } from '../../shared/components/ui/PageHeader';
import { DataTable, type TableColumn } from '../../shared/components/ui/DataTable';
import { Badge } from '../../shared/components/ui/Badge';
import { Tooltip } from '../../shared/components/ui/Tooltip';
import { Button } from '../../shared/components/ui/Button';
import { notificationService } from '../../shared/lib/notifications';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr + " UTC").toLocaleDateString();
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr + " UTC").toLocaleTimeString();
};

export function Caja() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [montoInicial, setMontoInicial] = useState('');
  const [montoFinal, setMontoFinal] = useState('');

  // Queries
  const { data: cajaAbierta, isLoading: isLoadingCaja } = useQuery({
    queryKey: ['caja-abierta'],
    queryFn: () => cajaService.getCajaAbierta()
  });

  const { data: historial = [] } = useQuery({
    queryKey: ['caja-historial'],
    queryFn: () => cajaService.getHistorial()
  });

  const { data: resumenVentas } = useQuery({
    queryKey: ['sales-summary', cajaAbierta?.fecha_apertura],
    queryFn: () => ventaService.getResumenHoy(cajaAbierta?.fecha_apertura)
  });

  // Mutations
  const abrirCajaMutation = useMutation({
    mutationFn: (monto: number) => cajaService.abrirCaja(user?.id || 1, monto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-abierta'] });
      queryClient.invalidateQueries({ queryKey: ['caja-historial'] });
      notificationService.success('¡Caja Abierta!', 'El turno ha comenzado correctamente.');
      setMontoInicial('');
    }
  });

  const cerrarCajaMutation = useMutation({
    mutationFn: ({ monto, esperado }: { monto: number; esperado: number }) =>
      cajaService.cerrarCaja(cajaAbierta!.id, user?.id || 1, monto, esperado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-abierta'] });
      queryClient.invalidateQueries({ queryKey: ['caja-historial'] });
      notificationService.success('¡Caja Cerrada!', 'El turno ha finalizado correctamente.');
      setMontoFinal('');
    }
  });

  const handleAbrir = (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoInicial);
    if (isNaN(monto) || monto < 0) {
      notificationService.warning('Monto inválido', 'Por favor ingresa un monto inicial válido.');
      return;
    }
    abrirCajaMutation.mutate(monto);
  };

  const handleCerrar = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoFinal);
    if (isNaN(monto) || monto < 0) {
      notificationService.warning('Monto inválido', 'Por favor ingresa el monto final real en caja.');
      return;
    }

    if (!cajaAbierta) return;

    // Calcular montos y diferencias en tiempo real
    const esperado = cajaAbierta.monto_inicial + (resumenVentas?.total_efectivo || 0) - (resumenVentas?.total_gastos_efectivo || 0);
    const diferencia = monto - esperado;

    let diffText = '';
    if (diferencia > 0.01) {
      diffText = `⚠️ SOBRANTE DETECTADO: +S/ ${diferencia.toFixed(2)}`;
    } else if (diferencia < -0.01) {
      diffText = `❌ FALTANTE DETECTADO: -S/ ${Math.abs(diferencia).toFixed(2)}`;
    } else {
      diffText = `✅ CAJA CUADRADA CORRECTAMENTE (S/ 0.00)`;
    }

    const confirmado = await notificationService.confirm(
      'Confirmar Cierre de Caja',
      `¿Deseas finalizar el turno con los siguientes saldos?\n\n• Esperado en físico: S/ ${esperado.toFixed(2)}\n• Contado en caja: S/ ${monto.toFixed(2)}\n\n${diffText}\n\nNota: Una vez cerrada la caja, no podrás modificar este registro.`
    );

    if (confirmado) {
      cerrarCajaMutation.mutate({ monto, esperado });
    }
  };

  const columns: TableColumn<any>[] = [
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => <Badge label={row.estado === 'abierta' ? 'ABIERTA' : 'CERRADA'} variant={row.estado === 'abierta' ? 'emerald' : 'gray'} />
    },
    {
      key: 'fecha_apertura',
      header: 'Apertura',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{formatDate(row.fecha_apertura)}</span>
          <span className="text-[10px] text-zinc-400">{formatTime(row.fecha_apertura)}</span>
        </div>
      )
    },
    {
      key: 'fecha_cierre',
      header: 'Cierre',
      render: (row) => row.fecha_cierre ? (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{formatDate(row.fecha_cierre)}</span>
          <span className="text-[10px] text-zinc-400">{formatTime(row.fecha_cierre)}</span>
        </div>
      ) : <span className="text-[10px] italic text-zinc-300">En curso…</span>
    },
    {
      key: 'monto_inicial',
      header: 'Inicial',
      align: 'right',
      render: (row) => <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">S/ {row.monto_inicial.toFixed(2)}</span>
    },
    {
      key: 'monto_esperado',
      header: 'Esperado',
      align: 'right',
      render: (row) => {
        return <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">S/ {row.total_monto_esperado.toFixed(2)}</span>;
      }
    },
    {
      key: 'monto_final',
      header: 'Final Real',
      align: 'right',
      render: (row) => row.monto_final ? <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">S/ {row.monto_final.toFixed(2)}</span> : '-'
    },
    {
      key: 'diferencia',
      header: 'Diferencia',
      align: 'right',
      render: (row) => {
        if (row.estado !== 'cerrada' || row.monto_final === undefined || row.monto_final === null) {
          return <span className="text-[10px] italic text-blue-500">En curso...</span>;
        }
        const diferencia = row.monto_final - row.total_monto_esperado;

        if (diferencia > 0.01) {
          return (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg">
              +S/ {diferencia.toFixed(2)} (Sobrante)
            </span>
          );
        } else if (diferencia < -0.01) {
          return (
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-lg">
              -S/ {Math.abs(diferencia).toFixed(2)} (Faltante)
            </span>
          );
        } else {
          return (
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">
              S/ 0.00 (Cuadrado)
            </span>
          );
        }
      }
    },
    {
      key: 'usuario_nombre',
      header: 'Usuario',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="size-5 bg-zinc-100 dark:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-500">
            <User size={10} />
          </div>
          <span className="text-xs text-zinc-500">{row.usuario_nombre}</span>
        </div>
      )
    }
  ];

  if (isLoadingCaja) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control de Caja"
        subtitle="Gestión de aperturas y cierres de turno"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Control Principal */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
                <Wallet size={20} className="text-blue-500" />
                Estado Actual
              </h3>
              <Badge
                label={cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
                variant={cajaAbierta ? 'emerald' : 'amber'}
              />
            </div>

            {!cajaAbierta ? (
              <form onSubmit={handleAbrir} className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    La caja está actualmente cerrada. Debes ingresar el monto con el que inicias el turno (fondo de caja).
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="monto-inicial-caja" className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Monto Inicial (S/)</label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      id="monto-inicial-caja"
                      type="number"
                      step="0.01"
                      value={montoInicial}
                      onChange={(e) => setMontoInicial(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-600 rounded-2xl text-lg font-bold text-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                </div>
                <Tooltip text="Iniciar el monto de caja por Turno" position="top-right" className="w-full">
                  <Button
                    type="submit"
                    fullWidth
                    isLoading={abrirCajaMutation.isPending}
                    icon={<Unlock size={18} />}
                    className="py-4 text-sm uppercase tracking-widest rounded-2xl"
                  >
                    Abrir Caja
                  </Button>
                </Tooltip>

              </form>
            ) : (
              <form onSubmit={handleCerrar} className="space-y-6">
                <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Resumen del Turno</p>
                    <TrendingUp size={16} className="text-blue-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Monto Inicial (Fondo):</span>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">S/ {cajaAbierta.monto_inicial.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Ventas en Efectivo (+):</span>
                      <span className="text-xs font-bold text-emerald-600">S/ {resumenVentas?.total_efectivo.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Compras en Efectivo (-):</span>
                      <span className="text-xs font-bold text-red-500">S/ {resumenVentas?.total_gastos_efectivo.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-60">
                      <span className="text-xs text-zinc-400">Pagos Digitales (Ref):</span>
                      <span className="text-xs font-medium text-zinc-500 italic">S/ {resumenVentas?.total_digital.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="pt-2 border-t border-blue-100 dark:border-blue-800 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Total Esperado en Físico:</span>
                        <span className="text-[10px] text-blue-400 font-medium">Solo efectivo + fondo - compras</span>
                      </div>
                      <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                        S/ {(cajaAbierta.monto_inicial + (resumenVentas?.total_efectivo || 0) - (resumenVentas?.total_gastos_efectivo || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="monto-final-caja" className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Monto Final Real (S/)</label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      id="monto-final-caja"
                      type="number"
                      step="0.01"
                      value={montoFinal}
                      onChange={(e) => setMontoFinal(e.target.value)}
                      placeholder="Ingresa lo que hay en caja..."
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-600 rounded-2xl text-lg font-bold text-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="danger"
                  fullWidth
                  isLoading={cerrarCajaMutation.isPending}
                  icon={<Lock size={18} />}
                  className="py-4 text-sm uppercase tracking-widest rounded-2xl bg-white hover:bg-rose-200 shadow-rose-100"
                >
                  Finalizar Turno / Cerrar Caja
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Historial de Movimientos */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-800 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-700 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-zinc-50 dark:border-zinc-700/50 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
              <History size={20} className="text-blue-500" />
              Historial de Turnos
            </h3>
          </div>
          <div className="flex-1">
            <DataTable
              columns={columns}
              data={historial}
              keyExtractor={(row) => row.id}
              emptyMessage="No hay registros de caja anteriores."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
