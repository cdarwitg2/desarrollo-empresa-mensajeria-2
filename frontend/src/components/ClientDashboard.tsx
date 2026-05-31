import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, Send, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ShipmentForm } from './ShipmentForm';

interface ClientPackage {
  id: number;
  nombre: string;
  descripcion: string;
  direccion_origen: string;
  direccion_destino: string;
  estado_actual: string;
  integridad: string;
  created_at: string;
  updated_at: string;
}

type TabType = 'request' | 'tracking';
type StateType = 'SOLICITADO' | 'EN_TRANSITO' | 'EN_ACOPIO' | 'ENTREGADO' | 'EN_DISPUTA';

const STATES_PIPELINE: StateType[] = ['SOLICITADO', 'EN_TRANSITO', 'EN_ACOPIO', 'ENTREGADO'];

export const ClientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('request');
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ClientPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Cargar paquetes cuando se cambia a la pestaña de seguimiento
  useEffect(() => {
    if (activeTab === 'tracking') {
      fetchMyPackages();
    }
  }, [activeTab]);

  const fetchMyPackages = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSelectedPackage(null);
      
      const token = sessionStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/api/packages/my-packages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al cargar los paquetes');

      const data = await response.json();
      setPackages(data.packages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const getStateColor = (state: string): string => {
    switch (state) {
      case 'SOLICITADO':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
      case 'EN_TRANSITO':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'EN_ACOPIO':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'ENTREGADO':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'EN_DISPUTA':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
    }
  };

  const getStateGlow = (state: string): string => {
    switch (state) {
      case 'SOLICITADO':
        return 'from-slate-500 to-slate-600';
      case 'EN_TRANSITO':
        return 'from-blue-500 to-blue-600';
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

  const getIntegrityColor = (integridad: string): string => {
    if (integridad === 'Intacto') {
      return 'text-green-400';
    }
    return 'text-yellow-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-emerald-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">Envíos</h2>
                <p className="text-sm text-slate-400">Portal del Cliente</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.nombre}</p>
                <p className="text-xs text-slate-400">Cliente</p>
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

      {/* Pestañas */}
      <div className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('request')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === 'request'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Send className="w-4 h-4" />
              Solicitar Envío
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === 'tracking'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              Mis Paquetes
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pestaña: Solicitar Envío */}
        {activeTab === 'request' && (
          <div className="max-w-4xl">
            <ShipmentForm />
          </div>
        )}

        {/* Pestaña: Mis Paquetes */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            {error && (
              <div className="backdrop-blur-md bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Lista de Paquetes */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-blue-400" />
                Historial de Envíos
              </h3>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p>No tienes paquetes registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
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
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-400">Paquete</p>
                          <p className="font-semibold text-white">{pkg.nombre}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Destino</p>
                          <p className="text-sm text-white">{pkg.direccion_destino}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Integridad</p>
                          <p className={`font-medium ${getIntegrityColor(pkg.integridad)}`}>
                            {pkg.integridad}
                          </p>
                        </div>
                        <div className="flex items-end justify-end">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStateColor(
                              pkg.estado_actual
                            )}`}
                          >
                            {pkg.estado_actual}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pipeline Visual */}
            {selectedPackage && (
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-slate-300 mb-6 uppercase">
                  Seguimiento - {selectedPackage.nombre}
                </h4>

                {/* Pipeline */}
                <div className="flex items-center justify-between">
                  {STATES_PIPELINE.map((state, idx) => {
                    const isActive = selectedPackage.estado_actual === state;
                    const isPassed =
                      STATES_PIPELINE.indexOf(selectedPackage.estado_actual as StateType) > idx;

                    return (
                      <div key={state} className="flex items-center flex-1">
                        {/* Nodo de Estado */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div
                            className={`flex items-center justify-center w-20 h-20 rounded-full font-bold text-sm transition-all relative ${
                              isActive
                                ? `bg-gradient-to-r ${getStateGlow(
                                    state
                                  )} text-white shadow-2xl shadow-current scale-110`
                                : isPassed
                                  ? 'bg-green-500/20 border-2 border-green-500/50 text-green-400'
                                  : 'bg-slate-800/50 border-2 border-slate-700 text-slate-400'
                            }`}
                          >
                            {state.slice(0, 3)}
                          </div>
                          <p className="text-xs text-slate-400 mt-2 text-center">{state}</p>
                        </div>

                        {/* Línea Conectora */}
                        {idx < STATES_PIPELINE.length - 1 && (
                          <div className="flex-1 h-1 mx-2 mb-8">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isPassed
                                  ? 'bg-green-500 shadow-lg shadow-green-500/50'
                                  : isActive
                                    ? `bg-gradient-to-r ${getStateGlow(state)} shadow-lg shadow-current`
                                    : 'bg-slate-700'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Información Adicional */}
                <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-xs text-slate-400">Origen</p>
                    <p className="text-white font-medium">{selectedPackage.direccion_origen}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Creado</p>
                    <p className="text-white font-medium">
                      {new Date(selectedPackage.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

