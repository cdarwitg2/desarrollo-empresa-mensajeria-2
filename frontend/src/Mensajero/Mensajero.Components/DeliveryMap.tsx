// frontend/src/Mensajero/components/DeliveryMap.tsx
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DeliveryMapProps {
  lat: number;
  lng: number;
  address: string;
  packageName: string;
  onClose?: () => void;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({ lat, lng, address, packageName, onClose }) => {
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15);
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-white/10">
      <MapContainer
        ref={mapRef}
        center={[lat, lng]}
        zoom={15}
        className="w-full h-full min-h-[500px]"
        zoomControl={false}
        scrollWheelZoom={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topright" />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="text-white">
              <p className="font-bold text-base">{packageName}</p>
              <p className="text-sm text-slate-300">{address}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-[1000] bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition-all backdrop-blur-sm border border-white/10 shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default DeliveryMap;