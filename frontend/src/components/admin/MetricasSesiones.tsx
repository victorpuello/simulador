import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../store';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface MetricasData {
  periodo: {
    dias: number;
    fecha_inicio: string;
    fecha_fin: string;
  };
  generales: {
    total_sesiones: number;
    sesiones_completadas: number;
    sesiones_activas: number;
    tasa_finalizacion: number;
    tiempo_promedio_minutos: number | null;
  };
  por_materia: Array<{
    materia: string;
    total_sesiones: number;
    completadas: number;
    activas: number;
    tasa_finalizacion: number;
    promedio_puntuacion: number;
  }>;
  estudiantes_activos: Array<{
    username: string;
    nombre_completo: string;
    total_sesiones: number;
    sesiones_completadas: number;
    tasa_finalizacion: number;
  }>;
  timestamp: string;
}

const MetricasSesiones: React.FC = () => {
  const { addNotification } = useNotifications();
  const [metricas, setMetricas] = useState<MetricasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  const periodOptions = [
    { value: 1, label: 'Último día' },
    { value: 7, label: 'Última semana' },
    { value: 30, label: 'Último mes' },
    { value: 90, label: 'Últimos 3 meses' },
  ];

  useEffect(() => {
    cargarMetricas();
  }, [selectedPeriod]);

  const cargarMetricas = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/simulacion/sesiones/metricas/?days=${selectedPeriod}`);
      setMetricas(response.data);
    } catch (error) {
      console.error('Error al cargar métricas:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las métricas',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (tasa: number) => {
    if (tasa >= 80) return 'text-green-600';
    if (tasa >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEstadoBadge = (tasa: number) => {
    if (tasa >= 80) return 'bg-green-100 text-green-800';
    if (tasa >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <Card className="p-8">
        <LoadingSpinner />
        <p className="text-center text-gray-600 mt-4">Cargando métricas...</p>
      </Card>
    );
  }

  if (!metricas) {
    return (
      <Card className="p-8">
        <p className="text-center text-gray-600">No se pudieron cargar las métricas</p>
        <div className="text-center mt-4">
          <Button variant="primary" onClick={cargarMetricas}>
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Métricas de Sesiones</h2>
          <p className="text-gray-600 mt-1">
            Período: {formatearFecha(metricas.periodo.fecha_inicio)} - {formatearFecha(metricas.periodo.fecha_fin)}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <Button
            variant="outline"
            onClick={cargarMetricas}
            size="sm"
          >
            🔄 Actualizar
          </Button>
        </div>
      </div>

      {/* Métricas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sesiones</p>
              <p className="text-2xl font-bold text-gray-900">{metricas.generales.total_sesiones}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-gray-900">{metricas.generales.sesiones_completadas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">🟡</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activas</p>
              <p className="text-2xl font-bold text-gray-900">{metricas.generales.sesiones_activas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasa Finalización</p>
              <p className={`text-2xl font-bold ${getEstadoColor(metricas.generales.tasa_finalizacion)}`}>
                {metricas.generales.tasa_finalizacion}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tiempo promedio */}
      {metricas.generales.tiempo_promedio_minutos && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⏱️ Tiempo Promedio por Sesión</h3>
          <div className="text-center">
            <span className="text-3xl font-bold text-blue-600">
              {metricas.generales.tiempo_promedio_minutos} minutos
            </span>
          </div>
        </Card>
      )}

      {/* Métricas por materia */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Estadísticas por Materia</h3>
        
        {metricas.por_materia.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay datos disponibles para el período seleccionado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Materia</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Total</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Completadas</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Activas</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Tasa Final.</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {metricas.por_materia.map((materia, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{materia.materia}</td>
                    <td className="text-center py-3 px-4">{materia.total_sesiones}</td>
                    <td className="text-center py-3 px-4">{materia.completadas}</td>
                    <td className="text-center py-3 px-4">{materia.activas}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(materia.tasa_finalizacion)}`}>
                        {materia.tasa_finalizacion}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="font-medium text-blue-600">
                        {materia.promedio_puntuacion}/10
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Top estudiantes activos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Estudiantes Más Activos</h3>
        
        {metricas.estudiantes_activos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay estudiantes activos en el período seleccionado</p>
        ) : (
          <div className="space-y-3">
            {metricas.estudiantes_activos.map((estudiante, index) => (
              <div
                key={estudiante.username}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{estudiante.nombre_completo}</p>
                    <p className="text-sm text-gray-500">@{estudiante.username}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {estudiante.total_sesiones} sesiones
                  </p>
                  <p className="text-xs text-gray-500">
                    {estudiante.sesiones_completadas} completadas ({estudiante.tasa_finalizacion}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Footer con timestamp */}
      <div className="text-center text-sm text-gray-500">
        Última actualización: {formatearFecha(metricas.timestamp)}
      </div>
    </div>
  );
};

export default MetricasSesiones;