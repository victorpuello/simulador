import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { simulacionService } from '../../services/api';
import { useNotifications } from '../../store';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ConfirmacionSesionModal from '../ui/ConfirmacionSesionModal';

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

const SesionesActivas: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [sesiones, setSesiones] = useState<SesionActiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [sesionSeleccionada, setSesionSeleccionada] = useState<SesionActiva | null>(null);

  useEffect(() => {
    cargarSesionesActivas();
  }, []);

  const cargarSesionesActivas = async () => {
    try {
      setLoading(true);
      const response = await simulacionService.verificarSesionActiva();
      
      if (response.tiene_sesiones_activas && response.sesiones) {
        setSesiones(response.sesiones);
      } else {
        setSesiones([]);
      }
    } catch (error) {
      console.error('Error al cargar sesiones activas:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las sesiones activas',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinuarSesion = (sesion: SesionActiva) => {
    setSesionSeleccionada(sesion);
    setMostrarModal(true);
  };

  const handleContinuarDirecto = () => {
    if (sesionSeleccionada) {
      navigate(`/simulacion/activa/${sesionSeleccionada.id}`);
    }
    setMostrarModal(false);
  };

  const handleReiniciarSesion = async () => {
    if (sesionSeleccionada) {
      try {
        // Crear nueva sesión con forzar_reinicio
        await simulacionService.crearSesion({
          materia: sesionSeleccionada.materia_id,
          cantidad_preguntas: 10,
          forzar_reinicio: true
        });

        addNotification({
          type: 'success',
          title: 'Simulación reiniciada',
          message: `Nueva simulación de ${sesionSeleccionada.materia_display} iniciada`,
          duration: 3000
        });

        // Recargar sesiones activas
        await cargarSesionesActivas();
      } catch (error) {
        console.error('Error al reiniciar sesión:', error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo reiniciar la simulación',
          duration: 5000
        });
      }
    }
    setMostrarModal(false);
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

  const getColorPorProgreso = (porcentaje: number) => {
    if (porcentaje === 0) return 'bg-gray-500';
    if (porcentaje < 30) return 'bg-red-500';
    if (porcentaje < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <ConfirmacionSesionModal
        isOpen={mostrarModal}
        sesion={sesionSeleccionada}
        onContinuar={handleContinuarDirecto}
        onReiniciar={handleReiniciarSesion}
        onCerrar={() => setMostrarModal(false)}
      />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            📚 Simulaciones en Progreso
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={cargarSesionesActivas}
          >
            🔄 Actualizar
          </Button>
        </div>

        {sesiones.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">🎯</div>
            <p className="text-gray-500 mb-4">
              No tienes simulaciones en progreso
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/simulacion')}
            >
              Iniciar Nueva Simulación
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sesiones.map((sesion) => (
              <div
                key={sesion.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    {sesion.materia_display}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {formatearFecha(sesion.fecha_inicio)}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progreso</span>
                    <span>
                      {sesion.progreso.respondidas}/{sesion.progreso.total} preguntas
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getColorPorProgreso(sesion.progreso.porcentaje)}`}
                      style={{ width: `${sesion.progreso.porcentaje}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {sesion.progreso.porcentaje}% completado
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleContinuarSesion(sesion)}
                    className="flex-1"
                  >
                    <span className="mr-1">▶️</span>
                    Continuar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSesionSeleccionada(sesion);
                      setMostrarModal(true);
                    }}
                    className="px-3"
                  >
                    ⚙️
                  </Button>
                </div>
              </div>
            ))}

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                💡 Puedes tener simulaciones activas en diferentes materias
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/simulacion')}
              >
                ➕ Iniciar Nueva Simulación
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
};

export default SesionesActivas;