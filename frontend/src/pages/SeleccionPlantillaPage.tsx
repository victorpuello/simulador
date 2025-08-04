import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { simulacionService } from '../services/api';
import { useNotifications } from '../store';

interface Plantilla {
  id: number;
  titulo: string;
  descripcion: string;
  cantidad_preguntas: number;
}

interface Materia {
  id: number;
  nombre_display: string;
  plantillas?: Plantilla[];
}

const SeleccionPlantillaPage: React.FC = () => {
  const { materiaId } = useParams<{ materiaId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  const [materia, setMateria] = useState<Materia | null>(null);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<number | null>(null);

  useEffect(() => {
    if (materiaId) {
      cargarMateriaYPlantillas();
    }
  }, [materiaId]);

  const cargarMateriaYPlantillas = async () => {
    try {
      setLoading(true);
      const materias = await simulacionService.getMateriasDisponibles();
      const materiaEncontrada = materias.find((m: Materia) => m.id === parseInt(materiaId!));
      
      if (materiaEncontrada) {
        setMateria(materiaEncontrada);
        setPlantillas(materiaEncontrada.plantillas || []);
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Materia no encontrada',
          duration: 3000,
        });
        navigate('/simulacion');
      }
    } catch (error) {
      console.error('Error al cargar materia:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar la información de la materia',
        duration: 5000,
      });
      navigate('/simulacion');
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarPlantilla = (plantillaId: number) => {
    setPlantillaSeleccionada(plantillaId);
  };

  const handleIniciarSimulacion = () => {
    if (!plantillaSeleccionada) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Debes seleccionar una simulación',
        duration: 3000,
      });
      return;
    }

    // Navegar a la simulación con la plantilla seleccionada
    navigate(`/simulacion/${materiaId}/${plantillaSeleccionada}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Cargando simulaciones...
          </h3>
        </div>
      </div>
    );
  }

  if (!materia) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Materia no encontrada
          </h3>
          <button
            onClick={() => navigate('/simulacion')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Encabezado */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            🎯 Selecciona tu Simulación
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Elige la simulación que deseas realizar para {materia.nombre_display}
          </p>
        </div>

        {/* Grid de plantillas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {plantillas.map((plantilla) => (
            <Card
              key={plantilla.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-2 ${
                plantillaSeleccionada === plantilla.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div 
                onClick={() => handleSeleccionarPlantilla(plantilla.id)}
                className="p-4 sm:p-6 h-full flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl sm:text-3xl">📝</div>
                  {plantillaSeleccionada === plantilla.id && (
                    <div className="flex items-center text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-1 text-xs font-medium">Seleccionada</span>
                    </div>
                  )}
                </div>
                
                {/* Título */}
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900 line-clamp-2">
                  {plantilla.titulo}
                </h3>
                
                {/* Descripción */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                  {plantilla.descripcion}
                </p>

                {/* Información */}
                <div className="mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {plantilla.cantidad_preguntas} preguntas
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {materia.nombre_display}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Mensaje si no hay plantillas */}
        {plantillas.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="mx-auto max-w-md">
              <div className="text-6xl sm:text-8xl mb-4">📚</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                No hay simulaciones disponibles
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mb-6">
                En este momento no hay simulaciones activas para {materia.nombre_display}. 
                Contacta a tu profesor para que active simulaciones.
              </p>
              <button
                onClick={() => navigate('/simulacion')}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        {plantillas.length > 0 && (
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => navigate('/simulacion')}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancelar
            </button>
            <button
              onClick={handleIniciarSimulacion}
              disabled={!plantillaSeleccionada}
              className="px-6 py-3 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Iniciar Simulación
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeleccionPlantillaPage; 