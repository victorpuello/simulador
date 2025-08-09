import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useSimulacionEstado, 
  useSimulacionAcciones, 
  useSimulacionEstadisticas 
} from '../../store/simulacion';
import { useNotifications } from '../../store';
import BarraProgreso from './BarraProgreso';
import RetroalimentacionSimple from './RetroalimentacionSimple';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ImageModal from '../ui/ImageModal';
import LoadingSpinner from '../ui/LoadingSpinner';
import ConfirmDialog from '../ui/ConfirmDialog';
import IndicePreguntasModal from './IndicePreguntasModal';

const SimulacionActiva: React.FC = () => {
  const navigate = useNavigate();
  const { sesionId } = useParams<{ sesionId: string }>();
  const { addNotification } = useNotifications();
  
  // Estado de la simulación
  const {
    sesionActual,
    preguntasActuales,
    respuestasActuales,
    preguntaActualIndex,
    loading,
    error,
    pausada,
  } = useSimulacionEstado();
  
  // Acciones
  const {
    cargarSesionExistente,
    finalizarSesion,
    responderPregunta,
    siguientePregunta,
    anteriorPregunta,
    irAPregunta,
    pausarSimulacion,
    reanudarSimulacion,
    limpiarSimulacion
  } = useSimulacionAcciones();
  
  // Estadísticas
  const { respuestasCorrectas, totalRespuestas } = useSimulacionEstadisticas();

  // Estado local
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<string | null>(null);
  const [mostrandoRetroalimentacion, setMostrandoRetroalimentacion] = useState(false);
  const [retroInmediata, setRetroInmediata] = useState<boolean>(
    () => localStorage.getItem('simulacion-retro-inmediata') === 'true'
  );
  const [ultimaRespuesta, setUltimaRespuesta] = useState<{
    seleccionada: string;
    correcta: string | undefined;
    esCorrecta: boolean;
    retroalimentacion?: unknown;
    retroalimentacionPlano?: string;
    explicacionGeneral?: string;
    explicacionIncorrectas?: unknown;
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tiempoRestante, setTiempoRestante] = useState<number>(0);
  const [mostrarConfirmSalir, setMostrarConfirmSalir] = useState(false);
  const [mostrarImagen, setMostrarImagen] = useState(false);
  const [mostrarIndice, setMostrarIndice] = useState(false);

  // Pregunta actual
  const preguntaActual = preguntasActuales[preguntaActualIndex];
  
  // Verificar si la pregunta actual ya fue respondida
  const preguntaYaRespondida = preguntaActual ? respuestasActuales.some(
    resp => resp.pregunta === preguntaActual.id
  ) : false;

  // Cargar la sesión al montar el componente
  useEffect(() => {
    if (sesionId) {
      cargarSesionExistente(sesionId).then(() => {
        // Restaurar borrador local si existe para la pregunta actual
        try {
          const draftRaw = localStorage.getItem('simulacion-draft');
          if (draftRaw) {
            const draft = JSON.parse(draftRaw);
            if (
              draft?.sesionId === sesionId &&
              typeof draft?.preguntaId === 'number' &&
              typeof draft?.respuesta === 'string'
            ) {
              const p = preguntasActuales[preguntaActualIndex];
              if (p && p.id === draft.preguntaId && !respuestasActuales.some(r => r.pregunta === p.id)) {
                setRespuestaSeleccionada(draft.respuesta);
              }
            }
          }
         } catch { /* noop */ }
      }).catch((error) => {
        console.error('Error al cargar sesión:', error);
        addNotification({
          type: 'error',
          title: 'Error al cargar simulación',
          message: 'No se pudo cargar la simulación. Serás redirigido al inicio.',
          duration: 5000
        });
        navigate('/simulacion');
      });
    }
  }, [sesionId, cargarSesionExistente, navigate, addNotification]);

  // Temporizador para la pregunta actual
  useEffect(() => {
    if (preguntaActual && !mostrandoRetroalimentacion && !preguntaYaRespondida && !pausada) {
      setTiempoRestante(preguntaActual.tiempo_estimado || 60);
      
       const timer = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [preguntaActual, mostrandoRetroalimentacion, preguntaYaRespondida, pausada]);

  // (Opcional) Atajos de teclado desactivados para simplificar dependencias de hooks

  const handleResponder = async () => {
    if (!respuestaSeleccionada || !preguntaActual) return;

    try {
      await responderPregunta(respuestaSeleccionada);
      // Limpiar borrador de esa pregunta
      try {
        const draftRaw = localStorage.getItem('simulacion-draft');
        if (draftRaw) {
          const draft = JSON.parse(draftRaw);
          if (draft?.sesionId === sesionId && draft?.preguntaId === preguntaActual.id) {
            localStorage.removeItem('simulacion-draft');
          }
        }
          } catch { /* noop */ }
      
      // Mostrar retroalimentación
      setUltimaRespuesta({
        seleccionada: respuestaSeleccionada,
        correcta: preguntaActual.respuesta_correcta,
        esCorrecta: respuestaSeleccionada === preguntaActual.respuesta_correcta,
        retroalimentacion: preguntaActual.retroalimentacion_estructurada,
        retroalimentacionPlano: preguntaActual.retroalimentacion,
        explicacionGeneral: preguntaActual.explicacion,
        explicacionIncorrectas: preguntaActual.explicacion_opciones_incorrectas
      });
      if (retroInmediata) {
        setMostrandoRetroalimentacion(true);
      }
      
      addNotification({
        type: respuestaSeleccionada === preguntaActual.respuesta_correcta ? 'success' : 'warning',
        title: respuestaSeleccionada === preguntaActual.respuesta_correcta ? '¡Correcto!' : 'Incorrecto',
        message: respuestaSeleccionada === preguntaActual.respuesta_correcta 
          ? '¡Excelente respuesta!' 
          : 'No te preocupes, sigue practicando.',
        duration: 3000
      });
    } catch (error) {
      console.error('Error al responder pregunta:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo registrar la respuesta. Intenta nuevamente.',
        duration: 5000
      });
    }
  };

  const handleSiguientePregunta = () => {
    if (preguntaActualIndex < preguntasActuales.length - 1) {
      siguientePregunta();
      setRespuestaSeleccionada(null);
      setMostrandoRetroalimentacion(false);
      setUltimaRespuesta(null);
    } else {
      // Es la última pregunta, finalizar simulación
      handleFinalizarSimulacion();
    }
  };

  const handleAnteriorPregunta = () => {
    if (preguntaActualIndex > 0) {
      anteriorPregunta();
      setRespuestaSeleccionada(null);
      setMostrandoRetroalimentacion(false);
      setUltimaRespuesta(null);
    }
  };

  const handleFinalizarSimulacion = async () => {
    try {
      await finalizarSesion();
      
      addNotification({
        type: 'success',
        title: 'Simulación completada',
        message: `¡Felicitaciones! Obtuviste ${respuestasCorrectas} de ${totalRespuestas} respuestas correctas.`,
        duration: 5000
      });
      
      navigate(`/simulacion/resultados/${sesionActual?.id}`);
    } catch (error) {
      console.error('Error al finalizar simulación:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Hubo un problema al finalizar la simulación.',
        duration: 5000
      });
    }
  };

  const handleSalir = () => {
    setMostrarConfirmSalir(true);
  };

  const confirmarSalir = () => {
    setMostrarConfirmSalir(false);
    limpiarSimulacion();
    navigate('/simulacion');
  };

  const cancelarSalir = () => {
    setMostrarConfirmSalir(false);
  };

  // Mostrar loading mientras carga
  if (loading && !sesionActual) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Cargando simulación...</p>
        </Card>
      </div>
    );
  }

  // Mostrar error si no se pudo cargar
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar simulación</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            variant="primary"
            onClick={() => navigate('/simulacion')}
          >
            Volver a simulaciones
          </Button>
        </Card>
      </div>
    );
  }

  // Mostrar mensaje si no hay pregunta actual
  if (!preguntaActual || !sesionActual) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Simulación no encontrada</h2>
          <p className="text-gray-600 mb-4">No se pudo encontrar la simulación solicitada.</p>
          <Button
            variant="primary"
            onClick={() => navigate('/simulacion')}
          >
            Volver a simulaciones
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal confirmar salida */}
      <ConfirmDialog
        isOpen={mostrarConfirmSalir}
        title="¿Salir de la simulación?"
        message="¿Estás seguro de que quieres salir? Tu progreso se guardará automáticamente."
        confirmText="Salir"
        cancelText="Continuar"
        onConfirm={confirmarSalir}
        onCancel={cancelarSalir}
        type="warning"
      />
      {/* Header de la simulación */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {sesionActual.materia.nombre_display}
              </h1>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                Continuando simulación
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarIndice(true)}
              >
                Índice
              </Button>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={retroInmediata}
                  onChange={(e) => {
                    setRetroInmediata(e.target.checked);
                    try { localStorage.setItem('simulacion-retro-inmediata', String(e.target.checked)); } catch {}
                  }}
                />
                Retro. inmediata
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSalir}
              >
                Salir
              </Button>
            </div>
          </div>
          
            <BarraProgreso
              totalPreguntas={preguntasActuales.length}
              preguntaActual={preguntaActualIndex + 1}
              onSelectPregunta={(idx) => irAPregunta(idx)}
              pausada={pausada}
              onPausar={() => pausarSimulacion()}
              onReanudar={() => reanudarSimulacion()}
            />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
                 {mostrandoRetroalimentacion && ultimaRespuesta ? (
           // Mostrar retroalimentación
           <RetroalimentacionSimple
             esCorrecta={ultimaRespuesta.esCorrecta}
             respuestaSeleccionada={ultimaRespuesta.seleccionada}
             respuestaCorrecta={preguntaActual.respuesta_correcta || ''}
             opciones={preguntaActual.opciones}
              retroEstructurada={preguntaActual.retroalimentacion_estructurada as unknown as Record<string, unknown>}
              explicacionOpcionesIncorrectas={preguntaActual.explicacion_opciones_incorrectas as unknown as Record<string, unknown>}
             explicacionGeneral={ultimaRespuesta.explicacionGeneral}
             retroalimentacion={ultimaRespuesta.retroalimentacionPlano}
             onContinuar={handleSiguientePregunta}
           />
        ) : (
          // Mostrar pregunta
          <Card className="p-6">
            {/* Encabezado de la pregunta */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-gray-500">
                Pregunta {preguntaActualIndex + 1} de {preguntasActuales.length}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Dificultad:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  preguntaActual.dificultad === 'facil' ? 'bg-green-100 text-green-800' :
                  preguntaActual.dificultad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {preguntaActual.dificultad === 'facil' ? 'Fácil' :
                   preguntaActual.dificultad === 'media' ? 'Media' : 'Difícil'}
                </span>
              </div>
            </div>

            {/* Contexto si existe */}
            {preguntaActual.contexto && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-medium text-blue-900 mb-2">Contexto:</h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  {preguntaActual.contexto}
                </p>
              </div>
            )}

            {/* Imagen contextual si existe */}
            {preguntaActual.imagen_url && (
              <div className="mb-4">
                <img
                  src={preguntaActual.imagen_url}
                  alt="Imagen de contexto"
                  className="w-full max-h-72 object-contain rounded-lg border cursor-zoom-in"
                  onClick={() => setMostrarImagen(true)}
                />
                <div className="text-xs text-gray-500 mt-1">Haz clic para ampliar</div>
              </div>
            )}

            {/* Enunciado */}
            <h2 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
              {preguntaActual.enunciado}
            </h2>

            {/* Opciones */}
            <div className="space-y-3 mb-6">
              {Object.entries(preguntaActual.opciones).map(([opcion, texto]) => {
                const yaRespondida = respuestasActuales.find(r => r.pregunta === preguntaActual.id);
                const esRespuestaPrevia = yaRespondida?.respuesta === opcion;
                const esOpcionCorrecta = opcion === preguntaActual.respuesta_correcta;

                const clasesRespondida = esOpcionCorrecta
                  ? 'border-green-500 bg-green-50 text-green-900'
                  : esRespuestaPrevia
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-gray-200 bg-gray-50 text-gray-500';

                return (
                  <button
                    key={opcion}
                    onClick={() => {
                      if (!preguntaYaRespondida && !pausada) {
                        setRespuestaSeleccionada(opcion);
                        // Guardar borrador local de respuesta
                         try {
                          localStorage.setItem(
                            'simulacion-draft',
                            JSON.stringify({
                              sesionId,
                              preguntaId: preguntaActual.id,
                              respuesta: opcion,
                              savedAt: Date.now()
                            })
                          );
                         } catch { /* noop */ }
                      }
                    }}
                    disabled={preguntaYaRespondida || pausada}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      preguntaYaRespondida
                        ? clasesRespondida
                        : respuestaSeleccionada === opcion
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <span className="font-semibold text-lg mr-3">{opcion})</span>
                      <span className="flex-1">{texto}</span>
            {preguntaYaRespondida && (
              <span className="ml-2 text-lg">
                {esOpcionCorrecta ? '✅' : esRespuestaPrevia ? '❌' : ''}
              </span>
            )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Controles */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handleAnteriorPregunta}
                disabled={preguntaActualIndex === 0 || pausada}
              >
                ← Anterior
              </Button>

              <div className="flex space-x-3">
                {!preguntaYaRespondida ? (
                  <Button
                    variant="primary"
                    onClick={handleResponder}
                    disabled={!respuestaSeleccionada || loading || pausada}
                  >
                    {loading ? 'Guardando...' : 'Responder'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleSiguientePregunta}
                    disabled={pausada}
                  >
                    {preguntaActualIndex === preguntasActuales.length - 1 ? 'Finalizar' : 'Siguiente →'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
      {/* Overlay de Pausa */}
      {pausada && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center">
            <div className="text-5xl mb-4">⏸️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Simulación en pausa</h2>
            <p className="text-gray-600 mb-6">Tu progreso se mantiene. Cuando estés listo, reanuda para continuar.</p>
            <div className="flex justify-center">
              <Button variant="primary" onClick={reanudarSimulacion}>Reanudar</Button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de imagen ampliada (solo imagen) */}
      {preguntaActual.imagen_url && (
        <ImageModal
          isOpen={mostrarImagen}
          onClose={() => setMostrarImagen(false)}
          src={preguntaActual.imagen_url}
          alt="Imagen de contexto"
        />
      )}

      {/* Modal de índice de preguntas */}
      <IndicePreguntasModal
        isOpen={mostrarIndice}
        onClose={() => setMostrarIndice(false)}
        totalPreguntas={preguntasActuales.length}
        preguntaActualIndex={preguntaActualIndex}
         respuestasActuales={respuestasActuales as unknown as Array<{ pregunta: number; respuesta: string; es_correcta?: boolean }>} 
        preguntasIds={preguntasActuales.map(p => p.id)}
        onGoTo={(idx) => irAPregunta(idx)}
      />
    </div>
  );
};

export default SimulacionActiva;