// Testing utilities for React components
import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock del NotificationContainer
const MockNotificationContainer = () => <div data-testid="notification-container" />;

// Wrapper personalizado que incluye todos los providers necesarios
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
      <MockNotificationContainer />
    </BrowserRouter>
  );
};

// Función personalizada para renderizar componentes con providers
const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-exportar todo de testing-library
export * from "@testing-library/react";

// Sobrescribir render method
export { renderWithProviders as render };

// Mock data para tests
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  rol: 'estudiante' as const,
  avatar: null,
  racha_actual: 5,
  puntos_totales: 1250,
  configuracion: {
    theme: 'light',
    notifications: true,
  },
  date_joined: '2024-01-01T00:00:00Z',
  last_login: '2024-01-15T10:30:00Z',
};

export const mockMateria = {
  id: 1,
  nombre: 'matematicas',
  nombre_display: 'Matemáticas',
  color: '#4F46E5',
  icono: 'calculator',
  descripcion: 'Materia de matemáticas',
  activa: true,
};

export const mockPregunta = {
  id: 1,
  materia: 1,
  materia_nombre: 'Matemáticas',
  competencia: 1,
  competencia_nombre: 'Razonamiento lógico',
  contexto: '',
  enunciado: '¿Cuánto es 2 + 2?',
  opciones: {
    A: '3',
    B: '4',
    C: '5',
    D: '6',
  },
  dificultad: 'facil' as const,
  tiempo_estimado: 60,
  tags: ['suma', 'basico'],
  activa: true,
};

export const mockSesion = {
  id: 1,
  usuario: 1,
  materia: 1,
  materia_nombre: 'Matemáticas',
  fecha_inicio: '2024-01-15T10:00:00Z',
  fecha_fin: null,
  puntaje_final: null,
  tiempo_total: null,
  completada: false,
  modo: 'practica' as const,
};

export const mockInsignia = {
  id: 1,
  nombre: 'Primera Sesión',
  descripcion: 'Completa tu primera sesión de práctica',
  icono: 'trophy',
  color: '#FFD700',
  criterio: {
    tipo: 'primera_sesion',
  },
  puntos: 50,
  rara: false,
};

// Helper para crear respuestas mock de API
export const createMockApiResponse = <T,>(data: T) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
});

export const createMockPaginatedResponse = <T,>(items: T[], page = 1, pageSize = 20) => ({
  count: items.length,
  next: items.length > page * pageSize ? `?page=${page + 1}` : null,
  previous: page > 1 ? `?page=${page - 1}` : null,
  results: items.slice((page - 1) * pageSize, page * pageSize),
});

// Helper para crear errores mock de API
export const createMockApiError = (status = 400, message = 'Error') => ({
  response: {
    status,
    data: { message },
  },
});

// Mock de notificaciones
export const mockNotification = {
  id: '1',
  type: 'success' as const,
  title: 'Éxito',
  message: 'Operación completada exitosamente',
  duration: 5000,
};

// Helper para simular delays en tests
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));