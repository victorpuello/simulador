import React, { useState, useMemo } from 'react';

interface Pregunta {
  id: number;
  enunciado: string;
  contexto?: string;
  imagen_url?: string | null;
  opciones: Record<string, string>;
  respuesta_correcta: string;
}

interface Respuesta {
  pregunta_id: number;
  respuesta_seleccionada: string;
  es_correcta: boolean;
  tiempo_respuesta: number;
}

interface ResultadoItem {
  pregunta: Pregunta;
  respuesta?: Respuesta;
}

interface RevisionGuiadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultados: ResultadoItem[];
}

const RevisionGuiadaModal: React.FC<RevisionGuiadaModalProps> = ({ isOpen, onClose, resultados }) => {
  const [index, setIndex] = useState(0);

  const total = resultados.length;
  const actual = useMemo(() => resultados[index], [resultados, index]);

  if (!isOpen) return null;
  if (total === 0) return null;

  const irAnterior = () => setIndex((i) => Math.max(0, i - 1));
  const irSiguiente = () => setIndex((i) => Math.min(total - 1, i + 1));

  const respuesta = actual.respuesta;
  const pregunta = actual.pregunta;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Revisión guiada • Pregunta {index + 1} de {total}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Cerrar">✕</button>
        </div>

        {/* Estado */}
        <div className={`p-3 rounded mb-4 ${respuesta?.es_correcta ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{respuesta?.es_correcta ? '✅' : '❌'}</span>
            <div className="font-medium">
              {respuesta?.es_correcta ? 'Correcto' : 'Incorrecto'}
              <span className="ml-2 text-gray-700">
                Tu respuesta: <strong>{respuesta?.respuesta_seleccionada}</strong> • Correcta: <strong>{pregunta.respuesta_correcta}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Contexto */}
        {pregunta.contexto && (
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
            <h4 className="font-medium text-blue-900 mb-1">Contexto</h4>
            <p className="text-blue-900 text-sm">{pregunta.contexto}</p>
          </div>
        )}

        {/* Imagen */}
        {pregunta.imagen_url && (
          <div className="mb-4">
            <img
              src={pregunta.imagen_url}
              alt="Imagen de contexto"
              className="w-full max-h-72 object-contain rounded border"
              onClick={() => window.open(pregunta.imagen_url!, '_blank')}
            />
            <div className="text-xs text-gray-500 mt-1">Haz clic para abrir en una pestaña nueva</div>
          </div>
        )}

        {/* Enunciado */}
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{pregunta.enunciado}</h2>

        {/* Opciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(pregunta.opciones).map(([op, texto]) => {
            const esCorrecta = op === pregunta.respuesta_correcta;
            const esSeleccionada = op === respuesta?.respuesta_seleccionada;
            return (
              <div
                key={op}
                className={`p-3 rounded border text-sm ${
                  esCorrecta ? 'bg-green-50 border-green-200 text-green-900' : esSeleccionada && !respuesta?.es_correcta ? 'bg-red-50 border-red-200 text-red-900' : 'bg-white border-gray-200'
                }`}
              >
                <span className="font-semibold mr-2">{op})</span>
                <span>{texto}</span>
              </div>
            );
          })}
        </div>

        {/* Navegación */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={irAnterior}
            disabled={index === 0}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            ← Anterior
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
            >
              Cerrar
            </button>
            <button
              onClick={irSiguiente}
              disabled={index === total - 1}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevisionGuiadaModal;

