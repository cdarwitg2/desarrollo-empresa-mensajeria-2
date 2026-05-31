// Tipos compartidos para la aplicación

export interface User {
  rut: string;
  nombre: string;
  roles: string[];
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (rut: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

export interface LoginResponse {
  token: string;
  nombre: string;
  roles: string[];
  rut: string;
}
