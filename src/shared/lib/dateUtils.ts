/**
 * Utilidades para el manejo consistente de Fechas y Zonas Horarias (UTC vs Local)
 * Solución 100% nativa sin dependencias externas para optimizar el rendimiento y escalabilidad.
 */
export const dateUtils = {
  /**
   * Obtiene la fecha de hoy en formato local 'YYYY-MM-DD' sin desfases UTC.
   */
  getTodayLocal(): string {
    const d = new Date();
    return this.formatToLocalISO(d);
  },

  /**
   * Obtiene la fecha de ayer en formato local 'YYYY-MM-DD'.
   */
  getYesterdayLocal(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return this.formatToLocalISO(d);
  },

  /**
   * Genera un array de fechas con los últimos N días locales en formato 'YYYY-MM-DD'.
   * Perfecto para gráficos que comparan días locales.
   */
  getLastDaysLocal(count = 7): string[] {
    const days: string[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(this.formatToLocalISO(d));
    }
    return days;
  },

  /**
   * Formatea un objeto Date a formato local ISO 'YYYY-MM-DD'.
   */
  formatToLocalISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Convierte una fecha UTC de la base de datos a un formato amigable local para mostrar.
   */
  formatUTCtoLocalString(utcString: string, includeTime = true): string {
    if (!utcString) return '';
    // Agregamos el sufijo UTC para que el navegador sepa que viene en UTC
    const date = new Date(utcString.includes('UTC') ? utcString : utcString + ' UTC');
    return includeTime ? date.toLocaleString() : date.toLocaleDateString();
  },

  /**
   * Convierte una fecha UTC de la base de datos a solo su componente de hora local en formato amigable.
   */
  formatUTCtoLocalTimeString(utcString: string): string {
    if (!utcString) return '';
    const date = new Date(utcString.includes('UTC') ? utcString : utcString + ' UTC');
    return date.toLocaleTimeString();
  },

  /**
   * Convierte una fecha UTC de la base de datos a solo su componente de fecha local en formato amigable.
   */
  formatUTCtoLocalDateString(utcString: string): string {
    if (!utcString) return '';
    const date = new Date(utcString.includes('UTC') ? utcString : utcString + ' UTC');
    return date.toLocaleDateString();
  },

  /**
   * Obtiene el primer día del mes actual en formato local 'YYYY-MM-DD'.
   */
  getFirstDayOfMonthLocal(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  },

  /**
   * Formatea un string de fecha local ISO 'YYYY-MM-DD' a formato de fecha local legible.
   */
  formatLocalISOToLocalDateString(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString + 'T00:00:00');
    return date.toLocaleDateString('es-PE');
  },

  /**
   * Formatea la fecha actual o una fecha dada a un formato largo legible en español.
   */
  formatToLongDateString(date: Date = new Date()): string {
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  },

  /**
   * Determina si una fecha UTC de la base de datos es reciente (por debajo del límite de milisegundos indicado).
   */
  isRecentUTC(utcString: string | null, limitMs = 300000): boolean {
    if (!utcString) return false;
    const date = new Date(utcString.includes('UTC') ? utcString : utcString + ' UTC');
    return (new Date().getTime() - date.getTime()) < limitMs;
  },

  /**
   * Obtiene el nombre corto del día de la semana para un string de fecha local ISO 'YYYY-MM-DD'.
   */
  getShortWeekday(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString + 'T12:00:00Z');
    return date.toLocaleDateString('es-PE', { weekday: 'short' });
  },

  /**
   * Determina si una fecha UTC de la base de datos cae en el mes y año local actual.
   */
  isCurrentMonthUTC(utcString: string): boolean {
    if (!utcString) return false;
    const date = new Date(utcString.includes('UTC') ? utcString : utcString + ' UTC');
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
};
