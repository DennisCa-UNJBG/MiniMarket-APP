import { ConnectionError } from './errors';
import { notificationService } from './notifications';

/**
 * Envuelve cualquier llamada a un servicio de base de datos.
 * - Si ocurre un ConnectionError, lo maneja automáticamente mostrando una alerta
 *   y lanzando el error para que el caller sepa que falló.
 * - Cualquier otro error (ej. AuthError) se deja pasar sin interceptar,
 *   para que el componente lo maneje según su lógica específica.
 */
export async function withDb<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ConnectionError) {
      notificationService.error(
        'Error de conexión',
        'No se pudo conectar a la base de datos. Verifica la instalación.'
      );
    }
    // Re-lanzamos el error (sea ConnectionError u otro) para que el
    // llamador sepa que la operación no se completó
    throw error;
  }
}
