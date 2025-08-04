import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { simulacionService } from '../services/api';
import { useNotifications } from '../store';

interface Pregunta {
  id: number;
  enunciado: string;
  opciones: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  respuesta_correcta: string;
  materia_nombre: string;
}

interface Respuesta {
  pregunta_id: number;
  respuesta_seleccionada: string;
  es_correcta: boolean;
  tiempo_respuesta: number;
}

interface Sesion {
  id: number;
  materia: {
    id: number;
    nombre_display: string;
  };
  fecha_inicio: string;
  fecha_fin: string;
  puntuacion: number;
  preguntas_sesion: Array<{
    id: number;
    pregunta: Pregunta;
    respuesta_estudiante: string;
    es_correcta: boolean;
    tiempo_respuesta: number;
  }>;
}

const ResultadosDetalladosPage: React.FC = () => {
  const { sesionId } = useParams<{ sesionId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [mostrarSolo, setMostrarSolo] = useState<'todas' | 'correctas' | 'incorrectas'>('todas');

  useEffect(() => {
    if (sesionId) {
      cargarResultados();
    }
  }, [sesionId]);

  const cargarResultados = async () => {
    try {
      setLoading(true);
      const sesionData = await simulacionService.getSesion(sesionId!);
      setSesion(sesionData);
    } catch (error) {
      console.error('Error al cargar resultados:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los resultados de la simulación',
        duration: 5000,
      });
      navigate('/simulacion');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Cargando resultados...
          </h3>
        </div>
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Sesión no encontrada
          </h3>
          <button
            onClick={() => navigate('/simulacion')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const preguntas = sesion.preguntas_sesion.map(ps => ps.pregunta);
  const respuestas = sesion.preguntas_sesion.map(ps => ({
    pregunta_id: ps.pregunta.id,
    respuesta_seleccionada: ps.respuesta_estudiante,
    es_correcta: ps.es_correcta,
    tiempo_respuesta: ps.tiempo_respuesta
  }));

  const correctas = respuestas.filter(r => r.es_correcta).length;
  const puntaje = Math.round((correctas / preguntas.length) * 100);

  // Combinar preguntas con respuestas
  const resultados = preguntas.map(pregunta => {
    const respuesta = respuestas.find(r => r.pregunta_id === pregunta.id);
    return {
      pregunta,
      respuesta
    };
  });

  // Filtrar según la opción seleccionada
  const resultadosFiltrados = resultados.filter(({ respuesta }) => {
    if (mostrarSolo === 'correctas') return respuesta?.es_correcta === true;
    if (mostrarSolo === 'incorrectas') return respuesta?.es_correcta === false;
    return true;
  });

  const toggleExpandir = (preguntaId: number) => {
    setExpandido(expandido === preguntaId ? null : preguntaId);
  };

  const handleNuevaSimulacion = () => {
    navigate('/simulacion');
  };

  const handleVolverDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Resumen de resultados */}
        <Card className="mb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              ¡Simulación completada!
            </h1>
            <div className="text-4xl sm:text-6xl font-bold text-blue-600 mb-2">
              {puntaje}%
            </div>
            <p className="text-lg sm:text-xl text-gray-600">Tu puntuación</p>
            <p className="text-sm text-gray-500 mt-2">
              {sesion.materia.nombre_display} • {new Date(sesion.fecha_fin).toLocaleDateString()}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="font-medium text-gray-900">Respondidas</p>
              <p className="text-2xl font-bold text-gray-600">{preguntas.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="font-medium text-green-900">Correctas</p>
              <p className="text-2xl font-bold text-green-600">{correctas}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="font-medium text-red-900">Incorrectas</p>
              <p className="text-2xl font-bold text-red-600">{preguntas.length - correctas}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleNuevaSimulacion}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Nueva simulación
            </button>
            <button
              onClick={handleVolverDashboard}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Volver al dashboard
            </button>
          </div>
        </Card>

        {/* Filtros */}
        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium text-gray-700">Mostrar:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setMostrarSolo('todas')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  mostrarSolo === 'todas'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Todas ({preguntas.length})
              </button>
              <button
                onClick={() => setMostrarSolo('correctas')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  mostrarSolo === 'correctas'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Correctas ({correctas})
              </button>
              <button
                onClick={() => setMostrarSolo('incorrectas')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  mostrarSolo === 'incorrectas'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Incorrectas ({preguntas.length - correctas})
              </button>
            </div>
          </div>
        </Card>

        {/* Lista de preguntas */}
        <div className="space-y-4">
          {resultadosFiltrados.map(({ pregunta, respuesta }, index) => (
            <Card
              key={pregunta.id}
              className={`border-l-4 ${
                respuesta?.es_correcta 
                  ? 'border-green-500' 
                  : 'border-red-500'
              }`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpandir(pregunta.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {respuesta?.es_correcta ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-500">
                        Pregunta {index + 1} • {pregunta.materia_nombre}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      {pregunta.enunciado}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                      <span className={`font-medium ${
                        respuesta?.es_correcta ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Tu respuesta: {respuesta?.respuesta_seleccionada}
                      </span>
                      {!respuesta?.es_correcta && (
                        <span className="text-green-600 font-medium">
                          Correcta: {pregunta.respuesta_correcta}
                        </span>
                      )}
                      <span className="text-gray-500">
                        Tiempo: {respuesta?.tiempo_respuesta}s
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandido === pregunta.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Contenido expandido */}
              {expandido === pregunta.id && (
                <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Opciones:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(pregunta.opciones).map(([opcion, texto]) => (
                        <div
                          key={opcion}
                          className={`p-2 rounded border ${
                            opcion === pregunta.respuesta_correcta
                              ? 'border-green-500 bg-green-50'
                              : opcion === respuesta?.respuesta_seleccionada && !respuesta?.es_correcta
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <span className="font-medium text-gray-700">{opcion}.</span>
                          <span className="ml-2 text-gray-600">{texto}</span>
                          {opcion === pregunta.respuesta_correcta && (
                            <span className="ml-2 text-green-600 font-medium">✓ Correcta</span>
                          )}
                          {opcion === respuesta?.respuesta_seleccionada && !respuesta?.es_correcta && (
                            <span className="ml-2 text-red-600 font-medium">✗ Tu respuesta</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Mensaje si no hay resultados para el filtro */}
        {resultadosFiltrados.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-500">
                No hay preguntas que coincidan con el filtro seleccionado.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResultadosDetalladosPage; 