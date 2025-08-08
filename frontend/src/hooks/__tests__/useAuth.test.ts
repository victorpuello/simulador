// Tests para el hook useAuth
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { mockUser } from '../../test/utils';

// Mock del store de autenticación
const mockAuthStore = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
  clearError: vi.fn(),
};

vi.mock('../../store/auth', () => ({
  useAuthStore: () => mockAuthStore,
}));

// Mock de la API de autenticación
const mockAuthApi = {
  verifyToken: vi.fn(),
};

vi.mock('../../services/api', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  }
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAuthStore.user = null;
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.isLoading = false;
    mockAuthStore.error = null;
  });

  it('returns initial auth state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns authenticated state when user is logged in', () => {
    mockAuthStore.user = mockUser;
    mockAuthStore.isAuthenticated = true;

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('provides login function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.login).toBe('function');
  });

  it('provides register function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.register).toBe('function');
  });

  it('provides logout function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.logout).toBe('function');
  });

  it('provides updateProfile function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.updateProfile).toBe('function');
  });

  it('provides clearError function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.clearError).toBe('function');
  });

  describe('Token verification on mount', () => {
    it('verifies token when present in localStorage and no user', async () => {
      const mockToken = 'valid-token';
      localStorage.setItem('access_token', mockToken);
      mockAuthApi.verifyToken.mockResolvedValue({ data: mockUser });

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockAuthApi.verifyToken).toHaveBeenCalledWith(mockToken);
      });
    });

    it('calls logout when token verification fails', async () => {
      const mockToken = 'invalid-token';
      localStorage.setItem('access_token', mockToken);
      mockAuthApi.verifyToken.mockRejectedValue(new Error('Invalid token'));

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockAuthStore.logout).toHaveBeenCalled();
      });
    });

    it('does not verify token when user already exists', () => {
      localStorage.setItem('access_token', 'token');
      mockAuthStore.user = mockUser;
      mockAuthStore.isAuthenticated = true;

      renderHook(() => useAuth());

      expect(mockAuthApi.verifyToken).not.toHaveBeenCalled();
    });

    it('does not verify token when no token in localStorage', () => {
      renderHook(() => useAuth());

      expect(mockAuthApi.verifyToken).not.toHaveBeenCalled();
    });
  });

  describe('Store integration', () => {
    it('calls store login when login is called', async () => {
      const { result } = renderHook(() => useAuth());
      const credentials = { username: 'test', password: 'pass' };

      await result.current.login(credentials);

      expect(mockAuthStore.login).toHaveBeenCalledWith(credentials);
    });

    it('calls store register when register is called', async () => {
      const { result } = renderHook(() => useAuth());
      const registerData = {
        username: 'test',
        email: 'test@test.com',
        password: 'pass',
        password_confirm: 'pass',
        first_name: 'Test',
        last_name: 'User',
        rol: 'estudiante' as const,
      };

      await result.current.register(registerData);

      expect(mockAuthStore.register).toHaveBeenCalledWith(registerData);
    });

    it('calls store logout when logout is called', () => {
      const { result } = renderHook(() => useAuth());

      result.current.logout();

      expect(mockAuthStore.logout).toHaveBeenCalled();
    });

    it('calls store updateProfile when updateProfile is called', async () => {
      const { result } = renderHook(() => useAuth());
      const profileData = { first_name: 'Updated Name' };

      await result.current.updateProfile(profileData);

      expect(mockAuthStore.updateProfile).toHaveBeenCalledWith(profileData);
    });

    it('calls store clearError when clearError is called', () => {
      const { result } = renderHook(() => useAuth());

      result.current.clearError();

      expect(mockAuthStore.clearError).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('returns error state from store', () => {
      const errorMessage = 'Authentication failed';
      mockAuthStore.error = errorMessage;

      const { result } = renderHook(() => useAuth());

      expect(result.current.error).toBe(errorMessage);
    });

    it('returns loading state from store', () => {
      mockAuthStore.isLoading = true;

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Re-renders on state changes', () => {
    it('updates when user state changes', () => {
      const { result, rerender } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();

      // Simular cambio de estado
      mockAuthStore.user = mockUser;
      mockAuthStore.isAuthenticated = true;

      rerender();

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('updates when loading state changes', () => {
      const { result, rerender } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      mockAuthStore.isLoading = true;

      rerender();

      expect(result.current.isLoading).toBe(true);
    });

    it('updates when error state changes', () => {
      const { result, rerender } = renderHook(() => useAuth());

      expect(result.current.error).toBeNull();

      mockAuthStore.error = 'Some error';

      rerender();

      expect(result.current.error).toBe('Some error');
    });
  });
});