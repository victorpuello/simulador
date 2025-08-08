import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { AxiosInstance } from 'axios';
import { useAppStore } from '../store';
import { mockLogin, mockLogout } from './mockApi';

// Configuración base de axios
const createApiInstance = (): AxiosInstance => {
  const isDev = !!((import.meta as any).env?.DEV);
  const configuredBaseUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  // En dev usamos el proxy '/api'. En preview/prod NO hay proxy, así que
  // si no hay VITE_API_URL configurado, apuntamos a backend local por defecto.
  const baseURL = isDev ? '/api' : (configuredBaseUrl || 'http://127.0.0.1:8000/api');

  // Log inicial de baseURL seleccionada
  try {
    // eslint-disable-next-line no-console
    console.info('[API] baseURL seleccionada:', baseURL, 'isDev:', isDev, 'VITE_API_URL:', configuredBaseUrl);
  } catch {}

  const instance = axios.create({
    // Usar proxy de Vite en dev; en prod permite override por VITE_API_URL
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    // JWT en Authorization header, no usamos cookies en dev → evitar preflight estrictos por credenciales
    withCredentials: false,
    transformRequest: [(data, headers) => {
      console.log('Transformando request:', { data, headers });
      // Si es FormData, no transformar y quitar Content-Type para que axios lo maneje
      if (data instanceof FormData) {
        if (headers) {
          delete headers['Content-Type'];
        }
        return data;
      }
      // Para datos normales, convertir a JSON
      return JSON.stringify(data);
    }],
  });

  // Interceptor para agregar token de autenticación y logging
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log de la configuración final
      console.log('Configuración final de la petición:', {
        url: config.url,
        baseURL: config.baseURL,
        resolved: (() => {
          try { return new URL(config.url || '', config.baseURL || baseURL).toString(); } catch { return 'n/a'; }
        })(),
        method: config.method,
        headers: config.headers,
        data: config.data instanceof FormData ? 'FormData' : config.data
      });
      
      return config;
    },
    (error) => {
      console.error('Error en interceptor de request:', error);
      return Promise.reject(error);
    }
  );

  // Interceptor para manejar respuestas y errores
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log('Respuesta exitosa:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
      return response;
    },
    async (error) => {
      console.error('Error en respuesta:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.config?.headers,
        error: error.message,
        detail: error.response?.data?.detail || error.response?.data?.error
      });

      const originalRequest = error.config;

      // Si el error es 401 y no hemos intentado refrescar el token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const response = await instance.post('/auth/token/refresh/', {
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
    try {
      return await apiPost<{ message: string; user: any; tokens: { access: string; refresh: string } }>(
        '/auth/login/',
        credentials
      );
    } catch (error: any) {
      // Si el backend no está disponible, usar mock
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
        console.log('🔄 Backend no disponible, usando mock login...');
        return await mockLogin(credentials.username, credentials.password);
      }
      throw error;
    }
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
    try {
      return await apiPost<{ message: string }>('/auth/logout/', { refresh: refreshToken });
    } catch (error: any) {
      // Si el backend no está disponible, usar mock
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
        console.log('🔄 Backend no disponible, usando mock logout...');
        return await mockLogout();
      }
      throw error;
    }
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

export const simulacionService = {
  // Obtener materias disponibles
  getMateriasDisponibles: async () => {
    return apiGet<any[]>('/simulacion/plantillas/materias_disponibles/');
  },

  // Obtener sesiones de simulación
  getSesiones: async () => {
    return apiGet<any[]>('/simulacion/sesiones/');
  },

  // Crear sesión de simulación
  crearSesion: async (data: any) => {
    return apiPost<any>('/simulacion/sesiones/iniciar_sesion/', data);
  },

  // Responder pregunta
  responderPregunta: async (sesionId: number, data: any) => {
    return apiPost<any>(`/simulacion/sesiones/${sesionId}/responder_pregunta/`, data);
  },

  // Verificar si hay sesión activa (general o por materia específica)
  verificarSesionActiva: async (materiaId?: number) => {
    const url = materiaId 
      ? `/simulacion/sesiones/verificar_sesion_activa/?materia_id=${materiaId}`
      : '/simulacion/sesiones/verificar_sesion_activa/';
      
    return apiGet<{
      tiene_sesion_activa?: boolean;
      tiene_sesiones_activas?: boolean;
      sesion?: {
        id: number;
        materia: string;
        materia_display: string;
        materia_id: number;
        fecha_inicio: string;
        progreso: {
          respondidas: number;
          total: number;
          porcentaje: number;
        };
      };
      sesiones?: Array<{
        id: number;
        materia: string;
        materia_display: string;
        materia_id: number;
        fecha_inicio: string;
        progreso: {
          respondidas: number;
          total: number;
          porcentaje: number;
        };
      }>;
      count?: number;
    }>(url);
  },

  // Obtener sesión específica
  getSesion: async (sesionId: string) => {
    return apiGet<any>(`/simulacion/sesiones/${sesionId}/`);
  },

  // Cargar sesión activa con preguntas para continuar
  cargarSesionActiva: async (sesionId: string) => {
    return apiGet<{
      id: number;
      materia: {
        id: number;
        nombre: string;
        nombre_display: string;
        color: string;
      };
      plantilla?: {
        id: number;
        titulo: string;
        descripcion: string;
      };
      fecha_inicio: string;
      completada: boolean;
      puntuacion: number;
      progreso: {
        respondidas: number;
        total: number;
        porcentaje: number;
      };
      preguntas_sesion: Array<{
        id: number;
        enunciado: string;
        contexto: string;
        opciones: Record<string, string>;
        dificultad: string;
        tiempo_estimado: number;
        materia: number;
        competencia?: number;
        tags: string[];
        orden: number;
      }>;
      respuestas_existentes: Array<{
        pregunta: number;
        respuesta: string;
        es_correcta: boolean;
        tiempo_respuesta: number;
        orden: number;
      }>;
      siguiente_pregunta_index: number;
      puede_continuar: boolean;
    }>(`/simulacion/sesiones/${sesionId}/cargar_sesion/`);
  },
};

export default api; 