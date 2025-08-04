import React from 'react';
import Button from './Button';

interface SesionActiva {
  id: number;
  materia: string;
  materia_display: string;
  fecha_inicio: string;
  progreso: {
    respondidas: number;
    total: number;
    porcentaje: number;
  };
}

interface Props {
  isOpen: boolean;
  sesion: SesionActiva | null;
  onContinuar: () => void;
  onReiniciar: () => void;
  onCerrar: () => void;
}

const ConfirmacionSesionModal: React.FC<Props> = ({
  isOpen,
  sesion,
  onContinuar,
  onReiniciar,
  onCerrar
}) => {
  if (!isOpen || !sesion) return null;

  const fechaFormateada = new Date(sesion.fecha_inicio).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all w-full max-w-lg">
          {/* Icono de advertencia */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>

          {/* Título */}
          <div className="text-center">
            <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-2">
              Ya tienes una simulación activa
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Encontramos una simulación en progreso. ¿Qué deseas hacer?
            </p>
          </div>

          {/* Información de la sesión */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">{sesion.materia_display}</h4>
              <span className="text-xs text-gray-500">{fechaFormateada}</span>
            </div>
            
            {/* Barra de progreso */}
            <div className="mb-3">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progreso</span>
                <span>{sesion.progreso.respondidas}/{sesion.progreso.total} preguntas</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${sesion.progreso.porcentaje}%` }}
                ></div>
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">
                {sesion.progreso.porcentaje}% completado
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onContinuar}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-8 4h8m-8 4h8m-8 4h8" />
              </svg>
              Continuar simulación
            </Button>
            
            <Button
              onClick={onReiniciar}
              variant="outline"
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reiniciar simulación
            </Button>
          </div>

          {/* Botón cerrar */}
          <div className="mt-4 text-center">
            <button
              onClick={onCerrar}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmacionSesionModal;