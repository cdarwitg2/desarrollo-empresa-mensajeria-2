import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, Send, ListChecks, Info, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ShipmentForm } from './ShipmentForm';

import { api, updateActivoEstado } from '../services/api';
import { Package as ClientPackage } from '../types';

type TabType = 'request' | 'tracking';
type StateType = 'SOLICITADO' | 'EN_TRANSITO' | 'EN_ACOPIO' | 'ENTREGADO' | 'EN_DISPUTA' | 'RECIBIDO';

const STATES_PIPELINE: StateType[] = ['SOLICITADO', 'EN_TRANSITO', 'EN_ACOPIO', 'ENTREGADO', 'RECIBIDO'];

export const ClientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = sessionStorage.getItem('clientDashboardTab');
    return (saved as TabType) || 'tracking';
  });
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ClientPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    sessionStorage.setItem('clientDashboardTab', activeTab);
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
      
      const data = await api.get('/api/packages/my-packages');
      setPackages(data.packages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsReceived = async () => {
    if (!selectedPackage) return;
    try {
      setIsLoading(true);
      setError('');
      await updateActivoEstado(selectedPackage.id_activo, 'RECIBIDO', selectedPackage.integridad, '');
      await fetchMyPackages();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el estado');
    } finally {
      setIsLoading(false);
    }
  };



  const getStateDotColor = (state: string): string => {
    switch (state) {
      case 'ENTREGADO':
      case 'RECIBIDO':
        return 'bg-emerald-400';
      case 'EN_TRANSITO':
      case 'EN_ACOPIO':
        return 'bg-blue-400';
      case 'EN_DISPUTA':
        return 'bg-red-400';
      default:
        return 'bg-slate-400';
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
        return 'from-emerald-500 to-emerald-600';
      case 'RECIBIDO':
        return 'from-teal-500 to-teal-600';
      case 'EN_DISPUTA':
        return 'from-red-500 to-red-600';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="flex h-screen bg-[#0b111a] text-slate-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-[#0b111a] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 px-6 py-8">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-wide">Portal Cliente</h1>
          </div>

          {/* Nav Links */}
          <nav className="px-4 space-y-2 mt-4">
            <button
              onClick={() => setActiveTab('request')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'request'
                  ? 'bg-emerald-400 text-slate-900 font-semibold shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Send className="w-4 h-4" />
              Solicitar Envío
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'tracking'
                  ? 'bg-emerald-400 text-slate-900 font-semibold shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              Mis Paquetes
            </button>
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-emerald-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.nombre || 'Usuario'}</p>
              <p className="text-xs text-slate-500">Cliente Premium</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#0b111a] p-8 lg:p-12">
        {activeTab === 'tracking' && (
          <div className="max-w-6xl mx-auto">
            {/* Header section */}
            <div className="mb-8 border-b border-white/5 pb-4">
              <h2 className="text-3xl font-bold text-white inline-block relative">
                Seguimiento de Paquetes
                <div className="absolute -bottom-4 left-0 w-1/3 h-1 bg-emerald-500 rounded-full"></div>
              </h2>
            </div>

            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-200px)]">
              {/* Left Column: List */}
              <div className="lg:col-span-4 flex flex-col h-full bg-[#131b26] rounded-2xl border border-white/5 p-4 overflow-hidden">
                <h3 className="text-sm font-medium text-emerald-500 mb-4 px-2">Tus Envíos</h3>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                    </div>
                  ) : packages.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      <p>No tienes paquetes registrados</p>
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
                              {pkg.estado_actual}
                            </span>
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
                      <p className="text-sm mt-1 text-slate-600">para ver los detalles completos</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 h-full flex flex-col overflow-y-auto">
                    <h4 className="text-lg font-bold text-white mb-8">
                      Detalles del envío
                    </h4>

                    {/* Pipeline */}
                    <div className="mb-12">
                      <div className="flex items-center justify-between">
                        {STATES_PIPELINE.map((state, idx) => {
                          const isActive = selectedPackage.estado_actual === state;
                          const isPassed = STATES_PIPELINE.indexOf(selectedPackage.estado_actual as StateType) > idx;

                          return (
                            <div key={state} className="flex items-center flex-1 last:flex-none">
                              {/* Nodo de Estado */}
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
                                  {state.toLowerCase()}
                                </p>
                              </div>

                              {/* Línea Conectora */}
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
                    <div className="mt-8 grid grid-cols-2 gap-6 bg-[#1a2332] rounded-xl p-6 border border-white/5">
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

                    {/* Acciones de Cliente */}
                    {selectedPackage.estado_actual === 'ENTREGADO' && (
                      <div className="mt-auto pt-8">
                        <button
                          onClick={handleMarkAsReceived}
                          disabled={isLoading}
                          className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <ListChecks className="w-5 h-5" />
                          Marcar como Recibido
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Solicitar Envío */}
        {activeTab === 'request' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 border-b border-white/5 pb-4">
              <h2 className="text-3xl font-bold text-white inline-block relative">
                Solicitar Envío
                <div className="absolute -bottom-4 left-0 w-1/3 h-1 bg-emerald-500 rounded-full"></div>
              </h2>
            </div>
            <div className="bg-[#131b26] rounded-2xl border border-white/5 p-6 md:p-8">
              <ShipmentForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

