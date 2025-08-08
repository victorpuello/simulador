import { useState, useEffect } from 'react';
import { useAuth as useAuthStore } from '../store';
import { authService } from '../services/api';
import type { LoginCredentials, RegisterData, User } from '../types';
import { useNotifications } from '../store';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, setAuthenticated, setLoading, logout: logoutStore } = useAuthStore();
  const { addNotification } = useNotifications();
  const [isInitialized, setIsInitialized] = useState(false);

  // Verificar token al cargar la app
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token && !isAuthenticated) {
        try {
          setLoading(true);
          const userData = await authService.getCurrentUser();
          setUser(userData);
          addNotification({
            type: 'success',
            title: 'Bienvenido',
            message: `Hola ${userData.first_name}!`,
            duration: 3000,
          });
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        } finally {
          setLoading(false);
          setIsInitialized(true);
        }
      } else {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [addNotification, isAuthenticated, setLoading, setUser]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      
      // Guardar tokens
      localStorage.setItem('access_token', response.tokens.access);
      localStorage.setItem('refresh_token', response.tokens.refresh);
      
      // Actualizar estado
      setUser(response.user);
      setAuthenticated(true);
      
      addNotification({
        type: 'success',
        title: 'Login exitoso',
        message: `Bienvenido ${response.user.first_name}!`,
        duration: 3000,
      });
      
      return response;
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error de login',
        message: error instanceof Error ? error.message : 'Credenciales inválidas',
        duration: 5000,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      // Guardar tokens
      localStorage.setItem('access_token', response.tokens.access);
      localStorage.setItem('refresh_token', response.tokens.refresh);
      
      // Actualizar estado
      setUser(response.user);
      setAuthenticated(true);
      
      addNotification({
        type: 'success',
        title: 'Registro exitoso',
        message: `¡Bienvenido ${response.user.first_name}! Tu cuenta ha sido creada.`,
        duration: 5000,
      });
      
      return response;
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error de registro',
        message: error instanceof Error ? error.message : 'Error al crear la cuenta',
        duration: 5000,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      const updatedUser = await authService.updateProfile(userData);
      
      // Actualizar estado
      setUser(updatedUser);
      
      addNotification({
        type: 'success',
        title: 'Perfil actualizado',
        message: 'Tu perfil ha sido actualizado correctamente.',
        duration: 3000,
      });
      
      return updatedUser;
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error al actualizar',
        message: error instanceof Error ? error.message : 'Error al actualizar el perfil',
        duration: 5000,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (passwordData: {
    password_actual: string;
    password_nueva: string;
    password_nueva_confirm: string;
  }) => {
    try {
      setLoading(true);
      await authService.changePassword(passwordData);
      
      addNotification({
        type: 'success',
        title: 'Contraseña cambiada',
        message: 'Tu contraseña ha sido cambiada correctamente.',
        duration: 3000,
      });
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error al cambiar contraseña',
        message: error instanceof Error ? error.message : 'Error al cambiar la contraseña',
        duration: 5000,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar tokens y estado
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      logoutStore();
      
      addNotification({
        type: 'info',
        title: 'Sesión cerrada',
        message: 'Has cerrado sesión correctamente.',
        duration: 3000,
      });
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    register,
    updateProfile,
    changePassword,
    logout,
  };
}; 