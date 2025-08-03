import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

type TabOption = 'estadisticas' | 'usuarios' | 'sistema';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [tabActiva, setTabActiva] = useState<TabOption>('estadisticas');

  // Verificar permisos de acceso
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Solo administradores del sistema pueden acceder
  if (user.rol !== 'admin' && !user.is_staff) {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs: { key: TabOption; label: string; icon: string }[] = [
    { key: 'estadisticas', label: 'Estadísticas del Sistema', icon: '📊' },
    { key: 'usuarios', label: 'Gestión de Usuarios', icon: '👥' },
    { key: 'sistema', label: 'Configuración', icon: '⚙️' },
  ];

  const renderContenido = () => {
    switch (tabActiva) {
      case 'estadisticas':
        return (
          <Card title="Estadísticas Generales del Sistema">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900">Usuarios</h3>
                  <p className="text-3xl font-bold text-blue-600">-</p>
                  <p className="text-sm text-blue-600">Total registrados</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900">Simulaciones</h3>
                  <p className="text-3xl font-bold text-green-600">-</p>
                  <p className="text-sm text-green-600">Completadas este mes</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900">Preguntas</h3>
                  <p className="text-3xl font-bold text-purple-600">-</p>
                  <p className="text-sm text-purple-600">En el banco</p>
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-gray-600 mb-4">
                  Panel de estadísticas completas en desarrollo. Próximamente incluirá:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Métricas de uso detalladas por fecha</li>
                  <li>Análisis de rendimiento por materia</li>
                  <li>Reportes de actividad de docentes</li>
                  <li>Estadísticas de engagement estudiantil</li>
                  <li>Análisis de dificultad de preguntas</li>
                </ul>
              </div>
            </div>
          </Card>
        );
      
      case 'usuarios':
        return (
          <Card title="Gestión de Usuarios">
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-yellow-600 text-xl mr-3">⚠️</div>
                  <div>
                    <h4 className="font-medium text-yellow-800">Funcionalidad en Desarrollo</h4>
                    <p className="text-sm text-yellow-700">Esta sección estará disponible próximamente.</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Funcionalidades Planificadas:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">👥 Administración de Usuarios</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Ver lista completa de usuarios</li>
                      <li>• Crear cuentas de estudiantes y docentes</li>
                      <li>• Editar perfiles y permisos</li>
                      <li>• Activar/suspender cuentas</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">📊 Reportes de Usuarios</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Estadísticas de actividad</li>
                      <li>• Exportar listados</li>
                      <li>• Histórico de accesos</li>
                      <li>• Análisis de uso</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );

      case 'sistema':
        return (
          <Card title="Configuración del Sistema">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-blue-600 text-xl mr-3">ℹ️</div>
                  <div>
                    <h4 className="font-medium text-blue-800">Panel de Configuración</h4>
                    <p className="text-sm text-blue-700">Ajustes globales del sistema en desarrollo.</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">⚙️ Configuraciones Generales</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Parámetros de simulación</li>
                    <li>• Límites de tiempo por pregunta</li>
                    <li>• Configuración de puntajes</li>
                    <li>• Ajustes de notificaciones</li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">🔧 Mantenimiento</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Backup de base de datos</li>
                    <li>• Limpieza de archivos temporales</li>
                    <li>• Monitoreo de rendimiento</li>
                    <li>• Logs del sistema</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">📋 Estado Actual del Sistema</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Versión:</span>
                    <span className="ml-2 font-medium">1.0.0</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Estado:</span>
                    <span className="ml-2 text-green-600 font-medium">Operativo</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Base de datos:</span>
                    <span className="ml-2 text-green-600 font-medium">Conectada</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Almacenamiento:</span>
                    <span className="ml-2 text-green-600 font-medium">OK</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Administración del Sistema
        </h1>
        <p className="text-gray-600">
          Panel de control y configuración general del simulador
        </p>
      </div>

      {/* Navegación por tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTabActiva(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                  tabActiva === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido del tab activo */}
      <div className="min-h-[400px]">
        {renderContenido()}
      </div>

      {/* Información adicional */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <Card title="Información del Usuario">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Usuario:</span>
              <p className="text-gray-900">{user.first_name} {user.last_name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Rol:</span>
              <p className="text-gray-900 capitalize">{user.rol_display || user.rol}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;