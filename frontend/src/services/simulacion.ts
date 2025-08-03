import { api } from './api';
import type { 
  Sesion, 
  Pregunta, 
  RespuestaUsuario 
} from '../types';

export interface IniciarSesionRequest {
  materia_id: number;
  cantidad_preguntas?: number;
  modo?: 'practica' | 'simulacro' | 'asignada';
  competencias?: number[];
  dificultad?: 'facil' | 'media' | 'dificil' | 'mixta';
}

export interface IniciarSesionResponse {
  sesion: Sesion;
  preguntas: Pregunta[];
  mensaje: string;
}

export interface ResponderPreguntaRequest {
  pregunta_id: number;
  respuesta_seleccionada: 'A' | 'B' | 'C' | 'D';
  tiempo_respuesta: number;
}

export interface ResponderPreguntaResponse {
  es_correcta: boolean;
  respuesta_correcta: string;
  retroalimentacion: string;
  mensaje: string;
}

export interface EstadisticasSesion {
  puntaje_final: number;
  total_preguntas: number;
  correctas: number;
  incorrectas: number;
  porcentaje_acierto: number;
  tiempo_promedio: number;
}

export interface FinalizarSesionResponse {
  sesion: Sesion;
  estadisticas: EstadisticasSesion;
  mensaje: string;
}

export const simulacionService = {
  /**
   * Obtener todas las sesiones del usuario
   */
  async obtenerSesiones(): Promise<Sesion[]> {
    const response = await api.get('/simulacion/sesiones/');
    return response.data;
  },

  /**
   * Obtener una sesión específica
   */
  async obtenerSesion(sessionId: number): Promise<Sesion> {
    const response = await api.get(`/simulacion/sesiones/${sessionId}/`);
    return response.data;
  },

  /**
   * Iniciar una nueva sesión de simulación
   */
  async iniciarSesion(data: IniciarSesionRequest): Promise<IniciarSesionResponse> {
    const response = await api.post('/simulacion/sesiones/iniciar_sesion/', data);
    return response.data;
  },

  /**
   * Responder una pregunta en una sesión
   */
  async responderPregunta(
    sessionId: number, 
    data: ResponderPreguntaRequest
  ): Promise<ResponderPreguntaResponse> {
    const response = await api.post(
      `/simulacion/sesiones/${sessionId}/responder_pregunta/`, 
      data
    );
    return response.data;
  },

  /**
   * Finalizar una sesión
   */
  async finalizarSesion(
    sessionId: number, 
    forzar_finalizacion = false
  ): Promise<FinalizarSesionResponse> {
    const response = await api.post(
      `/simulacion/sesiones/${sessionId}/finalizar_sesion/`, 
      { forzar_finalizacion }
    );
    return response.data;
  },

  /**
   * Obtener estadísticas detalladas de una sesión
   */
  async obtenerEstadisticas(sessionId: number): Promise<any> {
    const response = await api.get(`/simulacion/sesiones/${sessionId}/estadisticas/`);
    return response.data;
  },

  /**
   * Obtener todas las respuestas de una sesión
   */
  async obtenerRespuestas(sessionId: number): Promise<{
    sesion_id: number;
    respuestas: RespuestaUsuario[];
    total_respuestas: number;
  }> {
    const response = await api.get(`/simulacion/sesiones/${sessionId}/respuestas/`);
    return response.data;
  }
};