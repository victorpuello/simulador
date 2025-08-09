import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../store';
import MateriaCard from '../components/simulacion/MateriaCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { simulacionService } from '../services/api';

interface Plantilla {
  id: number;
  titulo: string;
  descripcion: string;
  cantidad_preguntas: number;
}

interface Materia {
  id: number;
  nombre: string;
  nombre_display: string;
  descripcion?: string;
  activa: boolean;
  preguntas_disponibles: number;
  plantillas_disponibles: number;
  plantillas?: Plantilla[];
}

interface SimulacionCompletada {
  materia_id: number;
  total_preguntas: number;
  mejor_puntaje: number;
}

const MATERIAS_CONFIG = {
  'Matemáticas': {
    icono: '🔢',
    color: 'blue',
    descripcion: 'Prueba tus habilidades matemáticas y resolución de problemas'
  },
  'Lectura Crítica': {
    icono: '📚',
    color: 'purple',
    descripcion: 'Evalúa tu comprensión lectora y análisis de textos'
  },
  'Ciencias Naturales': {
    icono: '🧪',
    color: 'green',
    descripcion: 'Pon a prueba tus conocimientos científicos'
  },
  'Ciencias Sociales': {
    icono: '🌍',
    color: 'orange',
    descripcion: 'Demuestra tu comprensión de la sociedad y la historia'
  },
  'Inglés': {
    icono: '🌐',
    color: 'indigo',
    descripcion: 'Evalúa tu nivel de inglés como segunda lengua'
  }
};

const SimulacionPage: React.FC = () => {
  const navigate = useNavigate();
  // const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [simulacionesCompletadas, setSimulacionesCompletadas] = useState<SimulacionCompletada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar materias disponibles para simulación
      const materias = await simulacionService.getMateriasDisponibles();
      setMaterias(materias);

      // Cargar simulaciones completadas
      const response = await simulacionService.getSesiones();
      const sesionesData = (response as unknown as { results?: unknown[] }).results || (response as unknown as unknown[]);
      const sesiones: Array<{ completada: boolean; materia: { id: number }; preguntas_sesion?: unknown[]; puntuacion: number }> = Array.isArray(sesionesData) ? sesionesData as Array<{ completada: boolean; materia: { id: number }; preguntas_sesion?: unknown[]; puntuacion: number }> : [];
      
      const simulaciones = sesiones
        .filter((s) => s.completada)
        .map((s) => ({
          materia_id: s.materia.id,
          total_preguntas: Array.isArray(s.preguntas_sesion) ? s.preguntas_sesion.length : 0,
          mejor_puntaje: Array.isArray(s.preguntas_sesion) && s.preguntas_sesion.length > 0 ? (s.puntuacion / s.preguntas_sesion.length) * 100 : 0
        }));
      setSimulacionesCompletadas(simulaciones);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las materias disponibles',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Inicio rápido: continuar sesión activa o crear una nueva y navegar
  const handleStartQuick = async (materiaId: number, plantillaId?: number) => {
    try {
      // 1) Verificar sesión activa para la materia
      const verif = await simulacionService.verificarSesionActiva(materiaId);
      if (verif.tiene_sesion_activa && verif.sesion?.id) {
        navigate(`/simulacion/activa/${verif.sesion.id}`);
        return;
      }

      // 2) Crear sesión nueva (usar plantilla si llega)
      const nueva = await simulacionService.crearSesion({
        materia: materiaId,
        ...(plantillaId ? { plantilla: plantillaId } : {}),
      });

      // 3) Navegar a la sesión activa recién creada
      navigate(`/simulacion/activa/${nueva.id}`);
    } catch (e) {
      console.error('Error inicio rápido:', e);
      addNotification({
        type: 'error',
        title: 'No se pudo iniciar la simulación',
        message: 'Intenta nuevamente en unos segundos.',
        duration: 4000,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="animate-pulse">
            <div className="text-6xl sm:text-8xl mb-6">📚</div>
          </div>
          <LoadingSpinner />
          <h3 className="mt-6 text-lg sm:text-xl font-semibold text-gray-900">
            Cargando simulaciones
          </h3>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Estamos preparando las mejores simulaciones para ti...
          </p>
          <div className="mt-6 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Encabezado */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            🎯 Simulaciones Disponibles
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto sm:mx-0">
            Selecciona una materia para comenzar tu simulación del examen Saber 11 y pon a prueba tus conocimientos
          </p>
        </div>

        {/* Grid de materias - Responsive mejorado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {materias.map((materia) => {
            const config = MATERIAS_CONFIG[materia.nombre_display as keyof typeof MATERIAS_CONFIG];
            const simulacionCompletada = simulacionesCompletadas.find(
              s => s.materia_id === materia.id
            );

            return (
              <MateriaCard
                key={materia.id}
                id={materia.id}
                nombre={materia.nombre_display}
                icono={config?.icono || '📝'}
                color={config?.color || 'gray'}
                descripcion={config?.descripcion || 'Pon a prueba tus conocimientos'}
                completada={!!simulacionCompletada}
                totalPreguntas={simulacionCompletada?.total_preguntas}
                mejorPuntaje={simulacionCompletada?.mejor_puntaje}
                plantillas={materia.plantillas || []}
                preguntasDisponibles={materia.preguntas_disponibles}
                onStart={handleStartQuick}
              />
            );
          })}
        </div>

        {/* Mensaje si no hay materias */}
        {materias.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="mx-auto max-w-md">
              <div className="text-6xl sm:text-8xl mb-4">📚</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                No hay simulaciones disponibles
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mb-6">
                En este momento no hay simulaciones activas. Contacta a tu profesor para que active simulaciones.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                🔄 Actualizar página
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulacionPage;