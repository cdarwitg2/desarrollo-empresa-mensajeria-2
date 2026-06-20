export type TabType = 'request' | 'tracking';
export type StateType = 'SOLICITADO' | 'EN_TRANSITO' | 'EN_ACOPIO' | 'ENTREGADO' | 'EN_DISPUTA' | 'RECIBIDO';

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

export interface ShipmentFormProps {
  onSuccess?: () => void;
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shipmentData: ShipmentData;
}
