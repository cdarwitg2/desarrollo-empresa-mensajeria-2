import React, { useState, useCallback, useRef } from 'react';
import { Package, AlertCircle, MapPin, Map, Target, X, Search, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PaymentModal } from './PaymentModal';
import { api } from '../services/api';

// Fix para los iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Iconos personalizados para origen y destino
const originIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'origin-marker',
});

const destinationIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'destination-marker',
});

interface ShipmentFormProps {
  onSuccess?: () => void;
}

export interface ShipmentData {
  nombre: string;
  descripcion: string;
  direccion_origen: string;
  direccion_destino: string;
  lat_origen?: number | null;
  lng_origen?: number | null;
  lat_destino?: number | null;
  lng_destino?: number | null;
}

// Componente para manejar los clics en el mapa
const MapClickHandler: React.FC<{
  mode: 'origen' | 'destino' | null;
  onMapClick: (lat: number, lng: number) => void;
}> = ({ mode, onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (mode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

export const ShipmentForm: React.FC<ShipmentFormProps> = ({ onSuccess }) => {
  // Centro del mapa en Temuco, Chile
  const defaultLat = -38.7365;
  const defaultLng = -72.5904;

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
  
  // Estados para geocodificación
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Geocodificación inversa: de coordenadas a dirección
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

  // Geocodificación directa: de dirección a coordenadas
  const searchLocation = useCallback(async (query: string, type: 'origen' | 'destino') => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const displayName = result.display_name || query;

        // Actualizar coordenadas y dirección
        if (type === 'origen') {
          setFormData((prev) => ({
            ...prev,
            lat_origen: lat,
            lng_origen: lng,
            direccion_origen: displayName,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            lat_destino: lat,
            lng_destino: lng,
            direccion_destino: displayName,
          }));
        }
      } else {
        setSearchError(`No se encontró la dirección: "${query}"`);
      }
    } catch (error) {
      setSearchError('Error al buscar la dirección');
      console.error('Error en geocodificación directa:', error);
    } finally {
      setIsSearching(false);
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

    // Obtener dirección desde las coordenadas (geocodificación inversa)
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
          onSuccess?.();
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

  // Estilos CSS para los marcadores
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .origin-marker .leaflet-marker-icon {
        filter: hue-rotate(200deg) saturate(2) brightness(1.2);
      }
      .destination-marker .leaflet-marker-icon {
        filter: hue-rotate(340deg) saturate(2) brightness(1.2);
      }
      .leaflet-popup-content-wrapper {
        background: #1a2332 !important;
        border-radius: 12px !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        color: white !important;
      }
      .leaflet-popup-tip {
        background: #1a2332 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px] relative">
        {/* Formulario - 40% */}
        <div className="lg:w-[40%] space-y-6 relative z-10">
          {successMessage && (
            <div className="backdrop-blur-md bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-green-400 text-sm font-medium">{successMessage}</p>
            </div>
          )}

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 overflow-y-auto max-h-[600px]">
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Solicitar Envío</h3>
            </div>

            <div className="space-y-5">
              {/* Nombre del Paquete */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre del Paquete <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Documentos confidenciales"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  disabled={isSubmitting}
                />
                {errors.nombre && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.nombre}
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descripción del Contenido <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Describe el contenido del paquete..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                  disabled={isSubmitting}
                />
                {errors.descripcion && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.descripcion}
                  </div>
                )}
              </div>

              {/* Buscador de Direcciones (Geocodificación Directa) */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">
                  🔍 Buscar ubicación
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          if (mapMode) {
                            searchLocation(searchQuery, mapMode);
                          } else {
                            setSearchError('Selecciona primero Origen o Destino en el mapa');
                          }
                        }
                      }}
                      placeholder="Buscar dirección..."
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                      disabled={isSubmitting || isSearching}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (searchQuery.trim()) {
                        if (mapMode) {
                          searchLocation(searchQuery, mapMode);
                        } else {
                          setSearchError('Selecciona primero Origen o Destino en el mapa');
                        }
                      }
                    }}
                    disabled={!searchQuery.trim() || isSearching || isSubmitting}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
                {searchError && (
                  <p className="text-xs text-red-400 mt-2">{searchError}</p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  💡 Escribe una dirección y presiona Enter (debes tener seleccionado Origen o Destino)
                </p>
              </div>

              {/* Dirección de Origen */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dirección de Origen <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="direccion_origen"
                    value={formData.direccion_origen}
                    onChange={handleInputChange}
                    placeholder="Ej: Calle Principal 123, Temuco"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setMapMode(mapMode === 'origen' ? null : 'origen')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                      mapMode === 'origen'
                        ? 'bg-blue-500 text-white ring-2 ring-blue-400'
                        : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                    }`}
                    disabled={isSubmitting}
                  >
                    <MapPin className="w-4 h-4" />
                    {mapMode === 'origen' ? 'Seleccionando...' : 'Seleccionar'}
                  </button>
                </div>
                {formData.lat_origen && formData.lng_origen && (
                  <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>Coordenadas: {formData.lat_origen.toFixed(6)}, {formData.lng_origen.toFixed(6)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          lat_origen: null,
                          lng_origen: null,
                        }));
                      }}
                      className="ml-auto text-red-400 hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {errors.lat_origen && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.lat_origen}
                  </div>
                )}
              </div>

              {/* Dirección de Destino */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dirección de Destino <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="direccion_destino"
                    value={formData.direccion_destino}
                    onChange={handleInputChange}
                    placeholder="Ej: Av. Secundaria 456, Temuco"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setMapMode(mapMode === 'destino' ? null : 'destino')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                      mapMode === 'destino'
                        ? 'bg-red-500 text-white ring-2 ring-red-400'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    }`}
                    disabled={isSubmitting}
                  >
                    <Target className="w-4 h-4" />
                    {mapMode === 'destino' ? 'Seleccionando...' : 'Seleccionar'}
                  </button>
                </div>
                {formData.lat_destino && formData.lng_destino && (
                  <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>Coordenadas: {formData.lat_destino.toFixed(6)}, {formData.lng_destino.toFixed(6)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          lat_destino: null,
                          lng_destino: null,
                        }));
                      }}
                      className="ml-auto text-red-400 hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {errors.lat_destino && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.lat_destino}
                  </div>
                )}
              </div>

              {/* Indicador de modo de selección */}
              {mapMode && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg animate-pulse">
                  <p className="text-yellow-400 text-sm flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    Haz clic en el mapa para seleccionar <span className="font-semibold uppercase">{mapMode}</span>
                  </p>
                </div>
              )}

              {/* Botón Proceder al Pago */}
              <button
                type="button"
                onClick={handleProceedPayment}
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Procesando...</span>
                  </div>
                ) : (
                  'Proceder al Pago'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mapa - 60% */}
        <div className="lg:w-[60%] min-h-[500px] lg:min-h-[600px] rounded-xl overflow-hidden border border-white/10 bg-[#131b26] relative z-0">
          <MapContainer
            center={[defaultLat, defaultLng]}
            zoom={13}
            className="w-full h-full min-h-[500px] lg:min-h-[600px]"
            zoomControl={true}
            scrollWheelZoom={true}
            dragging={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler mode={mapMode} onMapClick={handleMapClick} />

            {/* Marcador de Origen */}
            {formData.lat_origen && formData.lng_origen && (
              <Marker 
                position={[formData.lat_origen, formData.lng_origen]} 
                icon={originIcon}
              >
                <Popup>
                  <div className="text-white">
                    <p className="font-bold text-blue-400">📍 Origen</p>
                    <p className="text-sm text-slate-300">{formData.direccion_origen || 'Sin dirección'}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Marcador de Destino */}
            {formData.lat_destino && formData.lng_destino && (
              <Marker 
                position={[formData.lat_destino, formData.lng_destino]} 
                icon={destinationIcon}
              >
                <Popup>
                  <div className="text-white">
                    <p className="font-bold text-red-400">📍 Destino</p>
                    <p className="text-sm text-slate-300">{formData.direccion_destino || 'Sin dirección'}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Instrucciones en el mapa */}
            {!mapMode && !formData.lat_origen && !formData.lat_destino && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
                <p className="text-slate-300 text-sm flex items-center gap-2">
                  <Map className="w-4 h-4 text-blue-400" />
                  Usa los botones <span className="font-semibold text-blue-400">"Seleccionar"</span> y haz clic en el mapa
                </p>
              </div>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        shipmentData={formData}
      />
    </>
  );
};