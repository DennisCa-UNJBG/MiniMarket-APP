import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';

interface ClienteFormModalProps {
  showModal: boolean;
  editingId: number | null;
  form: {
    nombre: string;
    dni_ruc: string;
    telefono: string;
    email: string;
  };
  isSubmitted: boolean;
  errors: {
    nombre: string | null;
    dni_ruc: string | null;
  };
  setForm: (payload: Partial<ClienteFormModalProps['form']>) => void;
  onClose: () => void;
  onConsultarAPI: () => Promise<void> | void;
  onSave: () => Promise<void> | void;
}

export function ClienteFormModal({
  showModal,
  editingId,
  form,
  isSubmitted,
  errors,
  setForm,
  onClose,
  onConsultarAPI,
  onSave,
}: ClienteFormModalProps) {
  const [isQueryingAPI, setIsQueryingAPI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!showModal) return null;

  const handleConsultar = async () => {
    setIsQueryingAPI(true);
    try {
      await onConsultarAPI();
    } finally {
      setIsQueryingAPI(false);
    }
  };

  const handleGuardar = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={editingId ? "Editar Cliente" : "Agregar Cliente"}
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-4">
        {/* DNI / RUC al inicio */}
        <div className="col-span-2 flex flex-col gap-1.5">
          <label htmlFor="cliente-dni" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">DNI / RUC</label>
          <div className="flex gap-2">
            <input
              id="cliente-dni"
              value={form.dni_ruc}
              onChange={(e) => setForm({ dni_ruc: e.target.value })}
              disabled={!!editingId}
              className={`flex-1 min-w-0 px-3 py-2 text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:disabled:bg-zinc-800 ${isSubmitted && errors.dni_ruc ? 'border-red-500 focus:ring-red-400' : 'border-zinc-200 dark:border-zinc-600'}`}
              placeholder="Número de documento..."
            />
            {!editingId && (
              <Button
                type="button"
                onClick={handleConsultar}
                disabled={isQueryingAPI}
                className="px-3"
                variant="primary"
              >
                {isQueryingAPI ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
              </Button>
            )}
          </div>
          {isSubmitted && errors.dni_ruc && (
            <span className="text-[11px] text-red-500">{errors.dni_ruc}</span>
          )}
        </div>

        {/* Nombre Completo / Razón Social */}
        <div className="col-span-2 flex flex-col gap-1.5">
          <label htmlFor="cliente-nombre" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nombre Completo / Razón Social *</label>
          <input
            id="cliente-nombre"
            value={form.nombre}
            onChange={(e) => setForm({ nombre: e.target.value })}
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${isSubmitted && errors.nombre ? 'border-red-500 focus:ring-red-400' : 'border-zinc-200 dark:border-zinc-600'}`}
            placeholder="Nombres y apellidos o Razón social..."
          />
          {isSubmitted && errors.nombre && (
            <span className="text-[11px] text-red-500">{errors.nombre}</span>
          )}
        </div>

        {/* Teléfono */}
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
          <label htmlFor="cliente-telefono" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Teléfono</label>
          <input
            id="cliente-telefono"
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm({ telefono: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            placeholder="Celular o teléfono fijo..."
          />
        </div>

        {/* Correo Electrónico */}
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
          <label htmlFor="cliente-email" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Correo Electrónico</label>
          <input
            id="cliente-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ email: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            placeholder="correo@ejemplo.com"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleGuardar} disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Cliente'}
        </Button>
      </div>
    </Modal>
  );
}

