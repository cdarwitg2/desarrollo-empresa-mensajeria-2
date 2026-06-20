import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, AlertTriangle, FileText, UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BandejaPaquetes from './Operador.Components/BandejaPaquetes';
import PaquetesAcopio from './Operador.Components/PaquetesAcopio';
import PaquetesDisputa from './Operador.Components/PaquetesDisputa';
import IncidenceModal from './Operador.Components/IncidenceModal';
import { useOperatorDashboard } from './Operador.hooks';

export const OperatorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const {
    activeTab,
    setActiveTab,
    selectedPackage,
    setSelectedPackage,
    logs,
    setLogs,
    isLoading,
    setIsLoading,
    error,
    setError,
    isIncidenceModalOpen,
    setIsIncidenceModalOpen,
    rutMensajero,
    setRutMensajero,
    contingencyToken,
    setContingencyToken,
    refreshKey,
    handleSubmitIncidence
  } = useOperatorDashboard();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#0b111a] text-slate-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-[#0b111a] flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 px-6 py-8">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-wide">Portal Operador</h1>
          </div>

          <nav className="px-4 space-y-2 mt-4">
            <button
              onClick={() => setActiveTab('bandeja')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'bandeja'
                  ? 'bg-emerald-400 text-slate-900 font-semibold shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Package className="w-4 h-4" />
              Bandeja de Paquetes
            </button>
            <button
              onClick={() => setActiveTab('acopio')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'acopio'
                  ? 'bg-emerald-400 text-slate-900 font-semibold shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Paquetes en Acopio
            </button>
            <button
              onClick={() => setActiveTab('disputas')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'disputas'
                  ? 'bg-emerald-400 text-slate-900 font-semibold shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              Paquetes en Disputa
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
              <p className="text-xs text-slate-500">Operador</p>
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

      {/* Main Content - Full height */}
      <div className="flex-1 overflow-hidden bg-[#0b111a] p-8 lg:p-12">
        <div className="h-full">
          {activeTab === 'bandeja' && (
            <BandejaPaquetes
              key={`bandeja-${refreshKey}`}
              selectedPackage={selectedPackage}
              setSelectedPackage={setSelectedPackage}
              logs={logs}
              setLogs={setLogs}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              error={error}
              setError={setError}
              rutMensajero={rutMensajero}
              setRutMensajero={setRutMensajero}
              contingencyToken={contingencyToken}
              setContingencyToken={setContingencyToken}
              setIsIncidenceModalOpen={setIsIncidenceModalOpen}
            />
          )}
          {activeTab === 'acopio' && (
            <PaquetesAcopio
              key={`acopio-${refreshKey}`}
              selectedPackage={selectedPackage}
              setSelectedPackage={setSelectedPackage}
              logs={logs}
              setLogs={setLogs}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              error={error}
              setError={setError}
              rutMensajero={rutMensajero}
              setRutMensajero={setRutMensajero}
              contingencyToken={contingencyToken}
              setContingencyToken={setContingencyToken}
              setIsIncidenceModalOpen={setIsIncidenceModalOpen}
            />
          )}
          {activeTab === 'disputas' && (
            <PaquetesDisputa
              key={`disputas-${refreshKey}`}
              selectedPackage={selectedPackage}
              setSelectedPackage={setSelectedPackage}
              logs={logs}
              setLogs={setLogs}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              error={error}
              setError={setError}
            />
          )}
        </div>
      </div>

      {/* Incidence Modal (para reportar) */}
      <IncidenceModal
        isOpen={isIncidenceModalOpen}
        onClose={() => setIsIncidenceModalOpen(false)}
        onSubmit={handleSubmitIncidence}
        packageId={selectedPackage?.id || ''}
        packageName={selectedPackage?.nombre || ''}
        isLoading={isLoading}
      />
    </div>
  );
};