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
  puntuacion: number | null;
  completada: boolean;
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

export interface ReporteICFES {
  puntaje_global: number;
  percentil: number;
  nivel: string;
  puntajes_materias: Record<string, number>;
  detalles_materias: Record<string, {
    materia_nombre: string;
    puntaje: number;
    ponderacion: number;
    simulaciones: number;
    mejor_puntaje: number;
  }>;
  materias_faltantes: string[];
  promedio_ponderado: number;
  suma_ponderada: number;
  ponderacion_total: number;
  formula_aplicada: {
    descripcion: string;
    ponderaciones: Record<string, number>;
  };
}

// ===== Docentes =====
export interface DocenteResumen {
  simulaciones_totales: number;
  simulaciones_completadas: number;
  estudiantes_activos_7d: number;
  estudiantes_activos_30d: number;
  promedio_puntaje: number;
  tiempo_promedio_pregunta: number;
}

export interface DocenteMateriaItem {
  materia_id: number;
  materia_nombre: string;
  simulaciones: number;
  promedio_puntaje: number;
  porcentaje_acierto: number;
  tiempo_promedio_pregunta: number;
}

export interface DocentePreguntaItem {
  pregunta_id: number;
  enunciado_resumen: string;
  porcentaje_acierto: number;
  total_respuestas: number;
  opcion_mas_elegida: string | null;
}

export interface DocenteEstudianteItem {
  estudiante_id: number;
  nombre: string;
  simulaciones: number;
  porcentaje_acierto: number;
  tiempo_promedio_pregunta: number;
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
  },

  // Obtener reporte ICFES
  async getReporteICFES(): Promise<ReporteICFES> {
    const response = await api.get('/reportes/reporte_icfes/');
    return response.data;
  },

  // ===== Docentes =====
  async getDocenteResumen(): Promise<DocenteResumen> {
    const response = await api.get('/reportes/docente/resumen/');
    return response.data;
  },
  async getDocenteMaterias(): Promise<DocenteMateriaItem[]> {
    const response = await api.get('/reportes/docente/materias/');
    return response.data;
  },
  async getDocentePreguntas(materia?: number, limit: number = 50): Promise<DocentePreguntaItem[]> {
    const params = new URLSearchParams();
    if (materia) params.append('materia', String(materia));
    if (limit) params.append('limit', String(limit));
    const response = await api.get(`/reportes/docente/preguntas/?${params.toString()}`);
    return response.data;
  },
  async getDocenteEstudiantes(): Promise<DocenteEstudianteItem[]> {
    const response = await api.get('/reportes/docente/estudiantes/');
    return response.data;
  }
};