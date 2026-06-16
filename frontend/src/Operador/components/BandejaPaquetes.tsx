import React, { useState, useEffect } from 'react';
import { Package, Info, Play, Loader2, AlertTriangle, FileText, X } from 'lucide-react';
import { api, updateActivoEstado } from '../../services/api';
import { Package as PackageType, LogEntry } from '../../types';

type StateType = 'SOLICITADO' | 'EN_TRANSITO' | 'EN_ACOPIO' | 'EN_ACOPIO_ASIGNADO' | 'EN_TRANSITO_ENTREGA' | 'ENTREGADO' | 'RECIBIDO' | 'EN_DISPUTA';

const normalizeState = (state: string): StateType => {
  return state.toUpperCase().replace('Á', 'A').replace('Ó', 'O').replace(' ', '_') as StateType;
};

const STATES_PIPELINE: StateType[] = ['SOLICITADO', 'EN_TRANSITO', 'EN_ACOPIO', 'EN_ACOPIO_ASIGNADO', 'EN_TRANSITO_ENTREGA', 'ENTREGADO', 'RECIBIDO'];

interface BandejaPaquetesProps {
  selectedPackage: PackageType | null;
  setSelectedPackage: (pkg: PackageType | null) => void;
  logs: LogEntry[];
  setLogs: (logs: LogEntry[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string;
  setError: (error: string) => void;
  rutMensajero: string;
  setRutMensajero: (rut: string) => void;
  contingencyToken: string;
  setContingencyToken: (token: string) => void;
  setIsIncidenceModalOpen: (open: boolean) => void;
}

interface Mensajero {
  rut: string;
  nombre_completo: string;
  activo: boolean;
}

const BandejaPaquetes: React.FC<BandejaPaquetesProps> = ({
  selectedPackage,
  setSelectedPackage,
  logs,
  setLogs,
  isLoading,
  setIsLoading,
  error,
  setError,
  rutMensajero,
  setRutMensajero,
  contingencyToken,
  setContingencyToken,
  setIsIncidenceModalOpen,
}) => {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [filter, setFilter] = useState('all');
  const [mensajeros, setMensajeros] = useState<Mensajero[]>([]);

  useEffect(() => {
    fetchMensajeros();
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [filter]);

  useEffect(() => {
    if (selectedPackage) {
      fetchLogs(selectedPackage.id);
    }
  }, [selectedPackage]);

  const fetchMensajeros = async () => {
    try {
      const data = await api.get('/api/packages/mensajeros');
      setMensajeros(data.mensajeros || []);
    } catch (err) {
      console.error('Error al cargar mensajeros:', err);
    }
  };

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSelectedPackage(null);

      if (filter === 'all') {
        const [solicitados, enTransito] = await Promise.all([
          api.get('/api/packages/filter?estado=SOLICITADO'),
          api.get('/api/packages/filter?estado=EN_TRANSITO')
        ]);
        const combined = [...(solicitados.packages || []), ...(enTransito.packages || [])];
        setPackages(combined);
      } else {
        const data = await api.get(`/api/packages/filter?estado=${filter}`);
        setPackages(data.packages || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar paquetes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async (packageId: string) => {
    try {
      const data = await api.get(`/api/packages/${packageId}/logs`);
      setLogs(data.logs || []);
    } catch (err: any) {
      if (err.status !== 404) {
        console.error('Error al cargar logs:', err);
      }
      setLogs([]);
    }
  };

  const handleAction = async (actionType: string) => {
    if (!selectedPackage) return;

    let newStatus: StateType = 'EN_TRANSITO';
    if (actionType === 'INICIAR_TRANSPORTE') newStatus = 'EN_TRANSITO';
    if (actionType === 'RECIBIR_ACOPIO') newStatus = 'EN_ACOPIO';

    if (actionType === 'INICIAR_TRANSPORTE' && !rutMensajero.trim()) {
      setError('Debes seleccionar un mensajero');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const data = await updateActivoEstado(
        selectedPackage.id_activo,
        newStatus,
        selectedPackage.integridad,
        contingencyToken,
        actionType === 'INICIAR_TRANSPORTE' ? rutMensajero : undefined
      );

      setSelectedPackage({
        ...selectedPackage,
        estado_actual: data.asset?.estado_actual || newStatus
      });

      setRutMensajero('');
      setContingencyToken('');

      await fetchLogs(selectedPackage.id);
      await fetchPackages();
      
    } catch (err: any) {
      if (err.status === 403) {
        setError('El paquete está bloqueado. No se pueden realizar acciones.');
      } else if (err.status === 409) {
        setError(err.message || 'Error de conflicto de transición de estado');
      } else {
        setError(err.message || 'Error desconocido');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableTransitions = (currentState: string): { action: string; label: string }[] => {
    const normalized = normalizeState(currentState);
    switch (normalized) {
      case 'SOLICITADO':
        return [{ action: 'INICIAR_TRANSPORTE', label: 'Iniciar Transporte' }];
      case 'EN_TRANSITO':
        return [{ action: 'RECIBIR_ACOPIO', label: 'Recibir en Acopio' }];
      default:
        return [];
    }
  };

  const getStateGlow = (state: string): string => {
    switch (state) {
      case 'SOLICITADO': return 'from-slate-500 to-slate-600';
      case 'EN_TRANSITO': return 'from-blue-500 to-blue-600';
      case 'EN_ACOPIO': return 'from-purple-500 to-purple-600';
      case 'EN_ACOPIO_ASIGNADO': return 'from-indigo-500 to-indigo-600';
      case 'EN_TRANSITO_ENTREGA': return 'from-orange-500 to-orange-600';
      case 'ENTREGADO': return 'from-emerald-500 to-emerald-600';
      case 'RECIBIDO': return 'from-teal-500 to-teal-600';
      case 'EN_DISPUTA': return 'from-red-500 to-red-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getStateDotColor = (state: string): string => {
    switch (state) {
      case 'ENTREGADO':
      case 'RECIBIDO': return 'bg-emerald-400';
      case 'EN_TRANSITO':
      case 'EN_TRANSITO_ENTREGA': return 'bg-blue-400';
      case 'EN_ACOPIO': return 'bg-purple-400';
      case 'EN_ACOPIO_ASIGNADO': return 'bg-indigo-400';
      case 'EN_DISPUTA': return 'bg-red-400';
      default: return 'bg-slate-400';
    }
  };

  const isBlocked = selectedPackage?.is_blocked === true;
  const isDispute = selectedPackage?.estado_actual === 'EN_DISPUTA';
  const hasAvailableActions = getAvailableTransitions(selectedPackage?.estado_actual || '').length > 0;
  const canPerformActions = hasAvailableActions && !isBlocked && !isDispute;

  return (
    <>
      <div className="mb-6 border-b border-white/5 pb-4">
        <h2 className="text-3xl font-bold text-white inline-block relative">
          Bandeja de Paquetes
          <div className="absolute -bottom-4 left-0 w-1/3 h-1 bg-emerald-500 rounded-full"></div>
        </h2>
        <p className="text-slate-400 mt-4">Gestión de paquetes SOLICITADOS y EN TRÁNSITO</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
            <X size={16} />
          </button>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#131b26] rounded-xl p-6 flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-white">Procesando...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)]">
        {/* Left Column: List */}
        <div className="lg:col-span-4 flex flex-col h-full bg-[#131b26] rounded-2xl border border-white/5 p-4 overflow-hidden">
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'SOLICITADO', 'EN_TRANSITO'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  filter === f
                    ? 'bg-emerald-400 text-black'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {f === 'all' ? 'Todos' : f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {packages.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay paquetes disponibles</p>
              </div>
            ) : (
              packages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`w-full text-left p-4 rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-[#1a2332] border-white/5 border-r-4 border-r-emerald-500'
                        : 'bg-[#151e2a] border-white/5 hover:bg-[#1a2332]'
                    }`}
                  >
                    <h4 className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {pkg.nombre}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {pkg.direccion_destino}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStateDotColor(pkg.estado_actual)}`} />
                      <span className="text-xs font-medium text-slate-400 lowercase">
                        {pkg.estado_actual?.replace('_', ' ') || 'Desconocido'}
                      </span>
                    </div>
                    {pkg.is_blocked && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Bloqueado</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-8 flex flex-col h-full bg-[#131b26] rounded-2xl border border-white/5 overflow-hidden">
          {!selectedPackage ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <div className="w-16 h-16 rounded-full border border-slate-700 flex items-center justify-center mx-auto mb-4">
                  <Info className="w-6 h-6 text-slate-600" />
                </div>
                <p className="font-medium text-slate-400">Selecciona un paquete de la lista</p>
                <p className="text-sm mt-1 text-slate-600">para ver los detalles completos</p>
              </div>
            </div>
          ) : (
            <div className="p-6 h-full flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-white">Detalles del envío</h4>
                  <p className="text-slate-400 text-sm mt-1 font-mono">ID: {selectedPackage.id}</p>
                </div>
                {(isBlocked || isDispute) && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    isDispute ? 'bg-red-500/20 border border-red-500/50' : 'bg-orange-500/20 border border-orange-500/50'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${isDispute ? 'text-red-400' : 'text-orange-400'}`} />
                    <span className={`text-sm font-semibold ${isDispute ? 'text-red-400' : 'text-orange-400'}`}>
                      {isDispute ? 'EN DISPUTA' : 'PAQUETE BLOQUEADO'}
                    </span>
                  </div>
                )}
              </div>

              {/* Pipeline */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  {STATES_PIPELINE.map((state, idx) => {
                    const current = normalizeState(selectedPackage.estado_actual);
                    const isActive = current === state;
                    const isPassed = STATES_PIPELINE.indexOf(current) > idx;

                    return (
                      <div key={state} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center flex-shrink-0 relative">
                          <div
                            className={`flex items-center justify-center w-14 h-14 rounded-full font-bold text-xs transition-all relative z-10 ${
                              isActive
                                ? `bg-gradient-to-r ${getStateGlow(state)} text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-110`
                                : isPassed
                                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                                  : 'bg-slate-800/50 border border-slate-700 text-slate-500'
                            }`}
                          >
                            {state.slice(0, 3)}
                          </div>
                          <p className={`text-xs mt-3 text-center absolute -bottom-6 w-24 left-1/2 -translate-x-1/2 ${
                            isActive ? 'text-white font-medium' : isPassed ? 'text-emerald-400/80' : 'text-slate-500'
                          }`}>
                            {state.toLowerCase().replace('_', ' ')}
                          </p>
                        </div>

                        {idx < STATES_PIPELINE.length - 1 && (
                          <div className="flex-1 h-0.5 mx-2 bg-slate-800/50 relative">
                            <div
                              className={`absolute inset-0 h-full rounded-full transition-all ${
                                isPassed
                                  ? 'bg-emerald-500/50'
                                  : isActive
                                    ? 'bg-gradient-to-r from-emerald-500/50 to-transparent'
                                    : 'bg-transparent'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Información Detallada */}
              <div className="grid grid-cols-2 gap-4 bg-[#1a2332] rounded-xl p-4 border border-white/5">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Nombre</p>
                  <p className="text-white font-medium">{selectedPackage.nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Integridad</p>
                  <p className={`font-medium ${selectedPackage.integridad === 'Intacto' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {selectedPackage.integridad}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Origen</p>
                  <p className="text-white font-medium">{selectedPackage.direccion_origen}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Destino</p>
                  <p className="text-white font-medium">{selectedPackage.direccion_destino}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">RUT Remitente</p>
                  <p className="text-white font-mono text-sm">{selectedPackage.rut_remitente}</p>
                </div>
                <div className="col-span-2 pt-4 border-t border-white/5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Creado</p>
                  <p className="text-slate-300 text-sm">
                    {new Date(selectedPackage.created_at).toLocaleString('es-ES', {
                      dateStyle: 'long',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>

              {/* Controles */}
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="relative">
                    <select
                      value={rutMensajero}
                      onChange={(e) => setRutMensajero(e.target.value)}
                      className="w-full bg-[#1a2332] p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-white appearance-none cursor-pointer border border-white/5"
                      disabled={!canPerformActions || isLoading}
                    >
                      <option value="">Selecciona un mensajero</option>
                      {mensajeros.map(m => (
                        <option key={m.rut} value={m.rut}>
                          {m.nombre_completo} - {m.rut}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={contingencyToken}
                    onChange={(e) => setContingencyToken(e.target.value.toUpperCase())}
                    placeholder="Token de Contingencia (opcional)"
                    className="bg-[#1a2332] p-3 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder:text-slate-500 font-mono border border-white/5"
                    disabled={!canPerformActions || isLoading}
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-4">
                  {getAvailableTransitions(selectedPackage.estado_actual).map((transition) => (
                    <button
                      key={transition.action}
                      onClick={() => handleAction(transition.action)}
                      disabled={!canPerformActions || isLoading || (transition.action === 'INICIAR_TRANSPORTE' && !rutMensajero)}
                      className={`flex-1 rounded-xl py-3 font-bold text-white transition-all flex items-center justify-center gap-2 ${
                        !canPerformActions || isLoading || (transition.action === 'INICIAR_TRANSPORTE' && !rutMensajero)
                          ? 'bg-slate-700 cursor-not-allowed opacity-50'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                      }`}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      {transition.label}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setIsIncidenceModalOpen(true)}
                    disabled={isLoading || isDispute}
                    className={`flex-1 rounded-xl py-3 font-bold text-white transition-all flex items-center justify-center gap-2 ${
                      isLoading || isDispute
                        ? 'bg-slate-700 cursor-not-allowed opacity-50'
                        : 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Reportar Incidencia
                  </button>
                </div>

                {isBlocked && !isDispute && (
                  <p className="text-center text-orange-400 text-sm mt-3">
                    ⚠️ Este paquete está bloqueado. No se pueden realizar acciones hasta resolver la incidencia.
                  </p>
                )}
              </div>

              {/* Terminal de Logs */}
              <div className="mt-4 bg-black/60 rounded-xl p-4 flex-1 min-h-[100px]">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Terminal de Custodia - Historial de Eventos
                  </p>
                </div>
                <div className="space-y-1 font-mono text-xs max-h-32 overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-slate-600">$ No hay eventos registrados para este paquete...</p>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={log.id || idx} className={`py-1 ${
                        log.tipo_alerta === 'crítico' 
                          ? 'text-red-400' 
                          : log.tipo_alerta === 'resolución'
                          ? 'text-green-400'
                          : 'text-slate-400'
                      }`}>
                        <span className="text-slate-600">[{new Date(log.timestamp).toLocaleString()}]</span>
                        {' '}
                        <span className="text-emerald-400">{log.estado_instante}</span>
                        {' › '}
                        {log.rut_responsable && <span className="text-slate-500">[{log.rut_responsable}]</span>}
                        {' '}
                        {log.tipo_alerta === 'crítico' && <AlertTriangle className="inline w-3 h-3 mr-1" />}
                        {log.tipo_alerta === 'resolución' && '✓ '}
                        {log.tipo_alerta === 'crítico' ? 'INCIDENCIA' : 'Cambio de estado'}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BandejaPaquetes;