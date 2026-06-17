import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, Truck, CheckCircle, MapPin, UserIcon, Loader2, X, AlertCircle, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, updateActivoEstado } from '../services/api';
import { Package as PackageType } from '../types';
import DeliveryMap from './components/DeliveryMap';

type TabType = 'pendientes' | 'ruta';
type StateType = 'SOLICITADO' | 'EN_TRANSITO' | 'EN_ACOPIO' | 'EN_ACOPIO_ASIGNADO' | 'EN_TRANSITO_ENTREGA' | 'ENTREGADO' | 'RECIBIDO' | 'EN_DISPUTA';

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const DriverDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [packages, setPackages] = useState<PackageType[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('pendientes');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [showMap, setShowMap] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    fetchMessengerPackages();
  }, [activeTab]);

  const fetchMessengerPackages = async () => {
    try {
      setIsLoading(true);
      setError('');

      let estado = '';
      if (activeTab === 'pendientes') {
        estado = 'EN_ACOPIO_ASIGNADO';
      } else {
        estado = 'EN_TRANSITO_ENTREGA';
      }

      const data = await api.get(`/api/packages/filter?estado=${estado}`);
      const rutMensajero = user?.rut;
      const paquetesFiltrados = (data.packages || []).filter(
        (pkg: PackageType) => pkg.rut_mensajero === rutMensajero
      );
      setPackages(paquetesFiltrados);
    } catch (err: any) {
      setError(err.message || 'Error al cargar paquetes');
      showToast('Error al cargar los paquetes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoger = async (packageId: string, idActivo: string, integridad: string) => {
    if (actionLoading === packageId) return;

    setActionLoading(packageId);
    setError('');

    try {
      await updateActivoEstado(
        idActivo,
        'EN_TRANSITO_ENTREGA',
        integridad,
        '',
        user?.rut
      );

      showToast(`✅ Paquete "${packageId}" recogido exitosamente`, 'success');
      await fetchMessengerPackages();
    } catch (err: any) {
      if (err.status === 409) {
        const errorMsg = 'Error de conflicto. El paquete puede haber sido modificado por otro usuario.';
        setError(errorMsg);
        showToast(`❌ ${errorMsg}`, 'error');
      } else {
        const errorMsg = err.message || 'Error al recoger el paquete';
        setError(errorMsg);
        showToast(`❌ ${errorMsg}`, 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleEntregar = async (packageId: string, idActivo: string, integridad: string) => {
    if (actionLoading === packageId) return;

    setActionLoading(packageId);
    setError('');

    try {
      await updateActivoEstado(
        idActivo,
        'ENTREGADO',
        integridad,
        '',
        user?.rut
      );

      showToast(`✅ Paquete "${packageId}" entregado exitosamente`, 'success');
      await fetchMessengerPackages();
      setShowMap(false);
      setSelectedPackage(null);
    } catch (err: any) {
      if (err.status === 409) {
        const errorMsg = 'Error de conflicto. El paquete puede haber sido modificado por otro usuario.';
        setError(errorMsg);
        showToast(`❌ ${errorMsg}`, 'error');
      } else {
        const errorMsg = err.message || 'Error al marcar como entregado';
        setError(errorMsg);
        showToast(`❌ ${errorMsg}`, 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectPackage = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    setShowMap(true);
  };

  const handleCloseMap = () => {
    setShowMap(false);
    setSelectedPackage(null);
  };

  return (
    <div className="flex h-screen bg-[#0b111a] text-slate-300 font-sans overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md ${
            toast.type === 'success' 
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' 
              : toast.type === 'error'
              ? 'bg-red-500/20 border border-red-500/50 text-red-400'
              : 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {toast.type === 'info' && <Package className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button 
              onClick={() => setToast(null)} 
              className="ml-auto hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-[#0b111a] flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 px-6 py-8">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-wide">Portal Mensajero</h1>
          </div>

          <nav className="px-4 space-y-2 mt-4">
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'pendientes'
                  ? 'bg-emerald-400 text-slate-900 font-semibold shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Package className="w-4 h-4" />
              Pendientes
              {packages.length > 0 && activeTab === 'pendientes' && (
                <span className="ml-auto bg-white/20 text-slate-900 px-2 py-0.5 rounded-full text-xs font-bold">
                  {packages.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ruta')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'ruta'
                  ? 'bg-emerald-400 text-slate-900 font-semibold shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Truck className="w-4 h-4" />
              En Ruta
              {packages.length > 0 && activeTab === 'ruta' && (
                <span className="ml-auto bg-white/20 text-slate-900 px-2 py-0.5 rounded-full text-xs font-bold">
                  {packages.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-emerald-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.nombre || 'Usuario'}</p>
              <p className="text-xs text-slate-500">Mensajero</p>
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
        <div className="mb-8 border-b border-white/5 pb-4">
          <h2 className="text-3xl font-bold text-white inline-block relative">
            {activeTab === 'pendientes' ? 'Paquetes Pendientes' : 'Paquetes en Ruta'}
            <div className="absolute -bottom-4 left-0 w-1/3 h-1 bg-emerald-500 rounded-full"></div>
          </h2>
          <p className="text-slate-400 mt-4">
            {activeTab === 'pendientes'
              ? 'Recoge los paquetes asignados para iniciar la entrega'
              : 'Paquetes que estás llevando a su destino'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
              <X size={16} />
            </button>
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-[#131b26] rounded-xl p-6 flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-white">Cargando...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {packages.length === 0 ? (
            <div className="lg:col-span-3 text-center py-16 text-slate-500">
              <div className="w-16 h-16 rounded-full border border-slate-700 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-600" />
              </div>
              <p className="font-medium text-slate-400">
                {activeTab === 'pendientes'
                  ? 'No tienes paquetes pendientes'
                  : 'No tienes paquetes en ruta'}
              </p>
              <p className="text-sm mt-1 text-slate-600">
                {activeTab === 'pendientes'
                  ? 'Espera a que te asignen nuevos paquetes'
                  : 'Todos tus paquetes han sido entregados'}
              </p>
            </div>
          ) : (
            packages.map((pkg) => {
              const isActionLoading = actionLoading === pkg.id;
              return (
                <div
                  key={pkg.id}
                  className="bg-[#131b26] rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all flex flex-col cursor-pointer"
                  onClick={() => {
                    if (activeTab === 'ruta') {
                      handleSelectPackage(pkg);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white truncate flex-1 mr-2">
                      {pkg.nombre}
                    </h3>
                    <span className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                      pkg.estado_actual === 'EN_ACOPIO_ASIGNADO'
                        ? 'bg-indigo-500/30 text-indigo-300'
                        : 'bg-orange-500/30 text-orange-300'
                    }`}>
                      {pkg.estado_actual === 'EN_ACOPIO_ASIGNADO' ? 'Pendiente' : 'En Ruta'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{pkg.direccion_destino}</span>
                    </div>
                    {pkg.rut_remitente && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Package className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Remitente: {pkg.rut_remitente}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`font-medium ${
                        pkg.integridad === 'Intacto' ? 'text-emerald-400' : 'text-yellow-400'
                      }`}>
                        Integridad: {pkg.integridad || 'Intacto'}
                      </span>
                    </div>
                    {activeTab === 'ruta' && (
                      <div className="flex items-center gap-2 text-xs text-blue-400 mt-1">
                        <Map className="w-3 h-3" />
                        <span>Click para ver ubicación</span>
                      </div>
                    )}
                  </div>

                  {activeTab === 'pendientes' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecoger(pkg.id, pkg.id_activo, pkg.integridad);
                      }}
                      disabled={isActionLoading || isLoading}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {isActionLoading ? 'Procesando...' : 'Recoger'}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEntregar(pkg.id, pkg.id_activo, pkg.integridad);
                      }}
                      disabled={isActionLoading || isLoading}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                      {isActionLoading ? 'Procesando...' : 'Entregado'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

          {showMap && selectedPackage && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-[#131b26] rounded-2xl border border-white/5 shadow-2xl w-full max-w-6xl max-h-[95vh] h-[95vh] overflow-hidden flex flex-col">
          {/* Header del modal - más compacto */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 flex-shrink-0">
            <div>
              <h3 className="text-xl font-bold text-white">{selectedPackage.nombre}</h3>
              <p className="text-sm text-slate-400">{selectedPackage.direccion_destino}</p>
            </div>
            <button
              onClick={handleCloseMap}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Mapa - ocupa todo el espacio disponible */}
          <div className="flex-1 p-2 sm:p-4 min-h-[400px]">
            <DeliveryMap
              lat={selectedPackage.lat || -33.4489}
              lng={selectedPackage.lng || -70.6693}
              address={selectedPackage.direccion_destino}
              packageName={selectedPackage.nombre}
              onClose={handleCloseMap}
            />
          </div>

          {/* Footer del modal - más compacto */}
          <div className="flex items-center justify-between p-4 border-t border-white/5 flex-shrink-0">
            <div className="text-sm text-slate-400">
              <span className="font-medium text-white">{selectedPackage.rut_mensajero}</span>
              {' '}· En ruta hacia destino
            </div>
            <button
              onClick={() => {
                handleEntregar(selectedPackage.id, selectedPackage.id_activo, selectedPackage.integridad);
              }}
              disabled={actionLoading === selectedPackage.id || isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === selectedPackage.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Truck className="w-4 h-4" />
              )}
              {actionLoading === selectedPackage.id ? 'Procesando...' : 'Marcar como Entregado'}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};