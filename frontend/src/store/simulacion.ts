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
  pausada: boolean;

  // Estadísticas
  respuestasCorrectas: number;
  respuestasIncorrectas: number;
  totalRespuestas: number;
  porcentajeCompletado: number;
  porcentajeAcierto: number;

  // Acciones
  iniciarSesion: (params: { materia: number; cantidad_preguntas?: number; plantilla?: number; forzar_reinicio?: boolean }) => Promise<void>;
  cargarSesionExistente: (sesionId: string) => Promise<void>;
  finalizarSesion: () => Promise<void>;
  responderPregunta: (respuesta: string) => Promise<void>;
  siguientePregunta: () => void;
  anteriorPregunta: () => void;
  irAPregunta: (index: number) => void;
  pausarSimulacion: () => void;
  reanudarSimulacion: () => void;
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
  pausada: false,

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

  cargarSesionExistente: async (sesionId: string) => {
    set({ loading: true, error: null });
    try {
      const sesionData = await simulacionService.cargarSesionActiva(sesionId);
      
      // Calcular estadísticas de respuestas existentes
      const respuestasExistentes = sesionData.respuestas_existentes;
      const correctas = respuestasExistentes.filter(r => r.es_correcta).length;
      const incorrectas = respuestasExistentes.length - correctas;
      
      set({
        sesionActual: sesionData,
        preguntasActuales: sesionData.preguntas_sesion,
        respuestasActuales: respuestasExistentes,
        preguntaActualIndex: sesionData.siguiente_pregunta_index,
        sesionCompletada: sesionData.completada,
        respuestasCorrectas: correctas,
        respuestasIncorrectas: incorrectas,
        totalRespuestas: respuestasExistentes.length,
        porcentajeCompletado: sesionData.progreso.porcentaje,
        porcentajeAcierto: respuestasExistentes.length > 0 ? (correctas / respuestasExistentes.length) * 100 : 0,
        loading: false
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al cargar la simulación',
        loading: false 
      });
      throw error;
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

      // Sincronizar respuestas desde backend para evitar discrepancias
      const respuestasServidor: RespuestaUsuario[] = (sesionActualizada.preguntas_sesion || [])
        .filter((ps: any) => ps.respuesta_estudiante != null)
        .map((ps: any) => ({
          pregunta: ps.pregunta.id,
          respuesta: ps.respuesta_estudiante,
          es_correcta: !!ps.es_correcta,
          tiempo_respuesta: ps.tiempo_respuesta || 0,
        }));

      const correctas = respuestasServidor.filter(r => r.es_correcta).length;
      const totalResp = respuestasServidor.length;

      set({
        sesionActual: sesionActualizada,
        respuestasActuales: respuestasServidor,
        respuestasCorrectas: correctas,
        respuestasIncorrectas: totalResp - correctas,
        totalRespuestas: totalResp,
        porcentajeCompletado: (totalResp / preguntasActuales.length) * 100,
        porcentajeAcierto: totalResp > 0 ? (correctas / totalResp) * 100 : 0,
        loading: false
      });

      // Autosave local simple de progreso (pregunta y respuestas)
      try {
        localStorage.setItem(
          'simulacion-autosave',
          JSON.stringify({
            sesionId: sesionActual.id,
            preguntaIndex: preguntaActualIndex,
            respuestas: respuestasServidor,
            updatedAt: Date.now()
          })
        );
      } catch {}
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

  irAPregunta: (index: number) => {
    const { preguntasActuales } = get();
    if (index >= 0 && index < preguntasActuales.length) {
      set({ preguntaActualIndex: index });
    }
  },

  pausarSimulacion: () => {
    const state = get();
    // Persistir estado mínimo para reanudar
    try {
      localStorage.setItem(
        'simulacion-pausa',
        JSON.stringify({
          sesionId: state.sesionActual?.id,
          preguntaIndex: state.preguntaActualIndex,
          timestamp: Date.now(),
        })
      );
    } catch {}
    set({ pausada: true });
  },

  reanudarSimulacion: () => {
    try {
      const raw = localStorage.getItem('simulacion-pausa');
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data?.preguntaIndex === 'number') {
          set({ preguntaActualIndex: data.preguntaIndex });
        }
      }
      localStorage.removeItem('simulacion-pausa');
    } catch {}
    set({ pausada: false });
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
    error,
    pausada
  } = useSimulacionStore();

  return {
    sesionActual,
    preguntasActuales,
    respuestasActuales,
    preguntaActualIndex,
    sesionCompletada,
    loading,
    error,
    pausada
  };
};

export const useSimulacionAcciones = () => {
  const {
    iniciarSesion,
    cargarSesionExistente,
    finalizarSesion,
    responderPregunta,
    siguientePregunta,
    anteriorPregunta,
    irAPregunta,
    pausarSimulacion,
    reanudarSimulacion,
    limpiarSimulacion,
    setError
  } = useSimulacionStore();

  return {
    iniciarSesion,
    cargarSesionExistente,
    finalizarSesion,
    responderPregunta,
    siguientePregunta,
    anteriorPregunta,
    irAPregunta,
    pausarSimulacion,
    reanudarSimulacion,
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