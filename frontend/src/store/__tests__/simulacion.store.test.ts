import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSimulacionAcciones, useSimulacionEstado } from '../simulacion';

vi.mock('../../services/api', () => ({
  simulacionService: {
    crearSesion: vi.fn(async () => ({
      id: 1,
      preguntas_sesion: [
        { pregunta: { id: 10, tiempo_estimado: 30 } },
        { pregunta: { id: 11, tiempo_estimado: 25 } },
      ],
    })),
    responderPregunta: vi.fn(async () => ({
      preguntas_sesion: [
        { pregunta: { id: 10 }, respuesta_estudiante: 'A', es_correcta: true, tiempo_respuesta: 30 },
      ],
    })),
    cargarSesionActiva: vi.fn(async () => ({
      id: 1,
      preguntas_sesion: [{ id: 1 }, { id: 2 }],
      respuestas_existentes: [],
      siguiente_pregunta_index: 0,
      completada: false,
      progreso: { porcentaje: 0 },
    })),
  }
}));

describe('store/simulacion', () => {
  beforeEach(() => {
    // resetear localStorage mock
    (window.localStorage.setItem as unknown as { mockClear?: () => void }).mockClear?.();
  });

  it('inicia sesión y carga preguntas', async () => {
    const { iniciarSesion } = useSimulacionAcciones();
    await iniciarSesion({ materia: 1, cantidad_preguntas: 2 });
    const { preguntasActuales } = useSimulacionEstado();
    expect(preguntasActuales.length).toBe(2);
  });

  it('responde pregunta y actualiza estadísticas', async () => {
    const { iniciarSesion, responderPregunta } = useSimulacionAcciones();
    await iniciarSesion({ materia: 1, cantidad_preguntas: 2 });
    await responderPregunta('A');
    const { totalRespuestas, respuestasCorrectas } = useSimulacionEstado();
    expect(totalRespuestas).toBe(1);
    expect(respuestasCorrectas).toBe(1);
  });

  it('pausar y reanudar persisten índice', async () => {
    const { pausarSimulacion, reanudarSimulacion, siguientePregunta } = useSimulacionAcciones();
    const estado1 = useSimulacionEstado();
    // simular avance
    siguientePregunta();
    pausarSimulacion();
    reanudarSimulacion();
    const estado2 = useSimulacionEstado();
    expect(estado2.preguntaActualIndex).toBe(estado1.preguntaActualIndex);
  });
});


