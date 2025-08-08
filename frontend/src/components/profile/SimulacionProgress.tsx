import React, { useState, useEffect } from 'react';
import { simulacionService } from '../../services/api';
import { useAuth } from '../../store';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SesionActiva {
  id: number;
  materia: {
    id: number;
    nombre_display: string;
  };
  plantilla?: {
    titulo: string;
  };
  fecha_inicio: string;
  completada: boolean;
  puntuacion: number;
  preguntas_sesion: Array<{
    respuesta_estudiante: string | null;
    es_correcta: boolean | null;
  }>;
}

interface EstadisticasSimulacion {
  total_sesiones: number;
  sesiones_completadas: number;
  promedio_puntuacion: number;
  mejor_puntuacion: number;
  racha_actual: number;
}

const SimulacionProgress: React.FC = () => {
  const { user } = useAuth();
  const [sesionActiva, setSesionActiva] = useState<SesionActiva | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasSimulacion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const cargarDatos = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        
        console.log('👤 Usuario autenticado:', user?.username, '- Rol:', user?.rol);
        
        // Cargar sesiones para encontrar una activa
        const response = await simulacionService.getSesiones();
        console.log('🔍 Respuesta del API getSesiones:', response);
        
        if (!mounted) return;
        
        // La respuesta puede ser directa o paginada
        const sesionesData = response.results || response;
        const sesiones = Array.isArray(sesionesData) ? sesionesData : [];
        
        console.log('📊 Sesiones procesadas:', sesiones);
        
        const sesionEnCurso = sesiones.find((s: any) => !s.completada);
        setSesionActiva(sesionEnCurso || null);

        // Calcular estadísticas
        if (sesiones.length > 0) {
          const totalSesiones = sesiones.length;
          const completadas = sesiones.filter((s: any) => s.completada);
          const promedioPuntuacion = completadas.length > 0 
            ? completadas.reduce((acc: number, s: { puntuacion: number; preguntas_sesion?: Array<unknown> }) => {
                const totalPreguntas = s.preguntas_sesion?.length || 1;
                return acc + (s.puntuacion / totalPreguntas * 100);
              }, 0) / completadas.length
            : 0;
          const mejorPuntuacion = completadas.length > 0
            ? Math.max(...completadas.map((s: { puntuacion: number; preguntas_sesion?: Array<unknown> }) => {
                const totalPreguntas = s.preguntas_sesion?.length || 1;
                return s.puntuacion / totalPreguntas * 100;
              }))
            : 0;

          const stats: EstadisticasSimulacion = {
            total_sesiones: totalSesiones,
            sesiones_completadas: completadas.length,
            promedio_puntuacion: promedioPuntuacion,
            mejor_puntuacion: mejorPuntuacion,
            racha_actual: 0
          };
          
          setEstadisticas(stats);
          
          console.log('📈 Estadísticas calculadas:', stats);
        } else {
          setEstadisticas({
            total_sesiones: 0,
            sesiones_completadas: 0,
            promedio_puntuacion: 0,
            mejor_puntuacion: 0,
            racha_actual: 0
          });
        }
      } catch (error) {
        console.error('❌ Error al cargar progreso:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    cargarDatos();

    return () => {
      mounted = false;
    };
  }, [user?.username, user?.rol]);



  if (loading) {
    return (
      <Card title="Progreso de Simulaciones">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const calcularProgreso = (sesion: SesionActiva) => {
    const preguntasRespondidas = sesion.preguntas_sesion.filter(p => p.respuesta_estudiante !== null).length;
    const totalPreguntas = sesion.preguntas_sesion.length;
    return { preguntasRespondidas, totalPreguntas, porcentaje: (preguntasRespondidas / totalPreguntas) * 100 };
  };

  return (
    <div className="space-y-6">
      {/* Sesión Activa */}
      {sesionActiva && (
        <Card title="📚 Simulación en Progreso">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {sesionActiva.materia.nombre_display}
                </h3>
                {sesionActiva.plantilla && (
                  <p className="text-sm text-gray-600">{sesionActiva.plantilla.titulo}</p>
                )}
                <p className="text-xs text-gray-500">
                  Iniciada: {new Date(sesionActiva.fecha_inicio).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Puntuación actual</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {sesionActiva.puntuacion}/{sesionActiva.preguntas_sesion.length}
                </div>
              </div>
            </div>

            {/* Barra de progreso */}
            {(() => {
              const { preguntasRespondidas, totalPreguntas, porcentaje } = calcularProgreso(sesionActiva);
              return (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progreso</span>
                    <span className="font-medium">{preguntasRespondidas}/{totalPreguntas} preguntas</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <span className="text-lg font-semibold text-indigo-600">{porcentaje.toFixed(1)}% Completado</span>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-center pt-2">
              <button 
                onClick={() => window.location.href = `/simulacion/continuar/${sesionActiva.id}`}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                🎯 Continuar Simulación
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Estadísticas Generales */}
      {estadisticas && (
        <Card title="📊 Mis Estadísticas">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.sesiones_completadas}</div>
              <div className="text-sm text-blue-800">Simulaciones Completadas</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{estadisticas.mejor_puntuacion.toFixed(1)}%</div>
              <div className="text-sm text-green-800">Mejor Puntuación</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{estadisticas.promedio_puntuacion.toFixed(1)}%</div>
              <div className="text-sm text-purple-800">Promedio General</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{estadisticas.total_sesiones}</div>
              <div className="text-sm text-orange-800">Total Intentos</div>
            </div>
          </div>
        </Card>
      )}

      {/* Mensaje si no hay actividad */}
      {!sesionActiva && (!estadisticas || estadisticas.total_sesiones === 0) && (
        <Card title="🎯 Empieza tu Preparación">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Aún no has comenzado ninguna simulación!
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza a practicar con nuestras simulaciones del examen Saber 11 para mejorar tu rendimiento.
            </p>
            <button 
              onClick={() => window.location.href = '/simulacion'}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              🚀 Comenzar Primera Simulación
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SimulacionProgress;