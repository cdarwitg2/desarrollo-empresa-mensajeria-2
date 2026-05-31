/**
 * Tipos de autenticación y usuario
 */

export interface Usuario {
  rut: string
  nombre: string
  roles: string[]
}

export interface LoginCredentials {
  rut: string
  password: string
}

export interface LoginResponse {
  token: string
  nombre: string
  roles: string[]
  rut: string
}

export interface AuthContextType {
  usuario: Usuario | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  hasRole: (role: string | string[]) => boolean
  clearError: () => void
}
