import { useMutation, useQueryClient } from '@tanstack/react-query';
import { syncService } from '../Service';
import { notificationService } from '../../../shared/lib/notifications';

export function useSync(options?: { onSuccess?: (data: any) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      notificationService.info(
        'Sincronizando',
        'Enviando ventas, cajas, compras y descargando catálogo actualizado...'
      );
      return await syncService.syncAllData();
    },
    onSuccess: (data) => {
      notificationService.successWithConfirm(
        'Sincronización Exitosa',
        `Se han sincronizado correctamente todos los datos con la Sede Central.

        📤 ENVIADOS A LA CENTRAL:
        • Ventas: ${data.enviadas} registrada(s)
        • Compras: ${data.coEnviadas} ingreso(s)
        • Cajas: ${data.cEnviadas} cierre(s)
        • Kardex: ${data.kEnviadas} movimiento(s)

        📥 RECIBIDOS DE LA CENTRAL:
        • Catálogo: ${data.pCreados} nuevo(s), ${data.pActualizados} actualizado(s)
        • Unidades: ${data.umCreados} nueva(s), ${data.umActualizados} actualizada(s)
        • Roles: ${data.rCreados} nuevo(s), ${data.rActualizados} actualizado(s)
        • Usuarios: ${data.uCreados} nuevo(s), ${data.uActualizados} autorizado(s)`
      );

      // Invalidar caché de React Query para forzar el refresco automático de la interfaz en segundo plano
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['units-full'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });

      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      notificationService.error('Error de Sincronización', error.message);
    }
  });
}
