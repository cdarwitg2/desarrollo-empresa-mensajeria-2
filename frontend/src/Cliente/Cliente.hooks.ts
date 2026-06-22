import { useState, useEffect, useCallback } from 'react';
import { api, updateActivoEstado } from '../services/api';
import { Package as ClientPackage } from '../types';
import { TabType, ShipmentData } from './Cliente.types';

export const useClientDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = sessionStorage.getItem('clientDashboardTab');
    return (saved as TabType) || 'tracking';
  });
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ClientPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isIncidenceModalOpen, setIsIncidenceModalOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('clientDashboardTab', activeTab);
  }, [activeTab]);

  const fetchMyPackages = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSelectedPackage(null);
      const data = await api.get('/api/packages/my-packages');
      const formattedPackages = (data.packages || []).map((pkg: ClientPackage) => ({
        ...pkg,
        estado_actual: pkg.estado_actual?.toUpperCase()
      }));
      setPackages(formattedPackages);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tracking') {
      fetchMyPackages();
    }
  }, [activeTab]);

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

  const handleSubmitIncidence = async (data: { motivo: string; descripcion: string }) => {
    if (!selectedPackage) return;
    try {
      setIsLoading(true);
      setError('');
      await api.post(`/api/packages/${selectedPackage.id_activo}/incidencias`, data);
      await fetchMyPackages();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error al reportar la incidencia');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    packages,
    selectedPackage,
    setSelectedPackage,
    isLoading,
    error,
    handleMarkAsReceived,
    isIncidenceModalOpen,
    setIsIncidenceModalOpen,
    handleSubmitIncidence
  };
};

export const useClienteIncidenceModal = (
  onSubmit: (data: { motivo: string; descripcion: string }) => Promise<void>,
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

export const useShipmentForm = (onSuccess?: () => void) => {
  const [formData, setFormData] = useState<ShipmentData>({
    nombre: '',
    descripcion: '',
    direccion_origen: '',
    direccion_destino: '',
    lat_origen: null,
    lng_origen: null,
    lat_destino: null,
    lng_destino: null,
  });

  const [errors, setErrors] = useState<Partial<ShipmentData>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [mapMode, setMapMode] = useState<'origen' | 'destino' | null>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const parts = [];
        if (addr.road) parts.push(addr.road);
        if (addr.house_number) parts.push(addr.house_number);
        if (addr.suburb) parts.push(addr.suburb);
        if (addr.city || addr.town || addr.village) {
          parts.push(addr.city || addr.town || addr.village);
        }
        if (addr.state) parts.push(addr.state);
        return parts.join(', ') || 'Dirección no disponible';
      }
      return 'Dirección no disponible';
    } catch (error) {
      console.error('Error en geocodificación inversa:', error);
      return 'Dirección no disponible';
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof ShipmentData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (!mapMode) return;

    const address = await reverseGeocode(lat, lng);

    if (mapMode === 'origen') {
      setFormData((prev) => ({
        ...prev,
        lat_origen: lat,
        lng_origen: lng,
        direccion_origen: address,
      }));
    } else if (mapMode === 'destino') {
      setFormData((prev) => ({
        ...prev,
        lat_destino: lat,
        lng_destino: lng,
        direccion_destino: address,
      }));
    }
    setMapMode(null);
  }, [mapMode, reverseGeocode]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ShipmentData> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del paquete es obligatorio';
    }
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }
    if (!formData.direccion_origen.trim()) {
      newErrors.direccion_origen = 'La dirección de origen es obligatoria';
    }
    if (!formData.direccion_destino.trim()) {
      newErrors.direccion_destino = 'La dirección de destino es obligatoria';
    }
    if (!formData.lat_origen || !formData.lng_origen) {
      newErrors.lat_origen = 'Debes seleccionar la ubicación de origen en el mapa o buscarla';
    }
    if (!formData.lat_destino || !formData.lng_destino) {
      newErrors.lat_destino = 'Debes seleccionar la ubicación de destino en el mapa o buscarla';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSuccess = async () => {
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        direccion_origen: formData.direccion_origen,
        direccion_destino: formData.direccion_destino,
        lat_origen: formData.lat_origen,
        lng_origen: formData.lng_origen,
        lat_destino: formData.lat_destino,
        lng_destino: formData.lng_destino,
      };

      const response = await api.post('/api/packages/create', payload);

      if (response.success) {
        setSuccessMessage('✅ ¡Paquete creado exitosamente!');
        setFormData({
          nombre: '',
          descripcion: '',
          direccion_origen: '',
          direccion_destino: '',
          lat_origen: null,
          lng_origen: null,
          lat_destino: null,
          lng_destino: null,
        });
        setErrors({});
        setShowPaymentModal(false);
        
        setTimeout(() => {
          setSuccessMessage('');
          if (onSuccess) onSuccess();
        }, 4000);
      }
    } catch (error: any) {
      setErrors({ descripcion: error.message || 'Error al crear el paquete' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedPayment = () => {
    if (validateForm()) {
      setShowPaymentModal(true);
    }
  };

  return {
    formData,
    setFormData,
    errors,
    successMessage,
    isSubmitting,
    showPaymentModal,
    setShowPaymentModal,
    mapMode,
    setMapMode,
    handleInputChange,
    handleMapClick,
    handlePaymentSuccess,
    handleProceedPayment
  };
};

export const usePaymentModal = (onSuccess: () => void) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      setError('Número de tarjeta inválido');
      return;
    }
    if (!cardName.trim()) {
      setError('Nombre del titular es obligatorio');
      return;
    }
    if (!expiryDate || expiryDate.length < 5) {
      setError('Fecha de expiración inválida');
      return;
    }
    if (!cvv || cvv.length < 3) {
      setError('CVV inválido');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s/g, '').replace(/\D/g, '');
    const parts = v.match(/.{1,4}/g);
    return parts ? parts.join(' ') : v;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  return {
    cardNumber,
    setCardNumber,
    cardName,
    setCardName,
    expiryDate,
    setExpiryDate,
    cvv,
    setCvv,
    isProcessing,
    error,
    handleSubmit,
    formatCardNumber,
    formatExpiryDate
  };
};
