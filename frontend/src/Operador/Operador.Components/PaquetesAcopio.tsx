import React from 'react';
import { Package, Info, Loader2, AlertTriangle, FileText, X, UserCheck } from 'lucide-react';
import { Package as PackageType, LogEntry } from '../../types';
import { StateType } from '../Operador.types';
import { usePaquetesAcopio } from '../Operador.hooks';

const normalizeState = (state: string): StateType => {
  return state.toUpperCase().replace('Á', 'A').replace('Ó', 'O').replace(' ', '_') as StateType;
};

const STATES_PIPELINE: StateType[] = ['SOLICITADO', 'EN_TRANSITO', 'EN_ACOPIO', 'EN_ACOPIO_ASIGNADO', 'EN_TRANSITO_ENTREGA', 'ENTREGADO', 'RECIBIDO'];

interface PaquetesAcopioProps {
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

const PaquetesAcopio: React.FC<PaquetesAcopioProps> = ({
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
  const {
    packages,
    mensajeros,
    filter,
    setFilter,
    handleAsignarMensajero
  } = usePaquetesAcopio(
    selectedPackage,
    setSelectedPackage,
    setLogs,
    setIsLoading,
    setError,
    rutMensajero,
    setRutMensajero,
    contingencyToken,
    setContingencyToken
  );

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

  const isEnAcopio = (pkg: PackageType | null): boolean => {
    if (!pkg) return false;
    const estado = normalizeState(pkg.estado_actual);
    return estado === 'EN_ACOPIO';
  };

  const isEnAcopioAsignado = (pkg: PackageType | null): boolean => {
    if (!pkg) return false;
    const estado = normalizeState(pkg.estado_actual);
    return estado === 'EN_ACOPIO_ASIGNADO';
  };

  const canAssign = (pkg: PackageType | null): boolean => {
    if (!pkg) return false;
    const enAcopio = isEnAcopio(pkg);
    const noBloqueado = !pkg.is_blocked;
    const noDisputa = !isDispute(pkg);
    const noMensajero = !pkg.rut_mensajero;
    return enAcopio && noBloqueado && noDisputa && noMensajero;
  };

  const isDispute = (pkg: PackageType | null): boolean => {
    if (!pkg) return false;
    const estado = normalizeState(pkg.estado_actual);
    return estado === 'EN_DISPUTA';
  };

  const isBlocked = (pkg: PackageType | null): boolean => {
    if (!pkg) return false;
    return pkg.is_blocked === true;
  };

  return (
    <>
      <div className="mb-6 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white inline-block relative">
            Paquetes en Acopio
            <div className="absolute -bottom-4 left-0 w-1/3 h-1 bg-purple-500 rounded-full"></div>
          </h2>
          <p className="text-slate-400 mt-4">Gestiona los paquetes en punto de acopio</p>
        </div>
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-purple-500 px-2">Paquetes</h3>
            <span className="text-xs text-slate-400">{packages.length} paquetes</span>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mb-4 px-2">
            <button
              onClick={() => setFilter('EN_ACOPIO')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === 'EN_ACOPIO'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              Sin Asignar
            </button>
            <button
              onClick={() => setFilter('EN_ACOPIO_ASIGNADO')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === 'EN_ACOPIO_ASIGNADO'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              Con Mensajero
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {packages.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay paquetes en esta categoría</p>
              </div>
            ) : (
              packages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                const tieneMensajero = pkg.rut_mensajero && pkg.rut_mensajero.trim() !== '';
                return (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPackage(pkg);
                    }}
                    className={`w-full text-left p-4 rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-[#1a2332] border-white/5 border-r-4 border-r-purple-500'
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
                    {tieneMensajero && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-indigo-400">
                        <UserCheck className="w-3 h-3" />
                        <span>Mensajero: {pkg.rut_mensajero}</span>
                      </div>
                    )}
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                      isEnAcopio(selectedPackage) ? 'bg-purple-500/20 text-purple-400' :
                      isEnAcopioAsignado(selectedPackage) ? 'bg-indigo-500/20 text-indigo-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      Estado: {selectedPackage.estado_actual?.replace('_', ' ') || 'Desconocido'}
                    </span>
                    {selectedPackage.rut_mensajero && (
                      <span className="text-sm font-medium px-2 py-1 rounded bg-indigo-500/20 text-indigo-400">
                        Mensajero: {selectedPackage.rut_mensajero}
                      </span>
                    )}
                  </div>
                </div>
                {(isBlocked(selectedPackage) || isDispute(selectedPackage)) && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    isDispute(selectedPackage) ? 'bg-red-500/20 border border-red-500/50' : 'bg-orange-500/20 border border-orange-500/50'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${isDispute(selectedPackage) ? 'text-red-400' : 'text-orange-400'}`} />
                    <span className={`text-sm font-semibold ${isDispute(selectedPackage) ? 'text-red-400' : 'text-orange-400'}`}>
                      {isDispute(selectedPackage) ? 'EN DISPUTA' : 'PAQUETE BLOQUEADO'}
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

              {/* Controles - Asignación de mensajero */}
              <div className="mt-4">
                {canAssign(selectedPackage) ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="relative">
                        <select
                          value={rutMensajero}
                          onChange={(e) => setRutMensajero(e.target.value)}
                          className="w-full bg-[#1a2332] p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-white appearance-none cursor-pointer border border-white/5"
                          disabled={isLoading}
                        >
                          <option value="">Selecciona un mensajero</option>
                          {mensajeros.map(m => (
                            <option key={m.rut} value={m.rut}>
                              {m.nombre_completo} - {m.rut}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleAsignarMensajero}
                      disabled={!rutMensajero || isLoading}
                      className={`w-full rounded-xl py-3 font-bold text-white transition-all flex items-center justify-center gap-2 ${
                        !rutMensajero || isLoading
                          ? 'bg-slate-700 cursor-not-allowed opacity-50'
                          : 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]'
                      }`}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                      Asignar Mensajero
                    </button>
                  </div>
                ) : isEnAcopioAsignado(selectedPackage) ? (
                  <div className="text-center text-indigo-400 py-4 border border-indigo-500/30 rounded-lg bg-indigo-500/10">
                    <UserCheck className="w-5 h-5 mx-auto mb-2 text-indigo-400" />
                    <p>✅ Mensajero ya asignado</p>
                    <p className="text-xs text-slate-500 mt-1">El paquete está en espera de ser recogido</p>
                  </div>
                ) : isBlocked(selectedPackage) ? (
                  <div className="text-center text-orange-400 py-4 border border-orange-500/30 rounded-lg bg-orange-500/10">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-orange-400" />
                    <p>⚠️ Paquete bloqueado</p>
                    <p className="text-xs text-slate-500 mt-1">No se pueden realizar acciones hasta resolver la incidencia</p>
                  </div>
                ) : isDispute(selectedPackage) ? (
                  <div className="text-center text-red-400 py-4 border border-red-500/30 rounded-lg bg-red-500/10">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-red-400" />
                    <p>⚠️ Paquete en disputa</p>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-4">
                    <p>Este paquete no está disponible para asignación</p>
                    <p className="text-xs text-slate-500 mt-1">Estado actual: {selectedPackage.estado_actual}</p>
                  </div>
                )}

                {/* Botón de reportar incidencia - solo si no está en disputa */}
                {!isDispute(selectedPackage) && (
                  <div className="mt-4">
                    <button
                      onClick={() => setIsIncidenceModalOpen(true)}
                      disabled={isLoading}
                      className={`w-full rounded-xl py-3 font-bold text-white transition-all flex items-center justify-center gap-2 ${
                        isLoading
                          ? 'bg-slate-700 cursor-not-allowed opacity-50'
                          : 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Reportar Incidencia
                    </button>
                  </div>
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

export default PaquetesAcopio;