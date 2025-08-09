import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import AccesoRapidoSimulaciones from '../components/dashboard/AccesoRapidoSimulaciones';
import CardComp from '../components/ui/Card';
import DoughnutChart from '../components/charts/DoughnutChart';
import BarChart from '../components/charts/BarChart';
import { reportesService, type DocenteResumen, type DocenteMateriaItem, type EstadisticasGenerales, type EstadisticasMateria, type HistorialSesion } from '../services/reportes';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [docenteResumen, setDocenteResumen] = useState<DocenteResumen | null>(null);
  const [docenteMaterias, setDocenteMaterias] = useState<DocenteMateriaItem[]>([]);
  // Estado docente
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);
  const [estadisticasMaterias, setEstadisticasMaterias] = useState<EstadisticasMateria[]>([]);
  const [historialReciente, setHistorialReciente] = useState<HistorialSesion[]>([]);

  const clasePuntaje = (p?: number | null) => {
    if (p == null) return 'text-gray-600';
    if (p >= 80) return 'text-green-600 font-semibold';
    if (p >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const handleIniciarSimulacion = () => {
    navigate('/simulacion/1'); // Iniciar con matemáticas por defecto
  };

  const handleVerReportes = () => {
    navigate('/reportes');
  };

  const handleEditarPerfil = () => {
    navigate('/perfil');
  };

  useEffect(() => {
    const cargarDocente = async () => {
      if (user?.rol !== 'docente') return;
      try {
        const [res, mats] = await Promise.all([
          reportesService.getDocenteResumen(),
          reportesService.getDocenteMaterias(),
        ]);
        setDocenteResumen(res);
        setDocenteMaterias(mats);
      } catch { /* noop */ }
    };
    cargarDocente();
  }, [user?.rol]);

  useEffect(() => {
    const cargarEstudiante = async () => {
      if (user?.rol === 'docente') return;
      try {
        const [gen, mats, hist] = await Promise.all([
          reportesService.getEstadisticasGenerales(),
          reportesService.getEstadisticasPorMateria(),
          reportesService.getHistorial(undefined, 3),
        ]);
        setEstadisticas(gen);
        setEstadisticasMaterias(mats);
        setHistorialReciente(hist);
      } catch { /* noop */ }
    };
    cargarEstudiante();
  }, [user?.rol]);

  const doughnutDocente = useMemo(() => ({
    labels: ['Completadas', 'No completadas'],
    datasets: [
      {
        data: [
          docenteResumen?.simulaciones_completadas ?? 0,
          (docenteResumen?.simulaciones_totales ?? 0) - (docenteResumen?.simulaciones_completadas ?? 0),
        ],
        backgroundColor: ['#22c55e', '#e5e7eb'],
      },
    ],
  }), [docenteResumen]);

  const barDocente = useMemo(() => ({
    labels: docenteMaterias.map((m) => m.materia_nombre),
    datasets: [
      {
        label: 'Acierto %',
        data: docenteMaterias.map((m) => m.porcentaje_acierto),
        backgroundColor: '#3b82f6',
      },
    ],
  }), [docenteMaterias]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header con información del usuario */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              ¡Bienvenido, {user?.first_name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Aquí puedes ver tu progreso y acceder a todas las funcionalidades.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Última actividad:</span>
            <span className="text-sm font-medium text-gray-900">
              {user?.ultima_practica ? new Date(user.ultima_practica).toLocaleDateString() : 'Sin actividad'}
            </span>
          </div>
        </div>
      </div>

      {/* Vista docente rediseñada */}
      {user?.rol === 'docente' ? (
        <>
          {/* KPIs Docente */}
          {docenteResumen && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card><div className="text-center p-4"><div className="text-2xl font-bold text-primary-600">{docenteResumen.simulaciones_totales}</div><div className="text-sm text-gray-600">Simulaciones</div></div></Card>
              <Card><div className="text-center p-4"><div className="text-2xl font-bold text-green-600">{docenteResumen.promedio_puntaje}%</div><div className="text-sm text-gray-600">Prom. Puntaje</div></div></Card>
              <Card><div className="text-center p-4"><div className="text-2xl font-bold text-yellow-600">{docenteResumen.estudiantes_activos_7d}</div><div className="text-sm text-gray-600">Activos 7d</div></div></Card>
              <Card><div className="text-center p-4"><div className="text-2xl font-bold text-blue-600">{docenteResumen.estudiantes_activos_30d}</div><div className="text-sm text-gray-600">Activos 30d</div></div></Card>
              <Card><div className="text-center p-4"><div className="text-2xl font-bold text-indigo-600">{docenteResumen.tiempo_promedio_pregunta}s</div><div className="text-sm text-gray-600">Tiempo/pregunta</div></div></Card>
            </div>
          )}

          {/* Gráficos resumidos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Completadas vs No Completadas"><DoughnutChart data={doughnutDocente} height={260} /></Card>
            <Card title="Acierto por Materia"><BarChart data={barDocente} height={260} /></Card>
          </div>

          {/* Accesos rápidos docente */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="transform hover:scale-105 transition-transform duration-200">
              <button onClick={() => navigate('/reportes/docente')} className="w-full h-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg">
                <div className="text-xl font-semibold text-gray-900 mb-1">Reportes Docente</div>
                <div className="text-sm text-gray-600">KPIs, preguntas difíciles y estudiantes</div>
              </button>
            </Card>
            <Card className="transform hover:scale-105 transition-transform duration-200">
              <button onClick={() => navigate('/gestion-preguntas')} className="w-full h-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg">
                <div className="text-xl font-semibold text-gray-900 mb-1">Gestión de Preguntas</div>
                <div className="text-sm text-gray-600">Crea y mejora tu banco</div>
              </button>
            </Card>
            <Card className="transform hover:scale-105 transition-transform duration-200">
              <button onClick={() => navigate('/simulacion')} className="w-full h-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg">
                <div className="text-xl font-semibold text-gray-900 mb-1">Crear Simulación</div>
                <div className="text-sm text-gray-600">Inicia una nueva práctica guiada</div>
              </button>
            </Card>
            <Card className="transform hover:scale-105 transition-transform duration-200">
              <button onClick={() => navigate('/metricas')} className="w-full h-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg">
                <div className="text-xl font-semibold text-gray-900 mb-1">Métricas</div>
                <div className="text-sm text-gray-600">Explora tendencias en detalle</div>
              </button>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Estadísticas (estudiante) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="transform hover:scale-105 transition-transform duration-200">
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {estadisticas?.racha_actual ?? user?.racha_actual ?? 0}
                </div>
                <div className="text-sm font-medium text-gray-600">Días de racha</div>
                <div className="mt-2 text-xs text-gray-500">🔥 Mantén tu racha diaria</div>
              </div>
            </Card>

            <Card className="transform hover:scale-105 transition-transform duration-200">
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-success-600 mb-2">
                  {estadisticas ? Math.round(estadisticas.promedio_puntaje) : (user?.puntos_totales || 0)}
                </div>
                <div className="text-sm font-medium text-gray-600">Promedio puntaje</div>
                <div className="mt-2 text-xs text-gray-500">⭐ Mejora tu promedio con prácticas</div>
              </div>
            </Card>

            <Card className="transform hover:scale-105 transition-transform duration-200">
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-secondary-600 mb-2">
                  {user?.rol_display}
                </div>
                <div className="text-sm font-medium text-gray-600">Tu rol</div>
                <div className="mt-2 text-xs text-gray-500">👤 Estudiante activo</div>
              </div>
            </Card>
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ocultar para estudiantes la tarjeta de "Nueva simulación" */}
            {user?.rol !== 'estudiante' && (
              <Card className="transform hover:scale-105 transition-transform duration-200">
                <button 
                  onClick={handleIniciarSimulacion}
                  className="w-full h-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">Nueva simulación</div>
                      <div className="text-sm text-gray-600">Comienza tu práctica ahora</div>
                    </div>
                  </div>
                </button>
              </Card>
            )}

            <Card className="transform hover:scale-105 transition-transform duration-200">
              <button 
                onClick={handleVerReportes}
                className="w-full h-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">Ver reportes</div>
                    <div className="text-sm text-gray-600">Tu progreso y estadísticas</div>
                  </div>
                </div>
              </button>
            </Card>

            <Card className="transform hover:scale-105 transition-transform duration-200">
              <button 
                onClick={handleEditarPerfil}
                className="w-full h-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">Editar perfil</div>
                    <div className="text-sm text-gray-600">Configuración de cuenta</div>
                  </div>
                </div>
              </button>
            </Card>
          </div>

          {/* Acceso rápido a simulaciones */}
          <AccesoRapidoSimulaciones />

          {/* Historial reciente */}
          <div className="mt-6">
            <CardComp>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Últimas simulaciones</h3>
                {historialReciente.length === 0 ? (
                  <p className="text-sm text-gray-600">No hay simulaciones recientes.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {historialReciente.map((h) => (
                      <li key={h.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">{h.materia_nombre}</div>
                            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${h.completada ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                              {h.completada ? 'Completada' : 'En progreso'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {h.fecha_fin ? new Date(h.fecha_fin).toLocaleString() : new Date(h.fecha_inicio).toLocaleString()}
                            {h.puntuacion != null && (
                              <span className={`ml-2 ${clasePuntaje(h.puntuacion)}`}>• Puntaje {h.puntuacion}%</span>
                            )}
                          </div>
                        </div>
                        {h.completada ? (
                          <button
                            onClick={() => navigate(`/simulacion/resultados/${h.id}`)}
                            className="text-sm text-primary-700 hover:underline"
                          >
                            Ver resultados
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/simulacion/activa/${h.id}`)}
                            className="text-sm text-primary-700 hover:underline"
                          >
                            Continuar
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3">
                  <button
                    onClick={() => navigate('/reportes')}
                    className="text-sm text-primary-700 hover:underline"
                  >
                    Ver historial completo →
                  </button>
                </div>
              </div>
            </CardComp>
          </div>

          {/* Reportes mínimos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardComp>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Rendimiento global</h3>
                <DoughnutChart
                  data={{
                    labels: ['Correctas', 'Incorrectas'],
                    datasets: [
                      {
                        data: [
                          (estadisticasMaterias || []).reduce((acc, m) => acc + (m.preguntas_correctas || 0), 0),
                          (estadisticasMaterias || []).reduce((acc, m) => acc + Math.max(0, (m.total_preguntas || 0) - (m.preguntas_correctas || 0)), 0),
                        ],
                        backgroundColor: ['#22c55e', '#ef4444'],
                      },
                    ],
                  }}
                  title="Distribución de respuestas"
                  height={260}
                />
              </div>
            </CardComp>

            <CardComp>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Acierto por materia</h3>
                <BarChart
                  data={{
                    labels: (estadisticasMaterias ?? []).map((m) => (m as unknown as { materia_nombre?: string; nombre?: string }).materia_nombre || (m as unknown as { materia_nombre?: string; nombre?: string }).nombre || ''),
                    datasets: [
                      {
                        label: 'Acierto %',
                        data: (estadisticasMaterias ?? []).map((m) => {
                          const mm = m as unknown as { preguntas_correctas?: number; total_preguntas?: number };
                          return Math.round((((mm.preguntas_correctas || 0) / Math.max(1, (mm.total_preguntas || 0))) * 100));
                        }),
                        backgroundColor: '#3b82f6',
                      },
                    ],
                  }}
                  title="Porcentaje de acierto"
                  height={260}
                />
              </div>
            </CardComp>
          </div>
        </>
      )}

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ocultar para estudiantes la tarjeta de "Nueva simulación" */}
        {user?.rol !== 'estudiante' && (
          <Card className="transform hover:scale-105 transition-transform duration-200">
            <button 
              onClick={handleIniciarSimulacion}
              className="w-full h-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">Nueva simulación</div>
                  <div className="text-sm text-gray-600">Comienza tu práctica ahora</div>
                </div>
              </div>
            </button>
          </Card>
        )}

        <Card className="transform hover:scale-105 transition-transform duration-200">
          <button 
            onClick={handleVerReportes}
            className="w-full h-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">Ver reportes</div>
                <div className="text-sm text-gray-600">Tu progreso y estadísticas</div>
              </div>
            </div>
          </button>
        </Card>

        <Card className="transform hover:scale-105 transition-transform duration-200">
          <button 
            onClick={handleEditarPerfil}
            className="w-full h-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">Editar perfil</div>
                <div className="text-sm text-gray-600">Configuración de cuenta</div>
              </div>
            </div>
          </button>
        </Card>
      </div>

      {/* Acceso rápido a simulaciones */}
      {/* Renderizado movido a la rama de estudiante más abajo para evitar llamadas 403 en docentes */}

      {/* Reportes mínimos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardComp>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Rendimiento global</h3>
            <DoughnutChart
              data={{
                labels: ['Correctas', 'Incorrectas'],
                datasets: [
                  {
                    data: [user?.estadisticas?.correctas ?? 0, user?.estadisticas?.incorrectas ?? 0],
                    backgroundColor: ['#22c55e', '#ef4444'],
                  },
                ],
              }}
              title="Distribución de respuestas"
              height={260}
            />
          </div>
        </CardComp>

        <CardComp>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Acierto por materia</h3>
            <BarChart
              data={{
                    labels: (user?.estadisticas?.por_materia ?? []).map((m: { nombre: string }) => m.nombre),
                datasets: [
                  {
                    label: 'Acierto %',
                        data: (user?.estadisticas?.por_materia ?? []).map((m: { correctas: number; total: number }) => Math.round((m.correctas / Math.max(1, m.total)) * 100)),
                    backgroundColor: '#3b82f6',
                  },
                ],
              }}
              title="Porcentaje de acierto"
              height={260}
            />
          </div>
        </CardComp>
      </div>
    </div>
  );
};

export default DashboardPage; 