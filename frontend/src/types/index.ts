// Tipos compartidos para la aplicación

export interface Package {
  id: number
  tracking_number: string
  status: 'Registrado' | 'En Camino' | 'Entregado'
  created_at: string
  updated_at: string
}

export interface PackageCreateRequest {
  tracking_number: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
