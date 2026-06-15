import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Play, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { api, updateActivoEstado } from '../services/api';
import { Package, LogEntry } from '../types';

type StateType = 'SOLICITADO' | 'EN_TRANSITO' | 'EN_ACOPIO' | 'ENTREGADO' | 'EN_DISPUTA' | 'RECIBIDO';

const normalizeState = (state: string): StateType => {
  return state.toUpperCase().replace('Á', 'A').replace('Ó', 'O').replace(' ', '_') as StateType;
};

const STATES_PIPELINE: StateType[] = ['SOLICITADO', 'EN_TRANSITO', 'EN_ACOPIO', 'ENTREGADO', 'RECIBIDO'];

export const OperatorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [contingencyTokenInput, setContingencyTokenInput] = useState('');
  const [rutMensajeroInput, setRutMensajeroInput] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchPackagesByFilter();
  }, [selectedFilter]);

  useEffect(() => {
    if (selectedPackage) {
      fetchPackageLogs(selectedPackage.id);
    }
  }, [selectedPackage]);

  const fetchPackagesByFilter = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSelectedPackage(null);

      let url = '/api/packages/filter';
      if (selectedFilter !== 'all') {
        url += `?estado=${selectedFilter}`;
      } else {
        // En "all", el operador solo debería ver los estados que le competen
        // SOLICITADO, EN_TRANSITO, EN_ACOPIO
        url = '/api/packages/pending'; 
      }

      const data = await api.get(url);
      setPackages(data.packages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPackageLogs = async (packageId: string) => {
    try {
      setIsLoading(true);
      try {
        const data = await api.get(`/api/packages/${packageId}/logs`);
        setLogs(data.logs || []);
      } catch (err: any) {
        if (err.status === 404) {
          setLogs([]);
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Error al cargar logs:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePackageStatus = async (newStatus: StateType) => {
    if (!selectedPackage) return;

    if (newStatus === 'EN_TRANSITO' && !rutMensajeroInput.trim()) {
      setError('Debes ingresar el RUT del mensajero para marcar en tránsito.');
      return;
    }

    try {
      setIsLoading(true);
      const data = await updateActivoEstado(selectedPackage.id_activo, newStatus, selectedPackage.integridad, contingencyTokenInput, newStatus === 'EN_TRANSITO' ? rutMensajeroInput : undefined);

      setSelectedPackage(data.asset);
      setContingencyTokenInput('');
      if (newStatus === 'EN_TRANSITO') setRutMensajeroInput('');

      if (data.log) {
        setLogs([data.log, ...logs]);
      }

      await fetchPackagesByFilter();
    } catch (err: any) {
      if (err.status === 409) {
        setError(err.message || 'Error de conflicto de transición de estado');
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStateColor = (state: string): string => {
    switch (state) {
      case 'SOLICITADO': return 'from-blue-500 to-blue-600';
      case 'EN_TRANSITO': return 'from-yellow-500 to-yellow-600';
      case 'EN_ACOPIO': return 'from-purple-500 to-purple-600';
      case 'ENTREGADO': return 'from-green-500 to-green-600';
      case 'RECIBIDO': return 'from-teal-500 to-teal-600';
      case 'EN_DISPUTA': return 'from-red-500 to-red-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getAvailableTransitions = (currentState: string): { status: StateType, label: string }[] => {
    const normalized = normalizeState(currentState);
    // El operador solo puede marcar EN_TRANSITO o EN_ACOPIO
    switch (normalized) {
      case 'SOLICITADO':
        return [{ status: 'EN_TRANSITO', label: 'Marcar En Tránsito' }];
      case 'EN_TRANSITO':
        return [
          { status: 'EN_ACOPIO', label: 'Recibir en Acopio' }
        ];
      case 'EN_ACOPIO':
        return [
          { status: 'EN_TRANSITO', label: 'Marcar En Tránsito (Salida)' }
        ];
      default:
        return [];
    }
  };

  const isDisputeBlock = selectedPackage && normalizeState(selectedPackage.estado_actual) === 'EN_DISPUTA';
  const isCompleted = selectedPackage && (normalizeState(selectedPackage.estado_actual) === 'ENTREGADO' || normalizeState(selectedPackage.estado_actual) === 'RECIBIDO');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h2 className="text-2xl font-bold text-white">Workspace de Operador / Acopio</h2>
              <p className="text-sm text-slate-400">Sistema de Recepción y Despacho</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.nombre}</p>
                <p className="text-xs text-slate-400">Operador</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 backdrop-blur-md bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bandeja de Entrada */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Solicitudes Pendientes
            </h3>

            {/* Filtro de Estados */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  selectedFilter === 'all'
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setSelectedFilter('SOLICITADO')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  selectedFilter === 'SOLICITADO'
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Solicitado
              </button>
              <button
                onClick={() => setSelectedFilter('EN_TRANSITO')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  selectedFilter === 'EN_TRANSITO'
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                En Tránsito
              </button>
              <button
                onClick={() => setSelectedFilter('EN_ACOPIO')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  selectedFilter === 'EN_ACOPIO'
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                En Acopio
              </button>
            </div>

            {isLoading && packages.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>No hay paquetes en esta categoría</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedPackage?.id === pkg.id
                        ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30'
                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-white">{pkg.nombre}</p>
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                        ID: {pkg.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{pkg.descripcion}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Consola de Operación */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPackage ? (
              <>
                {/* Detalles del Paquete */}
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">{selectedPackage.nombre}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400">Origen</p>
                        <p className="text-white font-medium">{selectedPackage.direccion_origen}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Destino</p>
                        <p className="text-white font-medium">{selectedPackage.direccion_destino}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Integridad</p>
                        <p className="text-white font-medium">{selectedPackage.integridad}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Remitente</p>
                        <p className="text-white font-medium">{selectedPackage.rut_remitente}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pipeline de Estados */}
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase">
                    Pipeline de Estados
                  </h4>
                  <div className="flex items-center justify-between">
                    {STATES_PIPELINE.map((state, idx) => {
                      const normalizedCurrent = normalizeState(selectedPackage.estado_actual);
                      const isActive = normalizedCurrent === state;
                      const isPassed = STATES_PIPELINE.indexOf(normalizedCurrent) > idx;

                      return (
                        <div key={state} className="flex items-center">
                          <div
                            className={`flex items-center justify-center w-16 h-16 rounded-full font-bold text-sm transition-all ${
                              isActive
                                ? `bg-gradient-to-r ${getStateColor(state)} text-white shadow-lg shadow-current scale-110`
                                : isPassed
                                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                                  : 'bg-slate-800/50 border border-slate-700 text-slate-400'
                            }`}
                          >
                            {state.slice(0, 4)}
                          </div>
                          {idx < STATES_PIPELINE.length - 1 && (
                            <div
                              className={`flex-1 h-1 mx-2 ${
                                isPassed
                                  ? 'bg-green-500'
                                  : isActive
                                    ? 'bg-gradient-to-r from-current to-slate-800'
                                    : 'bg-slate-700'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Controles del Operador */}
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase">
                    Controles de Operador / Acopio
                  </h4>
                  
                  {getAvailableTransitions(selectedPackage.estado_actual).length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {getAvailableTransitions(selectedPackage.estado_actual).map((transition) => (
                        <button
                          key={transition.status}
                          onClick={() => updatePackageStatus(transition.status)}
                          disabled={isDisputeBlock || isLoading}
                          className={`w-full px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                            isDisputeBlock
                              ? 'bg-slate-800/50 border border-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                              : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border border-blue-500/50 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40'
                          }`}
                        >
                          <Play className="w-4 h-4" />
                          {transition.label}
                        </button>
                      ))}

                      {/* Inputs de Asignación y Contingencia */}
                      <div className="mt-2 pt-4 border-t border-slate-700/50 space-y-4">
                        {getAvailableTransitions(selectedPackage.estado_actual).some(t => t.status === 'EN_TRANSITO') && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                              Asignar RUT Mensajero
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: 12345678-9"
                              value={rutMensajeroInput}
                              onChange={(e) => setRutMensajeroInput(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                            Validación por Contingencia (Opcional)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: EXP-99"
                            value={contingencyTokenInput}
                            onChange={(e) => setContingencyTokenInput(e.target.value.toUpperCase())}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-mono tracking-widest uppercase"
                            maxLength={6}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full px-6 py-3 rounded-lg font-semibold text-center bg-slate-800/50 border border-slate-700 text-slate-500 opacity-80">
                      {isCompleted ? 'Completado' : isDisputeBlock ? 'Bloqueado por Disputa' : 'No hay acciones disponibles'}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <p className="text-slate-400">Selecciona un paquete para comenzar</p>
              </div>
            )}
          </div>
        </div>

        {/* Terminal de Logs */}
        {selectedPackage && (
          <div className="mt-6 backdrop-blur-md bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm">
            <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase">
              Terminal de Custodia - Paquete #{selectedPackage.id} ({selectedPackage.nombre})
            </h4>
            <div className="bg-black/80 rounded p-4 h-48 overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <p className="text-slate-600">
                  $ Historial de cambios de estado para este paquete...
                </p>
              ) : (
                logs.map((log) => {
                  const date = new Date(log.timestamp);
                  const dateStr = date.toLocaleDateString('es-ES', { 
                    day: '2-digit', month: '2-digit', year: 'numeric' 
                  });
                  const timeStr = date.toLocaleTimeString('es-ES', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                  });
                  
                  return (
                    <div
                      key={log.id}
                      className={`${
                        log.tipo_alerta === 'resolución'
                          ? 'text-green-400'
                          : log.tipo_alerta === 'crítico'
                            ? 'text-red-400'
                            : 'text-slate-400'
                      }`}
                    >
                      {`[${dateStr} ${timeStr}] RUT: ${log.rut_responsable} | Estado: ${log.estado_instante} | Alerta: ${log.tipo_alerta}`}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
