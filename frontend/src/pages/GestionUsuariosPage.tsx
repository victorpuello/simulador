import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import UsuarioList from '../components/admin/UsuarioList';
import UsuarioForm from '../components/admin/UsuarioForm';
import UsuarioStats from '../components/admin/UsuarioStats';
// Definir tipo localmente para evitar problemas de importación
type Usuario = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: 'estudiante' | 'docente' | 'admin';
  rol_display: string;
  nombre_completo: string;
  is_active: boolean;
  date_joined: string;
  ultima_actividad: string;
  estado_display: string;
  racha_actual: number;
  puntos_totales: number;
  avatar?: string;
  configuracion?: Record<string, unknown>;
};

type Vista = 'lista' | 'crear' | 'editar' | 'estadisticas';

const GestionUsuariosPage: React.FC = () => {
  const { user } = useAuth();
  const [vista, setVista] = useState<Vista>('lista');
  // Nota: estado reservado para futura vista de detalle
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  // Debug: Log del estado
  console.log('GestionUsuariosPage - Vista actual:', vista);
  console.log('GestionUsuariosPage - UsuarioEditando:', usuarioEditando);
  console.log('GestionUsuariosPage - Usuario:', user);
  console.log('GestionUsuariosPage - Puede crear usuarios:', user?.rol === 'admin' || !!user?.is_staff);

  // Verificar permisos
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Solo docentes y administradores pueden acceder a la gestión de usuarios
  if (user.rol !== 'docente' && user.rol !== 'admin' && !user.is_staff) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleEdit = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setVista('editar');
  };

  const handleView = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    // Aquí podrías implementar una vista de detalles
    console.log('Ver usuario:', usuario);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSave = (_usuario: Usuario) => {
    setUsuarioEditando(null);
    setVista('lista');
    // Recargar la lista
  };

  const handleCancel = () => {
    setUsuarioEditando(null);
    setVista('lista');
  };

  const handleRefresh = () => {
    // Recargar datos si es necesario
  };

  const renderContenido = () => {
    console.log('renderContenido - Vista:', vista);
    console.log('renderContenido - UsuarioEditando:', usuarioEditando);
    
    switch (vista) {
      case 'lista':
        console.log('Renderizando lista');
        return (
          <UsuarioList
            onEdit={handleEdit}
            onView={handleView}
            onRefresh={handleRefresh}
          />
        );
      
      case 'crear':
        console.log('Renderizando formulario CREAR');
        return (
          <UsuarioForm
            mode="create"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        );
      
      case 'editar':
        console.log('Renderizando formulario EDITAR con usuario:', usuarioEditando);
        return (
          <UsuarioForm
            usuario={usuarioEditando || undefined}
            mode="edit"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        );
      
      case 'estadisticas':
        console.log('Renderizando estadísticas');
        return <UsuarioStats />;
      
      default:
        console.log('Vista por defecto');
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-2">
            {user.rol === 'admin' || user.is_staff 
              ? 'Administra todos los usuarios del sistema: crear, editar, activar/desactivar y ver estadísticas'
              : 'Gestiona los estudiantes: ver, editar y ver estadísticas'
            }
          </p>
        </div>

        {/* Navegación por pestañas */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'lista', label: 'Lista de Usuarios', icon: '👥' },
              // Solo mostrar "Crear Usuario" para administradores
              ...(user.rol === 'admin' || user.is_staff ? [
                { key: 'crear', label: 'Crear Usuario', icon: '➕' }
              ] : []),
              { key: 'estadisticas', label: 'Estadísticas', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  console.log('Clic en tab:', tab.key);
                  setVista(tab.key as Vista);
                  // Limpiar estado al cambiar de vista
                  if (tab.key === 'crear') {
                    console.log('Limpiando usuarioEditando para crear');
                    setUsuarioEditando(null);
                  }
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  vista === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido */}
        <div className="bg-white rounded-lg shadow">
          {renderContenido()}
        </div>
      </div>
    </div>
  );
};

export default GestionUsuariosPage; 