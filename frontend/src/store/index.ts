import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Notification, Theme, AppConfig } from '../types';

interface AppState {
  // Estado de autenticación
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Estado de notificaciones
  notifications: Notification[];
  
  // Estado del tema
  theme: Theme;
  
  // Configuración de la app
  config: AppConfig;
  
  // Acciones de autenticación
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  
  // Acciones de notificaciones
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Acciones de tema
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  
  // Acciones de configuración
  updateConfig: (config: Partial<AppConfig>) => void;
  
  // Acción de logout
  logout: () => void;
}

const defaultTheme: Theme = {
  mode: 'light',
  primary: '#0ea5e9',
  secondary: '#a855f7',
};

const defaultConfig: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  theme: defaultTheme,
  notifications: true,
  sound: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      notifications: [],
      theme: defaultTheme,
      config: defaultConfig,
      
      // Acciones de autenticación
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      
      // Acciones de notificaciones
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification = { ...notification, id };
        
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));
        
        // Auto-remover notificaciones después de un tiempo
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration || 5000);
        }
      },
      
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
      
      clearNotifications: () => set({ notifications: [] }),
      
      // Acciones de tema
      setTheme: (theme) => set({ theme }),
      
      toggleTheme: () => {
        const { theme } = get();
        const newTheme: Theme = {
          ...theme,
          mode: theme.mode === 'light' ? 'dark' : 'light',
        };
        set({ theme: newTheme });
      },
      
      // Acciones de configuración
      updateConfig: (config) => {
        set((state) => ({
          config: { ...state.config, ...config },
        }));
      },
      
      // Acción de logout
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          notifications: [],
        });
      },
    }),
    {
      name: 'simulador-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        config: state.config,
      }),
    }
  )
);

// Hooks específicos para facilitar el uso
export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, setAuthenticated, setLoading, logout } = useAppStore();
  
  return {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setAuthenticated,
    setLoading,
    logout,
  };
};

export const useNotifications = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useAppStore();
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };
};

export const useTheme = () => {
  const { theme, setTheme, toggleTheme } = useAppStore();
  
  return {
    theme,
    setTheme,
    toggleTheme,
  };
};

export const useConfig = () => {
  const { config, updateConfig } = useAppStore();
  
  return {
    config,
    updateConfig,
  };
}; 