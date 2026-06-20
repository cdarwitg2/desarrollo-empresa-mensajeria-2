export type TabType = 'users' | 'packages';

export interface User {
  rut: string;
  nombre_completo: string;
  rol: string;
  roles: string[];
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  id_activo: string;
  nombre: string;
  descripcion: string;
  estado_actual: string;
  integridad: string;
  rut_cliente: string;
  rut_mensajero?: string;
  created_at: string;
  is_blocked: boolean;
}

export interface DeleteConfirmState {
  type: 'user' | 'package';
  id: string;
  name: string;
}
