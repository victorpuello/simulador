import React from 'react';
import { CheckCircleIcon, XCircleIcon, LightBulbIcon, ExclamationTriangleIcon, BookOpenIcon } from '@heroicons/react/24/outline';

interface RetroalimentacionProps {
  retroalimentacion: {
    esCorrecta: boolean;
    explicacion: string;
    respuestaCorrecta: string;
    habilidadEvaluada?: string;
    estrategiasResolucion?: string;
    erroresComunes?: string;
    explicacionOpcionesIncorrectas?: Record<string, string>;
    respuestaSeleccionada?: string;
  };
  opciones: Record<string, string>;
  onContinuar: () => void;
}

const RetroalimentacionExhaustiva: React.FC<RetroalimentacionProps> = ({
  retroalimentacion,
  opciones,
  onContinuar
}) => {
  const {
    esCorrecta,
    explicacion,
    respuestaCorrecta,
    habilidadEvaluada,
    estrategiasResolucion,
    erroresComunes,
    explicacionOpcionesIncorrectas,
    respuestaSeleccionada
  } = retroalimentacion;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6 m-4">
        {/* Header con resultado */}
        <div className={`flex items-center gap-3 p-4 rounded-lg mb-6 ${
          esCorrecta ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {esCorrecta ? (
            <CheckCircleIcon className="w-8 h-8" />
          ) : (
            <XCircleIcon className="w-8 h-8" />
          )}
          <div>
            <h2 className="text-xl font-bold">
              {esCorrecta ? '¡Correcto!' : 'Incorrecto'}
            </h2>
            {!esCorrecta && (
              <p className="text-sm mt-1">
                Tu respuesta: <span className="font-semibold">{respuestaSeleccionada}</span> | 
                Respuesta correcta: <span className="font-semibold">{respuestaCorrecta}</span>
              </p>
            )}
          </div>
        </div>

        {/* Sección 1: Habilidad Evaluada */}
        {habilidadEvaluada && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpenIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg text-blue-800">Habilidad Evaluada</h3>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-900">{habilidadEvaluada}</p>
            </div>
          </div>
        )}

        {/* Sección 2: Explicación de la Respuesta Correcta */}
        {explicacion && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-lg text-green-800">
                ¿Por qué es correcta la opción {respuestaCorrecta}?
              </h3>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-900">{explicacion}</p>
            </div>
          </div>
        )}

        {/* Sección 3: Explicación de Opciones Incorrectas */}
        {explicacionOpcionesIncorrectas && Object.keys(explicacionOpcionesIncorrectas).length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <XCircleIcon className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-lg text-red-800">¿Por qué las otras opciones son incorrectas?</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(explicacionOpcionesIncorrectas).map(([opcion, explicacionOpcion]) => (
                <div key={opcion} className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className={`font-bold text-sm px-2 py-1 rounded ${
                      respuestaSeleccionada === opcion 
                        ? 'bg-red-200 text-red-800' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {opcion}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">{opciones[opcion]}</p>
                      <p className="text-red-900">{explicacionOpcion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección 4: Estrategias de Resolución */}
        {estrategiasResolucion && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <LightBulbIcon className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-lg text-yellow-800">Estrategias de Resolución</h3>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="prose prose-sm">
                {estrategiasResolucion.split(/\d+\./).filter(Boolean).map((estrategia, index) => (
                  <div key={index} className="flex gap-3 mb-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-yellow-900 flex-1">{estrategia.trim()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sección 5: Errores Comunes */}
        {erroresComunes && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-lg text-orange-800">Errores Comunes</h3>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-orange-900">{erroresComunes}</p>
            </div>
          </div>
        )}

        {/* Botón de continuar */}
        <div className="flex justify-center pt-6 border-t">
          <button
            onClick={onContinuar}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetroalimentacionExhaustiva;