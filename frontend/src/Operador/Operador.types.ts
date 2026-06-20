export type TabType = 'bandeja' | 'acopio' | 'disputas';

export type StateType = 'SOLICITADO' | 'EN_TRANSITO' | 'EN_ACOPIO' | 'EN_ACOPIO_ASIGNADO' | 'EN_TRANSITO_ENTREGA' | 'ENTREGADO' | 'RECIBIDO' | 'EN_DISPUTA';

export interface Mensajero {
  rut: string;
  nombre_completo: string;
  activo: boolean;
}

export interface IncidenceData {
  motivo: string;
  descripcion: string;
}
