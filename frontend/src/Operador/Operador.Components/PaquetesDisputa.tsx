import React from 'react';
import { Package, Info, AlertTriangle, FileText, X, Eye } from 'lucide-react';
import { Package as PackageType, LogEntry } from '../../types';
import { usePaquetesDisputa } from '../Operador.hooks';

interface PaquetesDisputaProps {
  selectedPackage: PackageType | null;
  setSelectedPackage: (pkg: PackageType | null) => void;
  logs: LogEntry[];
  setLogs: (logs: LogEntry[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string;
  setError: (error: string) => void;
}

const PaquetesDisputa: React.FC<PaquetesDisputaProps> = ({
  selectedPackage,
  setSelectedPackage,
  logs,
  setLogs,
  isLoading,
  setIsLoading,
  error,
  setError,
}) => {
  const {
    packages,
    isViewIncidenceModalOpen,
    setIsViewIncidenceModalOpen,
    incidenciaDetalle,
    fetchIncidenciaDetails
  } = usePaquetesDisputa(
    selectedPackage,
    setSelectedPackage,
    setLogs,
    setIsLoading,
    setError
  );

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

  return (
    <>
      <div className="mb-6 border-b border-white/5 pb-4">
        <h2 className="text-3xl font-bold text-white inline-block relative">
          Paquetes en Disputa
          <div className="absolute -bottom-4 left-0 w-1/3 h-1 bg-red-500 rounded-full"></div>
        </h2>
        <p className="text-slate-400 mt-4">Visualiza los detalles de las incidencias reportadas</p>
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
            <span className="text-white">Cargando...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)]">
        {/* Left Column: List */}
        <div className="lg:col-span-4 flex flex-col h-full bg-[#131b26] rounded-2xl border border-white/5 p-4 overflow-hidden">
          <h3 className="text-sm font-medium text-red-500 mb-4 px-2">Paquetes Bloqueados</h3>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {packages.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay paquetes en disputa</p>
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
                        ? 'bg-[#1a2332] border-white/5 border-r-4 border-r-red-500'
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
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Bloqueado por incidencia</span>
                    </div>
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
                <p className="text-sm mt-1 text-slate-600">para ver los detalles de la incidencia</p>
              </div>
            </div>
          ) : (
            <div className="p-6 h-full flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-white">Detalles del envío</h4>
                  <p className="text-slate-400 text-sm mt-1 font-mono">ID: {selectedPackage.id}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-semibold text-red-400">EN DISPUTA</span>
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

              {/* Botón Ver Incidencia */}
              <div className="mt-4">
                <button
                  onClick={() => {
                    if (selectedPackage) {
                      fetchIncidenciaDetails(selectedPackage.id);
                      setIsViewIncidenceModalOpen(true);
                    }
                  }}
                  className="w-full rounded-xl py-3 font-bold text-white transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalles de Incidencia
                </button>
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

      {/* Modal para VER detalles de incidencia */}
      {isViewIncidenceModalOpen && incidenciaDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsViewIncidenceModalOpen(false)} />
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-700 shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/30">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Detalles de Incidencia</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Paquete: {selectedPackage?.nombre} (#{selectedPackage?.id})
                  </p>
                </div>
              </div>
              <button onClick={() => setIsViewIncidenceModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Motivo</label>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white">
                  {incidenciaDetalle.motivo || 'No especificado'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Descripción</label>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white whitespace-pre-wrap">
                  {incidenciaDetalle.descripcion || 'Sin descripción detallada'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Fecha de Reporte</label>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white">
                  {incidenciaDetalle.fecha ? new Date(incidenciaDetalle.fecha).toLocaleString() : 'No disponible'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Reportado por</label>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white font-mono">
                  {incidenciaDetalle.reportado_por || 'Desconocido'}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800">
              <button
                onClick={() => setIsViewIncidenceModalOpen(false)}
                className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 font-medium transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaquetesDisputa;