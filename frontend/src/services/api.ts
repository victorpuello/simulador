import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { AxiosInstance } from 'axios';
import { useAppStore } from '../store';
import { mockLogin, mockLogout } from './mockApi';

// Configuración base de axios
const createApiInstance = (): AxiosInstance => {
  const isDev = !!(import.meta as unknown as { env?: Record<string, unknown> })?.env?.DEV;
  const configuredBaseUrl = (import.meta as unknown as { env?: Record<string, unknown> })?.env?.VITE_API_URL as string | undefined;
  // En dev usamos el proxy '/api'. En preview/prod NO hay proxy, así que
  // si no hay VITE_API_URL configurado, apuntamos a backend local por defecto.
  const baseURL = isDev ? '/api' : (configuredBaseUrl || 'http://127.0.0.1:8000/api');

  // Log inicial de baseURL seleccionada
  try {
    // eslint-disable-next-line no-console
    console.info('[API] baseURL seleccionada:', baseURL, 'isDev:', isDev, 'VITE_API_URL:', configuredBaseUrl);
  } catch { /* noop */ }

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
    async (error: unknown) => {
      const err = error as { config?: Record<string, unknown>; response?: { status?: number; data?: Record<string, unknown> }; message?: string };
      console.error('Error en respuesta:', {
        url: err.config?.url,
        method: err.config?.method,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.config?.headers,
        error: err.message,
        detail: err.response?.data?.detail || err.response?.data?.error
      });

      const originalRequest = (err.config || {}) as Record<string, unknown> & { _retry?: boolean; headers?: Record<string, unknown> };

      // Si el error es 401 y no hemos intentado refrescar el token
      if (err.response?.status === 401 && !originalRequest._retry) {
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
            if (!originalRequest.headers) originalRequest.headers = {};
            (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${access}`;
            return instance(originalRequest);
          }
        } catch {
          // Si el refresh token también falla, hacer logout
          useAppStore.getState().logout();
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }

      return Promise.reject(err);
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
export const handleApiError = (error: unknown): ApiException => {
  const err = error as { response?: { data?: Record<string, unknown>; status: number }; request?: unknown };
  if (err.response) {
    const { data, status } = err.response;
    return new ApiException(
      (data?.message as string) || (data?.detail as string) || 'Error en la petición',
      status,
      data?.errors as Record<string, string[]> | undefined
    );
  } else if (err.request) {
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

export const apiPost = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await api.post<T>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const apiPut = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await api.put<T>(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const apiPatch = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
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
      return await apiPost<{ message: string; user: Record<string, unknown>; tokens: { access: string; refresh: string } }>(
        '/auth/login/',
        credentials
      );
    } catch (error: unknown) {
      // Si el backend no está disponible, usar mock
      const err = error as { code?: string; response?: { status?: number } };
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED' || (err.response?.status ?? 0) >= 500) {
        console.log('🔄 Backend no disponible, usando mock login...');
        return await mockLogin(credentials.username, credentials.password);
      }
      throw error;
    }
  },

  // Registro
  register: async (userData: Record<string, unknown>) => {
    return apiPost<{ message: string; user: Record<string, unknown>; tokens: { access: string; refresh: string } }>(
      '/auth/registro/',
      userData
    );
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    return apiGet<Record<string, unknown>>('/auth/usuario-actual/');
  },

  // Actualizar perfil
  updateProfile: async (userData: Record<string, unknown>) => {
    return apiPut<Record<string, unknown>>('/auth/perfil/', userData);
  },

  // Cambiar contraseña
  changePassword: async (passwordData: Record<string, unknown>) => {
    return apiPost<{ message: string }>('/auth/cambiar-password/', passwordData);
  },

  // Logout
  logout: async (refreshToken: string) => {
    try {
      return await apiPost<{ message: string }>('/auth/logout/', { refresh: refreshToken });
    } catch (error: unknown) {
      // Si el backend no está disponible, usar mock
      const err = error as { code?: string; response?: { status?: number } };
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED' || (err.response?.status ?? 0) >= 500) {
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
    return apiGet<Array<Record<string, unknown>>>('/core/materias/');
  },

  // Obtener materia por ID
  getById: async (id: number) => {
    return apiGet<Record<string, unknown>>(`/core/materias/${id}/`);
  },

  // Obtener estadísticas de materia
  getStats: async (id: number) => {
    return apiGet<Record<string, unknown>>(`/core/materias/${id}/estadisticas/`);
  },
};

export const preguntasService = {
  // Obtener todas las preguntas
  getAll: async (params?: Record<string, string | number | boolean>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiGet<Array<Record<string, unknown>>>(`/core/preguntas/${queryString}`);
  },

  // Obtener preguntas para simulación
  getForSimulation: async (params: { materia?: number; cantidad?: number; dificultad?: string }) => {
    const strParams: Record<string, string> = {};
    if (typeof params.materia === 'number') strParams.materia = String(params.materia);
    if (typeof params.cantidad === 'number') strParams.cantidad = String(params.cantidad);
    if (params.dificultad) strParams.dificultad = params.dificultad;
    const queryString = new URLSearchParams(strParams).toString();
    return apiGet<Array<Record<string, unknown>>>(`/core/preguntas/para_simulacion/?${queryString}`);
  },
};

export const sesionesService = {
  // Crear sesión
  create: async (sesionData: Record<string, unknown>) => {
    return apiPost<Record<string, unknown>>('/core/sesiones/', sesionData);
  },

  // Obtener sesiones del usuario
  getUserSessions: async (params?: Record<string, string | number | boolean>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiGet<Array<Record<string, unknown>>>(`/core/sesiones/${queryString}`);
  },

  // Finalizar sesión
  finish: async (id: number) => {
    return apiPost<Record<string, unknown>>(`/core/sesiones/${id}/finalizar/`);
  },

  // Obtener estadísticas del usuario
  getUserStats: async () => {
    return apiGet<Record<string, unknown>>('/core/sesiones/estadisticas_usuario/');
  },
};

export const respuestasService = {
  // Crear respuesta
  create: async (respuestaData: Record<string, unknown>) => {
    return apiPost<Record<string, unknown>>('/core/respuestas/', respuestaData);
  },

  // Obtener respuestas del usuario
  getUserResponses: async (params?: Record<string, string | number | boolean>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiGet<Array<Record<string, unknown>>>(`/core/respuestas/${queryString}`);
  },
};

export const clasesService = {
  // Obtener clases del usuario
  getUserClasses: async (params?: Record<string, string | number | boolean>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiGet<Array<Record<string, unknown>>>(`/core/clases/${queryString}`);
  },

  // Crear clase
  create: async (claseData: Record<string, unknown>) => {
    return apiPost<Record<string, unknown>>('/core/clases/', claseData);
  },

  // Inscribir estudiante
  enrollStudent: async (id: number, codigo: string) => {
    return apiPost<Record<string, unknown>>(`/core/clases/${id}/inscribir_estudiante/`, { codigo });
  },
};

export const asignacionesService = {
  // Obtener asignaciones del usuario
  getUserAssignments: async (params?: Record<string, string | number | boolean>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiGet<Array<Record<string, unknown>>>(`/core/asignaciones/${queryString}`);
  },

  // Crear asignación
  create: async (asignacionData: Record<string, unknown>) => {
    return apiPost<Record<string, unknown>>('/core/asignaciones/', asignacionData);
  },
};

export const gamificacionService = {
  // Obtener insignias
  getInsignias: async () => {
    return apiGet<Array<Record<string, unknown>>>('/core/insignias/');
  },

  // Obtener logros del usuario
  getUserAchievements: async () => {
    return apiGet<Array<Record<string, unknown>>>('/core/logros/');
  },
};

export const simulacionService = {
  // Obtener materias disponibles
  getMateriasDisponibles: async () => {
    return apiGet<Array<Record<string, unknown>>>('/simulacion/plantillas/materias_disponibles/');
  },

  // Obtener sesiones de simulación
  getSesiones: async () => {
    return apiGet<Array<Record<string, unknown>>>('/simulacion/sesiones/');
  },

  // Crear sesión de simulación
  crearSesion: async (data: Record<string, unknown>) => {
    return apiPost<Record<string, unknown>>('/simulacion/sesiones/iniciar_sesion/', data);
  },

  // Responder pregunta
  responderPregunta: async (sesionId: number, data: Record<string, unknown>) => {
    return apiPost<Record<string, unknown>>(`/simulacion/sesiones/${sesionId}/responder_pregunta/`, data);
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
    return apiGet<Record<string, unknown>>(`/simulacion/sesiones/${sesionId}/`);
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