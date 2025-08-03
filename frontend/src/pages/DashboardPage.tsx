import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.first_name}!
        </h1>
        <p className="text-gray-600">
          Aquí puedes ver tu progreso y acceder a todas las funcionalidades.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {user?.racha_actual || 0}
            </div>
            <div className="text-sm text-gray-600">Días de racha</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-success-600">
              {user?.puntos_totales || 0}
            </div>
            <div className="text-sm text-gray-600">Puntos totales</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-600">
              {user?.rol_display}
            </div>
            <div className="text-sm text-gray-600">Tu rol</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning-600">
              Próximamente
            </div>
            <div className="text-sm text-gray-600">Más estadísticas</div>
          </div>
        </Card>
      </div>

      <Card title="Acciones rápidas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleIniciarSimulacion}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">🎯 Nueva simulación</div>
              <div className="text-sm text-gray-600">Comenzar práctica de Matemáticas</div>
            </div>
          </button>

          <button 
            onClick={handleVerReportes}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">📊 Ver reportes</div>
              <div className="text-sm text-gray-600">Tu progreso y estadísticas</div>
            </div>
          </button>

          <button 
            onClick={handleEditarPerfil}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">👤 Editar perfil</div>
              <div className="text-sm text-gray-600">Configuración de cuenta</div>
            </div>
          </button>
        </div>
      </Card>

      <Card title="Materias disponibles">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/simulacion/1')}
            className="h-20 flex flex-col items-center justify-center"
          >
            <span className="text-2xl mb-1">🔢</span>
            <span>Matemáticas</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/simulacion/2')}
            className="h-20 flex flex-col items-center justify-center"
          >
            <span className="text-2xl mb-1">📚</span>
            <span>Lenguaje</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/simulacion/3')}
            className="h-20 flex flex-col items-center justify-center"
          >
            <span className="text-2xl mb-1">🧪</span>
            <span>Ciencias</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/simulacion/4')}
            className="h-20 flex flex-col items-center justify-center"
          >
            <span className="text-2xl mb-1">🌍</span>
            <span>Sociales</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage; 