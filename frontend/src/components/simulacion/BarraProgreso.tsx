import React from 'react';
import { useSimulacionEstadisticas } from '../../store/simulacion';
import Button from '../ui/Button';

interface Props {
  className?: string;
  totalPreguntas?: number;
  preguntaActual?: number; // 1-based
  onSelectPregunta?: (index: number) => void;
  pausada?: boolean;
  onPausar?: () => void;
  onReanudar?: () => void;
}

const BarraProgreso: React.FC<Props> = ({ className = '', totalPreguntas, preguntaActual, onSelectPregunta, pausada, onPausar, onReanudar }) => {
  const {
    respuestasCorrectas,
    respuestasIncorrectas,
    totalRespuestas,
    porcentajeCompletado,
    porcentajeAcierto,
    tiempoPromedio
  } = useSimulacionEstadisticas();

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      {/* Barra de progreso principal */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progreso general</span>
          <span>{Math.round(porcentajeCompletado)}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-600 rounded-full transition-all duration-300 relative"
            style={{ width: `${porcentajeCompletado}%` }}
          >
            {/* Mini barras para respuestas correctas/incorrectas */}
            <div 
              className="absolute top-0 right-0 h-full bg-green-500"
              style={{ width: `${(respuestasCorrectas / totalRespuestas) * 100}%` }}
            />
            <div 
              className="absolute top-0 right-0 h-full bg-red-500"
              style={{ width: `${(respuestasIncorrectas / totalRespuestas) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Índice de preguntas y pausa */}
      {typeof totalPreguntas === 'number' && typeof preguntaActual === 'number' && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: totalPreguntas }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPregunta && onSelectPregunta(idx)}
                className={`w-4 h-4 rounded-full border transition-colors ${
                  idx === (preguntaActual - 1)
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-gray-300 hover:border-primary-400'
                }`}
                aria-label={`Ir a pregunta ${idx + 1}`}
                title={`Pregunta ${idx + 1}`}
              />
            ))}
          </div>
          <div>
            {pausada ? (
              <Button size="sm" variant="secondary" onClick={onReanudar}>Reanudar</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={onPausar}>Pausar</Button>
            )}
          </div>
        </div>
      )}

      {/* Estadísticas detalladas */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-2 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-primary-600">
            {respuestasCorrectas}
          </div>
          <div className="text-sm text-gray-600">Correctas</div>
        </div>
        
        <div className="p-2 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-primary-600">
            {respuestasIncorrectas}
          </div>
          <div className="text-sm text-gray-600">Incorrectas</div>
        </div>
        
        <div className="p-2 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-primary-600">
            {Math.round(porcentajeAcierto)}%
          </div>
          <div className="text-sm text-gray-600">Acierto</div>
        </div>
      </div>

      {/* Tiempo promedio */}
      {tiempoPromedio && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Tiempo promedio por pregunta: {Math.round(tiempoPromedio)} segundos
        </div>
      )}
    </div>
  );
};

export default BarraProgreso;