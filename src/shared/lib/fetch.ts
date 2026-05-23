/**
 * Helper para realizar solicitudes HTTP fetch con un timeout.
 * Previene que la interfaz quede colgada indefinidamente si la red o el servidor fallan.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 15000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`La solicitud al servidor central superó el límite de tiempo de ${timeout / 1000} segundos.`);
    }
    throw error;
  }
}
