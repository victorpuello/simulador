import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useNotifications } from '../../store';

interface EstadisticasGenerales {
  total_preguntas: number;
  total_materias: number;
  total_competencias: number;
}

interface EstadisticaMateria {
  materia__nombre: string;
  materia__nombre_display: string;
  total: number;
  faciles: number;
  medias: number;
  dificiles: number;
}

interface EstadisticaDificultad {
  dificultad: string;
  count: number;
}

interface EstadisticasCompletas {
  general: EstadisticasGenerales;
  por_materia: EstadisticaMateria[];
  por_dificultad: EstadisticaDificultad[];
}

const PreguntasStats: React.FC = () => {
  const { addNotification } = useNotifications();
  const [estadisticas, setEstadisticas] = useState<EstadisticasCompletas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/core/preguntas/estadisticas/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }

      const data = await response.json();
      setEstadisticas(data);

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al cargar estadísticas',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getDificultadLabel = (dificultad: string) => {
    switch (dificultad) {
      case 'facil':
        return 'Fácil';
      case 'media':
        return 'Media';
      case 'dificil':
        return 'Difícil';
      default:
        return dificultad;
    }
  };

  const getDificultadColor = (dificultad: string) => {
    switch (dificultad) {
      case 'facil':
        return 'bg-green-500';
      case 'media':
        return 'bg-yellow-500';
      case 'dificil':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const calcularPorcentaje = (valor: number, total: number) => {
    return total > 0 ? Math.round((valor / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <Card title="Error">
        <p className="text-red-600">No se pudieron cargar las estadísticas.</p>
        <button
          onClick={cargarEstadisticas}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Intentar de nuevo
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <Card title="Estadísticas Generales">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {estadisticas.general.total_preguntas}
            </div>
            <div className="text-sm text-gray-600">Total de Preguntas</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {estadisticas.general.total_materias}
            </div>
            <div className="text-sm text-gray-600">Materias Activas</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {estadisticas.general.total_competencias}
            </div>
            <div className="text-sm text-gray-600">Competencias</div>
          </div>
        </div>
      </Card>

      {/* Distribución por dificultad */}
      <Card title="Distribución por Dificultad">
        <div className="space-y-4">
          {estadisticas.por_dificultad.map((item) => {
            const porcentaje = calcularPorcentaje(item.count, estadisticas.general.total_preguntas);
            return (
              <div key={item.dificultad} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${getDificultadColor(item.dificultad)}`}></div>
                  <span className="font-medium">{getDificultadLabel(item.dificultad)}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getDificultadColor(item.dificultad)}`}
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {item.count}
                  </span>
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {porcentaje}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Estadísticas por materia */}
      <Card title="Preguntas por Materia">
        <div className="space-y-4">
          {estadisticas.por_materia.map((materia) => (
            <div key={materia.materia__nombre} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {materia.materia__nombre_display}
                </h4>
                <span className="text-lg font-bold text-blue-600">
                  {materia.total} preguntas
                </span>
              </div>
              
              {/* Distribución de dificultades por materia */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-green-600 font-semibold">{materia.faciles}</div>
                  <div className="text-gray-500">Fáciles</div>
                  <div className="text-xs text-gray-400">
                    {calcularPorcentaje(materia.faciles, materia.total)}%
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-yellow-600 font-semibold">{materia.medias}</div>
                  <div className="text-gray-500">Medias</div>
                  <div className="text-xs text-gray-400">
                    {calcularPorcentaje(materia.medias, materia.total)}%
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-red-600 font-semibold">{materia.dificiles}</div>
                  <div className="text-gray-500">Difíciles</div>
                  <div className="text-xs text-gray-400">
                    {calcularPorcentaje(materia.dificiles, materia.total)}%
                  </div>
                </div>
              </div>

              {/* Barra de progreso por materia */}
              <div className="mt-3 flex h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="bg-green-500"
                  style={{ width: `${calcularPorcentaje(materia.faciles, materia.total)}%` }}
                ></div>
                <div
                  className="bg-yellow-500"
                  style={{ width: `${calcularPorcentaje(materia.medias, materia.total)}%` }}
                ></div>
                <div
                  className="bg-red-500"
                  style={{ width: `${calcularPorcentaje(materia.dificiles, materia.total)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {estadisticas.por_materia.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay materias con preguntas activas
          </div>
        )}
      </Card>

      {/* Recomendaciones */}
      <Card title="Recomendaciones">
        <div className="space-y-3">
          {estadisticas.general.total_preguntas < 50 && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="text-yellow-600 text-lg">⚠️</div>
              <div>
                <div className="font-medium text-yellow-800">Pocas preguntas disponibles</div>
                <div className="text-sm text-yellow-700">
                  Se recomienda tener al menos 50 preguntas para un banco robusto.
                </div>
              </div>
            </div>
          )}

          {estadisticas.por_materia.some(m => m.total < 10) && (
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="text-blue-600 text-lg">💡</div>
              <div>
                <div className="font-medium text-blue-800">Distribución desigual</div>
                <div className="text-sm text-blue-700">
                  Algunas materias tienen pocas preguntas. Considera equilibrar el contenido.
                </div>
              </div>
            </div>
          )}

          {estadisticas.por_dificultad.length < 3 && (
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
              <div className="text-purple-600 text-lg">📊</div>
              <div>
                <div className="font-medium text-purple-800">Variedad de dificultades</div>
                <div className="text-sm text-purple-700">
                  Asegúrate de tener preguntas de todas las dificultades: fácil, media y difícil.
                </div>
              </div>
            </div>
          )}

          {estadisticas.general.total_preguntas >= 100 && 
           estadisticas.por_materia.every(m => m.total >= 15) && (
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="text-green-600 text-lg">✅</div>
              <div>
                <div className="font-medium text-green-800">¡Excelente banco de preguntas!</div>
                <div className="text-sm text-green-700">
                  Tienes un banco bien distribuido y robusto para simulaciones efectivas.
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PreguntasStats;