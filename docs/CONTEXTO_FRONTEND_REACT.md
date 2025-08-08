# ⚛️ Contexto del Frontend - Simulador Saber 11

## 📋 **INFORMACIÓN GENERAL**

### **Proyecto**: Simulador Pruebas Saber 11 - Frontend
### **Framework**: React 18+ con TypeScript y Vite
### **Estado**: Frontend 85% completado, funcional y responsive
### **UI Framework**: Tailwind CSS + Headless UI
### **Estado Global**: Zustand

---

## 🏗️ **ARQUITECTURA FRONTEND**

### **Estructura de Directorios**
```
frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── admin/          # Componentes para administración
│   │   ├── auth/           # Autenticación
│   │   ├── charts/         # Gráficos y visualizaciones
│   │   ├── layout/         # Layout y navegación
│   │   ├── profile/        # Perfil de usuario
│   │   ├── reportes/       # Reportes y analytics
│   │   ├── simulacion/     # Componentes de simulación
│   │   └── ui/            # Componentes base (Button, Input, etc.)
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Páginas principales
│   ├── services/           # Servicios API
│   ├── store/              # Estado global (Zustand)
│   ├── types/              # Tipos TypeScript
│   ├── utils/              # Utilidades
│   └── assets/             # Recursos estáticos
├── public/                 # Archivos públicos
├── package.json            # Dependencias del proyecto
├── vite.config.ts         # Configuración de Vite
├── tailwind.config.js     # Configuración de Tailwind
└── tsconfig.json          # Configuración TypeScript
```

### **Dependencias Principales**
```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.7.1",
    "typescript": "~5.8.3",
    "zustand": "^5.0.7",
    "axios": "^1.11.0",
    "tailwindcss": "^3.4.17",
    "@headlessui/react": "^2.2.7",
    "@heroicons/react": "^2.2.0",
    "chart.js": "^4.5.0",
    "react-chartjs-2": "^5.3.0",
    "lucide-react": "^0.536.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "vite": "^7.0.4",
    "@vitejs/plugin-react": "^4.6.0",
    "vitest": "^3.2.4",
    "@testing-library/react": "^16.3.0",
    "eslint": "^9.30.1",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6"
  }
}
```

---

## 🎨 **SISTEMA DE DISEÑO**

### **Paleta de Colores**
```css
/* Colores principales */
:root {
  --primary: #6366f1;      /* Indigo moderno */
  --secondary: #8b5cf6;    /* Violeta */
  --success: #10b981;      /* Verde esmeralda */
  --warning: #f59e0b;      /* Ámbar */
  --error: #ef4444;        /* Rojo */
  --background: #f8fafc;   /* Gris muy claro */
  --surface: #ffffff;      /* Blanco */
  --text: #1e293b;         /* Gris oscuro */
}

/* Colores por materia */
.materia-matematicas { color: #4F46E5; }
.materia-lectura { color: #DC2626; }
.materia-ciencias { color: #059669; }
.materia-sociales { color: #7C3AED; }
.materia-ingles { color: #EA580C; }
```

### **Configuración Tailwind**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        success: {
          50: '#f0fdf4',
          500: '#10b981',
          600: '#059669',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

---

## 📱 **COMPONENTES UI BASE**

### **Button Component**
```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button',
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
    error: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
    ghost: 'text-primary-600 hover:bg-primary-50',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};
```

### **Input Component**
```typescript
// src/components/ui/Input.tsx
interface InputProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error,
  value,
  onChange,
  className = '',
}) => {
  const inputClasses = clsx(
    'block w-full rounded-lg border px-3 py-2 text-sm transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    error 
      ? 'border-error-300 bg-error-50' 
      : 'border-gray-300 bg-white hover:border-gray-400',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={inputClasses}
      />
      {error && (
        <p className="text-sm text-error-600 flex items-center">
          <ExclamationCircleIcon className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};
```

### **Card Component**
```typescript
// src/components/ui/Card.tsx
interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  headerActions,
  footer,
}) => {
  return (
    <div className={clsx(
      'bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden',
      className
    )}>
      {(title || subtitle || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center space-x-2">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="px-6 py-4">
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};
```

---

## 🔄 **ESTADO GLOBAL CON ZUSTAND**

### **Auth Store**
```typescript
// src/store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials, RegisterData } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Acciones
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);
          const { user, tokens } = response.data;
          
          // Guardar tokens en localStorage
          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error de autenticación',
            isLoading: false 
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          const { user, tokens } = response.data;
          
          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error en el registro',
            isLoading: false 
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        });
      },

      updateProfile: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.updateProfile(data);
          set({ 
            user: response.data, 
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error al actualizar perfil',
            isLoading: false 
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
```

### **Simulación Store**
```typescript
// src/store/simulacion.ts
import { create } from 'zustand';
import { Sesion, PreguntaSimulacion, RespuestaUsuario } from '../types';
import { simulacionApi } from '../services/api';

interface SimulacionState {
  sesionActual: Sesion | null;
  preguntas: PreguntaSimulacion[];
  preguntaActual: number;
  respuestas: Record<number, string>;
  tiempoInicio: Date | null;
  tiempoTranscurrido: number;
  isLoading: boolean;
  error: string | null;
}

interface SimulacionActions {
  iniciarSimulacion: (materiaId: number, modo: string, cantidadPreguntas: number) => Promise<void>;
  responderPregunta: (preguntaId: number, respuesta: string) => void;
  siguientePregunta: () => void;
  preguntaAnterior: () => void;
  finalizarSimulacion: () => Promise<void>;
  pausarSimulacion: () => void;
  reanudarSimulacion: () => void;
  resetSimulacion: () => void;
}

export const useSimulacionStore = create<SimulacionState & SimulacionActions>((set, get) => ({
  // Estado inicial
  sesionActual: null,
  preguntas: [],
  preguntaActual: 0,
  respuestas: {},
  tiempoInicio: null,
  tiempoTranscurrido: 0,
  isLoading: false,
  error: null,

  // Acciones
  iniciarSimulacion: async (materiaId, modo, cantidadPreguntas) => {
    set({ isLoading: true, error: null });
    try {
      // Crear sesión
      const sesionResponse = await simulacionApi.crearSesion({
        materia: materiaId,
        modo,
        cantidad_preguntas: cantidadPreguntas
      });
      
      // Obtener preguntas
      const preguntasResponse = await simulacionApi.obtenerPreguntasSesion(sesionResponse.data.id);
      
      set({
        sesionActual: sesionResponse.data,
        preguntas: preguntasResponse.data,
        preguntaActual: 0,
        respuestas: {},
        tiempoInicio: new Date(),
        tiempoTranscurrido: 0,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al iniciar simulación',
        isLoading: false
      });
    }
  },

  responderPregunta: (preguntaId, respuesta) => {
    const { respuestas } = get();
    set({
      respuestas: {
        ...respuestas,
        [preguntaId]: respuesta
      }
    });
  },

  siguientePregunta: () => {
    const { preguntaActual, preguntas } = get();
    if (preguntaActual < preguntas.length - 1) {
      set({ preguntaActual: preguntaActual + 1 });
    }
  },

  preguntaAnterior: () => {
    const { preguntaActual } = get();
    if (preguntaActual > 0) {
      set({ preguntaActual: preguntaActual - 1 });
    }
  },

  finalizarSimulacion: async () => {
    const { sesionActual, respuestas, tiempoInicio } = get();
    if (!sesionActual || !tiempoInicio) return;

    set({ isLoading: true });
    try {
      // Enviar todas las respuestas
      const respuestasArray = Object.entries(respuestas).map(([preguntaId, respuesta]) => ({
        pregunta: parseInt(preguntaId),
        respuesta_seleccionada: respuesta,
        tiempo_respuesta: Math.floor((Date.now() - tiempoInicio.getTime()) / 1000)
      }));

      await simulacionApi.enviarRespuestas(sesionActual.id, respuestasArray);
      
      // Finalizar sesión
      await simulacionApi.finalizarSesion(sesionActual.id);
      
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al finalizar simulación',
        isLoading: false
      });
    }
  },

  pausarSimulacion: () => {
    // Implementar lógica de pausa
  },

  reanudarSimulacion: () => {
    // Implementar lógica de reanudación
  },

  resetSimulacion: () => {
    set({
      sesionActual: null,
      preguntas: [],
      preguntaActual: 0,
      respuestas: {},
      tiempoInicio: null,
      tiempoTranscurrido: 0,
      error: null
    });
  },
}));
```

---

## 🛠️ **CUSTOM HOOKS**

### **useAuth Hook**
```typescript
// src/hooks/useAuth.ts
import { useAuthStore } from '../store/auth';
import { useEffect } from 'react';
import { authApi } from '../services/api';

export const useAuth = () => {
  const authStore = useAuthStore();

  useEffect(() => {
    // Verificar token al cargar la aplicación
    const token = localStorage.getItem('access_token');
    if (token && !authStore.user) {
      // Verificar si el token es válido
      authApi.verifyToken(token)
        .then((response) => {
          authStore.login(response.data);
        })
        .catch(() => {
          authStore.logout();
        });
    }
  }, []);

  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    error: authStore.error,
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    updateProfile: authStore.updateProfile,
    clearError: authStore.clearError,
  };
};
```

### **useApi Hook**
```typescript
// src/hooks/useApi.ts
import { useState, useEffect, useCallback } from 'react';
import { AxiosResponse } from 'axios';

interface UseApiOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

export const useApi = <T>(
  apiFunction: () => Promise<AxiosResponse<T>>,
  options: UseApiOptions<T> = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiFunction();
      setData(response.data);
      options.onSuccess?.(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error en la petición';
      setError(errorMessage);
      options.onError?.(err);
    } finally {
      setIsLoading(false);
    }
  }, [apiFunction, options]);

  useEffect(() => {
    if (options.immediate !== false) {
      execute();
    }
  }, [execute, options.immediate]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  return {
    data,
    isLoading,
    error,
    execute,
    refetch,
  };
};
```

---

## 📄 **PÁGINAS PRINCIPALES**

### **Dashboard Page**
```typescript
// src/pages/DashboardPage.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BarChart } from '../components/charts/BarChart';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: estadisticas, isLoading } = useApi(() => 
    api.get('/reportes/usuario/')
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">
          ¡Hola, {user?.first_name}! 👋
        </h1>
        <p className="mt-2 opacity-90">
          Continúa tu preparación para las Pruebas Saber 11
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">
              {estadisticas?.racha_actual || 0}
            </div>
            <div className="text-sm text-gray-600">Días de racha</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600">
              {estadisticas?.puntos_totales || 0}
            </div>
            <div className="text-sm text-gray-600">Puntos totales</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning-600">
              {estadisticas?.total_sesiones || 0}
            </div>
            <div className="text-sm text-gray-600">Simulaciones</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-error-600">
              {Math.round(estadisticas?.promedio_puntaje || 0)}%
            </div>
            <div className="text-sm text-gray-600">Promedio</div>
          </div>
        </Card>
      </div>

      {/* Gráfico de rendimiento */}
      <Card title="Rendimiento por Materia">
        <BarChart data={estadisticas?.sesiones_por_materia || []} />
      </Card>

      {/* Acciones rápidas */}
      <Card title="Acciones Rápidas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="primary" size="lg" className="h-20">
            <div className="text-center">
              <div className="text-lg font-semibold">Nueva Simulación</div>
              <div className="text-sm opacity-80">Practica cualquier materia</div>
            </div>
          </Button>
          
          <Button variant="secondary" size="lg" className="h-20">
            <div className="text-center">
              <div className="text-lg font-semibold">Simulacro Completo</div>
              <div className="text-sm opacity-80">Todas las materias</div>
            </div>
          </Button>
          
          <Button variant="outline" size="lg" className="h-20">
            <div className="text-center">
              <div className="text-lg font-semibold">Ver Reportes</div>
              <div className="text-sm opacity-80">Analiza tu progreso</div>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
};
```

### **Simulación Page**
```typescript
// src/pages/SimulacionPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSimulacionStore } from '../store/simulacion';
import { SimulacionComponent } from '../components/simulacion/SimulacionComponent';
import { BarraProgreso } from '../components/simulacion/BarraProgreso';
import { Button } from '../components/ui/Button';

const SimulacionPage: React.FC = () => {
  const { materiaId } = useParams<{ materiaId: string }>();
  const navigate = useNavigate();
  const {
    sesionActual,
    preguntas,
    preguntaActual,
    respuestas,
    isLoading,
    error,
    iniciarSimulacion,
    finalizarSimulacion,
    resetSimulacion
  } = useSimulacionStore();

  useEffect(() => {
    if (materiaId && !sesionActual) {
      iniciarSimulacion(parseInt(materiaId), 'practica', 10);
    }

    return () => {
      // Cleanup al desmontar el componente
      resetSimulacion();
    };
  }, [materiaId]);

  const handleFinalizarSimulacion = async () => {
    await finalizarSimulacion();
    navigate('/resultados');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Preparando tu simulación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-error-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!preguntas.length) {
    return null;
  }

  const progreso = ((preguntaActual + 1) / preguntas.length) * 100;
  const preguntaActualData = preguntas[preguntaActual];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de simulación */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Simulación - {sesionActual?.materia_nombre}
              </h1>
              <p className="text-sm text-gray-600">
                Pregunta {preguntaActual + 1} de {preguntas.length}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <BarraProgreso progreso={progreso} />
              <Button 
                variant="outline" 
                onClick={handleFinalizarSimulacion}
                disabled={Object.keys(respuestas).length === 0}
              >
                Finalizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Componente principal de simulación */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <SimulacionComponent 
          pregunta={preguntaActualData}
          respuestaSeleccionada={respuestas[preguntaActualData.id]}
          onResponder={(respuesta) => {
            useSimulacionStore.getState().responderPregunta(preguntaActualData.id, respuesta);
          }}
          onSiguiente={() => {
            useSimulacionStore.getState().siguientePregunta();
          }}
          onAnterior={() => {
            useSimulacionStore.getState().preguntaAnterior();
          }}
          esPrimera={preguntaActual === 0}
          esUltima={preguntaActual === preguntas.length - 1}
        />
      </div>
    </div>
  );
};
```

---

## 📊 **COMPONENTES DE VISUALIZACIÓN**

### **BarChart Component**
```typescript
// src/components/charts/BarChart.tsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  data: Array<{
    materia__nombre_display: string;
    count: number;
    avg_puntaje: number;
  }>;
  title?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  const chartData = {
    labels: data.map(item => item.materia__nombre_display),
    datasets: [
      {
        label: 'Promedio de Puntaje (%)',
        data: data.map(item => Math.round(item.avg_puntaje)),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',  // Indigo
          'rgba(220, 38, 38, 0.8)',   // Red
          'rgba(5, 150, 105, 0.8)',   // Green
          'rgba(124, 58, 237, 0.8)',  // Purple
          'rgba(234, 88, 12, 0.8)',   // Orange
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(220, 38, 38, 1)',
          'rgba(5, 150, 105, 1)',
          'rgba(124, 58, 237, 1)',
          'rgba(234, 88, 12, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};
```

---

## 🔌 **SERVICIOS API**

### **API Client Configuration**
```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Configuración base de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Reintentar la petición original
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh token inválido, cerrar sesión
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

### **Auth API Service**
```typescript
// src/services/auth.ts
import apiClient from './api';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>('/auth/login/', credentials),
    
  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>('/auth/register/', data),
    
  logout: () =>
    apiClient.post('/auth/logout/'),
    
  getProfile: () =>
    apiClient.get<User>('/auth/profile/'),
    
  updateProfile: (data: Partial<User>) =>
    apiClient.put<User>('/auth/profile/', data),
    
  verifyToken: (token: string) =>
    apiClient.post('/auth/verify/', { token }),
    
  refreshToken: (refresh: string) =>
    apiClient.post('/auth/refresh/', { refresh }),
};
```

---

## 🎮 **COMPONENTES DE SIMULACIÓN**

### **SimulacionComponent**
```typescript
// src/components/simulacion/SimulacionComponent.tsx
import React, { useState, useEffect } from 'react';
import { PreguntaSimulacion } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { clsx } from 'clsx';

interface SimulacionComponentProps {
  pregunta: PreguntaSimulacion;
  respuestaSeleccionada?: string;
  onResponder: (respuesta: string) => void;
  onSiguiente: () => void;
  onAnterior: () => void;
  esPrimera: boolean;
  esUltima: boolean;
}

export const SimulacionComponent: React.FC<SimulacionComponentProps> = ({
  pregunta,
  respuestaSeleccionada,
  onResponder,
  onSiguiente,
  onAnterior,
  esPrimera,
  esUltima,
}) => {
  const [tiempoRestante, setTiempoRestante] = useState(pregunta.tiempo_estimado);
  const [mostrarRetroalimentacion, setMostrarRetroalimentacion] = useState(false);

  // Timer para la pregunta
  useEffect(() => {
    const timer = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pregunta.id]);

  const handleSeleccionarRespuesta = (opcion: string) => {
    onResponder(opcion);
    // Opcional: mostrar retroalimentación inmediata
    // setMostrarRetroalimentacion(true);
  };

  const formatearTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header con información de la pregunta */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
            {pregunta.materia_nombre}
          </span>
          {pregunta.competencia_nombre && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
              {pregunta.competencia_nombre}
            </span>
          )}
          <span className={clsx(
            'px-2 py-1 rounded-full text-xs font-medium',
            pregunta.dificultad === 'facil' && 'bg-success-100 text-success-700',
            pregunta.dificultad === 'media' && 'bg-warning-100 text-warning-700',
            pregunta.dificultad === 'dificil' && 'bg-error-100 text-error-700'
          )}>
            {pregunta.dificultad === 'facil' && 'Fácil'}
            {pregunta.dificultad === 'media' && 'Media'}
            {pregunta.dificultad === 'dificil' && 'Difícil'}
          </span>
        </div>
        
        <div className={clsx(
          'font-mono font-bold',
          tiempoRestante <= 30 ? 'text-error-600' : 'text-gray-600'
        )}>
          ⏱️ {formatearTiempo(tiempoRestante)}
        </div>
      </div>

      {/* Contexto de la pregunta (si existe) */}
      {pregunta.contexto && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: pregunta.contexto }} />
          </div>
        </Card>
      )}

      {/* Enunciado de la pregunta */}
      <Card title="Pregunta">
        <div className="prose prose-lg max-w-none">
          <p>{pregunta.enunciado}</p>
        </div>
      </Card>

      {/* Opciones de respuesta */}
      <Card title="Opciones">
        <div className="space-y-3">
          {Object.entries(pregunta.opciones).map(([letra, texto]) => (
            <button
              key={letra}
              onClick={() => handleSeleccionarRespuesta(letra)}
              className={clsx(
                'w-full p-4 text-left border-2 rounded-lg transition-all duration-200',
                'hover:border-primary-300 hover:bg-primary-50',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                respuestaSeleccionada === letra
                  ? 'border-primary-500 bg-primary-100'
                  : 'border-gray-200 bg-white'
              )}
            >
              <div className="flex items-start space-x-3">
                <span className={clsx(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  respuestaSeleccionada === letra
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                )}>
                  {letra}
                </span>
                <p className="text-gray-900">{texto}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Controles de navegación */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onAnterior}
          disabled={esPrimera}
        >
          ← Anterior
        </Button>

        <div className="text-sm text-gray-500">
          {respuestaSeleccionada ? '✅ Respondida' : '⏳ Sin responder'}
        </div>

        <Button
          variant="primary"
          onClick={onSiguiente}
          disabled={!respuestaSeleccionada}
        >
          {esUltima ? 'Finalizar' : 'Siguiente →'}
        </Button>
      </div>
    </div>
  );
};
```

---

## 📱 **DISEÑO RESPONSIVE**

### **Configuración de Breakpoints**
```css
/* Tailwind breakpoints personalizados */
@screen sm {
  /* 640px y arriba */
}

@screen md {
  /* 768px y arriba */
}

@screen lg {
  /* 1024px y arriba */
}

@screen xl {
  /* 1280px y arriba */
}

@screen 2xl {
  /* 1536px y arriba */
}
```

### **Ejemplo de Layout Responsive**
```typescript
// src/components/layout/Layout.tsx
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <div className={clsx(
        'fixed inset-0 z-40 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
```

---

## 🧪 **TESTING**

### **Configuración de Testing**
```typescript
// src/test/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Configuración global para tests
beforeAll(() => {
  // Setup global antes de todos los tests
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  // Cleanup global después de todos los tests
});
```

### **Ejemplo de Test de Componente**
```typescript
// src/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies correct variant classes', () => {
    render(<Button variant="error">Error Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-error-600');
  });
});
```

---

## ⚡ **OPTIMIZACIÓN Y PERFORMANCE**

### **Lazy Loading de Componentes**
```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Lazy loading de páginas
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SimulacionPage = lazy(() => import('./pages/SimulacionPage'));
const ReportesPage = lazy(() => import('./pages/ReportesPage'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/simulacion/:materiaId" element={<SimulacionPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```

### **Memoización de Componentes**
```typescript
// src/components/charts/BarChart.tsx
import { memo } from 'react';

export const BarChart = memo<BarChartProps>(({ data, title }) => {
  // Componente memoizado para evitar re-renders innecesarios
  return (
    <Bar data={chartData} options={options} />
  );
});
```

---

## 🚀 **BUILD Y DEPLOYMENT**

### **Configuración de Vite**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## 📈 **PRÓXIMAS MEJORAS**

### **Funcionalidades Pendientes**
- [ ] PWA (Progressive Web App) con funcionalidad offline
- [ ] Notificaciones push
- [ ] Sistema de chat para soporte
- [ ] Modo oscuro completo
- [ ] Internacionalización (i18n)
- [ ] Análisis avanzado con gráficos más complejos

### **Optimizaciones Técnicas**
- [ ] Server-Side Rendering (SSR) con Next.js
- [ ] Bundle optimization con tree shaking
- [ ] Image optimization con WebP
- [ ] Service Worker para cache
- [ ] Web Workers para cálculos pesados

---

**🎯 El frontend está 85% completado con una arquitectura sólida, componentes reutilizables y diseño responsive. La integración con el backend está funcionando correctamente.**