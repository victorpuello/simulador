from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class UsuarioManagementPermission(permissions.BasePermission):
    """
    Permiso personalizado para gestión de usuarios.
    Solo administradores pueden gestionar usuarios.
    """
    
    def has_permission(self, request, view):
        # Verificar que el usuario esté autenticado
        if not request.user.is_authenticated:
            return False
        
        # Solo administradores pueden gestionar usuarios
        return request.user.rol == 'admin' or request.user.is_staff
    
    def has_object_permission(self, request, view, obj):
        # Verificar que el usuario esté autenticado
        if not request.user.is_authenticated:
            return False
        
        # Solo administradores pueden gestionar usuarios
        return request.user.rol == 'admin' or request.user.is_staff


class UsuarioReadPermission(permissions.BasePermission):
    """
    Permiso para lectura de usuarios.
    Administradores pueden leer todos, docentes solo estudiantes.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Administradores pueden leer todos los usuarios
        if request.user.rol == 'admin' or request.user.is_staff:
            return True
        
        # Docentes solo pueden leer estudiantes
        if request.user.rol == 'docente':
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Administradores pueden leer cualquier usuario
        if request.user.rol == 'admin' or request.user.is_staff:
            return True
        
        # Docentes solo pueden leer estudiantes
        if request.user.rol == 'docente' and obj.rol == 'estudiante':
            return True
        
        return False


class UsuarioCreatePermission(permissions.BasePermission):
    """
    Permiso para crear usuarios.
    Solo administradores pueden crear usuarios.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.rol == 'admin' or request.user.is_staff


class UsuarioUpdatePermission(permissions.BasePermission):
    """
    Permiso para actualizar usuarios.
    Administradores pueden actualizar cualquier usuario.
    Docentes solo pueden actualizar estudiantes.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.rol in ['admin', 'docente'] or request.user.is_staff
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Administradores pueden actualizar cualquier usuario
        if request.user.rol == 'admin' or request.user.is_staff:
            return True
        
        # Docentes solo pueden actualizar estudiantes
        if request.user.rol == 'docente' and obj.rol == 'estudiante':
            return True
        
        return False


class UsuarioDeletePermission(permissions.BasePermission):
    """
    Permiso para eliminar usuarios.
    Solo administradores pueden eliminar usuarios.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.rol == 'admin' or request.user.is_staff
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Solo administradores pueden eliminar usuarios
        return request.user.rol == 'admin' or request.user.is_staff


class UsuarioBulkPermission(permissions.BasePermission):
    """
    Permiso para operaciones masivas.
    Solo administradores pueden realizar operaciones masivas.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.rol == 'admin' or request.user.is_staff


class UsuarioStatsPermission(permissions.BasePermission):
    """
    Permiso para estadísticas de usuarios.
    Administradores pueden ver todas las estadísticas.
    Docentes pueden ver estadísticas básicas.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.rol in ['admin', 'docente'] or request.user.is_staff 