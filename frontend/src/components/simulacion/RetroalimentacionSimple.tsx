import React, { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, LightBulbIcon, LinkIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

interface RetroEstructurada {
  correcta?: {
    mensaje?: string;
    explicacion?: string;
    refuerzo?: string;
  };
  incorrecta?: Record<string, string>;
  conceptos_clave?: string[];
  recursos_adicionales?: string[];
}

interface RetroalimentacionSimpleProps {
  esCorrecta: boolean;
  respuestaSeleccionada: string;
  respuestaCorrecta: string;
  opciones?: Record<string, string>;
  retroEstructurada?: RetroEstructurada;
  explicacionOpcionesIncorrectas?: Record<string, string>;
  explicacionGeneral?: string;
  retroalimentacion?: string; // Fallback plano
  onContinuar: () => void;
}

const RetroalimentacionSimple: React.FC<RetroalimentacionSimpleProps> = ({
  esCorrecta,
  respuestaSeleccionada,
  respuestaCorrecta,
  opciones,
  retroEstructurada,
  explicacionOpcionesIncorrectas,
  explicacionGeneral,
  retroalimentacion,
  onContinuar
}) => {
  const [verMas, setVerMas] = useState(false);
  const textoCorrecta = opciones?.[respuestaCorrecta];
  const textoSeleccionada = opciones?.[respuestaSeleccionada];
  const mensajePrincipal = esCorrecta
    ? (retroEstructurada?.correcta?.mensaje || retroalimentacion)
    : (retroEstructurada?.incorrecta?.[respuestaSeleccionada] || retroalimentacion);
  const explicacionDetallada = retroEstructurada?.correcta?.explicacion || explicacionGeneral;
  const refuerzo = retroEstructurada?.correcta?.refuerzo;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto p-6 m-4">
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
            <div className="text-sm mt-1 space-y-1">
              <p>
                Tu respuesta: <span className="font-semibold">{respuestaSeleccionada}</span>
                {textoSeleccionada && <span className="text-gray-700"> — {textoSeleccionada}</span>}
              </p>
              <p>
                Respuesta correcta: <span className="font-semibold">{respuestaCorrecta}</span>
                {textoCorrecta && <span className="text-gray-700"> — {textoCorrecta}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* 1) Retroalimentación (mensaje principal) */}
        {mensajePrincipal && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
              <LightBulbIcon className="w-5 h-5 text-yellow-500" /> Retroalimentación
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-line">{mensajePrincipal}</p>
            </div>
          </div>
        )}

        {/* 2) Explicación de opciones incorrectas */}
        {explicacionOpcionesIncorrectas && Object.keys(explicacionOpcionesIncorrectas).length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-3">
              ¿Por qué las otras opciones son incorrectas?
            </h3>
            <div className="space-y-2">
              {Object.entries(explicacionOpcionesIncorrectas).map(([opcion, texto]) => (
                <div key={opcion} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-gray-900">
                    <span className="font-semibold mr-2">{opcion})</span>
                    <span>{texto}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3) Explicación general / detallada */}
        {explicacionDetallada && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-3">
              Explicación Detallada
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-line">
                {verMas ? explicacionDetallada : (explicacionDetallada.slice(0, 500) + (explicacionDetallada.length > 500 ? '…' : ''))}
              </p>
              {explicacionDetallada.length > 500 && (
                <button className="mt-2 text-primary-600 font-medium" onClick={() => setVerMas(!verMas)}>
                  {verMas ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4) Refuerzo */}
        {refuerzo && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-3">Refuerzo</h3>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-900 whitespace-pre-line">{refuerzo}</p>
            </div>
          </div>
        )}

        {/* 5) Conceptos clave */}
        {retroEstructurada?.conceptos_clave && retroEstructurada.conceptos_clave.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-3">Conceptos clave</h3>
            <div className="flex flex-wrap gap-2">
              {retroEstructurada.conceptos_clave.map((c, i) => (
                <span key={i} className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 6) Recursos adicionales */}
        {retroEstructurada?.recursos_adicionales && retroEstructurada.recursos_adicionales.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" /> Recursos adicionales
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              {retroEstructurada.recursos_adicionales.map((url, i) => (
                <li key={i}>
                  <a href={url} target="_blank" rel="noreferrer" className="text-primary-600 underline">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mensaje motivacional */}
        <div className="mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-900 text-center">
              {esCorrecta 
                ? '¡Excelente trabajo! Sigue así.' 
                : 'No te preocupes, cada error es una oportunidad de aprendizaje.'
              }
            </p>
          </div>
        </div>

        {/* Botón de continuar */}
        <div className="flex justify-center pt-4 border-t">
          <Button
            variant="primary"
            onClick={onContinuar}
            className="px-8 py-3"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RetroalimentacionSimple; 