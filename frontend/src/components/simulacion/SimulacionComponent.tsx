import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useSimulacionEstado, 
  useSimulacionAcciones, 
  useSimulacionEstadisticas 
} from '../../store/simulacion';
import { useNotifications } from '../../store';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SimulacionComponentProps {
  materiaId?: number;
}

const SimulacionComponent: React.FC<SimulacionComponentProps> = ({ materiaId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const { addNotification } = useNotifications();
  
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
    respuestasIncorrectas,
    totalRespuestas,
    porcentajeCompletado,
    porcentajeAcierto
  } = useSimulacionEstadisticas();

  // Estado local
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<string | null>(null);
  const [mostrandoRetroalimentacion, setMostrandoRetroalimentacion] = useState(false);
  const [ultimaRespuesta, setUltimaRespuesta] = useState<any>(null);

  // Obtener materia ID de params si no se pasa como prop
  const materiaIdFinal = materiaId || parseInt(params.materiaId || '1');

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

  const handleIniciarSimulacion = async () => {
    try {
      await iniciarSesion(materiaIdFinal, 10);
      addNotification({
        type: 'success',
        title: 'Simulación iniciada',
        message: '¡Comencemos! Lee cada pregunta cuidadosamente.',
        duration: 3000
      });
    } catch (error) {
      console.error('Error al iniciar simulación:', error);
    }
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
        <Card title="Iniciar Simulación">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-6">
              ¿Estás listo para comenzar tu práctica?
            </p>
            <Button 
              variant="primary"
              onClick={handleIniciarSimulacion}
              loading={loading}
            >
              Comenzar Simulación
            </Button>
          </div>
        </Card>
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
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${porcentajeCompletado}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>Pregunta {preguntaActualIndex + 1} de {preguntasActuales.length}</span>
          <span>{respuestasCorrectas} correctas • {respuestasIncorrectas} incorrectas</span>
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
  );
};

export default SimulacionComponent;