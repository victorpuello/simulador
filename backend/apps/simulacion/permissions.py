from rest_framework import permissions

class EsDocente(permissions.BasePermission):
    """Permiso para verificar si el usuario es docente"""
    
    def has_permission(self, request, view):
        return request.user and request.user.rol == 'docente'

class SoloEstudiantes(permissions.BasePermission):
    """Permiso para verificar si el usuario es estudiante"""
    
    def has_permission(self, request, view):
        return request.user and request.user.rol == 'estudiante'