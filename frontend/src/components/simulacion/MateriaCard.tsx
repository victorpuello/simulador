import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';

interface Plantilla {
  id: number;
  titulo: string;
  descripcion: string;
  cantidad_preguntas: number;
}

interface MateriaCardProps {
  id: number;
  nombre: string;
  icono: string;
  color: string;
  descripcion: string;
  completada?: boolean;
  totalPreguntas?: number;
  mejorPuntaje?: number;
  plantillas?: Plantilla[];
  preguntasDisponibles?: number;
  onStart?: (materiaId: number, plantillaId?: number) => void;
}

const MateriaCard: React.FC<MateriaCardProps> = ({
  id,
  nombre,
  icono,
  color,
  descripcion,
  completada = false,
  totalPreguntas,
  mejorPuntaje,
  plantillas = [],
  preguntasDisponibles = 0
 ,
  onStart
}) => {
  const navigate = useNavigate();

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    red: 'bg-red-50 border-red-200 hover:bg-red-100',
    yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    gray: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
  };

  const textColorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    indigo: 'text-indigo-600',
    gray: 'text-gray-600',
  };

  const buttonColorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    green: 'bg-green-600 hover:bg-green-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    red: 'bg-red-600 hover:bg-red-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    gray: 'bg-gray-600 hover:bg-gray-700',
  };

  const handleClick = () => {
    if (plantillas.length > 0) {
      // Inicio rápido: usar la primera plantilla disponible
      const firstPlantillaId = plantillas[0]?.id;
      if (onStart) {
        onStart(id, firstPlantillaId);
        return;
      }
      // Fallback anterior si no hay callback
      navigate(`/simulacion/iniciar/${id}`);
    } else {
      console.log('No hay plantillas disponibles para esta materia');
    }
  };

  // Solo mostrar simulaciones cuando hay plantillas activas disponibles
  const tieneSimulacionesDisponibles = plantillas.length > 0;

  return (
    <Card className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-2 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.gray} h-full`}>
      <div onClick={handleClick} className="p-4 sm:p-6 h-full flex flex-col">
        {/* Header con icono y estado */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="text-3xl sm:text-4xl">{icono}</div>
          {completada && (
            <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-1 text-xs sm:text-sm font-medium">Completada</span>
            </div>
          )}
        </div>
        
        {/* Título */}
        <h3 className={`text-lg sm:text-xl font-bold mb-2 ${textColorClasses[color as keyof typeof textColorClasses] || textColorClasses.gray} line-clamp-2`}>
          {nombre}
        </h3>
        
        {/* Descripción */}
        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 flex-grow">
          {descripcion}
        </p>

        {/* Información de simulaciones disponibles */}
        <div className="mb-3 sm:mb-4 space-y-2 sm:space-y-3 flex-grow">
          {plantillas.length > 0 && (
            <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 shadow-sm">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2 flex items-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="hidden sm:inline">Simulaciones Preparadas</span>
                <span className="sm:hidden">Preparadas</span>
              </h4>
              <div className="space-y-1">
                {plantillas.slice(0, 2).map((plantilla) => (
                  <div key={plantilla.id} className="text-xs sm:text-sm text-gray-600 flex justify-between items-center">
                    <span className="font-medium truncate mr-2">• {plantilla.titulo}</span>
                    <span className="text-xs bg-gray-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">{plantilla.cantidad_preguntas}p</span>
                  </div>
                ))}
                {plantillas.length > 2 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{plantillas.length - 2} más
                  </div>
                )}
              </div>
            </div>
          )}


          {!tieneSimulacionesDisponibles && (
            <div className="bg-yellow-50 rounded-lg p-2 sm:p-3 border border-yellow-200">
              <p className="text-xs sm:text-sm text-yellow-700 font-medium">⚠️ No disponible</p>
              <p className="text-xs text-yellow-600 mt-1 hidden sm:block">Contacta a tu profesor para activar simulaciones.</p>
            </div>
          )}
        </div>

        {/* Rendimiento del estudiante */}
        {completada && totalPreguntas && mejorPuntaje !== undefined && (
          <div className="mb-3 sm:mb-4 bg-green-50 rounded-lg p-2 sm:p-3 border border-green-200">
            <h4 className="text-xs sm:text-sm font-semibold text-green-700 mb-1 sm:mb-2">📊 Tu Rendimiento</h4>
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="text-center">
                <div className="font-bold text-green-700">{mejorPuntaje.toFixed(1)}%</div>
                <div className="text-green-600">Mejor puntaje</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-700">{totalPreguntas}</div>
                <div className="text-green-600">Preguntas</div>
              </div>
            </div>
          </div>
        )}

        {/* Botón de acción */}
        <div className="mt-auto">
          <button 
            className={`w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg text-white font-semibold transition-all duration-200 text-xs sm:text-sm ${
              tieneSimulacionesDisponibles
                ? `${buttonColorClasses[color as keyof typeof buttonColorClasses] || buttonColorClasses.gray} hover:shadow-md active:scale-95`
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={!tieneSimulacionesDisponibles}
          >
            {!tieneSimulacionesDisponibles 
              ? 'No disponible' 
              : completada 
                ? '🔄 Practicar de nuevo' 
                : '🚀 Comenzar simulación'
            }
          </button>
        </div>
      </div>
    </Card>
  );
};

export default MateriaCard;