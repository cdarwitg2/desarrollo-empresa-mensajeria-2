export type TabType = 'pendientes' | 'ruta';

export type StateType = 'SOLICITADO' | 'EN_TRANSITO' | 'EN_ACOPIO' | 'EN_ACOPIO_ASIGNADO' | 'EN_TRANSITO_ENTREGA' | 'ENTREGADO' | 'RECIBIDO' | 'EN_DISPUTA';

export interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface TravelState {
  progress: number;
  timeRemaining: number;
  isTraveling: boolean;
  hasArrived: boolean;
  knockAttempts: number;
  maxAttempts: number;
  isSuccess: boolean | null;
  isComplete: boolean;
  isKnocking: boolean;
}
