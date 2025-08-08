import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useSimulacionEstado, 
  useSimulacionAcciones, 
  useSimulacionEstadisticas 
} from '../../store/simulacion';
import { useNotifications, useAuth } from '../../store';
import { simulacionService } from '../../services/api';
import SeleccionPrueba from './SeleccionPrueba';
import BarraProgreso from './BarraProgreso';
import ConfirmacionSesionModal from '../ui/ConfirmacionSesionModal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SimulacionComponentProps {
  materiaId?: number;
  plantillaId?: number;
  cantidadPreguntas?: number;
}

const SimulacionComponent: React.FC<SimulacionComponentProps> = ({ 
  materiaId, 
  plantillaId, 
  cantidadPreguntas 
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  
  // Estado de la simulación
  const {
    sesionActual,
    preguntasActuales,
    respuestasActuales,
    preguntaActualIndex,
    sesionCompletada,
    loading,
    error
  } = useSimulacionEstado();
  
  // Acciones
  const {
    iniciarSesion,
    finalizarSesion,
    responderPregunta,
    siguientePregunta,
    anteriorPregunta,
    limpiarSimulacion,
    setError
  } = useSimulacionAcciones();
  
  // Estadísticas
  const {
    respuestasCorrectas,
    totalRespuestas,
    porcentajeAcierto
  } = useSimulacionEstadisticas();

  // Estado local
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<string | null>(null);
  const [mostrandoRetroalimentacion, setMostrandoRetroalimentacion] = useState(false);
  const [ultimaRespuesta, setUltimaRespuesta] = useState<any>(null);
  const [tiempoRestante, setTiempoRestante] = useState<number>(0);
  
  // Estado para modal de confirmación de sesión
  const [mostrarModalSesion, setMostrarModalSesion] = useState(false);
  const [sesionActivaDetalle, setSesionActivaDetalle] = useState<any>(null);
  const [accionPendiente, setAccionPendiente] = useState<{materia: number; cantidad_preguntas?: number; plantilla?: number} | null>(null);

  // Obtener materia ID y plantilla ID de params si no se pasan como props
  const materiaIdFinal = materiaId || parseInt(params.materiaId || '1');
  const plantillaIdFinal = plantillaId || parseInt(params.plantillaId || '0');

  // Pregunta actual
  const preguntaActual = preguntasActuales[preguntaActualIndex];
  
  // Verificar si la pregunta actual ya fue respondida
  const preguntaYaRespondida = preguntaActual ? respuestasActuales.some(
    resp => resp.pregunta === preguntaActual.id
  ) : false;

  // Inicializar la simulación al cargar el componente
  useEffect(() => {
    if (!sesionActual && !loading && materiaIdFinal) {
      handleIniciarSimulacion();
    }

    return () => {
      // Limpiar errores al desmontar
      setError(null);
    };
  }, [materiaIdFinal]);

  // Manejar errores
  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Error en simulación',
        message: error,
        duration: 5000
      });
    }
  }, [error]);

  // Controlar tiempo restante
  useEffect(() => {
    if (preguntaActual && !mostrandoRetroalimentacion) {
      setTiempoRestante(preguntaActual.tiempo_estimado);
      const timer = setInterval(() => {
        setTiempoRestante(prev => {
          if (prev <= 0) {
            clearInterval(timer);
            setMostrandoRetroalimentacion(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [preguntaActual, mostrandoRetroalimentacion]);

  const handleIniciarSimulacion = async (forzarReinicio = false) => {
    try {
      // Verificar si hay sesión activa para esta materia específica
      if (!forzarReinicio) {
        const verificacion = await simulacionService.verificarSesionActiva(materiaIdFinal);
        if (verificacion.tiene_sesion_activa && verificacion.sesion) {
          // Mostrar modal de confirmación para esta materia específica
          setSesionActivaDetalle(verificacion.sesion);
          setAccionPendiente({ 
            materia: materiaIdFinal, 
            cantidad_preguntas: cantidadPreguntas,
            plantilla: plantillaIdFinal
          });
          setMostrarModalSesion(true);
          return;
        }
      }

      await iniciarSesion({
        materia: materiaIdFinal,
        plantilla: plantillaIdFinal,
        cantidad_preguntas: cantidadPreguntas,
        forzar_reinicio: forzarReinicio
      });
      
      addNotification({
        type: 'success',
        title: 'Simulación iniciada',
        message: '¡Comencemos! Lee cada pregunta cuidadosamente.',
        duration: 3000
      });
    } catch (error) {
      console.error('Error al iniciar simulación:', error);
      
      addNotification({
        type: 'error',
        title: 'Error al iniciar',
        message: 'No se pudo iniciar la simulación. Intenta nuevamente.',
        duration: 5000
      });
    }
  };

  // Handlers para el modal de sesión activa
  const handleContinuarSesionActiva = () => {
    if (sesionActivaDetalle) {
      navigate(`/simulacion/activa/${sesionActivaDetalle.id}`);
    }
    setMostrarModalSesion(false);
  };

  const handleReiniciarSesion = async () => {
    setMostrarModalSesion(false);
    if (accionPendiente) {
      try {
        await iniciarSesion({
          materia: accionPendiente.materia,
          cantidad_preguntas: accionPendiente.cantidad_preguntas,
          forzar_reinicio: true
        });
        
        addNotification({
          type: 'success',
          title: 'Nueva simulación iniciada',
          message: '¡Simulación reiniciada! Comenzemos desde el inicio.',
          duration: 3000
        });
      } catch (error) {
        console.error('Error al reiniciar simulación:', error);
        addNotification({
          type: 'error',
          title: 'Error al reiniciar',
          message: 'No se pudo reiniciar la simulación. Intenta nuevamente.',
          duration: 5000
        });
      }
    }
  };

  const handleCerrarModalSesion = () => {
    setMostrarModalSesion(false);
    setSesionActivaDetalle(null);
    setAccionPendiente(null);
  };

  const handleResponderPregunta = async (respuesta: 'A' | 'B' | 'C' | 'D') => {
    if (preguntaYaRespondida) {
      return;
    }

    setRespuestaSeleccionada(respuesta);

    try {
      await responderPregunta(respuesta);
      
      // Simular retroalimentación (en el backend real esto vendría de la API)
      const esCorrecta = preguntaActual?.respuesta_correcta === respuesta;
      setUltimaRespuesta({
        es_correcta: esCorrecta,
        respuesta_correcta: preguntaActual?.respuesta_correcta,
        retroalimentacion: preguntaActual?.retroalimentacion || 'Respuesta procesada.'
      });
      setMostrandoRetroalimentacion(true);

    } catch (error) {
      console.error('Error al responder pregunta:', error);
      setRespuestaSeleccionada(null);
    }
  };

  const handleSiguientePregunta = () => {
    setRespuestaSeleccionada(null);
    setMostrandoRetroalimentacion(false);
    setUltimaRespuesta(null);
    
    // Si es la última pregunta, finalizar simulación
    if (preguntaActualIndex === preguntasActuales.length - 1) {
      handleFinalizarSimulacion();
    } else {
      siguientePregunta();
    }
  };

  const handleFinalizarSimulacion = async () => {
    try {
      await finalizarSesion();
      addNotification({
        type: 'success',
        title: 'Simulación completada',
        message: '¡Felicitaciones! Revisa tus resultados.',
        duration: 5000
      });
      
      // Navegar a resultados
      navigate(`/simulacion/resultados/${sesionActual?.id}`);
    } catch (error) {
      console.error('Error al finalizar simulación:', error);
    }
  };

  const handleVolverAlDashboard = () => {
    limpiarSimulacion();
    navigate('/dashboard');
  };

  // Componente de loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Preparando tu simulación...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !sesionActual) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card 
          title="Error en la simulación"
          className="border-red-200"
        >
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-x-4">
              <Button 
                variant="primary"
                onClick={handleIniciarSimulacion}
              >
                Intentar de nuevo
              </Button>
              <Button 
                variant="outline"
                onClick={handleVolverAlDashboard}
              >
                Volver al dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Sin sesión activa
  if (!sesionActual || preguntasActuales.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <SeleccionPrueba 
          onSeleccionarPrueba={async (params) => {
            try {
              await iniciarSesion(params);
              addNotification({
                type: 'success',
                title: 'Simulación iniciada',
                message: '¡Comencemos! Lee cada pregunta cuidadosamente.',
                duration: 3000
              });
            } catch (error) {
              console.error('Error al iniciar simulación:', error);
            }
          }}
          isDocente={user?.rol === 'docente'}
        />
      </div>
    );
  }

  // Sesión completada
  if (sesionCompletada) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card title="¡Simulación Completada!">
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {Math.round(porcentajeAcierto)}%
              </div>
              <p className="text-gray-600">
                {respuestasCorrectas} de {totalRespuestas} respuestas correctas
              </p>
            </div>
            
            <div className="space-x-4">
              <Button 
                variant="primary"
                onClick={() => navigate(`/simulacion/resultados/${sesionActual.id}`)}
              >
                Ver Resultados Detallados
              </Button>
              <Button 
                variant="outline"
                onClick={handleVolverAlDashboard}
              >
                Volver al Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Simulación en progreso
  return (
    <>
      {/* Modal de confirmación de sesión activa */}
      <ConfirmacionSesionModal
        isOpen={mostrarModalSesion}
        sesion={sesionActivaDetalle}
        onContinuar={handleContinuarSesionActiva}
        onReiniciar={handleReiniciarSesion}
        onCerrar={handleCerrarModalSesion}
      />

    <div className="max-w-4xl mx-auto p-6">
      {/* Header con progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Simulación - {sesionActual.materia_nombre}
          </h1>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleVolverAlDashboard}
          >
            Salir
          </Button>
        </div>
        
        {/* Barra de progreso */}
        <BarraProgreso className="mb-4" />
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>Pregunta {preguntaActualIndex + 1} de {preguntasActuales.length}</span>
          <span>Tiempo restante: {tiempoRestante} segundos</span>
        </div>
      </div>

      {/* Pregunta actual */}
      {preguntaActual && (
        <Card className="mb-6">
          {/* Contexto si existe */}
          {preguntaActual.contexto && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <p className="text-gray-700 leading-relaxed">
                {preguntaActual.contexto}
              </p>
            </div>
          )}

          {/* Imagen de contexto */}
          {preguntaActual.imagen_url && (
            <div className="mb-4">
              <div className="flex justify-center">
                <img
                  src={preguntaActual.imagen_url}
                  alt="Imagen de contexto de la pregunta"
                  className="max-w-full max-h-80 rounded-lg shadow-lg border border-gray-200"
                  style={{ objectFit: 'contain' }}
                  onClick={() => {
                    // Abrir imagen en nueva ventana para vista completa
                    window.open(preguntaActual.imagen_url, '_blank');
                  }}
                  onError={(e) => {
                    // Ocultar imagen si no se puede cargar
                    (e.target as HTMLImageElement).style.display = 'none';
                    console.error('Error cargando imagen:', preguntaActual.imagen_url);
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Haz clic en la imagen para verla en tamaño completo
              </p>
            </div>
          )}

          {/* Enunciado */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 leading-relaxed">
              {preguntaActual.enunciado}
            </h2>
          </div>

          {/* Opciones */}
          <div className="space-y-3 mb-6">
            {Object.entries(preguntaActual.opciones || {}).map(([key, value]) => {
              const isSelected = respuestaSeleccionada === key;
              const isCorrect = mostrandoRetroalimentacion && ultimaRespuesta?.respuesta_correcta === key;
              const isIncorrect = mostrandoRetroalimentacion && isSelected && !ultimaRespuesta?.es_correcta;
              const isDisabled = preguntaYaRespondida || mostrandoRetroalimentacion;

              return (
                <button
                  key={key}
                  onClick={() => !isDisabled && handleResponderPregunta(key as 'A' | 'B' | 'C' | 'D')}
                  disabled={isDisabled}
                  className={`
                    w-full p-4 text-left border-2 rounded-lg transition-all duration-200
                    ${isCorrect ? 'border-green-500 bg-green-50' : ''}
                    ${isIncorrect ? 'border-red-500 bg-red-50' : ''}
                    ${isSelected && !mostrandoRetroalimentacion ? 'border-primary-500 bg-primary-50' : ''}
                    ${!isSelected && !isCorrect && !isIncorrect ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50' : ''}
                    ${isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <span className={`
                      flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium
                      ${isCorrect ? 'bg-green-500 text-white' : ''}
                      ${isIncorrect ? 'bg-red-500 text-white' : ''}
                      ${isSelected && !mostrandoRetroalimentacion ? 'bg-primary-500 text-white' : ''}
                      ${!isSelected && !isCorrect && !isIncorrect ? 'bg-gray-200 text-gray-600' : ''}
                    `}>
                      {key}
                    </span>
                    <span className="flex-1 text-gray-900">
                      {value as string}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Retroalimentación */}
          {mostrandoRetroalimentacion && ultimaRespuesta && (
            <div className={`
              p-4 rounded-lg mb-6
              ${ultimaRespuesta.es_correcta ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
            `}>
              <div className="flex items-start space-x-3">
                <div className={`
                  flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold
                  ${ultimaRespuesta.es_correcta ? 'bg-green-500' : 'bg-red-500'}
                `}>
                  {ultimaRespuesta.es_correcta ? '✓' : '✗'}
                </div>
                <div className="flex-1">
                  <p className={`font-medium mb-2 ${ultimaRespuesta.es_correcta ? 'text-green-800' : 'text-red-800'}`}>
                    {ultimaRespuesta.es_correcta ? '¡Correcto!' : `Incorrecto. La respuesta correcta es ${ultimaRespuesta.respuesta_correcta}.`}
                  </p>
                  <p className="text-gray-700 text-sm">
                    {ultimaRespuesta.retroalimentacion}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setMostrandoRetroalimentacion(false);
                anteriorPregunta();
              }}
              disabled={preguntaActualIndex === 0}
            >
              Anterior
            </Button>

            <div className="space-x-4">
              {mostrandoRetroalimentacion ? (
                <Button
                  variant="primary"
                  onClick={handleSiguientePregunta}
                >
                  {preguntaActualIndex === preguntasActuales.length - 1 ? 'Finalizar' : 'Siguiente'}
                </Button>
              ) : preguntaYaRespondida ? (
                <Button
                  variant="primary"
                  onClick={handleSiguientePregunta}
                >
                  {preguntaActualIndex === preguntasActuales.length - 1 ? 'Finalizar' : 'Siguiente'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setMostrandoRetroalimentacion(true)}
                  disabled={!respuestaSeleccionada}
                >
                  Ver Respuesta
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
    </>
  );
};

export default SimulacionComponent;