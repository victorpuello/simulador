import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const RegisterPage: React.FC = () => {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    rol: 'estudiante' as 'estudiante' | 'docente' | 'admin',
    password: '',
    password_confirm: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validación básica
    const newErrors: Record<string, string> = {};
    if (!formData.username) {
      newErrors.username = 'El nombre de usuario es requerido';
    }
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    }
    if (!formData.first_name) {
      newErrors.first_name = 'El nombre es requerido';
    }
    if (!formData.last_name) {
      newErrors.last_name = 'El apellido es requerido';
    }
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Las contraseñas no coinciden';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await register(formData);
    } catch (error: any) {
      if (error.errors) {
        setErrors(error.errors);
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>

        <Card className="mt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="first_name"
                label="Nombre"
                type="text"
                placeholder="Tu nombre"
                required
                value={formData.first_name}
                onChange={(value: string) => handleChange('first_name', value)}
                error={errors.first_name}
              />

              <Input
                name="last_name"
                label="Apellido"
                type="text"
                placeholder="Tu apellido"
                required
                value={formData.last_name}
                onChange={(value: string) => handleChange('last_name', value)}
                error={errors.last_name}
              />
            </div>

            <Input
              name="username"
              label="Nombre de usuario"
              type="text"
              placeholder="Elige un nombre de usuario"
              required
              value={formData.username}
              onChange={(value: string) => handleChange('username', value)}
              error={errors.username}
            />

            <Input
              name="email"
              label="Email"
              type="email"
              placeholder="tu@email.com"
              required
              value={formData.email}
              onChange={(value: string) => handleChange('email', value)}
              error={errors.email}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <select
                value={formData.rol}
                onChange={(e) => handleChange('rol', e.target.value)}
                className="input"
              >
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente</option>
              </select>
            </div>

            <Input
              name="password"
              label="Contraseña"
              type="password"
              placeholder="Crea una contraseña"
              required
              value={formData.password}
              onChange={(value: string) => handleChange('password', value)}
              error={errors.password}
            />

            <Input
              name="password_confirm"
              label="Confirmar contraseña"
              type="password"
              placeholder="Confirma tu contraseña"
              required
              value={formData.password_confirm}
              onChange={(value: string) => handleChange('password_confirm', value)}
              error={errors.password_confirm}
            />

            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full"
              >
                {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Al crear una cuenta, aceptas nuestros términos y condiciones
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 