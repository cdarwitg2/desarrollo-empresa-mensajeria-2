import React from 'react';
import { Package, AlertCircle, MapPin, Map, Target, X, Search, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PaymentModal } from './PaymentModal';
import { ShipmentFormProps } from '../Cliente.types';
import { useShipmentForm } from '../Cliente.hooks';

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

  const {
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
  } = useShipmentForm(onSuccess);

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