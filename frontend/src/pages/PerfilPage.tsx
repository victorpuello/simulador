import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import SimulacionProgress from '../components/profile/SimulacionProgress';
import SesionesActivas from '../components/profile/SesionesActivas';

const PerfilPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600">
          Aquí puedes ver tu información personal y el progreso de tus simulaciones.
        </p>
      </div>

      {/* Simulaciones activas - Solo para estudiantes */}
      {user?.rol === 'estudiante' && (
        <SesionesActivas />
      )}

      {/* Progreso de Simulaciones - Solo para estudiantes */}
      {user?.rol === 'estudiante' && (
        <SimulacionProgress />
      )}

      <Card title="👤 Información del Usuario">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <p className="mt-1 text-sm text-gray-900">{user?.first_name || 'No especificado'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido</label>
              <p className="mt-1 text-sm text-gray-900">{user?.last_name || 'No especificado'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Usuario</label>
              <p className="mt-1 text-sm text-gray-900">{user?.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rol</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">
                {user?.rol === 'estudiante' ? '🎓 Estudiante' : 
                 user?.rol === 'docente' ? '👨‍🏫 Docente' : 
                 user?.rol === 'admin' ? '⚡ Administrador' : user?.rol}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Puntos totales</label>
              <p className="mt-1 text-sm text-gray-900">
                <span className="inline-flex items-center">
                  <span className="mr-1">🏆</span>
                  {user?.puntos_totales || 0} puntos
                </span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card title="⚙️ Funcionalidad en Desarrollo">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔧</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Edición de perfil en desarrollo
          </h3>
          <p className="text-gray-600">
            Pronto podrás editar tu información personal, cambiar tu avatar y configurar tus preferencias.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PerfilPage; 