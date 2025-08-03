from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from .serializers import (
    UsuarioListSerializer, UsuarioDetailSerializer,
    UsuarioCreateSerializer, UsuarioUpdateSerializer,
    UsuarioBulkSerializer, UsuarioStatsSerializer
)
from .permissions import (
    UsuarioManagementPermission, UsuarioReadPermission,
    UsuarioCreatePermission, UsuarioUpdatePermission,
    UsuarioDeletePermission, UsuarioBulkPermission,
    UsuarioStatsPermission
)

User = get_user_model()


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión completa de usuarios.
    Permite CRUD completo con filtros, búsqueda y ordenamiento.
    """
    queryset = User.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['rol', 'is_active']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['username', 'first_name', 'last_name', 'date_joined', 'puntos_totales']
    ordering = ['-date_joined']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UsuarioUpdateSerializer
        elif self.action == 'retrieve':
            return UsuarioDetailSerializer
        else:
            return UsuarioListSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [UsuarioReadPermission()]
        elif self.action == 'create':
            return [UsuarioCreatePermission()]
        elif self.action in ['update', 'partial_update']:
            return [UsuarioUpdatePermission()]
        elif self.action == 'destroy':
            return [UsuarioDeletePermission()]
        elif self.action in ['bulk_action', 'stats']:
            return [UsuarioBulkPermission()]
        else:
            return [UsuarioManagementPermission()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Administradores ven todos los usuarios
        if user.rol == 'admin' or user.is_staff:
            return queryset
        
        # Docentes solo ven estudiantes
        if user.rol == 'docente':
            return queryset.filter(rol='estudiante')
        
        # Otros usuarios no ven nada
        return User.objects.none()
    
    def perform_destroy(self, instance):
        """
        Soft delete: marcar como inactivo en lugar de eliminar
        """
        instance.is_active = False
        instance.save()
    
    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """
        Acción masiva para activar/desactivar/eliminar usuarios
        """
        serializer = UsuarioBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        usuarios_ids = serializer.validated_data['usuarios']
        accion = serializer.validated_data['accion']
        
        usuarios = User.objects.filter(id__in=usuarios_ids)
        count = 0
        
        if accion == 'activar':
            count = usuarios.update(is_active=True)
            mensaje = f'{count} usuarios activados'
        elif accion == 'desactivar':
            count = usuarios.update(is_active=False)
            mensaje = f'{count} usuarios desactivados'
        elif accion == 'eliminar':
            count = usuarios.count()
            usuarios.delete()
            mensaje = f'{count} usuarios eliminados'
        
        return Response({
            'mensaje': mensaje,
            'usuarios_procesados': count
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estadísticas de usuarios
        """
        # Estadísticas básicas
        total_usuarios = User.objects.count()
        usuarios_activos = User.objects.filter(is_active=True).count()
        usuarios_inactivos = total_usuarios - usuarios_activos
        
        # Por rol
        por_rol = User.objects.values('rol').annotate(
            count=Count('id')
        ).order_by('rol')
        por_rol_dict = {item['rol']: item['count'] for item in por_rol}
        
        # Nuevos este mes
        inicio_mes = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        nuevos_este_mes = User.objects.filter(date_joined__gte=inicio_mes).count()
        
        # Actividad reciente (últimos 7 días)
        hace_7_dias = timezone.now() - timedelta(days=7)
        actividad_reciente = User.objects.filter(ultima_practica__gte=hace_7_dias).count()
        
        # Top usuarios por puntos
        top_usuarios = User.objects.filter(
            is_active=True
        ).order_by('-puntos_totales')[:10].values(
            'id', 'username', 'first_name', 'last_name', 'puntos_totales'
        )
        
        stats = {
            'total_usuarios': total_usuarios,
            'usuarios_activos': usuarios_activos,
            'usuarios_inactivos': usuarios_inactivos,
            'por_rol': por_rol_dict,
            'nuevos_este_mes': nuevos_este_mes,
            'actividad_reciente': actividad_reciente,
            'top_usuarios': list(top_usuarios)
        }
        
        serializer = UsuarioStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """
        Resetear contraseña de un usuario
        """
        user = self.get_object()
        nueva_password = request.data.get('password')
        
        if not nueva_password:
            return Response({
                'error': 'Nueva contraseña es requerida'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(nueva_password)
        user.save()
        
        return Response({
            'mensaje': 'Contraseña reseteada exitosamente'
        })
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """
        Activar/desactivar usuario
        """
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        estado = 'activado' if user.is_active else 'desactivado'
        return Response({
            'mensaje': f'Usuario {estado} exitosamente',
            'is_active': user.is_active
        })


class UsuarioSearchView(generics.ListAPIView):
    """
    Vista para búsqueda avanzada de usuarios
    """
    serializer_class = UsuarioListSerializer
    permission_classes = [UsuarioReadPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['username', 'date_joined', 'puntos_totales']
    
    def get_queryset(self):
        queryset = User.objects.all()
        user = self.request.user
        
        # Filtrar por rol del usuario actual
        if user.rol == 'docente':
            queryset = queryset.filter(rol='estudiante')
        elif user.rol not in ['admin'] and not user.is_staff:
            return User.objects.none()
        
        # Filtros adicionales
        rol = self.request.query_params.get('rol')
        if rol:
            queryset = queryset.filter(rol=rol)
        
        activo = self.request.query_params.get('activo')
        if activo is not None:
            activo_bool = activo.lower() == 'true'
            queryset = queryset.filter(is_active=activo_bool)
        
        return queryset


class UsuarioExportView(generics.ListAPIView):
    """
    Vista para exportar usuarios
    """
    serializer_class = UsuarioListSerializer
    permission_classes = [UsuarioReadPermission]
    
    def get_queryset(self):
        queryset = User.objects.all()
        user = self.request.user
        
        # Filtrar por rol del usuario actual
        if user.rol == 'docente':
            queryset = queryset.filter(rol='estudiante')
        elif user.rol not in ['admin'] and not user.is_staff:
            return User.objects.none()
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Formato de exportación
        formato = request.query_params.get('formato', 'json')
        
        if formato == 'csv':
            # TODO: Implementar exportación CSV
            return Response({
                'mensaje': 'Exportación CSV en desarrollo'
            })
        else:
            return Response(serializer.data) 