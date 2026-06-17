import { useReducer } from 'react';
import { CreditCard, Banknote, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { ventaService } from '../Service';
import { clienteService } from '../../clientes/Service';
import { perudevsService } from '../../configuracion/perudevsService';
import { notificationService } from '../../../shared/lib/notifications';
import { type Product } from '../../productos/Service';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  igvAmount: number;
  hasIGV: boolean;
  igvPercent: number;
  cart: CartItem[];
  user: any;
  onSuccess: () => void;
}

interface CheckoutState {
  paymentMethod: 'EFECTIVO' | 'TARJETA';
  amountPaid: string;
  associateClient: boolean;
  documentNumber: string;
  clientNombre: string;
  clientTelefono: string;
  clientEmail: string;
  isSearchingClient: boolean;
  selectedClientId: number | null;
}

type CheckoutAction =
  | { type: 'SET_PAYMENT_METHOD'; payload: 'EFECTIVO' | 'TARJETA' }
  | { type: 'SET_AMOUNT_PAID'; payload: string }
  | { type: 'SET_ASSOCIATE_CLIENT'; payload: boolean }
  | { type: 'SET_DOCUMENT_NUMBER'; payload: string }
  | { type: 'SET_CLIENT_NOMBRE'; payload: string }
  | { type: 'SET_CLIENT_TELEFONO'; payload: string }
  | { type: 'SET_CLIENT_EMAIL'; payload: string }
  | { type: 'SET_IS_SEARCHING_CLIENT'; payload: boolean }
  | { type: 'SET_SELECTED_CLIENT_ID'; payload: number | null }
  | { type: 'RESET' };

const initialCheckoutState: CheckoutState = {
  paymentMethod: 'EFECTIVO',
  amountPaid: '',
  associateClient: false,
  documentNumber: '',
  clientNombre: '',
  clientTelefono: '',
  clientEmail: '',
  isSearchingClient: false,
  selectedClientId: null
};

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    case 'SET_AMOUNT_PAID':
      return { ...state, amountPaid: action.payload };
    case 'SET_ASSOCIATE_CLIENT':
      if (!action.payload) {
        return initialCheckoutState;
      }
      return { ...state, associateClient: true };
    case 'SET_DOCUMENT_NUMBER':
      return { ...state, documentNumber: action.payload, selectedClientId: null };
    case 'SET_CLIENT_NOMBRE':
      return { ...state, clientNombre: action.payload };
    case 'SET_CLIENT_TELEFONO':
      return { ...state, clientTelefono: action.payload };
    case 'SET_CLIENT_EMAIL':
      return { ...state, clientEmail: action.payload };
    case 'SET_IS_SEARCHING_CLIENT':
      return { ...state, isSearchingClient: action.payload };
    case 'SET_SELECTED_CLIENT_ID':
      return { ...state, selectedClientId: action.payload };
    case 'RESET':
      return initialCheckoutState;
    default:
      return state;
  }
}

export function CheckoutModal({
  isOpen,
  onClose,
  total,
  igvAmount,
  hasIGV,
  igvPercent,
  cart,
  user,
  onSuccess
}: CheckoutModalProps) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckoutState);

  const {
    paymentMethod,
    amountPaid,
    associateClient,
    documentNumber,
    clientNombre,
    clientTelefono,
    clientEmail,
    isSearchingClient
  } = state;

  const registrarVentaMutation = useMutation({
    mutationFn: (ventaData: any) => ventaService.registrarVenta(ventaData),
    onSuccess: async (data) => {
      onClose();
      await notificationService.successWithConfirm('¡Venta completada!', `Vuelto: S/ ${data.vuelto.toFixed(2)}`);

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['sales-chart'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['report-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['report-top-products'] });
      queryClient.invalidateQueries({ queryKey: ['report-monthly-revenue'] });
      queryClient.invalidateQueries({ queryKey: ['report-category-sales'] });

      // Limpiar estados locales de cliente al tener éxito
      dispatch({ type: 'RESET' });

      onSuccess();
    }
  });

  const paidNumber = parseFloat(amountPaid) || 0;
  const roundedTotal = parseFloat(total.toFixed(2));
  const change = Math.max(0, paidNumber - roundedTotal);

  const handleQueryClient = async () => {
    const doc = documentNumber.trim();
    if (!doc) {
      notificationService.warning('Documento vacío', 'Por favor ingresa un número de DNI o RUC.');
      return;
    }
    if (doc.length !== 8 && doc.length !== 11) {
      notificationService.warning('Documento inválido', 'El documento debe tener 8 dígitos (DNI) u 11 dígitos (RUC).');
      return;
    }

    dispatch({ type: 'SET_IS_SEARCHING_CLIENT', payload: true });
    try {
      // 1. Buscar localmente en SQLite
      const localClient = await clienteService.getByDniRuc(doc);
      if (localClient) {
        dispatch({ type: 'SET_CLIENT_NOMBRE', payload: localClient.nombre });
        dispatch({ type: 'SET_CLIENT_TELEFONO', payload: localClient.telefono || '' });
        dispatch({ type: 'SET_CLIENT_EMAIL', payload: localClient.email || '' });
        dispatch({ type: 'SET_SELECTED_CLIENT_ID', payload: localClient.id });
        notificationService.success('Cliente encontrado', `Cliente local: ${localClient.nombre}`);
        dispatch({ type: 'SET_IS_SEARCHING_CLIENT', payload: false });
        return;
      }

      // 2. Si no existe localmente, consultar API de PeruDevs
      const hasKey = await perudevsService.hasKey();
      if (!hasKey) {
        notificationService.info(
          'Cliente no registrado',
          'El documento no está registrado localmente. Completa sus datos manualmente (API Key no configurada).'
        );
        dispatch({ type: 'SET_SELECTED_CLIENT_ID', payload: null });
        dispatch({ type: 'SET_IS_SEARCHING_CLIENT', payload: false });
        return;
      }

      const apiRes = await perudevsService.queryDocument(doc);
      if (apiRes && apiRes.nombre) {
        dispatch({ type: 'SET_CLIENT_NOMBRE', payload: apiRes.nombre });
        dispatch({ type: 'SET_CLIENT_TELEFONO', payload: '' });
        dispatch({ type: 'SET_CLIENT_EMAIL', payload: '' });
        dispatch({ type: 'SET_SELECTED_CLIENT_ID', payload: null });
        notificationService.success('Datos externos obtenidos', `Nombre: ${apiRes.nombre}`);
      } else {
        notificationService.info('Cliente no registrado', 'El cliente no existe localmente y no se encontró en la API.');
        dispatch({ type: 'SET_SELECTED_CLIENT_ID', payload: null });
      }
    } catch (error: any) {
      console.error(error);
      notificationService.warning('Consulta externa fallida', 'No se pudo consultar externamente, completa los datos manualmente.');
      dispatch({ type: 'SET_SELECTED_CLIENT_ID', payload: null });
    } finally {
      dispatch({ type: 'SET_IS_SEARCHING_CLIENT', payload: false });
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title="Completar Venta"
      onClose={onClose}
      maxWidth={associateClient ? '3xl' : 'md'}
    >
      <div className="-mx-6 -mt-5 mb-5">
        <div className={`bg-blue-600 ${associateClient ? 'p-4 sm:p-6' : 'p-6 sm:p-8'} text-center text-white transition-all`}>
          <p className="text-blue-200 text-sm font-medium mb-1">Monto a cobrar</p>
          <p className="text-4xl font-black">S/ {roundedTotal.toFixed(2)}</p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${associateClient ? 'lg:grid-cols-2 lg:gap-8 gap-5' : 'gap-5'} transition-all`}>
        {/* Columna Izquierda: Cliente */}
        <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-700/60 h-fit">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <input
                id="checkbox-asociar-cliente"
                type="checkbox"
                checked={associateClient}
                onChange={(e) => {
                  dispatch({ type: 'SET_ASSOCIATE_CLIENT', payload: e.target.checked });
                }}
                className="size-4 rounded text-blue-600 border-zinc-300 focus:ring-blue-500 dark:bg-zinc-700 dark:border-zinc-600 cursor-pointer"
              />
              <label htmlFor="checkbox-asociar-cliente" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                Asociar venta a un cliente
              </label>
            </div>
          </div>

          {associateClient && (
            <div className="space-y-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-700/60 animate-in fade-in duration-200">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    label="DNI (8 dig.) o RUC (11 dig.)"
                    placeholder="Ej. 10456789012"
                    value={documentNumber}
                    onChange={(e) => dispatch({ type: 'SET_DOCUMENT_NUMBER', payload: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                    className="py-1.5 font-bold"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleQueryClient}
                  disabled={isSearchingClient}
                  className="font-bold shrink-0 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 px-4 rounded-xl shadow-md shadow-blue-200 dark:shadow-none self-end h-[38px] mb-[2px]"
                >
                  {isSearchingClient ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Consultar'
                  )}
                </Button>
              </div>

              <Input
                label="Nombre / Razón Social"
                value={clientNombre}
                onChange={(e) => dispatch({ type: 'SET_CLIENT_NOMBRE', payload: e.target.value })}
                placeholder="Nombre completo o razón social del cliente..."
                className="py-1.5 font-semibold"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  label="Teléfono"
                  value={clientTelefono}
                  onChange={(e) => dispatch({ type: 'SET_CLIENT_TELEFONO', payload: e.target.value })}
                  placeholder="987654321"
                  className="py-1.5 font-semibold"
                />
                <Input
                  label="Correo"
                  value={clientEmail}
                  onChange={(e) => dispatch({ type: 'SET_CLIENT_EMAIL', payload: e.target.value })}
                  placeholder="ejemplo@correo.com"
                  className="py-1.5 font-semibold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Pagos */}
        <div className="space-y-6">
          {/* Métodos de pago */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: 'SET_PAYMENT_METHOD', payload: 'EFECTIVO' })}
              className={`flex-col h-auto py-4 border-2 transition-all ${paymentMethod === 'EFECTIVO' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-transparent opacity-60'}`}
              icon={<Banknote size={24} />}
            >
              <span>Efectivo</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                dispatch({ type: 'SET_PAYMENT_METHOD', payload: 'TARJETA' });
                dispatch({ type: 'SET_AMOUNT_PAID', payload: roundedTotal.toFixed(2) });
              }}
              className={`flex-col h-auto py-4 border-2 transition-all ${paymentMethod === 'TARJETA' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-transparent opacity-60'}`}
              icon={<CreditCard size={24} />}
            >
              <span>Tarjeta / Yape</span>
            </Button>
          </div>

          {/* Input de Monto */}
          <div className="space-y-4">
            <Input
              label={paymentMethod === 'EFECTIVO' ? "Monto recibido (S/)" : "Monto exacto (Tarjeta/Yape)"}
              type="number"
              disabled={paymentMethod === 'TARJETA'}
              autoFocus
              value={amountPaid}
              onChange={(e) => dispatch({ type: 'SET_AMOUNT_PAID', payload: e.target.value })}
              icon={<span className="text-zinc-400 font-bold">S/</span>}
              placeholder="0.00"
              className="text-xl font-bold"
            />

            {/* Vuelto / Estado del Pago */}
            <div className={`p-4 rounded-xl flex justify-between items-center transition-colors ${paidNumber >= roundedTotal
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800'
              }`}>
              <span className="font-semibold">{paidNumber >= roundedTotal ? 'Vuelto:' : 'Pendiente:'}</span>
              <span className="text-2xl font-black">S/ {Math.abs(change).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="w-full"
            >
              Volver
            </Button>
            <Button
              disabled={paymentMethod === 'EFECTIVO' && paidNumber < roundedTotal}
              isLoading={registrarVentaMutation.isPending}
              onClick={async () => {
                let clienteId: number | undefined = undefined;

                if (associateClient) {
                  const doc = documentNumber.trim();
                  const nombre = clientNombre.trim();

                  if (!doc) {
                    notificationService.warning('Documento requerido', 'Por favor ingresa el número de DNI o RUC del cliente.');
                    return;
                  }
                  if (doc.length !== 8 && doc.length !== 11) {
                    notificationService.warning('Documento inválido', 'El documento debe tener 8 dígitos (DNI) u 11 dígitos (RUC).');
                    return;
                  }
                  if (!nombre) {
                    notificationService.warning('Nombre requerido', 'Por favor ingresa el nombre o razón social del cliente.');
                    return;
                  }

                  try {
                    const localClient = await clienteService.getByDniRuc(doc);
                    if (localClient) {
                      // Actualizar datos por si fueron editados durante el cobro
                      await clienteService.update(localClient.id, {
                        nombre,
                        dni_ruc: doc,
                        telefono: clientTelefono.trim(),
                        email: clientEmail.trim()
                      }, user?.id || 1);
                      clienteId = localClient.id;
                    } else {
                      // Registrar el cliente nuevo automáticamente
                      clienteId = await clienteService.create({
                        nombre,
                        dni_ruc: doc,
                        telefono: clientTelefono.trim(),
                        email: clientEmail.trim()
                      }, user?.id || 1);
                    }
                  } catch (error: any) {
                    console.error(error);
                    notificationService.error('Error al registrar cliente', 'No se pudo guardar la información del cliente.');
                    return;
                  }
                }

                const ventaData = {
                  usuario_id: user?.id || 1,
                  cliente_id: clienteId,
                  total: roundedTotal,
                  igv: parseFloat(igvAmount.toFixed(2)),
                  igv_porcentaje: hasIGV ? igvPercent : 0,
                  metodo_pago: paymentMethod,
                  monto_pagado: paidNumber,
                  vuelto: parseFloat(change.toFixed(2)),
                  items: cart.map(i => ({
                    producto_id: i.product.id,
                    cantidad: i.quantity,
                    precio_unitario: i.product.precio_venta || 0
                  }))
                };
                registrarVentaMutation.mutate(ventaData);
              }}
              className="w-full flex-[2]"
            >
              Confirmar Pago
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
