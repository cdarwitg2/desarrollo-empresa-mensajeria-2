import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Play, AlertOctagon, Package as PackageIcon, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { api, updateActivoEstado, generarContingencia } from '../services/api';
import { Package } from '../types';

type StateType = 'SOLICITADO' | 'EN_TRANSITO' | 'EN_ACOPIO' | 'ENTREGADO' | 'EN_DISPUTA';

const normalizeState = (state: string): StateType => {
  return state.toUpperCase().replace('Á', 'A').replace('Ó', 'O').replace(' ', '_') as StateType;
};

export const DriverDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Contingencia State
  const [contingencyToken, setContingencyToken] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchPendingPackages();
  }, []);

  const fetchPendingPackages = async () => {
    try {
      setIsLoading(true);
      setError('');
      // Para el mensajero podríamos filtrar sólo los asignados a él, 
      // pero por ahora usamos el endpoint pending genérico.
      const data = await api.get('/api/packages/pending');
      // Filtramos solo los que pueden ser operados en la calle (SOLICITADO, EN_TRANSITO)
      const validPackages = (data.packages || []).filter((p: Package) => {
        const state = normalizeState(p.estado_actual);
        return state === 'SOLICITADO' || state === 'EN_TRANSITO';
      });
      setPackages(validPackages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePackageStatus = async (newStatus: StateType) => {
    if (!selectedPackage) return;
    try {
      setIsLoading(true);
      const data = await updateActivoEstado(selectedPackage.id_activo, newStatus, 'Intacto');
      setSelectedPackage(data.asset);
      await fetchPendingPackages();
    } catch (err: any) {
      setError(err.message || 'Error de actualización de estado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateContingency = async () => {
    if (!selectedPackage) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await generarContingencia(selectedPackage.id_activo);
      setContingencyToken(data.token_contingencia);
    } catch (err: any) {
      setError(err.message || 'Error al generar token de contingencia');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableTransitions = (currentState: string): { status: StateType, label: string }[] => {
    const normalized = normalizeState(currentState);
    switch (normalized) {
      case 'SOLICITADO':
        return [{ status: 'EN_TRANSITO', label: 'Iniciar Ruta (Recoger)' }];
      case 'EN_TRANSITO':
        return [
          { status: 'ENTREGADO', label: 'Entregar al Cliente' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* App Bar Móvil */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div>
          <h2 className="text-xl font-bold text-blue-400">Mensajero App</h2>
          <p className="text-xs text-slate-400">{user?.nombre}</p>
        </div>
        <button onClick={handleLogout} className="p-2 bg-slate-800 rounded-full text-slate-300">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto pb-24">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Token Modal / Overlay */}
        {contingencyToken && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-6 text-center">
            <AlertOctagon className="w-16 h-16 text-yellow-400 mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-white mb-2">Token de Excepción</h3>
            <p className="text-slate-300 mb-8">Dicta este código al operador o al cliente para destrabar el envío sin escanear QR.</p>
            <div className="bg-yellow-400 text-slate-900 text-6xl font-black px-8 py-6 rounded-2xl tracking-widest mb-8">
              {contingencyToken}
            </div>
            <button 
              onClick={() => setContingencyToken('')}
              className="px-8 py-4 bg-slate-800 rounded-full text-white font-bold text-lg w-full max-w-xs"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Vista principal: Selector de paquetes vs Paquete Activo */}
        {!selectedPackage ? (
          <div className="flex-1 flex flex-col">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-300">
              <PackageIcon className="w-5 h-5" /> 
              Paquetes Asignados ({packages.length})
            </h3>
            
            {packages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <CheckCircle2 className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">No hay rutas pendientes</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {packages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-left active:scale-95 transition-transform"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-lg">{pkg.nombre}</span>
                      <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        {normalizeState(pkg.estado_actual)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-1">Destino: {pkg.direccion_destino}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col animate-in slide-in-from-right-4">
            <button 
              onClick={() => setSelectedPackage(null)}
              className="text-blue-400 text-sm mb-4 font-semibold flex items-center gap-1"
            >
              ← Volver a la lista
            </button>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                  <PackageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedPackage.nombre}</h3>
                  <p className="text-slate-400 text-sm">ID: {selectedPackage.id_activo}</p>
                </div>
              </div>

              <div className="space-y-4 text-left">
                <div className="bg-slate-950 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 mb-1 uppercase font-bold">Origen</p>
                  <p className="font-medium">{selectedPackage.direccion_origen}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 mb-1 uppercase font-bold">Destino Final</p>
                  <p className="font-medium text-blue-300">{selectedPackage.direccion_destino}</p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-4 mt-auto">
              {getAvailableTransitions(selectedPackage.estado_actual).map((transition) => (
                <button
                  key={transition.status}
                  onClick={() => updatePackageStatus(transition.status)}
                  disabled={isLoading}
                  className="bg-blue-600 active:bg-blue-700 text-white p-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-900/50"
                >
                  <Play className="w-6 h-6" />
                  {transition.label}
                </button>
              ))}

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-sm font-medium">Opciones de Emergencia</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                onClick={handleGenerateContingency}
                disabled={isLoading}
                className="bg-slate-900 border-2 border-yellow-500/30 text-yellow-500 active:bg-yellow-500/10 p-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3"
              >
                <AlertOctagon className="w-6 h-6" />
                Falla Hardware (Generar Token)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
