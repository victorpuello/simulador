import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import RetroalimentacionExhaustiva from '../components/simulacion/RetroalimentacionExhaustiva';
import ResultadosDetallados from '../components/simulacion/ResultadosDetallados';
import { randomizeQuestionOptions, randomizeQuestions } from '../utils/randomize';

interface Pregunta {
  id: number;
  enunciado: string;
  contexto?: string;
  opciones: Record<string, string>;
  respuesta_correcta: string;
  retroalimentacion: string;
  explicacion?: string;
  tiempo_estimado: number;
  materia_nombre?: string;
}

interface Sesion {
  id: number;
  materia_nombre: string;
  fecha_inicio: string;
  modo: string;
}

const SimulacionPage: React.FC = () => {
  const { materiaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [preguntasAleatorizadas, setPreguntasAleatorizadas] = useState<Pregunta[]>([]);
  const [mapeoOpciones, setMapeoOpciones] = useState<Record<number, Record<string, string>>>({});
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<string>('');
  const [respuestas, setRespuestas] = useState<any[]>([]);
  const [tiempoInicio, setTiempoInicio] = useState<Date | null>(null);
  const [simulacionCompletada, setSimulacionCompletada] = useState(false);
  
  // Ref para controlar peticiones duplicadas
  const simulacionIniciandose = useRef(false);

  const iniciarSimulacion = async () => {
    // Prevenir ejecuciones múltiples simultáneas
    if (loading || simulacionIniciandose.current) {
      console.log('Simulación ya en proceso, ignorando petición duplicada');
      return;
    }
    
    // Marcar que estamos iniciando una simulación
    simulacionIniciandose.current = true;
    setLoading(true);
    setError(null);
    setSimulacionCompletada(false);
    setRespuestas([]);
    setPreguntaActual(0);
    setRespuestaSeleccionada('');
    setMostrarRetroalimentacion(false);
    setRetroalimentacionActual(null);
    
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Necesitas estar autenticado. Por favor, inicia sesión nuevamente.');
      }

      const requestBody = {
        materia_id: parseInt(materiaId || '1'),
        cantidad_preguntas: 10
      };

      const response = await fetch('/api/simulacion/sesiones/iniciar_sesion/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

                   if (!response.ok) {
               const errorText = await response.text();
               if (response.status === 503) {
                 throw new Error('El servidor está temporalmente ocupado. Por favor, inténtalo de nuevo en unos segundos.');
               }
               throw new Error(`Error ${response.status}: ${errorText || 'Error al iniciar la simulación'}`);
             }

      const data = await response.json();
      
      if (!data.sesion || !data.preguntas || data.preguntas.length === 0) {
        throw new Error('No se recibieron datos válidos de la simulación');
      }
      
      setSesion(data.sesion);
      // Agregar nombre de materia a cada pregunta
      const preguntasConMateria = data.preguntas.map((pregunta: any) => ({
        ...pregunta,
        materia_nombre: data.sesion.materia_nombre
      }));
      setPreguntas(preguntasConMateria);
      
      // 🎲 Aleatorizar orden de preguntas
      const preguntasAleatorias = randomizeQuestions(preguntasConMateria, data.sesion.id);
      
      // 🎲 Aleatorizar opciones de cada pregunta
      const mapeoGenerado: Record<number, Record<string, string>> = {};
      const preguntasConOpcionesAleatorias = preguntasAleatorias.map(pregunta => {
        const { opciones, respuestaCorrecta, mapeo } = randomizeQuestionOptions(
          pregunta.opciones,
          pregunta.respuesta_correcta,
          pregunta.id,
          data.sesion.id
        );
        
        // Guardar mapeo para conversión de respuestas
        mapeoGenerado[pregunta.id] = mapeo;
        
        return {
          ...pregunta,
          opciones,
          respuesta_correcta: respuestaCorrecta
        };
      });
      
      setPreguntasAleatorizadas(preguntasConOpcionesAleatorias);
      setMapeoOpciones(mapeoGenerado);
      setTiempoInicio(new Date());
      
    } catch (error: any) {
      setError(error.message || 'Error desconocido al iniciar la simulación');
    } finally {
      // Resetear flags de control
      simulacionIniciandose.current = false;
      setLoading(false);
    }
  };

  const [mostrarRetroalimentacion, setMostrarRetroalimentacion] = useState(false);
  const [retroalimentacionActual, setRetroalimentacionActual] = useState<{
    esCorrecta: boolean;
    explicacion: string;
    respuestaCorrecta: string;
    habilidadEvaluada?: string;
    estrategiasResolucion?: string;
    erroresComunes?: string;
    explicacionOpcionesIncorrectas?: Record<string, string>;
    respuestaSeleccionada?: string;
  } | null>(null);

  const responderPregunta = async () => {
    if (!respuestaSeleccionada) {
      alert('Por favor selecciona una respuesta');
      return;
    }

    const tiempoRespuesta = tiempoInicio ? 
      Math.floor((new Date().getTime() - tiempoInicio.getTime()) / 1000) : 0;

    // Usar preguntas aleatorizadas
    const preguntaActualObj = preguntasAleatorizadas[preguntaActual];
    const esCorrecta = respuestaSeleccionada === preguntaActualObj.respuesta_correcta;

    // Convertir respuesta aleatorizada de vuelta al formato original para el backend
    const mapeoInverso = Object.fromEntries(
      Object.entries(mapeoOpciones[preguntaActualObj.id] || {}).map(([orig, nuevo]) => [nuevo, orig])
    );
    const respuestaOriginal = mapeoInverso[respuestaSeleccionada] || respuestaSeleccionada;

    const nuevaRespuesta = {
      pregunta_id: preguntaActualObj.id,
      respuesta_seleccionada: respuestaSeleccionada, // Para la UI usamos la aleatorizada
      respuesta_original: respuestaOriginal, // Para el backend usamos la original
      tiempo_respuesta: tiempoRespuesta,
      es_correcta: esCorrecta
    };

    setRespuestas(prevRespuestas => [...prevRespuestas, nuevaRespuesta]);

    // Mostrar retroalimentación
    setRetroalimentacionActual({
      esCorrecta,
      explicacion: preguntaActualObj.retroalimentacion || preguntaActualObj.explicacion || '',
      respuestaCorrecta: preguntaActualObj.respuesta_correcta
    });
    setMostrarRetroalimentacion(true);

    // Enviar respuesta al backend y obtener retroalimentación exhaustiva
    try {
      const token = localStorage.getItem('access_token');
      if (token && sesion) {
        const response = await fetch(`/api/simulacion/sesiones/${sesion.id}/responder_pregunta/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            pregunta_id: preguntaActualObj.id,
            respuesta_seleccionada: respuestaOriginal, // ✅ Enviar respuesta original al backend
            tiempo_respuesta: tiempoRespuesta
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Actualizar retroalimentación con datos exhaustivos del backend
          if (data.pregunta) {
            setRetroalimentacionActual(prev => ({
              esCorrecta: data.es_correcta, // ✅ Usar evaluación del backend
              explicacion: data.pregunta.retroalimentacion || prev?.explicacion || '',
              respuestaCorrecta: data.pregunta.respuesta_correcta,
              habilidadEvaluada: data.pregunta.habilidad_evaluada || '',
              estrategiasResolucion: data.pregunta.estrategias_resolucion || '',
              erroresComunes: data.pregunta.errores_comunes || '',
              explicacionOpcionesIncorrectas: data.pregunta.explicacion_opciones_incorrectas || {},
              respuestaSeleccionada: respuestaSeleccionada
            }));
          }
        }
      }
    } catch (error) {
      // Error silencioso - la simulación continúa funcionando
    }
  };

  const continuarSiguientePregunta = () => {
    setMostrarRetroalimentacion(false);
    setRetroalimentacionActual(null);
    setRespuestaSeleccionada('');

    if (preguntaActual < preguntasAleatorizadas.length - 1) {
      setPreguntaActual(preguntaActual + 1);
      setTiempoInicio(new Date());
    } else {
      finalizarSimulacion();
    }
  };

  const finalizarSimulacion = async () => {
    // Obtener las respuestas reales del backend para asegurar precisión
    try {
      const token = localStorage.getItem('access_token');
      if (token && sesion) {
        const response = await fetch(`/api/simulacion/sesiones/${sesion.id}/finalizar_sesion/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Usar las respuestas del backend que son la fuente de verdad
          if (data.respuestas && Array.isArray(data.respuestas)) {
            setRespuestas(data.respuestas);
          }
        }
      }
    } catch (error) {
      console.error('Error al finalizar simulación:', error);
    }
    
    setSimulacionCompletada(true);
  };

  const volverAlDashboard = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    // Prevenir peticiones duplicadas con protección robusta
    if (!loading && !sesion && !simulacionIniciandose.current) {
      iniciarSimulacion();
    }
  }, [materiaId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card title="Cargando simulación...">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Preparando tu simulación...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card title="Error">
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <p className="font-medium">{error}</p>
            </div>
            <div className="space-x-4">
              <Button variant="primary" onClick={iniciarSimulacion}>
                Intentar de nuevo
              </Button>
              <Button variant="outline" onClick={volverAlDashboard}>
                Volver al dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (simulacionCompletada) {
    return (
      <ResultadosDetallados
        preguntas={preguntasAleatorizadas}
        respuestas={respuestas}
        onNuevaSimulacion={iniciarSimulacion}
        onVolverDashboard={volverAlDashboard}
      />
    );
  }

  if (!sesion || preguntasAleatorizadas.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card title="Sin datos">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No se pudieron cargar los datos de simulación.</p>
            <div className="space-x-4">
              <Button variant="primary" onClick={iniciarSimulacion}>
                Reintentar
              </Button>
              <Button variant="outline" onClick={volverAlDashboard}>
                Volver al dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const pregunta = preguntasAleatorizadas[preguntaActual];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {sesion.materia_nombre}
          </h1>
          <Button variant="outline" size="sm" onClick={volverAlDashboard}>
            Salir
          </Button>
        </div>
        
        {/* Progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((preguntaActual + 1) / preguntasAleatorizadas.length) * 100}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>Pregunta {preguntaActual + 1} de {preguntasAleatorizadas.length}</span>
          <span>{user?.first_name} {user?.last_name}</span>
        </div>
      </div>

      {/* Pregunta */}
      <Card>
        {/* Contexto */}
        {pregunta.contexto && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <p className="text-gray-700">{pregunta.contexto}</p>
          </div>
        )}

        {/* Enunciado */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {pregunta.enunciado}
          </h2>
        </div>

        {/* Opciones */}
        <div className="space-y-3 mb-6">
          {Object.entries(pregunta.opciones || {}).map(([key, value]) => (
            <button
              key={key}
              className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                respuestaSeleccionada === key
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              }`}
              onClick={() => setRespuestaSeleccionada(key)}
            >
              <div className="flex items-start space-x-3">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                  respuestaSeleccionada === key
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {key}
                </span>
                <span className="flex-1 text-gray-900">{value as string}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Navegación */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setPreguntaActual(Math.max(0, preguntaActual - 1))}
            disabled={preguntaActual === 0 || mostrarRetroalimentacion}
          >
            Anterior
          </Button>

          <Button
            variant="primary"
            onClick={responderPregunta}
            disabled={!respuestaSeleccionada || mostrarRetroalimentacion}
          >
            {preguntaActual === preguntasAleatorizadas.length - 1 ? 'Finalizar' : 'Responder'}
          </Button>
        </div>
      </Card>

      {/* Modal de Retroalimentación Exhaustiva */}
      {mostrarRetroalimentacion && retroalimentacionActual && (
        <RetroalimentacionExhaustiva
          retroalimentacion={retroalimentacionActual}
          opciones={preguntasAleatorizadas[preguntaActual]?.opciones || {}}
          onContinuar={continuarSiguientePregunta}
        />
      )}
    </div>
  );
};

export default SimulacionPage;