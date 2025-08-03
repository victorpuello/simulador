import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  AcademicCapIcon, 
  ChartBarIcon, 
  UserIcon,
  BookOpenIcon,
  TrophyIcon,
  CogIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/dashboard',
    },
    {
      name: 'Perfil',
      href: '/perfil',
      icon: UserIcon,
      current: location.pathname === '/perfil',
    },
  ];

  // Simulación solo para estudiantes
  if (user?.rol === 'estudiante') {
    navigation.splice(1, 0, {
      name: 'Simulación',
      href: '/simulacion',
      icon: AcademicCapIcon,
      current: location.pathname === '/simulacion',
    });
    navigation.splice(2, 0, {
      name: 'Reportes',
      href: '/reportes',
      icon: ChartBarIcon,
      current: location.pathname === '/reportes',
    });
  }

  // Agregar elementos específicos para docentes
  if (user?.rol === 'docente') {
    navigation.splice(2, 0, {
      name: 'Gestión de Preguntas',
      href: '/gestion-preguntas',
      icon: DocumentTextIcon,
      current: location.pathname === '/gestion-preguntas',
    });
    navigation.splice(3, 0, {
      name: 'Clases',
      href: '/clases',
      icon: BookOpenIcon,
      current: location.pathname === '/clases',
    });
    navigation.splice(4, 0, {
      name: 'Gamificación',
      href: '/gamificacion',
      icon: TrophyIcon,
      current: location.pathname === '/gamificacion',
    });
  }

  // Gestión de Usuarios para docentes y administradores
  if (user?.rol === 'docente' || user?.rol === 'admin' || user?.is_staff) {
    navigation.push({
      name: 'Gestión de Usuarios',
      href: '/gestion-usuarios',
      icon: UserIcon,
      current: location.pathname === '/gestion-usuarios',
    });
  }

  // Administración solo para administradores del sistema (otras funciones administrativas)
  if (user?.rol === 'admin' || user?.is_staff) {
    navigation.push({
      name: 'Administración',
      href: '/admin',
      icon: CogIcon,
      current: location.pathname === '/admin',
    });
  }

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  item.current
                    ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar; 