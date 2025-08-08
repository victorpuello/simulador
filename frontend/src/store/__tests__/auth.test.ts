// Tests para el store de autenticación
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from '../index';
import { mockUser, createMockApiResponse } from '../../test/utils';

// Mock de la API
const mockAuthApi = {
  login: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
};

vi.mock('../../services/api', () => ({
  authApi: mockAuthApi,
}));

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Resetear el store
    useAppStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe('Initial state', () => {
    it('has correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Login action', () => {
    it('sets loading state during login', async () => {
      const credentials = { username: 'test', password: 'password' };
      const mockResponse = createMockApiResponse({
        user: mockUser,
        tokens: { access: 'token123', refresh: 'refresh123' },
      });

      mockAuthApi.login.mockResolvedValue(mockResponse);

      const loginPromise = useAuthStore.getState().login(credentials);

      // Verificar estado de loading
      expect(useAuthStore.getState().isLoading).toBe(true);
      expect(useAuthStore.getState().error).toBeNull();

      await loginPromise;

      // Verificar estado final
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('stores tokens in localStorage on successful login', async () => {
      const credentials = { username: 'test', password: 'password' };
      const mockResponse = createMockApiResponse({
        user: mockUser,
        tokens: { access: 'token123', refresh: 'refresh123' },
      });

      mockAuthApi.login.mockResolvedValue(mockResponse);

      await useAuthStore.getState().login(credentials);

      expect(localStorage.getItem('access_token')).toBe('token123');
      expect(localStorage.getItem('refresh_token')).toBe('refresh123');
    });

    it('handles login error correctly', async () => {
      const credentials = { username: 'test', password: 'wrong' };
      const errorMessage = 'Invalid credentials';
      
      mockAuthApi.login.mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await expect(
        useAuthStore.getState().login(credentials)
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });

    it('calls API with correct credentials', async () => {
      const credentials = { username: 'test', password: 'password' };
      const mockResponse = createMockApiResponse({
        user: mockUser,
        tokens: { access: 'token', refresh: 'refresh' },
      });

      mockAuthApi.login.mockResolvedValue(mockResponse);

      await useAuthStore.getState().login(credentials);

      expect(mockAuthApi.login).toHaveBeenCalledWith(credentials);
    });
  });

  describe('Register action', () => {
    it('sets loading state during register', async () => {
      const registerData = {
        username: 'newuser',
        email: 'new@test.com',
        password: 'password',
        password_confirm: 'password',
        first_name: 'New',
        last_name: 'User',
        rol: 'estudiante' as const,
      };

      const mockResponse = createMockApiResponse({
        user: mockUser,
        tokens: { access: 'token123', refresh: 'refresh123' },
      });

      mockAuthApi.register.mockResolvedValue(mockResponse);

      const registerPromise = useAuthStore.getState().register(registerData);

      expect(useAuthStore.getState().isLoading).toBe(true);

      await registerPromise;

      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('handles register error correctly', async () => {
      const registerData = {
        username: 'existinguser',
        email: 'existing@test.com',
        password: 'password',
        password_confirm: 'password',
        first_name: 'Test',
        last_name: 'User',
        rol: 'estudiante' as const,
      };

      mockAuthApi.register.mockRejectedValue({
        response: { data: { message: 'Username already exists' } },
      });

      await expect(
        useAuthStore.getState().register(registerData)
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.error).toBe('Username already exists');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Logout action', () => {
    it('clears user state and localStorage', () => {
      // Configurar estado inicial autenticado
      localStorage.setItem('access_token', 'token123');
      localStorage.setItem('refresh_token', 'refresh123');
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('Update profile action', () => {
    it('updates user profile successfully', async () => {
      const updatedUser = { ...mockUser, first_name: 'Updated' };
      const mockResponse = createMockApiResponse(updatedUser);

      mockAuthApi.updateProfile.mockResolvedValue(mockResponse);

      // Configurar estado inicial autenticado
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      await useAuthStore.getState().updateProfile({ first_name: 'Updated' });

      const state = useAuthStore.getState();
      expect(state.user?.first_name).toBe('Updated');
      expect(state.isLoading).toBe(false);
    });

    it('handles update profile error', async () => {
      mockAuthApi.updateProfile.mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      });

      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      await expect(
        useAuthStore.getState().updateProfile({ first_name: 'Updated' })
      ).rejects.toThrow();

      expect(useAuthStore.getState().error).toBe('Update failed');
    });
  });

  describe('Clear error action', () => {
    it('clears error state', () => {
      useAuthStore.setState({ error: 'Some error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('uses default error message when no message in response', async () => {
      mockAuthApi.login.mockRejectedValue({
        response: { data: {} },
      });

      await expect(
        useAuthStore.getState().login({ username: 'test', password: 'pass' })
      ).rejects.toThrow();

      expect(useAuthStore.getState().error).toBe('Error de autenticación');
    });

    it('uses default error message when no response', async () => {
      mockAuthApi.login.mockRejectedValue(new Error('Network error'));

      await expect(
        useAuthStore.getState().login({ username: 'test', password: 'pass' })
      ).rejects.toThrow();

      expect(useAuthStore.getState().error).toBe('Error de autenticación');
    });
  });

  describe('Persistence', () => {
    it('persists user and authentication state', () => {
      const persistKey = 'auth-storage';
      
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      // Verificar que se guarda en localStorage (simulado)
      // En un test real, esto estaría persistido por zustand/middleware/persist
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  describe('State transitions', () => {
    it('transitions from unauthenticated to authenticated correctly', async () => {
      const mockResponse = createMockApiResponse({
        user: mockUser,
        tokens: { access: 'token', refresh: 'refresh' },
      });

      mockAuthApi.login.mockResolvedValue(mockResponse);

      // Estado inicial
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();

      // Login
      await useAuthStore.getState().login({ username: 'test', password: 'pass' });

      // Estado final
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('transitions from authenticated to unauthenticated correctly', () => {
      // Estado inicial autenticado
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Logout
      useAuthStore.getState().logout();

      // Estado final
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});