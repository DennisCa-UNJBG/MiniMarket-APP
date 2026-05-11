/**
 * Verifica si un registro es editable basado en su fecha de creación.
 * Por política de negocio, solo se permite editar durante las primeras 12 horas.
 * 
 * @param fechaCreacion Fecha en formato string (ISO/DB) o Date
 * @param horasLimite Límite de tiempo permitido (default: 12)
 * @returns boolean true si es editable, false si ha expirado
 */
export const esRegistroEditable = (fechaCreacion: string | Date, horasLimite: number = 12): boolean => {
  if (!fechaCreacion) return false;
  
  // Si es string y no tiene indicador de zona, le añadimos UTC para un parseo correcto
  // igual a como lo haces en Ventas.tsx y Compras.tsx
  const fecha = typeof fechaCreacion === 'string' && !fechaCreacion.includes('Z') && !fechaCreacion.includes('+')
    ? new Date(fechaCreacion + " UTC") 
    : new Date(fechaCreacion);

  const ahora = new Date();
  
  // getTime() nos da el timestamp absoluto (independiente de zona horaria)
  const diferenciaMs = ahora.getTime() - fecha.getTime();
  
  // Convertir a horas
  const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);
  
  return diferenciaHoras <= horasLimite;
};
