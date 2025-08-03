import React, { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useNotifications } from '../../store';
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

type UsuarioCreate = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: 'estudiante' | 'docente' | 'admin';
  password: string;
  password_confirm: string;
  is_active?: boolean;
};

type UsuarioUpdate = {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  rol?: 'estudiante' | 'docente' | 'admin';
  is_active?: boolean;
  password?: string;
  password_confirm?: string;
  avatar?: string;
  configuracion?: any;
};

interface UsuarioFormProps {
  usuario?: Usuario;
  onSave?: (usuario: Usuario) => void;
  onCancel?: () => void;
  mode: 'create' | 'edit';
}

const UsuarioForm: React.FC<UsuarioFormProps> = ({
  usuario,
  onSave,
  onCancel,
  mode
}) => {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<UsuarioCreate | UsuarioUpdate>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    rol: 'estudiante',
    password: '',
    password_confirm: '',
    is_active: true
  });

  useEffect(() => {
    if (usuario && mode === 'edit') {
      setFormData({
        username: usuario.username,
        email: usuario.email,
        first_name: usuario.first_name,
        last_name: usuario.last_name,
        rol: usuario.rol,
        is_active: usuario.is_active,
        password: '',
        password_confirm: ''
      });
    }
  }, [usuario, mode]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.username) errors.push('El nombre de usuario es requerido');
    if (!formData.email) errors.push('El email es requerido');
    if (!formData.first_name) errors.push('El nombre es requerido');
    if (!formData.last_name) errors.push('El apellido es requerido');
    
    if (mode === 'create') {
      if (!formData.password) errors.push('La contraseña es requerida');
      if (!formData.password_confirm) errors.push('La confirmación de contraseña es requerida');
      if (formData.password !== formData.password_confirm) {
        errors.push('Las contraseñas no coinciden');
      }
      if (formData.password && formData.password.length < 8) {
        errors.push('La contraseña debe tener al menos 8 caracteres');
      }
    } else {
      // En modo edición, si se proporciona contraseña, validar
      if (formData.password || formData.password_confirm) {
        if (!formData.password) errors.push('La contraseña es requerida');
        if (!formData.password_confirm) errors.push('La confirmación de contraseña es requerida');
        if (formData.password !== formData.password_confirm) {
          errors.push('Las contraseñas no coinciden');
        }
        if (formData.password && formData.password.length < 8) {
          errors.push('La contraseña debe tener al menos 8 caracteres');
        }
      }
    }

    if (errors.length > 0) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: errors.join(', ')
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      let result: Usuario;

      if (mode === 'create') {
        result = await usuariosService.createUsuario(formData as UsuarioCreate);
        addNotification({
          type: 'success',
          title: 'Éxito',
          message: 'Usuario creado correctamente'
        });
      } else {
        // En modo edición, solo enviar campos que han cambiado y no están vacíos
        const updateData: UsuarioUpdate = {};
        Object.keys(formData).forEach(key => {
          const value = formData[key as keyof typeof formData];
          if (value !== undefined && value !== '' && value !== null) {
            updateData[key as keyof UsuarioUpdate] = value;
          }
        });
        
        // Si no hay campos para actualizar, mostrar error
        if (Object.keys(updateData).length === 0) {
          addNotification({
            type: 'warning',
            title: 'Atención',
            message: 'No hay cambios para guardar'
          });
          return;
        }
        
        result = await usuariosService.updateUsuario(usuario!.id, updateData);
        addNotification({
          type: 'success',
          title: 'Éxito',
          message: 'Usuario actualizado correctamente'
        });
      }

      onSave?.(result);
    } catch (error: any) {
      console.error('Error guardando usuario:', error);
      console.error('Datos enviados:', formData);
      
      let errorMessage = 'Error al guardar el usuario';
      if (error.response?.data) {
        const data = error.response.data;
        console.error('Respuesta del servidor:', data);
        
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.username) {
          errorMessage = `Usuario: ${Array.isArray(data.username) ? data.username.join(', ') : data.username}`;
        } else if (data.email) {
          errorMessage = `Email: ${Array.isArray(data.email) ? data.email.join(', ') : data.email}`;
        } else if (data.password) {
          errorMessage = `Contraseña: ${Array.isArray(data.password) ? data.password.join(', ') : data.password}`;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(', ') : data.non_field_errors;
        } else {
          // Mostrar todos los errores de validación
          const errors = Object.entries(data).map(([field, messages]) => {
            const message = Array.isArray(messages) ? messages.join(', ') : messages;
            return `${field}: ${message}`;
          }).join('; ');
          errorMessage = errors || errorMessage;
        }
      }

      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'create' ? 'Crear Usuario' : 'Editar Usuario'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de Usuario *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="usuario123"
              disabled={mode === 'edit'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="usuario@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Juan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellido *
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol *
            </label>
            <select
              value={formData.rol}
              onChange={(e) => handleInputChange('rol', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={formData.is_active?.toString() || 'true'}
              onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Contraseñas */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {mode === 'create' ? 'Contraseña' : 'Cambiar Contraseña (opcional)'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña {mode === 'create' ? '*' : ''}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={mode === 'create' ? 'Mínimo 8 caracteres' : 'Dejar vacío para no cambiar'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña {mode === 'create' ? '*' : ''}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.password_confirm}
                  onChange={(e) => handleInputChange('password_confirm', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Repetir contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : null}
            {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default UsuarioForm; 