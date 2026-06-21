import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, AlertTriangle, RotateCcw, X, CheckCircle, 
  FileText, UserIcon, Loader2, Clock, Flag, 
  Eye, MessageSquare, ThumbsUp, Ban, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, updateActivoEstado } from '../services/api';
import { Package as PackageType, LogEntry } from '../types';
import { CustodyTerminal } from './Analista.Components/CustodyTerminal';

type StateType = 'SOLICITADO' | 'EN_TRANSITO' | 'EN_ACOPIO' | 'EN_ACOPIO_ASIGNADO' | 'EN_TRANSITO_ENTREGA' | 'ENTREGADO' | 'RECIBIDO' | 'EN_DISPUTA';
type TabType = 'incidencias' | 'bloqueados';

interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface IncidenceDetail {
  motivo: string;
  descripcion: string;
  fecha: string;
  reportado_por: string;
}

export const AnalystDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('incidencias');
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [incidenciaDetalle, setIncidenciaDetalle] = useState<IncidenceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [comentarioResolucion, setComentarioResolucion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    if (activeTab === 'incidencias') {
      fetchIncidencias();
    } else {
      fetchBloqueados();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedPackage) {
      fetchPackageLogs(selectedPackage.id);
      if (selectedPackage.is_blocked) {
        fetchIncidenciaDetails(selectedPackage.id);
      }
    }
  }, [selectedPackage]);

  const fetchIncidencias = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSelectedPackage(null);

      const data = await api.get('/api/packages/filter?estado=EN_DISPUTA');
      const paquetes = (data.packages || []).filter((pkg: PackageType) => pkg.is_blocked === true);
      setPackages(paquetes);
    } catch (err: any) {
      setError(err.message || 'Error al cargar incidencias');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBloqueados = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSelectedPackage(null);

      const data = await api.get('/api/packages/filter');
      const paquetes = (data.packages || []).filter((pkg: PackageType) => pkg.is_blocked === true);
      setPackages(paquetes);
    } catch (err: any) {
      setError(err.message || 'Error al cargar paquetes bloqueados');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPackageLogs = async (packageId: string) => {
    try {
      const data = await api.get(`/api/packages/${packageId}/logs`);
      setLogs(data.logs || []);
    } catch (err: any) {
      if (err.status !== 404) {
        console.error('Error al cargar logs:', err);
      }
      setLogs([]);
    }
  };

  const fetchIncidenciaDetails = async (packageId: string) => {
    try {
      const data = await api.get(`/api/packages/${packageId}/incidencia`);
      setIncidenciaDetalle(data.incidencia);
    } catch (err: any) {
      console.error('Error al cargar detalles de incidencia:', err);
      setIncidenciaDetalle(null);
    }
  };

  const handleOpenResolutionModal = () => {
    setShowResolutionModal(true);
    setComentarioResolucion('');
  };

  const handleCloseResolutionModal = () => {
    setShowResolutionModal(false);
    setComentarioResolucion('');
    setError('');
  };

  const handleResolve = async (action: 'liberar' | 'cerrar') => {
    if (!selectedPackage) return;

    if (!comentarioResolucion.trim()) {
      setError('Debes ingresar un comentario de resolución');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let newStatus: StateType = 'EN_ACOPIO';
      if (action === 'cerrar') {
        newStatus = 'ENTREGADO';
      }

      const data = await updateActivoEstado(
        selectedPackage.id_activo,
        newStatus,
        selectedPackage.integridad,
        '',
        user?.rut
      );

      showToast(
        `✅ Caso resuelto con éxito: Paquete ${action === 'liberar' ? 'liberado a Acopio' : 'cerrado como Entregado'}`,
        'success'
      );

      handleCloseResolutionModal();
      setSelectedPackage(null);
      
      if (activeTab === 'incidencias') {
        await fetchIncidencias();
      } else {
        await fetchBloqueados();
      }
      
    } catch (err: any) {
      setError(err.message || 'Error al resolver la incidencia');
      showToast('❌ Error al resolver la incidencia', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (pkg: PackageType): string => {
    if (pkg.is_blocked) {
      const hasCriticalLog = logs.some(log => log.tipo_alerta === 'crítico');
      if (hasCriticalLog) {
        return 'border-red-500/50 bg-red-500/10';
      }
      return 'border-yellow-500/50 bg-yellow-500/10';
    }
    return 'border-slate-700 bg-slate-800/30';
  };

  const getPriorityBadge = (pkg: PackageType): { text: string; color: string } => {
    if (pkg.is_blocked) {
      const hasCriticalLog = logs.some(log => log.tipo_alerta === 'crítico');
      if (hasCriticalLog) {
        return { text: 'ALTA', color: 'bg-red-500/30 text-red-300' };
      }
      return { text: 'MEDIA', color: 'bg-yellow-500/30 text-yellow-300' };
    }
    return { text: 'BAJA', color: 'bg-slate-500/30 text-slate-300' };
  };

  const getEstadoDisplay = (estado: string): string => {
    const display: Record<string, string> = {
      'SOLICITADO': 'Solicitado',
      'EN_TRANSITO': 'En Tránsito',
      'EN_ACOPIO': 'En Acopio',
      'EN_ACOPIO_ASIGNADO': 'Asignado',
      'EN_TRANSITO_ENTREGA': 'En Ruta',
      'ENTREGADO': 'Entregado',
      'RECIBIDO': 'Recibido',
      'EN_DISPUTA': 'En Disputa'
    };
    return display[estado] || estado;
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
              : toast.type === 'warning'
              ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
              : 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            {toast.type === 'info' && <FileText className="w-5 h-5 flex-shrink-0" />}
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
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-wide">Portal Analista</h1>
          </div>

          <nav className="px-4 space-y-2 mt-4">
            <button
              onClick={() => setActiveTab('incidencias')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'incidencias'
                  ? 'bg-amber-400 text-slate-900 font-semibold shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Incidencias Pendientes
              {packages.length > 0 && activeTab === 'incidencias' && (
                <span className="ml-auto bg-white/20 text-slate-900 px-2 py-0.5 rounded-full text-xs font-bold">
                  {packages.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('bloqueados')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'bloqueados'
                  ? 'bg-amber-400 text-slate-900 font-semibold shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Ban className="w-4 h-4" />
              Paquetes Bloqueados
              {packages.length > 0 && activeTab === 'bloqueados' && (
                <span className="ml-auto bg-white/20 text-slate-900 px-2 py-0.5 rounded-full text-xs font-bold">
                  {packages.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-amber-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.nombre || 'Usuario'}</p>
              <p className="text-xs text-slate-500">Analista</p>
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 border-b border-white/5 pb-4">
            <h2 className="text-3xl font-bold text-white inline-block relative">
              {activeTab === 'incidencias' ? 'Incidencias Pendientes' : 'Paquetes Bloqueados'}
              <div className="absolute -bottom-4 left-0 w-1/3 h-1 bg-amber-500 rounded-full"></div>
            </h2>
            <p className="text-slate-400 mt-4">
              {activeTab === 'incidencias'
                ? 'Gestiona las incidencias reportadas por los mensajeros'
                : 'Revisa los paquetes bloqueados por incidencias'}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
            {/* Panel izquierdo - Lista */}
            <div className="lg:col-span-1 flex flex-col h-full bg-[#131b26] rounded-2xl border border-white/5 p-4 overflow-hidden">
              <h3 className="text-sm font-medium text-amber-500 mb-4 px-2">
                {activeTab === 'incidencias' ? 'Incidencias' : 'Paquetes'}
              </h3>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                  </div>
                ) : packages.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>
                      {activeTab === 'incidencias'
                        ? 'No hay incidencias pendientes'
                        : 'No hay paquetes bloqueados'}
                    </p>
                  </div>
                ) : (
                  packages.map((pkg) => {
                    const isSelected = selectedPackage?.id === pkg.id;
                    const priority = getPriorityBadge(pkg);
                    
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`w-full text-left p-4 rounded-xl transition-all border ${
                          isSelected
                            ? 'bg-[#1a2332] border-amber-500/50 border-r-4 border-r-amber-500'
                            : `hover:bg-[#1a2332] ${getPriorityColor(pkg)}`
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {pkg.nombre}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${priority.color}`}>
                            {priority.text}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{pkg.descripcion}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            pkg.estado_actual === 'EN_DISPUTA'
                              ? 'bg-red-500/30 text-red-300'
                              : 'bg-orange-500/30 text-orange-300'
                          }`}>
                            {getEstadoDisplay(pkg.estado_actual)}
                          </span>
                          {pkg.is_blocked && (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Bloqueado
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Panel derecho - Detalles */}
            <div className="lg:col-span-2 flex flex-col h-full bg-[#131b26] rounded-2xl border border-white/5 overflow-hidden">
              {!selectedPackage ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <div className="w-16 h-16 rounded-full border border-slate-700 flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="font-medium text-slate-400">
                      Selecciona una incidencia de la lista
                    </p>
                    <p className="text-sm mt-1 text-slate-600">
                      para ver los detalles completos y gestionarla
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 h-full flex flex-col overflow-y-auto">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">{selectedPackage.nombre}</h4>
                      <p className="text-slate-400 text-sm font-mono">ID: {selectedPackage.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedPackage.estado_actual === 'EN_DISPUTA'
                          ? 'bg-red-500/30 text-red-300'
                          : 'bg-orange-500/30 text-orange-300'
                      }`}>
                        {getEstadoDisplay(selectedPackage.estado_actual)}
                      </span>
                      {selectedPackage.is_blocked && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/30 text-red-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalles del paquete */}
                  <div className="grid grid-cols-2 gap-4 bg-[#1a2332] rounded-xl p-4 border border-white/5 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Origen</p>
                      <p className="text-white text-sm">{selectedPackage.direccion_origen}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Destino</p>
                      <p className="text-white text-sm">{selectedPackage.direccion_destino}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Integridad</p>
                      <p className={`font-medium ${selectedPackage.integridad === 'Intacto' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {selectedPackage.integridad || 'Intacto'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Remitente</p>
                      <p className="text-white font-mono text-sm">{selectedPackage.rut_remitente}</p>
                    </div>
                  </div>

                  {/* Detalles de la incidencia */}
                  {incidenciaDetalle && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                      <h5 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Detalles de la Incidencia
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wider">Motivo</p>
                          <p className="text-white">{incidenciaDetalle.motivo || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wider">Descripción</p>
                          <p className="text-white text-sm">{incidenciaDetalle.descripcion || 'Sin descripción'}</p>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <div>
                            <p className="text-slate-400 uppercase tracking-wider">Reportado por</p>
                            <p className="text-white font-mono">{incidenciaDetalle.reportado_por || 'Desconocido'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 uppercase tracking-wider">Fecha</p>
                            <p className="text-white">
                              {incidenciaDetalle.fecha 
                                ? new Date(incidenciaDetalle.fecha).toLocaleString()
                                : 'No disponible'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botón Gestionar */}
                  <button
                    onClick={handleOpenResolutionModal}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Eye className="w-4 h-4" />
                    Gestionar Incidencia
                  </button>

                  {/* Terminal de Logs */}
                  <CustodyTerminal selectedPackage={selectedPackage} logs={logs} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Resolución */}
      {showResolutionModal && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131b26] rounded-2xl border border-white/5 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Resolución de Incidencia</h3>
                  <p className="text-sm text-slate-400">
                    Paquete: {selectedPackage.nombre} (#{selectedPackage.id})
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseResolutionModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {incidenciaDetalle && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <h5 className="text-sm font-semibold text-red-400 mb-2">Incidencia Reportada</h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Motivo</p>
                      <p className="text-white">{incidenciaDetalle.motivo || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Descripción</p>
                      <p className="text-white text-sm">{incidenciaDetalle.descripcion || 'Sin descripción'}</p>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div>
                        <p className="text-slate-400">Reportado por</p>
                        <p className="text-white font-mono">{incidenciaDetalle.reportado_por || 'Desconocido'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Fecha</p>
                        <p className="text-white">
                          {incidenciaDetalle.fecha 
                            ? new Date(incidenciaDetalle.fecha).toLocaleString()
                            : 'No disponible'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Comentarios de Resolución <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={comentarioResolucion}
                  onChange={(e) => setComentarioResolucion(e.target.value)}
                  rows={4}
                  placeholder="Describe la resolución de la incidencia..."
                  className="w-full bg-[#1a2332] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {comentarioResolucion.length}/500 caracteres
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleResolve('liberar')}
                  disabled={isSubmitting || !comentarioResolucion.trim()}
                  className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Procesando...' : 'Liberar Activo'}
                </button>
                <button
                  onClick={() => handleResolve('cerrar')}
                  disabled={isSubmitting || !comentarioResolucion.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Procesando...' : 'Cerrar Incidencia'}
                </button>
                <button
                  onClick={handleCloseResolutionModal}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>

              <div className="text-xs text-slate-500 text-center">
                <p>
                  <span className="text-emerald-400">Liberar Activo</span> → Envía el paquete a Acopio para reasignación
                </p>
                <p>
                  <span className="text-blue-400">Cerrar Incidencia</span> → Marca el paquete como Entregado y cierra el caso
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};