import React from 'react';
import type { Pregunta } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preguntas: Pregunta[];
  titulo: string;
}

const VistaPreviewModal: React.FC<Props> = ({ isOpen, onClose, preguntas, titulo }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Vista Previa: {titulo}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 max-h-[calc(90vh-8rem)]">
            <div className="space-y-8">
              {preguntas.map((pregunta, index) => (
                <div key={pregunta.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">
                      Pregunta {index + 1} de {preguntas.length}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pregunta.dificultad === 'facil' ? 'bg-green-100 text-green-800' :
                      pregunta.dificultad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {pregunta.dificultad.charAt(0).toUpperCase() + pregunta.dificultad.slice(1)}
                    </span>
                  </div>

                  {/* Contexto */}
                  {pregunta.contexto && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-700">{pregunta.contexto}</p>
                    </div>
                  )}

                  {/* Enunciado */}
                  <div className="mb-4">
                    <p className="text-gray-900 font-medium">{pregunta.enunciado}</p>
                  </div>

                  {/* Opciones */}
                  <div className="space-y-2">
                    {Object.entries(pregunta.opciones).map(([letra, texto]) => (
                      <div
                        key={letra}
                        className={`p-3 rounded-lg border ${
                          letra === pregunta.respuesta_correcta
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start">
                          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                            letra === pregunta.respuesta_correcta
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {letra}
                          </span>
                          <span className="ml-3 text-gray-900">{texto}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Información adicional */}
                  <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Tiempo estimado:</span>{' '}
                      {pregunta.tiempo_estimado} segundos
                    </div>
                    <div>
                      <span className="font-medium">Competencia:</span>{' '}
                      {pregunta.competencia_nombre || 'No especificada'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Total: {preguntas.length} preguntas
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VistaPreviewModal;