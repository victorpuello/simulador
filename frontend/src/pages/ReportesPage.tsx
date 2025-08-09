import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import DoughnutChart from '../components/charts/DoughnutChart';
import ReporteICFES from '../components/reportes/ReporteICFES';
import { reportesService, type EstadisticasGenerales, type EstadisticasMateria, type ProgresoDiario, type HistorialSesion, type ReporteICFES as ReporteICFESType } from '../services/reportes';
import { exportToCSV } from '../utils/exportCSV';

const ReportesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales | null>(null);
  const [estadisticasMaterias, setEstadisticasMaterias] = useState<EstadisticasMateria[]>([]);
  const [progresoDiario, setProgresoDiario] = useState<ProgresoDiario[]>([]);
  const [historial, setHistorial] = useState<HistorialSesion[]>([]);
  const [reporteICFES, setReporteICFES] = useState<ReporteICFESType | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [estadisticas, materias, progreso, hist, icfes] = await Promise.all([
        reportesService.getEstadisticasGenerales(),
        reportesService.getEstadisticasPorMateria(),
        reportesService.getProgresoDiario(),
        reportesService.getHistorial(undefined, 10),
        reportesService.getReporteICFES()
      ]);

      setEstadisticasGenerales(estadisticas);
      setEstadisticasMaterias(materias);
      setProgresoDiario(progreso);
      setHistorial(hist);
      setReporteICFES(icfes);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatearTiempo = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const exportarMateriasCSV = () => {
    const rows = estadisticasMaterias.map(m => ({
      materia: m.materia_nombre,
      simulaciones: m.simulaciones_realizadas,
      promedio_puntaje: m.promedio_puntaje,
      mejor_puntaje: m.mejor_puntaje,
      total_preguntas: m.total_preguntas,
      preguntas_correctas: m.preguntas_correctas,
      porcentaje_acierto: m.porcentaje_acierto,
    }));
    exportToCSV(rows, 'reportes_materias.csv');
  };

  const exportarProgresoCSV = () => {
    const rows = progresoDiario.map(d => ({
      fecha: new Date(d.fecha).toISOString().slice(0, 10),
      promedio_puntaje: d.promedio_puntaje,
      simulaciones: d.simulaciones,
      tiempo_estudio_min: d.tiempo_estudio,
    }));
    exportToCSV(rows, 'reportes_progreso_diario.csv');
  };

  const exportarHistorialCSV = () => {
    const rows = historial.map(h => ({
      fecha_inicio: new Date(h.fecha_inicio).toISOString(),
      materia: h.materia_nombre,
      puntaje: h.puntuacion ?? 0,
      duracion_minutos: h.duracion_minutos,
      completada: h.completada ? 'Sí' : 'No',
    }));
    exportToCSV(rows, 'reportes_historial.csv');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reportes y Analytics</h1>
          <p className="text-gray-600">Cargando tu progreso...</p>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded-lg"></div>
            <div className="h-80 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Datos para gráfico de progreso diario
  const datosProgreso = {
    labels: progresoDiario.slice(-14).map(d => formatearFecha(d.fecha)),
    datasets: [
      {
        label: 'Promedio de Puntaje',
        data: progresoDiario.slice(-14).map(d => d.promedio_puntaje),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
      }
    ]
  };

  // Datos para gráfico de materias
  const datosMaterias = {
    labels: estadisticasMaterias.map(m => m.materia_nombre),
    datasets: [
      {
        label: 'Promedio por Materia',
        data: estadisticasMaterias.map(m => m.promedio_puntaje),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 2
      }
    ]
  };

  // Datos para gráfico de distribución de tiempo
  const datosDistribucion = {
    labels: estadisticasMaterias.map(m => m.materia_nombre),
    datasets: [
      {
        data: estadisticasMaterias.map(m => m.simulaciones_realizadas),
        backgroundColor: [
          '#6366f1',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
        ]
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reportes y Analytics</h1>
        <p className="text-gray-600">Visualiza tu progreso y rendimiento académico</p>
      </div>

      {/* Estadísticas generales */}
      {estadisticasGenerales && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {estadisticasGenerales.simulaciones_completadas}
              </div>
              <div className="text-sm text-gray-600">Simulaciones Completadas</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {estadisticasGenerales.promedio_puntaje}%
              </div>
              <div className="text-sm text-gray-600">Promedio General</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {estadisticasGenerales.mejor_puntaje}%
              </div>
              <div className="text-sm text-gray-600">Mejor Puntaje</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {formatearTiempo(estadisticasGenerales.tiempo_total_estudio)}
              </div>
              <div className="text-sm text-gray-600">Tiempo de Estudio</div>
            </div>
          </Card>
        </div>
      )}

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Progreso Diario (Últimas 2 semanas)">
          <div className="flex justify-end p-3">
            <button onClick={exportarProgresoCSV} className="text-sm px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700">Exportar CSV</button>
          </div>
          <LineChart data={datosProgreso} height={300} />
        </Card>
        
        <Card title="Rendimiento por Materia">
          <div className="flex justify-end p-3">
            <button onClick={exportarMateriasCSV} className="text-sm px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700">Exportar CSV</button>
          </div>
          <BarChart data={datosMaterias} height={260} />
        </Card>
      </div>

      {/* Segunda fila de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Distribución de Simulaciones">
          <DoughnutChart data={datosDistribucion} height={300} />
        </Card>
        
        <Card title="Estadísticas por Materia">
          <div className="space-y-4">
            {estadisticasMaterias.map((materia) => (
              <div key={materia.materia_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">{materia.materia_nombre}</h3>
                  <span className="text-lg font-bold text-primary-600">
                    {materia.promedio_puntaje}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Simulaciones:</span> {materia.simulaciones_realizadas}
                  </div>
                  <div>
                    <span className="font-medium">Mejor:</span> {materia.mejor_puntaje}%
                  </div>
                  <div>
                    <span className="font-medium">Preguntas:</span> {materia.total_preguntas}
                  </div>
                  <div>
                    <span className="font-medium">Aciertos:</span> {materia.porcentaje_acierto}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Historial reciente */}
      {historial.length > 0 && (
        <Card title="Historial Reciente">
          <div className="flex justify-end p-3">
            <button onClick={exportarHistorialCSV} className="text-sm px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700">Exportar CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Fecha</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Materia</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Puntaje</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Duración</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((sesion) => (
                  <tr key={sesion.id} className="border-b">
                    <td className="py-2 text-sm">
                      {new Date(sesion.fecha_inicio).toLocaleDateString('es-ES')}
                    </td>
                    <td className="py-2 text-sm">{sesion.materia_nombre}</td>
                    <td className="py-2 text-sm">
                      <span className={`font-medium ${
                        (sesion.puntuacion || 0) >= 70 ? 'text-green-600' : 
                        (sesion.puntuacion || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {sesion.puntuacion || 0}%
                      </span>
                    </td>
                    <td className="py-2 text-sm">{formatearTiempo(sesion.duracion_minutos)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        sesion.completada 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {sesion.completada ? 'Completada' : 'Incompleta'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Reporte ICFES */}
      <ReporteICFES reporte={reporteICFES} loading={loading} />
    </div>
  );
};

export default ReportesPage; 