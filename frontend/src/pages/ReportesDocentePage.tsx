import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/ui/Card';
import BarChart from '../components/charts/BarChart';
import DoughnutChart from '../components/charts/DoughnutChart';
import { reportesService, type DocenteResumen, type DocenteMateriaItem, type DocentePreguntaItem, type DocenteEstudianteItem } from '../services/reportes';

const ReportesDocentePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<DocenteResumen | null>(null);
  const [materias, setMaterias] = useState<DocenteMateriaItem[]>([]);
  const [preguntas, setPreguntas] = useState<DocentePreguntaItem[]>([]);
  const [estudiantes, setEstudiantes] = useState<DocenteEstudianteItem[]>([]);
  const [materiaFiltro, setMateriaFiltro] = useState<number | undefined>(undefined);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarPreguntas();
  }, [materiaFiltro]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [res, mats, est] = await Promise.all([
        reportesService.getDocenteResumen(),
        reportesService.getDocenteMaterias(),
        reportesService.getDocenteEstudiantes(),
      ]);
      setResumen(res);
      setMaterias(mats);
      setEstudiantes(est);
      await cargarPreguntas();
    } finally {
      setLoading(false);
    }
  };

  const cargarPreguntas = async () => {
    const preg = await reportesService.getDocentePreguntas(materiaFiltro, 50);
    setPreguntas(preg);
  };

  const doughnutData = useMemo(() => ({
    labels: ['Completadas', 'No completadas'],
    datasets: [
      {
        data: [resumen?.simulaciones_completadas ?? 0, (resumen?.simulaciones_totales ?? 0) - (resumen?.simulaciones_completadas ?? 0)],
        backgroundColor: ['#22c55e', '#e5e7eb'],
      },
    ],
  }), [resumen]);

  const barMaterias = useMemo(() => ({
    labels: materias.map(m => m.materia_nombre),
    datasets: [
      {
        label: 'Acierto %',
        data: materias.map(m => m.porcentaje_acierto),
        backgroundColor: '#3b82f6',
      },
    ],
  }), [materias]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reportes Docente</h1>
        <p className="text-gray-600">Métricas clave para seguimiento académico</p>
      </div>

      {/* KPIs */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-1">{resumen.simulaciones_totales}</div>
              <div className="text-sm text-gray-600">Simulaciones Totales</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{resumen.promedio_puntaje}%</div>
              <div className="text-sm text-gray-600">Promedio de Puntaje</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">{resumen.estudiantes_activos_7d}</div>
              <div className="text-sm text-gray-600">Activos 7 días</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{resumen.tiempo_promedio_pregunta}s</div>
              <div className="text-sm text-gray-600">Tiempo prom. por pregunta</div>
            </div>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Completadas vs No Completadas">
          <DoughnutChart data={doughnutData} height={300} />
        </Card>
        <Card title="Acierto por Materia">
          <BarChart data={barMaterias} height={300} />
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
          <div className="font-medium text-gray-900">Preguntas más difíciles</div>
          <div className="flex-1" />
          <select
            className="border rounded px-3 py-2 text-sm"
            value={materiaFiltro ?? ''}
            onChange={(e) => setMateriaFiltro(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Todas las materias</option>
            {materias.map(m => (
              <option key={m.materia_id} value={m.materia_id}>{m.materia_nombre}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-medium text-gray-600">Pregunta</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Acierto</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Respuestas</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Opción más elegida</th>
              </tr>
            </thead>
            <tbody>
              {preguntas.map((p) => (
                <tr key={p.pregunta_id} className="border-b">
                  <td className="py-2 text-sm text-gray-900">{p.enunciado_resumen}</td>
                  <td className="py-2 text-sm">{p.porcentaje_acierto}%</td>
                  <td className="py-2 text-sm">{p.total_respuestas}</td>
                  <td className="py-2 text-sm">{p.opcion_mas_elegida ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Estudiantes */}
      <Card title="Estudiantes">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-medium text-gray-600">Estudiante</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Simulaciones</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Acierto</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Tiempo prom. pregunta</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((e) => (
                <tr key={e.estudiante_id} className="border-b">
                  <td className="py-2 text-sm text-gray-900">{e.nombre}</td>
                  <td className="py-2 text-sm">{e.simulaciones}</td>
                  <td className="py-2 text-sm">{e.porcentaje_acierto}%</td>
                  <td className="py-2 text-sm">{e.tiempo_promedio_pregunta}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ReportesDocentePage;

