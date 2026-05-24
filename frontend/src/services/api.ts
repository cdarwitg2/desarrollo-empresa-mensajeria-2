// Cliente HTTP para comunicación con la API

import { Package, ApiResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const packageAPI = {
  // Obtener estado de un paquete
  getPackage: async (trackingNumber: string): Promise<Package> => {
    const response = await fetch(`${API_BASE_URL}/packages/${trackingNumber}`)
    if (!response.ok) throw new Error('Paquete no encontrado')
    const data = await response.json()
    return data
  },

  // Registrar nuevo paquete
  createPackage: async (trackingNumber: string): Promise<Package> => {
    const response = await fetch(`${API_BASE_URL}/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking_number: trackingNumber }),
    })
    if (!response.ok) throw new Error('Error al registrar paquete')
    const data = await response.json()
    return data
  },

  // Actualizar estado de paquete
  updatePackageStatus: async (trackingNumber: string, status: string): Promise<Package> => {
    const response = await fetch(`${API_BASE_URL}/packages/${trackingNumber}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!response.ok) throw new Error('Error al actualizar estado')
    const data = await response.json()
    return data
  },
}
