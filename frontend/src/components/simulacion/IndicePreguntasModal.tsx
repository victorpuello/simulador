import React from 'react';

interface RespuestaActual {
  pregunta: number;
  respuesta: string;
  es_correcta: boolean;
}

interface IndicePreguntasModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPreguntas: number;
  preguntaActualIndex: number;
  respuestasActuales: RespuestaActual[];
  onGoTo: (index: number) => void;
  preguntasIds?: number[];
}

const IndicePreguntasModal: React.FC<IndicePreguntasModalProps> = ({
  isOpen,
  onClose,
  totalPreguntas,
  preguntaActualIndex,
  respuestasActuales,
  onGoTo,
  preguntasIds,
}) => {
  if (!isOpen) return null;

  const respuestaPorPreguntaId = new Map<number, RespuestaActual>();
  respuestasActuales.forEach((r) => respuestaPorPreguntaId.set(r.pregunta, r));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Índice de preguntas</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: totalPreguntas }).map((_, idx) => {
            const preguntaId = preguntasIds?.[idx];
            const r = preguntaId ? respuestaPorPreguntaId.get(preguntaId) : undefined;
            const estado: 'correcta' | 'incorrecta' | 'sin_responder' = r ? (r.es_correcta ? 'correcta' : 'incorrecta') : 'sin_responder';
            const isActual = idx === preguntaActualIndex;
            const base = 'h-10 rounded flex items-center justify-center text-sm font-medium border transition';
            const clases = isActual
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : estado === 'correcta'
                ? 'border-green-500 bg-green-50 text-green-700'
                : estado === 'incorrecta'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50';
            return (
              <button
                key={idx}
                className={`${base} ${clases}`}
                onClick={() => {
                  onGoTo(idx);
                  onClose();
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded border border-green-500 bg-green-50" /> Correcta
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded border border-red-500 bg-red-50" /> Incorrecta
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded border border-gray-300 bg-white" /> Sin responder
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded border border-blue-500 bg-blue-50" /> Actual
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndicePreguntasModal;

