import { useState, useEffect } from 'react';
import { api, updateActivoEstado } from '../services/api';
import { Package as PackageType, LogEntry } from '../types';
import { TabType, StateType, Mensajero, IncidenceData } from './Operador.types';

export const useOperatorDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('bandeja');
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isIncidenceModalOpen, setIsIncidenceModalOpen] = useState(false);
  const [rutMensajero, setRutMensajero] = useState('');
  const [contingencyToken, setContingencyToken] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmitIncidence = async (incidenceData: IncidenceData) => {
    if (!selectedPackage) return;

    try {
      setIsLoading(true);
      await api.post(`/api/packages/${selectedPackage.id}/incidencias`, {
        motivo: incidenceData.motivo,
        descripcion: incidenceData.descripcion,
        package_id: selectedPackage.id
      });
      
      setIsIncidenceModalOpen(false);
      setRefreshKey(prev => prev + 1);
      
    } catch (err: any) {
      setError(err.message || 'Error al reportar incidencia');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
};

export const useBandejaPaquetes = (
  selectedPackage: PackageType | null,
  setSelectedPackage: (pkg: PackageType | null) => void,
  setLogs: (logs: LogEntry[]) => void,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string) => void,
  rutMensajero: string,
  setRutMensajero: (rut: string) => void,
  contingencyToken: string,
  setContingencyToken: (token: string) => void
) => {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [filter, setFilter] = useState('all');
  const [mensajeros, setMensajeros] = useState<Mensajero[]>([]);

  useEffect(() => {
    fetchMensajeros();
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [filter]);

  useEffect(() => {
    if (selectedPackage) {
      fetchLogs(selectedPackage.id);
    }
  }, [selectedPackage]);

  const fetchMensajeros = async () => {
    try {
      const data = await api.get('/api/packages/mensajeros');
      setMensajeros(data.mensajeros || []);
    } catch (err) {
      console.error('Error al cargar mensajeros:', err);
    }
  };

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSelectedPackage(null);

      if (filter === 'all') {
        const data = await api.get('/api/packages/filter');
        const excludedStates = ['EN_ACOPIO', 'EN_ACOPIO_ASIGNADO', 'EN_DISPUTA'];
        const filtered = (data.packages || []).filter(
          (pkg: any) => !excludedStates.includes(pkg.estado_actual)
        );
        setPackages(filtered);
      } else {
        const data = await api.get(`/api/packages/filter?estado=${filter}`);
        setPackages(data.packages || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar paquetes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async (packageId: string) => {
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

  const handleAction = async (actionType: string) => {
    if (!selectedPackage) return;

    let newStatus: StateType = 'EN_TRANSITO';
    if (actionType === 'INICIAR_TRANSPORTE') newStatus = 'EN_TRANSITO';
    if (actionType === 'RECIBIR_ACOPIO') newStatus = 'EN_ACOPIO';

    if (actionType === 'INICIAR_TRANSPORTE' && !rutMensajero.trim()) {
      setError('Debes seleccionar un mensajero');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const data = await updateActivoEstado(
        selectedPackage.id_activo,
        newStatus,
        selectedPackage.integridad,
        contingencyToken,
        actionType === 'INICIAR_TRANSPORTE' ? rutMensajero : undefined
      );

      setSelectedPackage({
        ...selectedPackage,
        estado_actual: data.asset?.estado_actual || newStatus
      });

      setRutMensajero('');
      setContingencyToken('');

      await fetchLogs(selectedPackage.id);
      await fetchPackages();
      
    } catch (err: any) {
      if (err.status === 403) {
        setError('El paquete está bloqueado. No se pueden realizar acciones.');
      } else if (err.status === 409) {
        setError(err.message || 'Error de conflicto de transición de estado');
      } else {
        setError(err.message || 'Error desconocido');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    packages,
    filter,
    setFilter,
    mensajeros,
    handleAction
  };
};

export const usePaquetesAcopio = (
  selectedPackage: PackageType | null,
  setSelectedPackage: (pkg: PackageType | null) => void,
  setLogs: (logs: LogEntry[]) => void,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string) => void,
  rutMensajero: string,
  setRutMensajero: (rut: string) => void,
  contingencyToken: string,
  setContingencyToken: (token: string) => void
) => {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [mensajeros, setMensajeros] = useState<Mensajero[]>([]);
  const [filter, setFilter] = useState<'EN_ACOPIO' | 'EN_ACOPIO_ASIGNADO'>('EN_ACOPIO');

  useEffect(() => {
    fetchMensajeros();
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [filter]);

  useEffect(() => {
    if (selectedPackage) {
      fetchLogs(selectedPackage.id);
    }
  }, [selectedPackage]);

  const fetchMensajeros = async () => {
    try {
      const data = await api.get('/api/packages/mensajeros');
      setMensajeros(data.mensajeros || []);
    } catch (err) {
      console.error('Error al cargar mensajeros:', err);
    }
  };

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSelectedPackage(null);

      const data = await api.get(`/api/packages/filter?estado=${filter}`);
      setPackages(data.packages || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar paquetes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async (packageId: string) => {
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

  const handleAsignarMensajero = async () => {
    if (!selectedPackage) {
      setError('No hay un paquete seleccionado');
      return;
    }

    if (!rutMensajero.trim()) {
      setError('Debes seleccionar un mensajero');
      return;
    }

    const newStatus: StateType = 'EN_ACOPIO_ASIGNADO';

    try {
      setIsLoading(true);
      setError('');

      const data = await updateActivoEstado(
        selectedPackage.id_activo,
        newStatus,
        selectedPackage.integridad,
        contingencyToken,
        rutMensajero
      );

      setSelectedPackage({
        ...selectedPackage,
        estado_actual: data.asset?.estado_actual || newStatus,
        rut_mensajero: rutMensajero
      });

      setRutMensajero('');
      setContingencyToken('');

      await fetchLogs(selectedPackage.id);
      await fetchPackages();
      
    } catch (err: any) {
      if (err.status === 403) {
        setError('El paquete está bloqueado. No se pueden realizar acciones.');
      } else if (err.status === 409) {
        setError(err.message || 'Error de conflicto de transición de estado');
      } else {
        setError(err.message || 'Error desconocido');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    packages,
    mensajeros,
    filter,
    setFilter,
    handleAsignarMensajero
  };
};

export const usePaquetesDisputa = (
  selectedPackage: PackageType | null,
  setSelectedPackage: (pkg: PackageType | null) => void,
  setLogs: (logs: LogEntry[]) => void,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string) => void
) => {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [isViewIncidenceModalOpen, setIsViewIncidenceModalOpen] = useState(false);
  const [incidenciaDetalle, setIncidenciaDetalle] = useState<any>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (selectedPackage) {
      fetchLogs(selectedPackage.id);
      if (selectedPackage.is_blocked) {
        fetchIncidenciaDetails(selectedPackage.id);
      }
    }
  }, [selectedPackage]);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSelectedPackage(null);

      const data = await api.get('/api/packages/filter?estado=EN_DISPUTA');
      const paquetes = (data.packages || []).filter((pkg: any) => pkg.is_blocked === true);
      setPackages(paquetes);
    } catch (err: any) {
      setError(err.message || 'Error al cargar paquetes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async (packageId: string) => {
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
    }
  };

  return {
    packages,
    isViewIncidenceModalOpen,
    setIsViewIncidenceModalOpen,
    incidenciaDetalle,
    fetchIncidenciaDetails
  };
};

export const useIncidenceModal = (
  onSubmit: (data: IncidenceData) => Promise<void>,
  onClose: () => void
) => {
  const [motivo, setMotivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!motivo) {
      setError('Debes seleccionar un motivo');
      return;
    }
    
    if (!descripcion.trim()) {
      setError('Debes ingresar una descripción');
      return;
    }

    if (descripcion.trim().length < 10) {
      setError('La descripción debe tener al menos 10 caracteres');
      return;
    }

    try {
      setError('');
      await onSubmit({ motivo, descripcion });
      setMotivo('');
      setDescripcion('');
      onClose();
    } catch (err) {
      setError('Error al enviar la incidencia. Intenta nuevamente.');
    }
  };

  const handleClose = () => {
    setMotivo('');
    setDescripcion('');
    setError('');
    onClose();
  };

  return {
    motivo,
    setMotivo,
    descripcion,
    setDescripcion,
    error,
    handleSubmit,
    handleClose
  };
};
