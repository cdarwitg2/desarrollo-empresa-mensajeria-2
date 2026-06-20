/**
 * Tipos y Modelos Globales
 * Mantener en sincronía con API/app/models.py
 */

export interface User {
  rut: string;
  nombre_completo: string;
  rol: string | null;
  roles: string[];
  activo: boolean;
  ultima_conexion: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  // Compatibilidad hacia atrás para algunos componentes que usen .nombre
  nombre?: string;
}

export interface Package {
  id: string;
  id_activo: string;
  nombre: string;
  descripcion: string;
  valor_estimado: number;
  direccion_origen: string;
  direccion_destino: string;
  estado_actual: string;
  integridad: string;
  rut_remitente: string;
  rut_mensajero?: string;
  timestamp_registro: string | null;
  created_at: string;
  updated_at: string;
  is_blocked: boolean;
  lat?: number;        // 👈 Agregar
  lng?: number; 
}

export interface LogEntry {
  id: number;
  id_log: number;
  id_activo: string;
  id_responsable: string;
  rut_responsable: string;
  estado_instante: string;
  timestamp_accion: string | null;
  timestamp: string;
  coordenadas_gps: string | null;
  is_offline_sync: boolean;
  tipo_alerta: string;
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

export interface LoginResponse {
  token: string;
  nombre: string;
  roles: string[];
  rut: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (rut: string, password: string) => Promise<void>;
  register: (rut: string, nombre: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}
