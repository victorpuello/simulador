import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../store';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SeleccionPrueba from '../components/simulacion/SeleccionPrueba';
import VistaPreviewModal from '../components/simulacion/VistaPreviewModal';

const GestionSimulacionesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [simulacionesCreadas, setSimulacionesCreadas] = useState<Array<{ id: number; titulo?: string; materia_nombre?: string; descripcion?: string; preguntas_especificas: unknown[]; cantidad_preguntas: number; activa: boolean; fecha_creacion: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    isOpen: boolean;
    preguntas: Array<Record<string, unknown>>;
    titulo: string;
  }>({
    isOpen: false,
    preguntas: [],
    titulo: '',
  });

  useEffect(() => {
    if (user?.rol !== 'docente') {
      navigate('/dashboard');
      return;
    }
    cargarSimulaciones();
  }, [navigate, user?.rol]);

  const cargarSimulaciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/simulacion/plantillas/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Asegurar que data sea un array
        const simulaciones = Array.isArray(data) ? data : data.results || [];
        setSimulacionesCreadas(simulaciones);
        console.log('Simulaciones cargadas:', simulaciones);
      } else {
        console.error('Error al cargar simulaciones:', response.status);
      }
    } catch (error) {
      console.error('Error al cargar simulaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVistaPrevia = async (simulacionId: number, titulo: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/simulacion/plantillas/${simulacionId}/vista_previa/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const preguntas = await response.json();
        setPreviewData({
          isOpen: true,
          preguntas,
          titulo,
        });
      } else {
        throw new Error('No se pudo obtener la vista previa');
      }
    } catch (error) {
      console.error('Error al obtener vista previa:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo obtener la vista previa',
        duration: 5000,
      });
    }
  };

  const handleToggleActiva = async (simulacionId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/simulacion/plantillas/${simulacionId}/toggle_activa/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        addNotification({
          type: 'success',
          title: 'Estado actualizado',
          message: `La simulación ha sido ${data.activa ? 'activada' : 'desactivada'}`,
          duration: 3000,
        });
        cargarSimulaciones();
      } else {
        throw new Error('No se pudo cambiar el estado');
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo cambiar el estado de la simulación',
        duration: 5000,
      });
    }
  };

  const handleCrearSimulacion = async (params: { materia: number; cantidad_preguntas?: number; preguntasIds?: number[] }) => {
    try {
      const { materia: materiaId, cantidad_preguntas: numPreguntas = 10, preguntasIds } = params;
      const token = localStorage.getItem('access_token');
      
      // Obtener el nombre de la materia
      const materiaResponse = await fetch(`/api/core/materias/${materiaId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!materiaResponse.ok) {
        throw new Error('No se pudo obtener la información de la materia');
      }
      
      const materiaData = await materiaResponse.json();
      const requestData = {
        materia: materiaId,
        titulo: `Simulación de ${materiaData.nombre_display}`,
        descripcion: preguntasIds ? 'Simulación con preguntas específicas' : 'Simulación con preguntas aleatorias',
        cantidad_preguntas: numPreguntas,
        preguntas_especificas: preguntasIds || [],
        activa: true,
      };

      console.log('Enviando datos:', requestData);

      const response = await fetch('/api/simulacion/plantillas/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Simulación creada',
          message: 'La simulación ha sido creada exitosamente',
          duration: 3000,
        });
        cargarSimulaciones();
      } else {
        const errorData = await response.json();
        console.error('Error al crear simulación:', response.status, errorData);
        addNotification({
          type: 'error',
          title: 'Error',
          message: errorData.detail || errorData.message || 'No se pudo crear la simulación',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error al crear simulación:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Ocurrió un error al crear la simulación',
        duration: 5000,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Simulaciones
        </h1>
        <p className="mt-2 text-gray-600">
          Crea y administra simulaciones para tus estudiantes
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Panel de creación */}
        <div className="xl:sticky xl:top-0">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Crear Nueva Simulación
              </h2>
              <SeleccionPrueba
                onSeleccionarPrueba={handleCrearSimulacion}
                isDocente={true}
              />
            </div>
          </Card>
        </div>

        {/* Lista de simulaciones creadas */}
        <div>
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Simulaciones Creadas
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cargarSimulaciones}
                >
                  Actualizar
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
                  <p className="mt-4 text-gray-600">Cargando simulaciones...</p>
                </div>
              ) : simulacionesCreadas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    No hay simulaciones creadas aún
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {simulacionesCreadas.map((simulacion) => (
                    <div
                      key={simulacion.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {simulacion.titulo || simulacion.materia_nombre}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {simulacion.descripcion || 'Sin descripción'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              simulacion.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {simulacion.activa ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                          <span className="inline-flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {simulacion.preguntas_especificas.length > 0
                              ? `${simulacion.preguntas_especificas.length} preguntas específicas`
                              : `${simulacion.cantidad_preguntas} preguntas aleatorias`}
                          </span>
                          <span className="inline-flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(simulacion.fecha_creacion).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex justify-end space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVistaPrevia(simulacion.id, simulacion.titulo || simulacion.materia_nombre)}
                          >
                            Vista previa
                          </Button>
                          <Button
                            variant={simulacion.activa ? 'error' : 'success'}
                            size="sm"
                            onClick={() => handleToggleActiva(simulacion.id, simulacion.activa)}
                          >
                            {simulacion.activa ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      {/* Modal de vista previa */}
      <VistaPreviewModal
        isOpen={previewData.isOpen}
        onClose={() => setPreviewData(prev => ({ ...prev, isOpen: false }))}
        preguntas={previewData.preguntas}
        titulo={previewData.titulo}
      />
    </div>
  );
};

export default GestionSimulacionesPage;