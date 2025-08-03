import { api } from './api';

export interface EstadisticasGenerales {
  total_simulaciones: number;
  simulaciones_completadas: number;
  promedio_puntaje: number;
  tiempo_total_estudio: number;
  mejor_puntaje: number;
  ultima_simulacion: string | null;
  racha_actual: number;
}

export interface EstadisticasMateria {
  materia_id: number;
  materia_nombre: string;
  simulaciones_realizadas: number;
  promedio_puntaje: number;
  mejor_puntaje: number;
  total_preguntas: number;
  preguntas_correctas: number;
  porcentaje_acierto: number;
}

export interface HistorialSesion {
  id: number;
  materia_nombre: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  puntaje_final: number | null;
  completada: boolean;
  modo: string;
  duracion_minutos: number;
}

export interface ProgresoDiario {
  fecha: string;
  simulaciones: number;
  promedio_puntaje: number;
  tiempo_estudio: number;
}

export interface RankingMateria {
  materia_id: number;
  materia_nombre: string;
  promedio_puntaje: number;
  color: string;
  simulaciones: number;
}

export const reportesService = {
  // Obtener estadísticas generales del usuario
  async getEstadisticasGenerales(): Promise<EstadisticasGenerales> {
    const response = await api.get('/reportes/estadisticas_generales/');
    return response.data;
  },

  // Obtener estadísticas por materia
  async getEstadisticasPorMateria(): Promise<EstadisticasMateria[]> {
    const response = await api.get('/reportes/estadisticas_por_materia/');
    return response.data;
  },

  // Obtener historial de simulaciones
  async getHistorial(materiaId?: number, limite: number = 20): Promise<HistorialSesion[]> {
    const params = new URLSearchParams();
    if (materiaId) params.append('materia_id', materiaId.toString());
    params.append('limite', limite.toString());
    
    const response = await api.get(`/reportes/historial/?${params.toString()}`);
    return response.data;
  },

  // Obtener progreso diario
  async getProgresoDiario(): Promise<ProgresoDiario[]> {
    const response = await api.get('/reportes/progreso_diario/');
    return response.data;
  },

  // Obtener ranking de materias
  async getRankingMaterias(): Promise<RankingMateria[]> {
    const response = await api.get('/reportes/ranking_materias/');
    return response.data;
  }
};