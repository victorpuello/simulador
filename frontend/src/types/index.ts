// Tipos de usuario
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: 'estudiante' | 'docente' | 'admin';
  rol_display: string;
  racha_actual: number;
  puntos_totales: number;
  avatar?: string;
  ultima_practica?: string;
  configuracion: Record<string, any>;
  date_joined: string;
  is_staff?: boolean;
}

// Tipos de autenticación
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: 'estudiante' | 'docente' | 'admin';
  password: string;
  password_confirm: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

// Tipos de materias
export interface Materia {
  id: number;
  nombre: string;
  nombre_display: string;
  color: string;
  icono: string;
  descripcion: string;
  activa: boolean;
  preguntas_count: number;
}

export interface Competencia {
  id: number;
  materia: number;
  materia_nombre: string;
  nombre: string;
  descripcion: string;
  peso_icfes: number;
  preguntas_count: number;
}

// Tipos de preguntas
export interface Pregunta {
  id: number;
  materia: number;
  materia_nombre: string;
  competencia?: number;
  competencia_nombre?: string;
  contexto?: string;
  enunciado: string;
  opciones: Record<string, string>;
  respuesta_correcta?: string;
  retroalimentacion_estructurada?: string;
  explicacion_opciones_incorrectas?: string;
  imagen_url?: string | null;
  retroalimentacion?: string;
  explicacion?: string;
  dificultad: 'facil' | 'media' | 'dificil';
  tiempo_estimado: number;
  activa: boolean;
  tags: string[];
}

export interface PreguntaSimulacion {
  id: number;
  materia: number;
  materia_nombre: string;
  competencia?: number;
  competencia_nombre?: string;
  contexto?: string;
  enunciado: string;
  opciones: Record<string, string>;
  dificultad: 'facil' | 'media' | 'dificil';
  tiempo_estimado: number;
}

// Tipos de sesiones
export interface Sesion {
  id: number;
  usuario: number;
  usuario_nombre: string;
  materia: number;
  materia_nombre: string;
  asignacion?: number;
  fecha_inicio: string;
  fecha_fin?: string;
  puntaje_final?: number;
  tiempo_total?: number;
  completada: boolean;
  modo: 'practica' | 'simulacro' | 'asignada';
  modo_display: string;
  respuestas_count: number;
}

export interface RespuestaUsuario {
  id: number;
  sesion: number;
  pregunta: number;
  pregunta_enunciado: string;
  respuesta_seleccionada: string;
  es_correcta: boolean;
  tiempo_respuesta: number;
  timestamp: string;
  revisada: boolean;
}

// Tipos de clases
export interface Clase {
  id: number;
  nombre: string;
  docente: number;
  docente_nombre: string;
  estudiantes: number[];
  codigo_inscripcion: string;
  fecha_creacion: string;
  activa: boolean;
  configuracion: Record<string, any>;
  estudiantes_count: number;
}

export interface Asignacion {
  id: number;
  clase: number;
  clase_nombre: string;
  materia: number;
  materia_nombre: string;
  titulo: string;
  descripcion: string;
  cantidad_preguntas: number;
  tiempo_limite?: number;
  fecha_limite: string;
  fecha_creacion: string;
  activa: boolean;
  esta_vencida: boolean;
}

// Tipos de gamificación
export interface Insignia {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  criterio: Record<string, any>;
  puntos: number;
  rara: boolean;
}

export interface LogroUsuario {
  id: number;
  usuario: number;
  insignia: number;
  insignia_nombre: string;
  insignia_icono: string;
  insignia_color: string;
  fecha_obtenido: string;
  contexto: Record<string, any>;
}

// Tipos de estadísticas
export interface EstadisticasUsuario {
  total_sesiones: number;
  promedio_puntaje: number;
  racha_actual: number;
  puntos_totales: number;
  sesiones_por_materia: Array<{
    materia__nombre_display: string;
    count: number;
    avg_puntaje: number;
  }>;
  ultimas_sesiones: Sesion[];
}

export interface EstadisticasMateria {
  materia: string;
  total_sesiones: number;
  promedio_puntaje: number;
  total_preguntas: number;
  competencias: Array<{
    nombre: string;
    preguntas_count: number;
  }>;
}

// Tipos de API
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Tipos de formularios
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// Tipos de navegación
export interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  current?: boolean;
  badge?: string;
}

// Tipos de notificaciones
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Tipos de tema
export interface Theme {
  mode: 'light' | 'dark';
  primary: string;
  secondary: string;
}

// Tipos de configuración
export interface AppConfig {
  apiUrl: string;
  theme: Theme;
  notifications: boolean;
  sound: boolean;
}

// Tipos de estado global
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  notifications: Notification[];
  theme: Theme;
  config: AppConfig;
}

// Tipos de acciones
export interface AppAction {
  type: string;
  payload?: any;
}

// Tipos de hooks
export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface UseApiReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Tipos de componentes
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
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

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
} 