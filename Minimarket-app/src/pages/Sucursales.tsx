import { useState, useEffect } from 'react';
import { Building2, Plus, Search, MapPin, Key, RefreshCw, Pencil, Copy, Clock, AlertCircle, Power, RotateCcw } from 'lucide-react';
import { sucursalService } from '../services/sucursalService';
import { notificationService } from '../lib/notifications';
import { Badge } from '../components/ui/Badge';

export function Sucursales() {
  const [sedes, setSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    direccion: '',
    estado: 'activo'
  });

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nuevoEstado = currentStatus === 'activo' ? 'inactivo' : 'activo';
    const confirmMsg = nuevoEstado === 'inactivo' 
      ? '¿Estás seguro de desactivar esta sucursal? No podrá sincronizar hasta que sea reactivada.'
      : '¿Deseas reactivar esta sucursal?';

    const confirmed = await notificationService.confirm(
      nuevoEstado === 'inactivo' ? 'Desactivar Sede' : 'Reactivar Sede',
      confirmMsg
    );

    if (!confirmed) return;

    try {
      await sucursalService.toggleEstado(id, nuevoEstado as 'activo' | 'inactivo');
      notificationService.success(
        nuevoEstado === 'activo' ? 'Sede Reactivada' : 'Sede Desactivada', 
        `La sucursal ahora está ${nuevoEstado}.`
      );
      loadSedes();
    } catch (error) {
      notificationService.error('Error', 'No se pudo cambiar el estado de la sucursal.');
    }
  };

  const loadSedes = async () => {
    setLoading(true);
    try {
      const data = await sucursalService.getAll();
      setSedes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSedes();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ codigo: '', nombre: '', direccion: '', estado: 'activo' });
    setShowModal(true);
  };

  const handleOpenEdit = (sede: any) => {
    setEditingId(sede.id);
    setFormData({
      codigo: sede.codigo,
      nombre: sede.nombre,
      direccion: sede.direccion || '',
      estado: sede.estado || 'activo'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await sucursalService.update(editingId, formData);
        notificationService.success('Sucursal Actualizada', 'Los cambios se guardaron correctamente.');
      } else {
        await sucursalService.create(formData);
        notificationService.success('Sucursal Registrada', 'La nueva sucursal ha sido creada.');
      }
      setShowModal(false);
      loadSedes();
    } catch (error: any) {
      notificationService.error('Error', 'No se pudo procesar la solicitud.');
    }
  };

  const getStatus = (lastSync: string | null, estado: string) => {
    if (estado !== 'activo') return { label: 'DESACTIVADO', variant: 'gray' as const };
    if (!lastSync) return { label: 'NUNCA', variant: 'gray' as const };
    
    const diff = new Date().getTime() - new Date(lastSync).getTime();
    if (diff < 300000) return { label: 'EN LÍNEA', variant: 'emerald' as const };
    return { label: 'DESCONECTADO', variant: 'amber' as const };
  };

  const activeSedes = sedes.filter(s => 
    s.estado === 'activo' && 
    (s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const inactiveSedes = sedes.filter(s => 
    s.estado !== 'activo' && 
    (s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Gestión de Sucursales</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Registra y administra las sucursales del minimarket.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <Plus size={18} />
          Registrar Nueva Sucursal
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
        />
      </div>

      {/* Tabla de Sedes Activas */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sucursal / Código</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ubicación / Sincro</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Estado Real</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                    Cargando sucursales...
                  </td>
                </tr>
              ) : activeSedes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No hay sucursales activas.</td>
                </tr>
              ) : (
                activeSedes.map((sede) => (
                  <tr key={sede.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">{sede.nombre}</p>
                          <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                            <Key size={10} />
                            {sede.codigo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <MapPin size={12} />
                          {sede.direccion || 'No especificada'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          <Clock size={10} />
                          {sede.ultima_sincronizacion ? new Date(sede.ultima_sincronizacion).toLocaleString() : 'Sin sincronización'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(() => {
                        const { label, variant } = getStatus(sede.ultima_sincronizacion, sede.estado);
                        return <Badge label={label} variant={variant} />;
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="relative group/tooltip">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`Sede: ${sede.nombre}\nCódigo: ${sede.codigo}`);
                              notificationService.success('Copiado', 'Datos de sede listos para configurar.');
                            }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800"
                          >
                            <Copy size={16} />
                          </button>
                          <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] leading-tight rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 shadow-xl pointer-events-none">
                            Copiar nombre y llave de acceso
                            <div className="absolute top-full right-4 border-8 border-transparent border-t-gray-900" />
                          </div>
                        </div>

                        <button 
                          onClick={() => handleOpenEdit(sede)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>

                        <button 
                          onClick={() => handleToggleStatus(sede.id, sede.estado)}
                          className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition-all bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800"
                          title="Desactivar"
                        >
                          <Power size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sedes Inactivas */}
      {inactiveSedes.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl text-amber-700 dark:text-amber-400">
            <AlertCircle size={20} />
            <div>
              <p className="text-xs font-bold">Sucursales Desactivadas</p>
              <p className="text-[10px] opacity-80">Las sedes en esta lista tienen el acceso restringido y no pueden sincronizar datos con la central.</p>
            </div>
          </div>

          <div className="bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden opacity-60">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/50 dark:bg-gray-800/50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sucursal / Código</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {inactiveSedes.map((sede) => (
                    <tr key={sede.id} className="hover:bg-gray-100/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Building2 size={18} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{sede.nombre}</p>
                            <p className="text-[10px] font-mono text-gray-400">{sede.codigo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(sede)}
                            className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(sede.id, sede.estado)}
                            className="p-2 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl transition-all"
                            title="Reactivar"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro/Edición */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-800 dark:text-white">
                {editingId ? 'Editar Sucursal' : 'Registrar Nueva Sucursal'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Código Único (Llave de Acceso)</label>
                <input
                  required
                  disabled={!!editingId}
                  type="text"
                  placeholder="Ej: SEDE-SUR-01"
                  value={formData.codigo}
                  onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                  className={`w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${editingId ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}`}
                />
                {editingId && (
                  <p className="text-[9px] text-amber-500 ml-1 font-bold italic">La llave de acceso no se puede modificar.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Nombre de la Sucursal</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Sucursal Av. Ejercito"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Dirección (Opcional)</label>
                <input
                  type="text"
                  placeholder="Av. Principal 456..."
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="w-full px-4 py-2.5 text-sm font-medium border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {/* El estado ahora se gestiona exclusivamente desde la tabla mediante handleToggleStatus */}
              <button 
                type="submit"
                className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                {editingId ? 'Guardar Cambios' : 'Registrar y Generar Acceso'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
