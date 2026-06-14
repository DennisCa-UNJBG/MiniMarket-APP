// src/modules/productos/importService.ts
//
// Servicio de importación de catálogo desde Excel (001.xlsx)
// Orquesta: selección de archivo → llamada al comando Rust → resultado

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

/** Resumen de una compra generada por hoja */
export interface CompraResumen {
  hoja:      string;
  compra_id: number;
  productos: number;
  total:     number;
}

/** Resultado devuelto por el comando Rust */
export interface ImportResult {
  insertados:      number;
  ignorados:       number;
  errores:         number;
  compras:         CompraResumen[];
  detalle_errores: string[];
}

/**
 * Abre el selector de archivos nativo filtrado por .xlsx
 * Retorna la ruta seleccionada o null si el usuario canceló
 */
export async function seleccionarArchivoExcel(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    directory: false,
    filters: [
      {
        name: 'Excel',
        extensions: ['xlsx', 'xls'],
      },
    ],
    title: 'Seleccionar catálogo de productos (001.xlsx)',
  });

  if (!selected || Array.isArray(selected)) return null;
  return selected;
}

/**
 * Llama al comando Rust que lee el Excel e importa los datos
 */
export async function importarDesdeExcel(filePath: string): Promise<ImportResult> {
  return invoke<ImportResult>('import_productos_excel', { filePath });
}

/**
 * Crea un backup de la base de datos antes de importar
 * Retorna la ruta absoluta donde se guardó el backup
 */
export async function crearBackup(): Promise<string> {
  return invoke<string>('backup_database');
}
