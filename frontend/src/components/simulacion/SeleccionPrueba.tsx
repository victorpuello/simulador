import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import ConfirmacionSesionModal from '../ui/ConfirmacionSesionModal';
import SeleccionPreguntas from './SeleccionPreguntas';
import { simulacionService } from '../../services/api';
import { useNotifications } from '../../store';

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

interface Props {
  onSeleccionarPrueba?: (params: { materia: number; cantidad_preguntas?: number; plantilla?: number; preguntasIds?: number[]; forzar_reinicio?: boolean }) => void;
  isDocente?: boolean;
}

const SeleccionPrueba: React.FC<Props> = ({ onSeleccionarPrueba, isDocente = false }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  // Estado local
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<number | null>(null);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<number | null>(null);
  const [numPreguntas, setNumPreguntas] = useState(10);
  const [usarPreguntasEspecificas, setUsarPreguntasEspecificas] = useState(false);
  const [mostrarSeleccionPreguntas, setMostrarSeleccionPreguntas] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estado para modal de sesión activa
  const [mostrarModalSesion, setMostrarModalSesion] = useState(false);
  const [sesionActivaDetalle, setSesionActivaDetalle] = useState<any>(null);
  const [accionPendiente, setAccionPendiente] = useState<{materia: number; cantidad_preguntas?: number; plantilla?: number} | null>(null);

  // Cargar materias disponibles
  const cargarMaterias = async () => {
    try {
      setLoading(true);
      const response = await simulacionService.getMateriasDisponibles();
      setMaterias(response);
    } catch (error) {
      console.error('Error al cargar materias:', error);
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

  useEffect(() => {
    cargarMaterias();
  }, []);

  // Obtener plantillas de la materia seleccionada
  const plantillasDisponibles = materiaSeleccionada 
    ? materias.find(m => m.id === materiaSeleccionada)?.plantillas || []
    : [];

  const handleIniciarSimulacion = async () => {
    if (!materiaSeleccionada) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Debes seleccionar una materia',
        duration: 3000,
      });
      return;
    }

    // Para estudiantes, verificar que hay plantillas disponibles
    if (!isDocente && plantillasDisponibles.length === 0) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No hay simulaciones disponibles para esta materia',
        duration: 3000,
      });
      return;
    }

    // Para estudiantes, verificar que se seleccionó una plantilla
    if (!isDocente && !plantillaSeleccionada) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Debes seleccionar una simulación',
        duration: 3000,
      });
      return;
    }

    // Verificar sesión activa para esta materia
    try {
      const verificacion = await simulacionService.verificarSesionActiva(materiaSeleccionada);
      if (verificacion.tiene_sesion_activa && verificacion.sesion) {
        setSesionActivaDetalle(verificacion.sesion);
        setAccionPendiente({ 
          materia: materiaSeleccionada, 
          cantidad_preguntas: isDocente ? numPreguntas : undefined,
          plantilla: !isDocente ? plantillaSeleccionada || undefined : undefined
        });
        setMostrarModalSesion(true);
        return;
      }
    } catch (error) {
      console.error('Error al verificar sesión activa:', error);
    }

    // Proceder normalmente
    if (isDocente && usarPreguntasEspecificas) {
      setMostrarSeleccionPreguntas(true);
    } else if (onSeleccionarPrueba) {
              onSeleccionarPrueba({
          materia: materiaSeleccionada,
          cantidad_preguntas: isDocente ? numPreguntas : undefined,
          plantilla: !isDocente ? plantillaSeleccionada || undefined : undefined
        });
    } else {
      navigate(`/simulacion/${materiaSeleccionada}`);
    }
  };

  // Handlers para el modal de sesión activa
  const handleContinuarSesionActiva = () => {
    if (sesionActivaDetalle) {
      navigate(`/simulacion/activa/${sesionActivaDetalle.id}`);
    }
    setMostrarModalSesion(false);
  };

  const handleReiniciarSesion = () => {
    setMostrarModalSesion(false);
    if (accionPendiente && onSeleccionarPrueba) {
      onSeleccionarPrueba({
        materia: accionPendiente.materia,
        cantidad_preguntas: accionPendiente.cantidad_preguntas,
        plantilla: accionPendiente.plantilla,
        forzar_reinicio: true
      });
    }
  };

  const handleCerrarModalSesion = () => {
    setMostrarModalSesion(false);
    setSesionActivaDetalle(null);
    setAccionPendiente(null);
  };

  if (mostrarSeleccionPreguntas && materiaSeleccionada) {
    return (
      <SeleccionPreguntas
        materiaId={materiaSeleccionada}
        onSeleccionarPreguntas={(preguntasIds) => {
          if (onSeleccionarPrueba) {
            onSeleccionarPrueba({
              materia: materiaSeleccionada,
              cantidad_preguntas: preguntasIds.length,
              preguntasIds: preguntasIds
            });
          }
        }}
        onCancelar={() => setMostrarSeleccionPreguntas(false)}
      />
    );
  }

  return (
    <>
      {/* Modal de confirmación de sesión activa */}
      <ConfirmacionSesionModal
        isOpen={mostrarModalSesion}
        sesion={sesionActivaDetalle}
        onContinuar={handleContinuarSesionActiva}
        onReiniciar={handleReiniciarSesion}
        onCerrar={handleCerrarModalSesion}
      />
      
      <Card className="max-w-2xl mx-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Selecciona la prueba a simular
          </h2>

          <div className="space-y-6">
            {/* Selección de materia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Materia
              </label>
              <select
                value={materiaSeleccionada || ''}
                onChange={(e) => {
                  setMateriaSeleccionada(Number(e.target.value));
                  setPlantillaSeleccionada(null); // Reset plantilla al cambiar materia
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Selecciona una materia</option>
                {materias.map((materia) => (
                  <option key={materia.id} value={materia.id}>
                    {materia.nombre_display}
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de plantilla para estudiantes */}
            {!isDocente && materiaSeleccionada && plantillasDisponibles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Simulación a realizar
                </label>
                <select
                  value={plantillaSeleccionada || ''}
                  onChange={(e) => setPlantillaSeleccionada(Number(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Selecciona una simulación</option>
                  {plantillasDisponibles.map((plantilla) => (
                    <option key={plantilla.id} value={plantilla.id}>
                      {plantilla.titulo} ({plantilla.cantidad_preguntas} preguntas)
                    </option>
                  ))}
                </select>
                {plantillaSeleccionada && (
                  <p className="mt-1 text-sm text-gray-500">
                    {plantillasDisponibles.find(p => p.id === plantillaSeleccionada)?.descripcion}
                  </p>
                )}
              </div>
            )}

            {/* Opciones de docente */}
            {isDocente && (
              <>
                {/* Selector de modo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modo de selección
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!usarPreguntasEspecificas}
                        onChange={() => setUsarPreguntasEspecificas(false)}
                        className="mr-2"
                      />
                      <span>Seleccionar número de preguntas aleatorias</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={usarPreguntasEspecificas}
                        onChange={() => setUsarPreguntasEspecificas(true)}
                        className="mr-2"
                      />
                      <span>Seleccionar preguntas específicas</span>
                    </label>
                  </div>
                </div>

                {/* Número de preguntas (solo si no se seleccionan específicas) */}
                {!usarPreguntasEspecificas && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de preguntas
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={numPreguntas}
                      onChange={(e) => setNumPreguntas(Math.max(5, Math.min(50, Number(e.target.value))))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Mínimo 5, máximo 50 preguntas
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Botón de inicio */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => navigate('/simulacion')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleIniciarSimulacion}
                disabled={loading || !materiaSeleccionada || (!isDocente && !plantillaSeleccionada)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Cargando...' : 'Iniciar Simulación'}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

export default SeleccionPrueba;