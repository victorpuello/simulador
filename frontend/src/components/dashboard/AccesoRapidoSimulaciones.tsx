import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../store';
import { simulacionService } from '../../services/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SesionActiva {
  id: number;
  materia: string;
  materia_display: string;
  materia_id: number;
  fecha_inicio: string;
  progreso: {
    respondidas: number;
    total: number;
    porcentaje: number;
  };
}

interface Materia {
  id: number;
  nombre: string;
  nombre_display: string;
  color: string;
  icono: string;
  preguntasDisponibles: number;
}

const AccesoRapidoSimulaciones: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  const [sesionesActivas, setSesionesActivas] = useState<SesionActiva[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar sesiones activas y materias en paralelo
      const [sesionesResponse, materiasResponse] = await Promise.all([
        simulacionService.verificarSesionActiva(),
        simulacionService.getMateriasDisponibles()
      ]);
      
      if (sesionesResponse.tiene_sesiones_activas && sesionesResponse.sesiones) {
        setSesionesActivas(sesionesResponse.sesiones);
      }
      
      setMaterias(materiasResponse);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos de simulaciones',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleContinuarSesion = (sesion: SesionActiva) => {
    navigate(`/simulacion/activa/${sesion.id}`);
  };

  const handleIniciarNuevaSimulacion = (materia: Materia) => {
    navigate(`/simulacion/iniciar/${materia.id}`);
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      '#4F46E5': 'bg-indigo-500 hover:bg-indigo-600',
      '#DC2626': 'bg-red-500 hover:bg-red-600',
      '#059669': 'bg-green-500 hover:bg-green-600',
      '#7C3AED': 'bg-purple-500 hover:bg-purple-600',
      '#EA580C': 'bg-orange-500 hover:bg-orange-600',
    };
    return colorMap[color] || 'bg-blue-500 hover:bg-blue-600';
  };

  const getIconEmoji = (icono: string) => {
    const iconMap: Record<string, string> = {
      'calculator': '🧮',
      'book': '📚',
      'flask': '🧪',
      'globe': '🌍',
      'language': '🌐',
    };
    return iconMap[icono] || '📖';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        🚀 Acceso Rápido a Simulaciones
      </h2>

      {/* Sesiones activas */}
      {sesionesActivas.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            ⏳ Simulaciones en Progreso
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {sesionesActivas.length}
            </span>
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            {sesionesActivas.map((sesion) => (
              <div
                key={sesion.id}
                className="border border-blue-200 rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-900">
                    {sesion.materia_display}
                  </h4>
                  <span className="text-sm text-blue-600 font-medium">
                    {sesion.progreso.porcentaje}% completado
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${sesion.progreso.porcentaje}%` }}
                    />
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    {sesion.progreso.respondidas} de {sesion.progreso.total} preguntas
                  </p>
                </div>
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleContinuarSesion(sesion)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  ▶️ Continuar Simulación
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Materias disponibles */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          ✨ Iniciar Nueva Simulación
        </h3>
        
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {materias.map((materia) => (
            <button
              key={materia.id}
              onClick={() => handleIniciarNuevaSimulacion(materia)}
              className={`${getColorClasses(materia.color)} text-white rounded-lg p-4 text-left transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
            >
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">{getIconEmoji(materia.icono)}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-sm leading-tight">
                    {materia.nombre_display}
                  </h4>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/80">
                  {materia.preguntasDisponibles} preguntas
                </span>
                <span className="text-white font-medium">
                  Iniciar →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Botón para ver todas las opciones */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={() => navigate('/simulacion')}
          className="w-full"
        >
          🎯 Ver Todas las Opciones de Simulación
        </Button>
      </div>

      {/* Tips para el usuario */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="text-sm font-semibold text-yellow-800 mb-1">
          💡 Tips Rápidos:
        </h4>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• Las simulaciones se guardan automáticamente</li>
          <li>• Puedes pausar y continuar cuando quieras</li>
          <li>• Solo una simulación activa por materia</li>
        </ul>
      </div>
    </Card>
  );
};

export default AccesoRapidoSimulaciones;