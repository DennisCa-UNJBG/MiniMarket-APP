
import { useState } from 'react';
import {
  Plus,
  Search,
  User,
  Phone,
  Mail
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';

const clients = [
  { id: 1, name: 'María García',     dni: '47823456', phone: '923 456 789', email: 'mgarcia@mail.com',    purchases: 12, total: 340.50 },
  { id: 2, name: 'Juan Quispe',      dni: '40123789', phone: '945 123 456', email: 'jquispe@mail.com',    purchases: 5,  total: 128.00 },
  { id: 3, name: 'Ana Mamani',       dni: '52987654', phone: '961 789 123', email: 'amamani@mail.com',    purchases: 8,  total: 215.75 },
  { id: 4, name: 'Carlos Flores',    dni: '43765432', phone: '912 345 678', email: 'cflores@mail.com',    purchases: 20, total: 890.00 },
  { id: 5, name: 'Rosa Huanca',      dni: '48234567', phone: '934 567 890', email: 'rhuanca@mail.com',    purchases: 3,  total: 67.30  },
  { id: 6, name: 'Pedro Condori',    dni: '41876543', phone: '956 890 123', email: 'pcondori@mail.com',   purchases: 15, total: 450.20 },
];

export function Clientes() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} clientes registrados`}
        action={
          <Button
            id="add-client-btn"
            onClick={() => setShowModal(true)}
            icon={<Plus size={16} />}
          >
            Agregar cliente
          </Button>
        }
      />

      {/* Búsqueda */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            id="search-clients"
            type="text"
            placeholder="Buscar por nombre o DNI..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        </div>
      </div>

      {/* Cards de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            {/* Avatar + nombre */}
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-800 dark:text-white truncate">{c.name}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">DNI: {c.dni}</p>
              </div>
            </div>

            {/* Contacto */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Phone size={12} /> {c.phone}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Mail size={12} /> {c.email}
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-700">
              <div className="text-center">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Compras</p>
                <p className="text-sm font-bold text-zinc-800 dark:text-white">{c.purchases}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Total gastado</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">S/ {c.total.toFixed(2)}</p>
              </div>
              <Tooltip text="Ver historial del cliente" position="top-right">
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                >
                  Ver historial
                </Button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Agregar Cliente" onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2 flex flex-col gap-1.5">
              <label htmlFor="cliente-nombre" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nombre Completo *</label>
              <input id="cliente-nombre" className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" placeholder="Nombres y apellidos..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cliente-dni" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">DNI / RUC</label>
              <input id="cliente-dni" className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" placeholder="Número de documento..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cliente-telefono" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Teléfono</label>
              <input id="cliente-telefono" type="tel" className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" placeholder="Celular o teléfono fijo..." />
            </div>
             <div className="col-span-2 flex flex-col gap-1.5">
              <label htmlFor="cliente-email" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Correo Electrónico</label>
              <input id="cliente-email" type="email" className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" placeholder="correo@ejemplo.com" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowModal(false)}>
              Guardar Cliente
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
