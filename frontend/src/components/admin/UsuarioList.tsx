import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  KeyIcon,
  UserPlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useNotifications } from '../../store';
import { useAuth } from '../../hooks/useAuth';
import { usuariosService } from '../../services/usuarios';

// Definir tipos localmente para evitar problemas de importación
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
  configuracion?: any;
};

type UsuarioFilters = {
  rol?: string;
  is_active?: boolean;
  search?: string;
  ordering?: string;
};

type BulkAction = {
  usuarios: number[];
  accion: 'activar' | 'desactivar' | 'eliminar';
};

interface UsuarioListProps {
  onEdit?: (usuario: Usuario) => void;
  onView?: (usuario: Usuario) => void;
  onRefresh?: () => void;
}

const UsuarioList: React.FC<UsuarioListProps> = ({ 
  onEdit, 
  onView, 
  onRefresh 
}) => {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin' || user?.is_staff;
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsuarios, setSelectedUsuarios] = useState<number[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmBulk, setShowConfirmBulk] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction['accion']>('activar');
  const [filters, setFilters] = useState<UsuarioFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('-date_joined');
  const [showFilters, setShowFilters] = useState(false);

  const cargarUsuarios = async (page: number = 1, resetList: boolean = false) => {
    try {
      setLoading(true);
      const params = {
        page,
        ...filters,
        ordering: sortField,
        search: searchTerm || undefined
      };

      const response = await usuariosService.getUsuarios(params);
      
      if (resetList) {
        setUsuarios(response.results);
      } else {
        setUsuarios(prev => page === 1 ? response.results : [...prev, ...response.results]);
      }
      
      setTotalCount(response.count);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los usuarios'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios(1, true);
  }, [filters, sortField, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: Partial<UsuarioFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    const newSort = sortField === field ? `-${field}` : field;
    setSortField(newSort);
  };

  const handleSelectUsuario = (id: number) => {
    setSelectedUsuarios(prev => 
      prev.includes(id) 
        ? prev.filter(userId => userId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsuarios.length === usuarios.length) {
      setSelectedUsuarios([]);
    } else {
      setSelectedUsuarios(usuarios.map(u => u.id));
    }
  };

  const handleBulkAction = async () => {
    if (selectedUsuarios.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Atención',
        message: 'Selecciona al menos un usuario'
      });
      return;
    }

    try {
      const result = await usuariosService.bulkAction({
        usuarios: selectedUsuarios,
        accion: bulkAction
      });

      addNotification({
        type: 'success',
        title: 'Éxito',
        message: result.mensaje
      });

      setSelectedUsuarios([]);
      cargarUsuarios(1, true);
      onRefresh?.();
    } catch (error) {
      console.error('Error en acción masiva:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo completar la acción masiva'
      });
    }
  };

  const handleToggleStatus = async (usuario: Usuario) => {
    try {
      const result = await usuariosService.toggleStatus(usuario.id);
      addNotification({
        type: 'success',
        title: 'Éxito',
        message: result.mensaje
      });
      cargarUsuarios(currentPage, true);
      onRefresh?.();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo cambiar el estado del usuario'
      });
    }
  };

  const handleDelete = async (usuario: Usuario) => {
    try {
      await usuariosService.deleteUsuario(usuario.id);
      addNotification({
        type: 'success',
        title: 'Éxito',
        message: 'Usuario eliminado correctamente'
      });
      cargarUsuarios(currentPage, true);
      onRefresh?.();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el usuario'
      });
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'docente': return 'bg-blue-100 text-blue-800';
      case 'estudiante': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (loading && usuarios.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gestión de Usuarios
          </h2>
          <p className="text-gray-600">
            {totalCount} usuarios en total
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => onEdit?.({} as Usuario)}
            variant="primary"
            className="flex items-center gap-2"
          >
            <UserPlusIcon className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <div className="space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtros avanzados */}
          <div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <FunnelIcon className="h-5 w-5" />
              Filtros
              {showFilters ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={filters.rol || ''}
                  onChange={(e) => handleFilterChange({ rol: e.target.value || undefined })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los roles</option>
                  <option value="estudiante">Estudiante</option>
                  <option value="docente">Docente</option>
                  <option value="admin">Administrador</option>
                </select>

                <select
                  value={filters.is_active?.toString() || ''}
                  onChange={(e) => handleFilterChange({ 
                    is_active: e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined 
                  })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>

                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="-date_joined">Más recientes</option>
                  <option value="date_joined">Más antiguos</option>
                  <option value="username">Usuario A-Z</option>
                  <option value="-username">Usuario Z-A</option>
                  <option value="-puntos_totales">Más puntos</option>
                  <option value="puntos_totales">Menos puntos</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Acciones masivas - Solo para administradores */}
      {selectedUsuarios.length > 0 && isAdmin && (
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedUsuarios.length} usuario(s) seleccionado(s)
            </span>
            
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value as BulkAction['accion'])}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            >
              <option value="activar">Activar</option>
              <option value="desactivar">Desactivar</option>
              <option value="eliminar">Eliminar</option>
            </select>

            <Button
              onClick={() => setShowConfirmBulk(true)}
              variant="secondary"
              size="sm"
            >
              Aplicar a seleccionados
            </Button>

            <Button
              onClick={() => setSelectedUsuarios([])}
              variant="outline"
              size="sm"
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Lista de usuarios */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {isAdmin && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsuarios.length === usuarios.length && usuarios.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Actividad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsuarios.includes(usuario.id)}
                        onChange={() => handleSelectUsuario(usuario.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {usuario.nombre_completo.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {usuario.nombre_completo}
                        </div>
                        <div className="text-sm text-gray-500">
                          {usuario.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {usuario.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRolColor(usuario.rol)}`}>
                      {usuario.rol_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(usuario.is_active)}`}>
                      {usuario.estado_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {usuario.puntos_totales}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usuario.ultima_actividad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onView?.(usuario)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => onEdit?.(usuario)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleToggleStatus(usuario)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title={usuario.is_active ? 'Desactivar' : 'Activar'}
                          >
                            <ExclamationTriangleIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(usuario)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalCount > 20 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {usuarios.length} de {totalCount} usuarios
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => cargarUsuarios(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Anterior
                </Button>
                
                <Button
                  onClick={() => cargarUsuarios(currentPage + 1)}
                  disabled={usuarios.length < 20}
                  variant="outline"
                  size="sm"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Diálogos de confirmación */}
      <ConfirmDialog
        isOpen={showConfirmBulk}
        onClose={() => setShowConfirmBulk(false)}
        onConfirm={handleBulkAction}
        title="Confirmar acción masiva"
        message={`¿Estás seguro de que quieres ${bulkAction} ${selectedUsuarios.length} usuario(s)?`}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />

      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={() => {
          // Implementar eliminación individual
          setShowConfirmDelete(false);
        }}
        title="Confirmar eliminación"
        message="¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default UsuarioList; 