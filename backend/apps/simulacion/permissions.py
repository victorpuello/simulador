from rest_framework import permissions

class SoloEstudiantes(permissions.BasePermission):
    """
    Permiso personalizado que solo permite acceso a usuarios con rol 'estudiante'
    """
    
    def has_permission(self, request, view):
        # Verificar que el usuario esté autenticado
        if not request.user.is_authenticated:
            return False
        
        # Verificar que el usuario tenga rol de estudiante
        return request.user.rol == 'estudiante' 