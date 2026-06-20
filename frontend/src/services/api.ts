const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    const message = errorData?.error || errorData?.message || 'Error en la petición a la API';
    throw new ApiError(message, response.status, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (endpoint: string) => fetchWithAuth(endpoint, { method: 'GET' }),
  post: (endpoint: string, data?: any) =>
    fetchWithAuth(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: (endpoint: string, data?: any) =>
    fetchWithAuth(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: (endpoint: string) => fetchWithAuth(endpoint, { method: 'DELETE' }),
  patch: (endpoint: string, data?: any) => 
    fetchWithAuth(endpoint, { 
      method: 'PATCH', 
      body: data ? JSON.stringify(data) : undefined 
    }),
};

export const updateActivoEstado = async (id: string, nuevoEstado: string, integridad: string = 'Intacto', tokenContingencia?: string, rutMensajero?: string) => {
  return await api.patch(`/api/packages/${id}/estado`, {
    estado: nuevoEstado,
    integridad,
    ...(tokenContingencia && { token_contingencia: tokenContingencia }),
    ...(rutMensajero && { rut_mensajero: rutMensajero })
  });
};

export const generarContingencia = async (id: string) => {
  return await api.post(`/api/packages/${id}/generar-contingencia`);
};
