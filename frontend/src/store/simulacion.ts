import { create } from 'zustand';
import { simulacionService } from '../services/api';
import type { Pregunta } from '../types';

interface RespuestaUsuario {
  pregunta: number;
  respuesta: string;
  es_correcta: boolean;
  tiempo_respuesta: number;
}

interface SimulacionState {
  // Estado
  sesionActual: any;
  preguntasActuales: Pregunta[];
  respuestasActuales: RespuestaUsuario[];
  preguntaActualIndex: number;
  sesionCompletada: boolean;
  loading: boolean;
  error: string | null;

  // Estadísticas
  respuestasCorrectas: number;
  respuestasIncorrectas: number;
  totalRespuestas: number;
  porcentajeCompletado: number;
  porcentajeAcierto: number;

  // Acciones
  iniciarSesion: (params: { materia: number; cantidad_preguntas?: number; plantilla?: number; forzar_reinicio?: boolean }) => Promise<void>;
  finalizarSesion: () => Promise<void>;
  responderPregunta: (respuesta: string) => Promise<void>;
  siguientePregunta: () => void;
  anteriorPregunta: () => void;
  limpiarSimulacion: () => void;
  setError: (error: string | null) => void;
}

const useSimulacionStore = create<SimulacionState>((set, get) => ({
  // Estado inicial
  sesionActual: null,
  preguntasActuales: [],
  respuestasActuales: [],
  preguntaActualIndex: 0,
  sesionCompletada: false,
  loading: false,
  error: null,

  // Estadísticas iniciales
  respuestasCorrectas: 0,
  respuestasIncorrectas: 0,
  totalRespuestas: 0,
  porcentajeCompletado: 0,
  porcentajeAcierto: 0,

  // Acciones
  iniciarSesion: async (params: { materia: number; cantidad_preguntas?: number; plantilla?: number; forzar_reinicio?: boolean }) => {
    set({ loading: true, error: null });
    try {
      const sesion = await simulacionService.crearSesion(params);
      
      set({
        sesionActual: sesion,
        preguntasActuales: sesion.preguntas_sesion.map((ps: any) => ps.pregunta),
        respuestasActuales: [],
        preguntaActualIndex: 0,
        sesionCompletada: false,
        loading: false
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al iniciar la simulación',
        loading: false 
      });
      throw error; // Re-lanzar el error para manejarlo en el componente
    }
  },

  finalizarSesion: async () => {
    const { sesionActual } = get();
    if (!sesionActual) return;

    set({ loading: true, error: null });
    try {
      // Solo marcar como completada localmente ya que el backend maneja la finalización automáticamente
      set({
        sesionCompletada: true,
        loading: false
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al finalizar la simulación',
        loading: false 
      });
    }
  },

  responderPregunta: async (respuesta) => {
    const { sesionActual, preguntaActualIndex, preguntasActuales } = get();
    if (!sesionActual) return;

    set({ loading: true, error: null });
    try {
      const params = {
        respuesta,
        tiempo_respuesta: preguntasActuales[preguntaActualIndex].tiempo_estimado
      };
      
      const sesionActualizada = await simulacionService.responderPregunta(
        sesionActual.id,
        params
      );

      // Actualizar estado con la respuesta
      const nuevasRespuestas = [...get().respuestasActuales];
      nuevasRespuestas.push({
        pregunta: preguntasActuales[preguntaActualIndex].id,
        respuesta,
        es_correcta: respuesta === preguntasActuales[preguntaActualIndex].respuesta_correcta,
        tiempo_respuesta: params.tiempo_respuesta
      });

      // Actualizar estadísticas
      const correctas = nuevasRespuestas.filter(r => r.es_correcta).length;
      const incorrectas = nuevasRespuestas.length - correctas;

      set({
        sesionActual: sesionActualizada,
        respuestasActuales: nuevasRespuestas,
        respuestasCorrectas: correctas,
        respuestasIncorrectas: incorrectas,
        totalRespuestas: nuevasRespuestas.length,
        porcentajeCompletado: (nuevasRespuestas.length / preguntasActuales.length) * 100,
        porcentajeAcierto: (correctas / nuevasRespuestas.length) * 100,
        loading: false
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al registrar la respuesta',
        loading: false 
      });
    }
  },

  siguientePregunta: () => {
    const { preguntaActualIndex, preguntasActuales } = get();
    if (preguntaActualIndex < preguntasActuales.length - 1) {
      set({ preguntaActualIndex: preguntaActualIndex + 1 });
    }
  },

  anteriorPregunta: () => {
    const { preguntaActualIndex } = get();
    if (preguntaActualIndex > 0) {
      set({ preguntaActualIndex: preguntaActualIndex - 1 });
    }
  },

  limpiarSimulacion: () => {
    set({
      sesionActual: null,
      preguntasActuales: [],
      respuestasActuales: [],
      preguntaActualIndex: 0,
      sesionCompletada: false,
      loading: false,
      error: null,
      respuestasCorrectas: 0,
      respuestasIncorrectas: 0,
      totalRespuestas: 0,
      porcentajeCompletado: 0,
      porcentajeAcierto: 0
    });
  },

  setError: (error) => set({ error })
}));

// Hooks para acceder al estado y acciones
export const useSimulacionEstado = () => {
  const {
    sesionActual,
    preguntasActuales,
    respuestasActuales,
    preguntaActualIndex,
    sesionCompletada,
    loading,
    error
  } = useSimulacionStore();

  return {
    sesionActual,
    preguntasActuales,
    respuestasActuales,
    preguntaActualIndex,
    sesionCompletada,
    loading,
    error
  };
};

export const useSimulacionAcciones = () => {
  const {
    iniciarSesion,
    finalizarSesion,
    responderPregunta,
    siguientePregunta,
    anteriorPregunta,
    limpiarSimulacion,
    setError
  } = useSimulacionStore();

  return {
    iniciarSesion,
    finalizarSesion,
    responderPregunta,
    siguientePregunta,
    anteriorPregunta,
    limpiarSimulacion,
    setError
  };
};

export const useSimulacionEstadisticas = () => {
  const {
    respuestasCorrectas,
    respuestasIncorrectas,
    totalRespuestas,
    porcentajeCompletado,
    porcentajeAcierto
  } = useSimulacionStore();

  return {
    respuestasCorrectas,
    respuestasIncorrectas,
    totalRespuestas,
    porcentajeCompletado,
    porcentajeAcierto
  };
};