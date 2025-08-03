import { api } from './api';

export interface Usuario {
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
}

export interface UsuarioCreate {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: 'estudiante' | 'docente' | 'admin';
  password: string;
  password_confirm: string;
  is_active?: boolean;
}

export interface UsuarioUpdate {
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
}

export interface UsuarioStats {
  total_usuarios: number;
  usuarios_activos: number;
  usuarios_inactivos: number;
  por_rol: Record<string, number>;
  nuevos_este_mes: number;
  actividad_reciente: number;
  top_usuarios: Array<{
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    puntos_totales: number;
  }>;
}

export interface BulkAction {
  usuarios: number[];
  accion: 'activar' | 'desactivar' | 'eliminar';
}

export interface UsuarioFilters {
  rol?: string;
  is_active?: boolean;
  search?: string;
  ordering?: string;
}

// Servicio de usuarios
export const usuariosService = {
  // Obtener lista de usuarios
  async getUsuarios(params?: UsuarioFilters & { page?: number }): Promise<{
    results: Usuario[];
    count: number;
    next?: string;
    previous?: string;
  }> {
    const response = await api.get('/usuarios/usuarios/', { params });
    return response.data;
  },

  // Obtener usuario específico
  async getUsuario(id: number): Promise<Usuario> {
    const response = await api.get(`/usuarios/usuarios/${id}/`);
    return response.data;
  },

  // Crear usuario
  async createUsuario(data: UsuarioCreate): Promise<Usuario> {
    const response = await api.post('/usuarios/usuarios/', data);
    return response.data;
  },

  // Actualizar usuario
  async updateUsuario(id: number, data: UsuarioUpdate): Promise<Usuario> {
    const response = await api.put(`/usuarios/usuarios/${id}/`, data);
    return response.data;
  },

  // Actualizar parcialmente usuario
  async patchUsuario(id: number, data: Partial<UsuarioUpdate>): Promise<Usuario> {
    const response = await api.patch(`/usuarios/usuarios/${id}/`, data);
    return response.data;
  },

  // Eliminar usuario (soft delete)
  async deleteUsuario(id: number): Promise<void> {
    await api.delete(`/usuarios/usuarios/${id}/`);
  },

  // Acción masiva
  async bulkAction(data: BulkAction): Promise<{
    mensaje: string;
    usuarios_procesados: number;
  }> {
    const response = await api.post('/usuarios/usuarios/bulk_action/', data);
    return response.data;
  },

  // Obtener estadísticas
  async getStats(): Promise<UsuarioStats> {
    const response = await api.get('/usuarios/usuarios/stats/');
    return response.data;
  },

  // Resetear contraseña
  async resetPassword(id: number, password: string): Promise<{ mensaje: string }> {
    const response = await api.post(`/usuarios/usuarios/${id}/reset_password/`, {
      password
    });
    return response.data;
  },

  // Toggle estado (activar/desactivar)
  async toggleStatus(id: number): Promise<{
    mensaje: string;
    is_active: boolean;
  }> {
    const response = await api.post(`/usuarios/usuarios/${id}/toggle_status/`);
    return response.data;
  },

  // Búsqueda avanzada
  async searchUsuarios(params?: {
    q?: string;
    rol?: string;
    activo?: boolean;
    ordering?: string;
  }): Promise<Usuario[]> {
    const response = await api.get('/usuarios/usuarios/buscar/', { params });
    return response.data;
  },

  // Exportar usuarios
  async exportUsuarios(formato: 'json' | 'csv' = 'json'): Promise<any> {
    const response = await api.get('/usuarios/usuarios/exportar/', {
      params: { formato }
    });
    return response.data;
  }
}; 