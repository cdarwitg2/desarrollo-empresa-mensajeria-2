import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Play, AlertTriangle, RotateCcw, Zap, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Package {
  id: number;
  nombre: string;
  descripcion: string;
  direccion_origen: string;
  direccion_destino: string;
  estado_actual: string;
  integridad: string;
  rut_remitente: string;
  created_at: string;
}

interface LogEntry {
  id: number;
  id_activo: number;
  rut_responsable: string;
  estado_instante: string;
  timestamp: string;
  tipo_alerta: string;
}

type StateType = 'SOLICITADO' | 'EN_TRANSITO' | 'EN_ACOPIO' | 'ENTREGADO' | 'EN_DISPUTA';

const STATES_PIPELINE: StateType[] = ['SOLICITADO', 'EN_TRANSITO', 'EN_ACOPIO', 'ENTREGADO'];

export const WorkerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Cargar paquetes pendientes al montar
  useEffect(() => {
    fetchPendingPackages();
  }, []);

  // Cargar paquetes cuando cambia el filtro
  useEffect(() => {
    fetchPackagesByFilter();
  }, [selectedFilter]);

  // Cargar logs cuando se selecciona un paquete
  useEffect(() => {
    if (selectedPackage) {
      fetchPackageLogs(selectedPackage.id);
    }
  }, [selectedPackage]);

  const fetchPendingPackages = async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = sessionStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/api/packages/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar paquetes');

      const data = await response.json();
      setPackages(data.packages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPackagesByFilter = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSelectedPackage(null);
      const token = sessionStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      let url = `${apiUrl}/api/packages/filter`;
      if (selectedFilter !== 'all') {
        url += `?estado=${selectedFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar paquetes');

      const data = await response.json();
      setPackages(data.packages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPackageLogs = async (packageId: number) => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/api/packages/${packageId}/logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Si el endpoint no existe aún, mostrar vacío
        setLogs([]);
        return;
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error al cargar logs:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePackageStatus = async (newStatus: StateType, integridad?: string) => {
    if (!selectedPackage) return;

    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const payload: any = {
        id_activo: selectedPackage.id,
        nuevo_estado: newStatus,
      };

      if (integridad) {
        payload.integridad = integridad;
      }

      const response = await fetch(`${apiUrl}/api/packages/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Error al actualizar estado');

      const data = await response.json();

      // Actualizar paquete seleccionado
      setSelectedPackage(data.asset);

      // Agregar nuevo log al principio (más recientes primero)
      if (data.log) {
        setLogs([data.log, ...logs]);
      }

      // Recargar lista de pendientes
      await fetchPendingPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOperatorAction = async () => {
    if (!selectedPackage) return;

    const currentStateIndex = STATES_PIPELINE.indexOf(selectedPackage.estado_actual as StateType);
    if (currentStateIndex < STATES_PIPELINE.length - 1) {
      const nextState = STATES_PIPELINE[currentStateIndex + 1];
      await updatePackageStatus(nextState);
    }
  };

  const handleForceDispute = async () => {
    await updatePackageStatus('EN_DISPUTA');
  };

  const handleSimulateAccident = async () => {
    const randomChance = Math.random();
    if (randomChance < 0.1) {
      // 10% probabilidad: EN_DISPUTA
      await updatePackageStatus('EN_DISPUTA');
    } else {
      // 90% probabilidad: integridad dañada
      await updatePackageStatus(selectedPackage!.estado_actual as StateType, 'Un poco dañado');
    }
  };

  const handleReleaseAsset = async () => {
    await updatePackageStatus('EN_ACOPIO');
  };

  const getStateColor = (state: string): string => {
    switch (state) {
      case 'SOLICITADO':
        return 'from-blue-500 to-blue-600';
      case 'EN_TRANSITO':
        return 'from-yellow-500 to-yellow-600';
      case 'EN_ACOPIO':
        return 'from-purple-500 to-purple-600';
      case 'ENTREGADO':
        return 'from-green-500 to-green-600';
      case 'EN_DISPUTA':
        return 'from-red-500 to-red-600';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  const getOperatorButtonLabel = (): string => {
    if (!selectedPackage) return '';
    switch (selectedPackage.estado_actual) {
      case 'SOLICITADO':
        return 'Iniciar Ruta';
      case 'EN_TRANSITO':
        return 'Ingresar a Acopio';
      case 'EN_ACOPIO':
        return 'Marcar Entregado';
      case 'ENTREGADO':
        return 'Completado';
      default:
        return 'Actualizar';
    }
  };

  const isDisputeBlock = selectedPackage?.estado_actual === 'EN_DISPUTA';
  const isCompleted = selectedPackage?.estado_actual === 'ENTREGADO';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h2 className="text-2xl font-bold text-white">Workspace de Operador</h2>
              <p className="text-sm text-slate-400">Sistema de Trazabilidad de Paquetes</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.nombre}</p>
                <p className="text-xs text-slate-400">{user?.roles.join(', ')}</p>
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
                Todos
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
              <button
                onClick={() => setSelectedFilter('ENTREGADO')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  selectedFilter === 'ENTREGADO'
                    ? 'bg-green-500/20 border-green-500/50 text-green-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Entregado
              </button>
              <button
                onClick={() => setSelectedFilter('EN_DISPUTA')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  selectedFilter === 'EN_DISPUTA'
                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Disputa
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
                      const isActive = selectedPackage.estado_actual === state;
                      const isPassed =
                        STATES_PIPELINE.indexOf(selectedPackage.estado_actual as StateType) > idx;

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

                  {selectedPackage.estado_actual === 'EN_DISPUTA' && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <p className="text-red-400 text-sm">Paquete en DISPUTA - Flujo bloqueado</p>
                    </div>
                  )}
                </div>

                {/* Controles del Operador */}
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase">
                    Controles del Operador
                  </h4>
                  <button
                    onClick={handleOperatorAction}
                    disabled={isDisputeBlock || isCompleted || isLoading}
                    className={`w-full px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      isDisputeBlock || isCompleted
                        ? 'bg-slate-800/50 border border-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border border-green-500/50 hover:shadow-lg hover:shadow-green-500/50'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    {getOperatorButtonLabel()}
                  </button>
                </div>

                {/* Panel del Analista */}
                {user?.roles.includes('analista') && (
                  <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase">
                      Simulación del Analista
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={handleForceDispute}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg font-medium transition-all disabled:opacity-50"
                      >
                        <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs">Forzar Disputa</span>
                      </button>
                      <button
                        onClick={handleSimulateAccident}
                        disabled={isLoading}
                        className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-lg font-medium transition-all disabled:opacity-50"
                      >
                        <Zap className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs">Simular Accidente</span>
                      </button>
                      <button
                        onClick={handleReleaseAsset}
                        disabled={isLoading || selectedPackage.estado_actual !== 'EN_DISPUTA'}
                        className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg font-medium transition-all disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs">Liberar Activo</span>
                      </button>
                    </div>
                  </div>
                )}
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
                logs.map((log, idx) => {
                  const date = new Date(log.timestamp);
                  const dateStr = date.toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  });
                  const timeStr = date.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
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
