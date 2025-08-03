import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  UserGroupIcon, 
  UserMinusIcon,
  CalendarIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useNotifications } from '../../store';
import { usuariosService } from '../../services/usuarios';

// Definir tipos localmente para evitar problemas de importación
type UsuarioStatsType = {
  total_usuarios: number;
  usuarios_activos: number;
  usuarios_inactivos: number;
  por_rol: Record<string, number>;
  nuevos_este_mes: number;
  actividad_reciente: number;
  top_usuarios: Array<{
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    puntos_totales: number;
  }>;
};

const UsuarioStats: React.FC = () => {
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState<UsuarioStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarStats = async () => {
    try {
      setLoading(true);
      const data = await usuariosService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las estadísticas'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-500">No se pudieron cargar las estadísticas</p>
        </div>
      </Card>
    );
  }

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin': return 'text-red-600 bg-red-100';
      case 'docente': return 'text-blue-600 bg-blue-100';
      case 'estudiante': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRolIcon = (rol: string) => {
    switch (rol) {
      case 'admin': return '👑';
      case 'docente': return '👨‍🏫';
      case 'estudiante': return '👨‍🎓';
      default: return '👤';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Estadísticas de Usuarios
        </h2>
        <p className="text-gray-600">
          Resumen general del sistema de usuarios
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_usuarios}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.usuarios_activos}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserMinusIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Usuarios Inactivos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.usuarios_inactivos}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Nuevos Este Mes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.nuevos_este_mes}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Estadísticas por rol */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Distribución por Rol
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats.por_rol).map(([rol, count]) => (
            <div key={rol} className="flex items-center p-4 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0 mr-3">
                <span className="text-2xl">{getRolIcon(rol)}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {rol === 'estudiante' ? 'Estudiantes' : rol === 'docente' ? 'Docentes' : 'Administradores'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">
                  {((count / stats.total_usuarios) * 100).toFixed(1)}% del total
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Actividad reciente */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Actividad Reciente
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <ClockIcon className="h-4 w-4 mr-1" />
            Últimos 7 días
          </div>
        </div>
        
        <div className="flex items-center p-4 bg-blue-50 rounded-lg">
          <div className="flex-shrink-0 mr-4">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Usuarios con actividad reciente
            </p>
            <p className="text-2xl font-bold text-blue-600">{stats.actividad_reciente}</p>
            <p className="text-sm text-gray-500">
              {stats.total_usuarios > 0 
                ? `${((stats.actividad_reciente / stats.total_usuarios) * 100).toFixed(1)}% de usuarios activos`
                : 'Sin datos'
              }
            </p>
          </div>
        </div>
      </Card>

      {/* Top usuarios */}
      {stats.top_usuarios.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Top Usuarios por Puntos
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <TrophyIcon className="h-4 w-4 mr-1" />
              Mejores puntuaciones
            </div>
          </div>
          
          <div className="space-y-3">
            {stats.top_usuarios.map((usuario, index) => (
              <div key={usuario.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0 mr-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {usuario.first_name} {usuario.last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{usuario.username}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {usuario.puntos_totales}
                  </p>
                  <p className="text-xs text-gray-500">puntos</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Resumen */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Resumen del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Estado General</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Usuarios activos:</span>
                <span className="text-sm font-medium text-green-600">
                  {stats.usuarios_activos} ({((stats.usuarios_activos / stats.total_usuarios) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Usuarios inactivos:</span>
                <span className="text-sm font-medium text-red-600">
                  {stats.usuarios_inactivos} ({((stats.usuarios_inactivos / stats.total_usuarios) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Nuevos este mes:</span>
                <span className="text-sm font-medium text-blue-600">
                  {stats.nuevos_este_mes}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Actividad</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Actividad reciente:</span>
                <span className="text-sm font-medium text-blue-600">
                  {stats.actividad_reciente} usuarios
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tasa de actividad:</span>
                <span className="text-sm font-medium text-blue-600">
                  {stats.total_usuarios > 0 
                    ? `${((stats.actividad_reciente / stats.total_usuarios) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UsuarioStats; 