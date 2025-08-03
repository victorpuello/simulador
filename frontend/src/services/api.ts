import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { AxiosInstance } from 'axios';
import { useAppStore } from '../store';

// Configuración base de axios
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor para agregar token de autenticación
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor para manejar respuestas y errores
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Si el error es 401 y no hemos intentado refrescar el token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const response = await axios.post('/api/auth/token/refresh/', {
              refresh: refreshToken,
            });

            const { access } = response.data;
            localStorage.setItem('access_token', access);

            // Reintentar la petición original con el nuevo token
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return instance(originalRequest);
          }
        } catch (refreshError) {
          // Si el refresh token también falla, hacer logout
          useAppStore.getState().logout();
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Instancia de API
export const api = createApiInstance();

// Tipos para las respuestas de la API
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Clase para manejar errores de la API
export class ApiException extends Error {
  public status: number;
  public errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.errors = errors;
  }
}

// Función para manejar errores de axios
export const handleApiError = (error: any): ApiException => {
  if (error.response) {
    const { data, status } = error.response;
    return new ApiException(
      data.message || data.detail || 'Error en la petición',
      status,
      data.errors
    );
  } else if (error.request) {
    return new ApiException('Error de conexión', 0);
  } else {
    return new ApiException('Error inesperado', 0);
  }
};

// Funciones helper para las peticiones
export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await api.get<T>(url, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const apiPost = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await api.post<T>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const apiPut = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await api.put<T>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const apiPatch = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await api.patch<T>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const apiDelete = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await api.delete<T>(url, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Servicios específicos de la API
export const authService = {
  // Login
  login: async (credentials: { username: string; password: string }) => {
    return apiPost<{ message: string; user: any; tokens: { access: string; refresh: string } }>(
      '/auth/login/',
      credentials
    );
  },

  // Registro
  register: async (userData: any) => {
    return apiPost<{ message: string; user: any; tokens: { access: string; refresh: string } }>(
      '/auth/registro/',
      userData
    );
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    return apiGet<any>('/auth/usuario-actual/');
  },

  // Actualizar perfil
  updateProfile: async (userData: any) => {
    return apiPut<any>('/auth/perfil/', userData);
  },

  // Cambiar contraseña
  changePassword: async (passwordData: any) => {
    return apiPost<{ message: string }>('/auth/cambiar-password/', passwordData);
  },

  // Logout
  logout: async (refreshToken: string) => {
    return apiPost<{ message: string }>('/auth/logout/', { refresh: refreshToken });
  },
};

export const materiasService = {
  // Obtener todas las materias
  getAll: async () => {
    return apiGet<any[]>('/core/materias/');
  },

  // Obtener materia por ID
  getById: async (id: number) => {
    return apiGet<any>(`/core/materias/${id}/`);
  },

  // Obtener estadísticas de materia
  getStats: async (id: number) => {
    return apiGet<any>(`/core/materias/${id}/estadisticas/`);
  },
};

export const preguntasService = {
  // Obtener todas las preguntas
  getAll: async (params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiGet<any[]>(`/core/preguntas/${queryString}`);
  },

  // Obtener preguntas para simulación
  getForSimulation: async (params: { materia?: number; cantidad?: number; dificultad?: string }) => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return apiGet<any[]>(`/core/preguntas/para_simulacion/?${queryString}`);
  },
};

export const sesionesService = {
  // Crear sesión
  create: async (sesionData: any) => {
    return apiPost<any>('/core/sesiones/', sesionData);
  },

  // Obtener sesiones del usuario
  getUserSessions: async (params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiGet<any[]>(`/core/sesiones/${queryString}`);
  },

  // Finalizar sesión
  finish: async (id: number) => {
    return apiPost<any>(`/core/sesiones/${id}/finalizar/`);
  },

  // Obtener estadísticas del usuario
  getUserStats: async () => {
    return apiGet<any>('/core/sesiones/estadisticas_usuario/');
  },
};

export const respuestasService = {
  // Crear respuesta
  create: async (respuestaData: any) => {
    return apiPost<any>('/core/respuestas/', respuestaData);
  },

  // Obtener respuestas del usuario
  getUserResponses: async (params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiGet<any[]>(`/core/respuestas/${queryString}`);
  },
};

export const clasesService = {
  // Obtener clases del usuario
  getUserClasses: async (params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiGet<any[]>(`/core/clases/${queryString}`);
  },

  // Crear clase
  create: async (claseData: any) => {
    return apiPost<any>('/core/clases/', claseData);
  },

  // Inscribir estudiante
  enrollStudent: async (id: number, codigo: string) => {
    return apiPost<any>(`/core/clases/${id}/inscribir_estudiante/`, { codigo });
  },
};

export const asignacionesService = {
  // Obtener asignaciones del usuario
  getUserAssignments: async (params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiGet<any[]>(`/core/asignaciones/${queryString}`);
  },

  // Crear asignación
  create: async (asignacionData: any) => {
    return apiPost<any>('/core/asignaciones/', asignacionData);
  },
};

export const gamificacionService = {
  // Obtener insignias
  getInsignias: async () => {
    return apiGet<any[]>('/core/insignias/');
  },

  // Obtener logros del usuario
  getUserAchievements: async () => {
    return apiGet<any[]>('/core/logros/');
  },
};

export default api; 