import { getDb } from '../lib/db';

export interface StockAlerta {
  id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
}

export const alertaService = {
  /**
   * Busca productos que estén por debajo de su stock mínimo
   */
  async getLowStockAlerts(): Promise<StockAlerta[]> {
    try {
      const db = await getDb();
      const results = await db.select<StockAlerta[]>(
        `SELECT id, nombre, stock_actual, stock_minimo 
         FROM productos 
         WHERE stock_actual <= stock_minimo 
         AND estado = 'activo'
         ORDER BY stock_actual ASC`
      );
      return results;
    } catch (error) {
      console.error('Error al obtener alertas de stock:', error);
      return [];
    }
  }
};
