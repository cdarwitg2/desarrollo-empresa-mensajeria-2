import { useState, useEffect, useRef } from 'react';
import { api, updateActivoEstado } from '../services/api';
import { Package as PackageType } from '../types';
import { TabType, ToastMessage, TravelState } from './Mensajero.types';
import { useAuth } from '../context/AuthContext';

export const useDriverDashboard = () => {
  const { user } = useAuth();
  
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('pendientes');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showKnockButton, setShowKnockButton] = useState(false);

  const [travelState, setTravelState] = useState<TravelState>({
    progress: 0,
    timeRemaining: 10,
    isTraveling: false,
    hasArrived: false,
    knockAttempts: 1,
    maxAttempts: 3,
    isSuccess: null,
    isComplete: false,
    isKnocking: false,
  });

  const travelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    fetchMessengerPackages();
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (travelIntervalRef.current) clearInterval(travelIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

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

  const startTravel = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    setShowMap(true);
    setShowKnockButton(false);
    
    setTravelState({
      progress: 0,
      timeRemaining: 10,
      isTraveling: true,
      hasArrived: false,
      knockAttempts: 1,
      maxAttempts: 3,
      isSuccess: null,
      isComplete: false,
      isKnocking: false,
    });

    showToast('🚗 Iniciando viaje hacia el destino...', 'info');

    let timeLeft = 10;
    let progressValue = 0;

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      progressValue += 1;
      if (progressValue <= 100) {
        setTravelState(prev => ({
          ...prev,
          progress: progressValue,
        }));
      }
    }, 100);

    if (travelIntervalRef.current) clearInterval(travelIntervalRef.current);
    travelIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      
      setTravelState(prev => ({
        ...prev,
        timeRemaining: timeLeft,
      }));

      if (timeLeft > 0 && timeLeft % 3 === 0) {
        const progressPercent = Math.round(((10 - timeLeft) / 10) * 100);
        showToast(`🚚 Viaje en progreso... ${progressPercent}%`, 'info');
      }

      if (timeLeft <= 0) {
        if (travelIntervalRef.current) clearInterval(travelIntervalRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        
        setTravelState(prev => ({
          ...prev,
          isTraveling: false,
          hasArrived: true,
          progress: 100,
          timeRemaining: 0,
        }));
        
        setShowKnockButton(true);
        showToast('📍 ¡Has llegado al destino! Toca la puerta', 'success');
      }
    }, 1000);
  };

  const getSuccessThreshold = (attempts: number): number => {
    if (attempts >= 3) return 1.0;
    if (attempts === 2) return 0.66;
    return 0.33;
  };

  const handleKnockDoor = async () => {
    if (travelState.isKnocking) return;
    if (travelState.knockAttempts > 3) return;
    if (travelState.isSuccess) return;
    if (travelState.isComplete) return;

    setTravelState(prev => ({ ...prev, isKnocking: true }));
    setShowKnockButton(false);

    showToast('🔔 Tocando la puerta...', 'info');

    await new Promise(resolve => setTimeout(resolve, 800));

    const currentAttempts = travelState.knockAttempts;
    const threshold = getSuccessThreshold(currentAttempts);
    const randomValue = Math.random();
    const isSuccess = randomValue < threshold;

    console.log(`🔍 Intento ${currentAttempts}: random=${randomValue.toFixed(3)}, umbral=${threshold.toFixed(3)}, éxito=${isSuccess}`);

    if (isSuccess) {
      setTravelState(prev => ({
        ...prev,
        isSuccess: true,
        isComplete: true,
        knockAttempts: 0,
        isKnocking: false,
      }));
      setShowKnockButton(false);
      showToast('🚪 ¡El cliente ha salido! Entrega el paquete', 'success');
    } else {
      const newAttempts = currentAttempts + 1;
      
      if (newAttempts > 3) {
        setTravelState(prev => ({
          ...prev,
          isSuccess: false,
          isComplete: true,
          knockAttempts: 0,
          isKnocking: false,
        }));
        setShowKnockButton(false);
        await reportIncidence(selectedPackage!);
        showToast('⚠️ Nadie respondió después de 3 intentos. Incidencia reportada.', 'error');
      } else {
        setTravelState(prev => ({
          ...prev,
          knockAttempts: newAttempts,
          isKnocking: false,
        }));
        
        const nextThreshold = getSuccessThreshold(newAttempts) * 100;
        showToast(
          `🔔 Nadie responde, intenta de nuevo. (Intento ${newAttempts}/3, próxima probabilidad: ${Math.round(nextThreshold)}%)`,
          'warning'
        );
        
        setTimeout(() => {
          if (!travelState.isSuccess && !travelState.isComplete) {
            setShowKnockButton(true);
          }
        }, 1500);
      }
    }
  };

  const reportIncidence = async (pkg: PackageType) => {
    try {
      await api.post(`/api/packages/${pkg.id}/incidencias`, {
        motivo: 'Intento de entrega fallido',
        descripcion: `El mensajero intentó entregar el paquete ${pkg.nombre} (${pkg.id}) pero después de 3 intentos no hubo respuesta en la dirección.`,
        package_id: pkg.id
      });
      
      await fetchMessengerPackages();
      setShowMap(false);
      setSelectedPackage(null);
      setShowKnockButton(false);
      
      setTravelState({
        progress: 0,
        timeRemaining: 10,
        isTraveling: false,
        hasArrived: false,
        knockAttempts: 1,
        maxAttempts: 3,
        isSuccess: null,
        isComplete: false,
        isKnocking: false,
      });
    } catch (err: any) {
      showToast('Error al reportar incidencia: ' + err.message, 'error');
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
      setShowKnockButton(false);
      
      setTravelState({
        progress: 0,
        timeRemaining: 10,
        isTraveling: false,
        hasArrived: false,
        knockAttempts: 1,
        maxAttempts: 3,
        isSuccess: null,
        isComplete: false,
        isKnocking: false,
      });
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
    if (travelState.isTraveling) {
      if (travelIntervalRef.current) clearInterval(travelIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      
      setTravelState({
        progress: 0,
        timeRemaining: 10,
        isTraveling: false,
        hasArrived: false,
        knockAttempts: 1,
        maxAttempts: 3,
        isSuccess: null,
        isComplete: false,
        isKnocking: false,
      });
      setShowKnockButton(false);
    }
    
    startTravel(pkg);
  };

  const handleCloseMap = () => {
    if (travelIntervalRef.current) clearInterval(travelIntervalRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    
    setShowMap(false);
    setSelectedPackage(null);
    setShowKnockButton(false);
    
    setTravelState({
      progress: 0,
      timeRemaining: 10,
      isTraveling: false,
      hasArrived: false,
      knockAttempts: 1,
      maxAttempts: 3,
      isSuccess: null,
      isComplete: false,
      isKnocking: false,
    });
  };

  const getProgressColor = (progress: number): string => {
    if (progress < 33) return 'bg-red-500';
    if (progress < 66) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return {
    packages,
    activeTab,
    setActiveTab,
    isLoading,
    error,
    setError,
    toast,
    setToast,
    actionLoading,
    selectedPackage,
    showMap,
    showKnockButton,
    travelState,
    handleKnockDoor,
    handleRecoger,
    handleEntregar,
    handleSelectPackage,
    handleCloseMap,
    getProgressColor
  };
};
