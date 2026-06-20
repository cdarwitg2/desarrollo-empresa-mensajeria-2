import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, AlertTriangle, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { StateType } from './Analista.types';
import { useAnalystDashboard } from './Analista.hooks';
import { CustodyTerminal } from './Analista.Components/CustodyTerminal';

const normalizeState = (state: string): StateType => {
  return state.toUpperCase().replace('Á', 'A').replace('Ó', 'O').replace(' ', '_') as StateType;
};

const STATES_PIPELINE: StateType[] = ['SOLICITADO', 'EN_TRANSITO', 'EN_ACOPIO', 'ENTREGADO', 'RECIBIDO'];

export const AnalystDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const {
    packages,
    selectedPackage,
    setSelectedPackage,
    logs,
    isLoading,
    error,
    handleReleaseAsset
  } = useAnalystDashboard();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h2 className="text-2xl font-bold text-white">Workspace de Analista</h2>
              <p className="text-sm text-slate-400">Gestión de Reclamos y Disputas</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.nombre}</p>
                <p className="text-xs text-slate-400">Analista</p>
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
          {/* Bandeja de Entrada de Reclamos */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Reclamos Pendientes (EN DISPUTA)
            </h3>

            {isLoading && packages.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400"></div>
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>No hay reclamos pendientes en este momento.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedPackage?.id === pkg.id
                        ? 'bg-red-500/20 border-red-500/50 ring-2 ring-red-500/30'
                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-white">{pkg.nombre}</p>
                      <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded">
                        ID: {pkg.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{pkg.descripcion}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Consola del Analista */}
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
                      return (
                        <div key={state} className="flex items-center">
                          <div
                            className={`flex items-center justify-center w-16 h-16 rounded-full font-bold text-sm transition-all bg-slate-800/50 border border-slate-700 text-slate-400`}
                          >
                            {state.slice(0, 4)}
                          </div>
                          {idx < STATES_PIPELINE.length - 1 && (
                            <div className={`flex-1 h-1 mx-2 bg-slate-700`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {normalizeState(selectedPackage.estado_actual) === 'EN_DISPUTA' && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                      <p className="text-red-400 text-sm font-semibold">Paquete en DISPUTA - Flujo bloqueado, requiere resolución del Analista.</p>
                    </div>
                  )}
                </div>

                {/* Resolución del Analista */}
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase">
                    Acciones de Resolución
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={handleReleaseAsset}
                      disabled={isLoading}
                      className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border border-green-500/50 text-white rounded-lg font-bold transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Liberar Activo (Enviar a Acopio)
                    </button>
                    {/* Placeholder para otras acciones en el futuro */}
                    <button
                      disabled={true}
                      className="px-6 py-4 bg-slate-800/50 border border-slate-700 text-slate-500 rounded-lg font-bold cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-5 h-5" />
                      Devolver a Origen
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <p className="text-slate-400">Selecciona un reclamo para ver detalles</p>
              </div>
            )}
          </div>
        </div>

        {/* Terminal de Logs */}
        {selectedPackage && (
          <CustodyTerminal selectedPackage={selectedPackage} logs={logs} />
        )}
      </div>
    </div>
  );
};
