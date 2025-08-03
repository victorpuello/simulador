import React, { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface Pregunta {
  id: number;
  enunciado: string;
  opciones: Record<string, string>;
  respuesta_correcta: string;
  retroalimentacion?: string;
  materia_nombre?: string;
}

interface RespuestaUsuario {
  pregunta_id: number;
  respuesta_seleccionada: string;
  es_correcta: boolean;
  tiempo_respuesta?: number;
}

interface ResultadosDetalladosProps {
  preguntas: Pregunta[];
  respuestas: RespuestaUsuario[];
  onNuevaSimulacion: () => void;
  onVolverDashboard: () => void;
}

const ResultadosDetallados: React.FC<ResultadosDetalladosProps> = ({
  preguntas,
  respuestas,
  onNuevaSimulacion,
  onVolverDashboard
}) => {
  const [expandido, setExpandido] = useState<number | null>(null);
  const [mostrarSolo, setMostrarSolo] = useState<'todas' | 'correctas' | 'incorrectas'>('todas');

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

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Simulación completada!</h1>
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {puntaje}%
          </div>
          <p className="text-xl text-gray-600">Tu puntuación</p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
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
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={onNuevaSimulacion}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Nueva simulación
          </button>
          <button
            onClick={onVolverDashboard}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Volver al dashboard
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Detalle de preguntas</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setMostrarSolo('todas')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mostrarSolo === 'todas' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas ({preguntas.length})
          </button>
          <button
            onClick={() => setMostrarSolo('correctas')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mostrarSolo === 'correctas' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Correctas ({correctas})
          </button>
          <button
            onClick={() => setMostrarSolo('incorrectas')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mostrarSolo === 'incorrectas' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Incorrectas ({preguntas.length - correctas})
          </button>
        </div>
      </div>

      {/* Lista de preguntas */}
      <div className="space-y-4">
        {resultadosFiltrados.map(({ pregunta, respuesta }, index) => (
          <div
            key={pregunta.id}
            className={`bg-white rounded-lg shadow-lg border-l-4 ${
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
                  <div className="flex items-center gap-4 text-sm">
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
                  </div>
                </div>
                <div className="ml-4">
                  {expandido === pregunta.id ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Contenido expandido */}
            {expandido === pregunta.id && (
              <div className="border-t bg-gray-50 p-4">
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Opciones:</h4>
                  <div className="space-y-2">
                    {Object.entries(pregunta.opciones).map(([letra, texto]) => (
                      <div
                        key={letra}
                        className={`p-3 rounded-lg border ${
                          letra === pregunta.respuesta_correcta
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : letra === respuesta?.respuesta_seleccionada && !respuesta.es_correcta
                            ? 'bg-red-50 border-red-200 text-red-800'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <span className="font-medium">{letra})</span> {texto}
                        {letra === pregunta.respuesta_correcta && (
                          <span className="ml-2 text-green-600 font-semibold">✓ Correcta</span>
                        )}
                        {letra === respuesta?.respuesta_seleccionada && !respuesta.es_correcta && (
                          <span className="ml-2 text-red-600 font-semibold">✗ Tu respuesta</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {pregunta.retroalimentacion && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <h4 className="font-medium text-blue-900 mb-2">Explicación:</h4>
                    <p className="text-blue-800">{pregunta.retroalimentacion}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {resultadosFiltrados.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500">No hay preguntas que mostrar con el filtro seleccionado.</p>
        </div>
      )}
    </div>
  );
};

export default ResultadosDetallados;