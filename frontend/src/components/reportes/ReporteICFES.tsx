import React from 'react';
import { TrophyIcon, ChartBarIcon, AcademicCapIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { ReporteICFES as ReporteICFESType } from '../../services/reportes';

interface Props {
  reporte: ReporteICFESType | null;
  loading: boolean;
}

const ReporteICFES: React.FC<Props> = ({ reporte, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!reporte) {
    return (
      <Card>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay datos disponibles</h3>
          <p className="text-gray-600">Completa simulaciones en todas las materias para ver tu puntaje ICFES</p>
        </div>
      </Card>
    );
  }

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'Excelente':
        return 'text-green-600 bg-green-100';
      case 'Muy Bueno':
        return 'text-blue-600 bg-blue-100';
      case 'Bueno':
        return 'text-yellow-600 bg-yellow-100';
      case 'Aceptable':
        return 'text-orange-600 bg-orange-100';
      case 'Bajo':
      case 'Muy Bajo':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPercentilColor = (percentil: number) => {
    if (percentil >= 90) return 'text-green-600';
    if (percentil >= 80) return 'text-blue-600';
    if (percentil >= 70) return 'text-yellow-600';
    if (percentil >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Puntaje Global */}
      <Card>
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <TrophyIcon className="h-8 w-8 text-yellow-500 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Puntaje ICFES Global</h2>
          </div>
          
          <div className="mb-6">
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {reporte.puntaje_global}
            </div>
            <div className="text-lg text-gray-600">de 500 puntos</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-600">Percentil Nacional</span>
              </div>
              <div className={`text-2xl font-bold ${getPercentilColor(reporte.percentil)}`}>
                {reporte.percentil}%
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <AcademicCapIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-gray-600">Nivel de Desempeño</span>
              </div>
              <div className={`text-lg font-semibold px-3 py-1 rounded-full inline-block ${getNivelColor(reporte.nivel)}`}>
                {reporte.nivel}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Detalles por Materia */}
      <Card>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Puntajes por Materia</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(reporte.detalles_materias).map(([codigo, detalle]) => (
            <div key={codigo} className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{detalle.materia_nombre}</h4>
                <span className="text-sm text-gray-500">Pond: {detalle.ponderacion}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Puntaje:</span>
                  <span className="font-semibold text-blue-600">{detalle.puntaje}/100</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Mejor:</span>
                  <span className="font-medium text-green-600">{detalle.mejor_puntaje}/100</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Simulaciones:</span>
                  <span className="font-medium text-gray-900">{detalle.simulaciones}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reporte.materias_faltantes.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
              <h4 className="font-semibold text-yellow-800">Materias Faltantes</h4>
            </div>
            <p className="text-yellow-700 text-sm mb-2">
              Para un cálculo completo del puntaje ICFES, necesitas completar simulaciones en:
            </p>
            <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
              {reporte.materias_faltantes.map((materia) => (
                <li key={materia}>{materia}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Fórmula Aplicada */}
      <Card>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Fórmula ICFES Aplicada</h3>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-gray-700 mb-3">{reporte.formula_aplicada.descripcion}</p>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Suma ponderada:</span>
              <span className="font-medium">{reporte.suma_ponderada}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Ponderación total:</span>
              <span className="font-medium">{reporte.ponderacion_total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Promedio ponderado:</span>
              <span className="font-medium">{reporte.promedio_ponderado}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(reporte.formula_aplicada.ponderaciones).map(([materia, ponderacion]) => (
            <div key={materia} className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700">{materia}</div>
              <div className="text-lg font-bold text-blue-600">×{ponderacion}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ReporteICFES; 