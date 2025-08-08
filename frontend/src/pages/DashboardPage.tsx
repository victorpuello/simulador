import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AccesoRapidoSimulaciones from '../components/dashboard/AccesoRapidoSimulaciones';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleIniciarSimulacion = () => {
    navigate('/simulacion/1'); // Iniciar con matemáticas por defecto
  };

  const handleVerReportes = () => {
    navigate('/reportes');
  };

  const handleEditarPerfil = () => {
    navigate('/perfil');
  };

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

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="transform hover:scale-105 transition-transform duration-200">
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {user?.racha_actual || 0}
            </div>
            <div className="text-sm font-medium text-gray-600">Días de racha</div>
            <div className="mt-2 text-xs text-gray-500">🔥 Mantén tu racha diaria</div>
          </div>
        </Card>

        <Card className="transform hover:scale-105 transition-transform duration-200">
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-success-600 mb-2">
              {user?.puntos_totales || 0}
            </div>
            <div className="text-sm font-medium text-gray-600">Puntos totales</div>
            <div className="mt-2 text-xs text-gray-500">⭐ Sigue acumulando puntos</div>
          </div>
        </Card>

        <Card className="transform hover:scale-105 transition-transform duration-200">
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-secondary-600 mb-2">
              {user?.rol_display}
            </div>
            <div className="text-sm font-medium text-gray-600">Tu rol</div>
            <div className="mt-2 text-xs text-gray-500">👤 {user?.rol === 'estudiante' ? 'Estudiante activo' : 'Docente activo'}</div>
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
    </div>
  );
};

export default DashboardPage; 