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
  DocumentTextIcon,
  PresentationChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  current: boolean;
  title?: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Secciones del menú (evitar enlaces rotos y mejorar UX con grupos)
  const seccionGeneral: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: location.pathname === '/dashboard' },
    { name: user?.rol === 'docente' ? 'Crear Simulación' : 'Simulación', href: '/simulacion', icon: AcademicCapIcon, current: location.pathname.startsWith('/simulacion') },
    // Reportes: mostrar versión adecuada según rol
    ...(user?.rol === 'docente'
      ? [{ name: 'Reportes Docente', href: '/reportes/docente', icon: ChartBarIcon, current: location.pathname.startsWith('/reportes/docente') }]
      : [{ name: 'Reportes', href: '/reportes', icon: ChartBarIcon, current: location.pathname.startsWith('/reportes') }]
    ),
    { name: 'Perfil', href: '/perfil', icon: UserIcon, current: location.pathname === '/perfil' },
  ];

  const seccionDocente: NavItem[] = [];
  if (user?.rol === 'docente') {
    seccionDocente.push(
      { name: 'Gestión de Preguntas', href: '/gestion-preguntas', icon: DocumentTextIcon, current: location.pathname.startsWith('/gestion-preguntas') },
      // Enlaces que antes estaban rotos (/clases, /gamificacion) se omiten hasta que existan rutas
      { name: 'Gestión de Usuarios', href: '/gestion-usuarios', icon: UserIcon, current: location.pathname.startsWith('/gestion-usuarios') },
      { name: 'Métricas', href: '/metricas', icon: PresentationChartBarIcon, current: location.pathname.startsWith('/metricas') },
    );
  }

  const seccionAdmin: NavItem[] = [];
  if (user?.rol === 'admin' || user?.is_staff) {
    seccionAdmin.push({ name: 'Administración', href: '/admin', icon: CogIcon, current: location.pathname.startsWith('/admin') });
  }

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200">
      <nav className="mt-5 px-2" aria-label="Sidebar">
        {/* General */}
        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">General</div>
        <div className="space-y-1 mb-4">
          {seccionGeneral.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                aria-current={item.current ? 'page' : undefined}
                title={item.name}
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

        {/* Docente */}
        {seccionDocente.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Docente</div>
            <div className="space-y-1 mb-4">
              {seccionDocente.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    title={item.name}
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
          </>
        )}

        {/* Administración */}
        {seccionAdmin.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Administración</div>
            <div className="space-y-1">
              {seccionAdmin.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    title={item.name}
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
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar; 