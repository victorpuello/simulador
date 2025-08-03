from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q

from .serializers import (
    CustomTokenObtainPairSerializer, UsuarioLoginSerializer,
    UsuarioRegistroSerializer, UsuarioPerfilSerializer,
    CambioPasswordSerializer, RefreshTokenSerializer
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista personalizada para obtener tokens JWT"""
    serializer_class = CustomTokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    """Vista personalizada para refrescar tokens JWT"""
    pass


class UsuarioRegistroView(generics.CreateAPIView):
    """Vista para registro de usuarios"""
    queryset = User.objects.all()
    serializer_class = UsuarioRegistroSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generar tokens para el usuario registrado
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Usuario registrado exitosamente',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'rol': user.rol,
                'rol_display': user.get_rol_display(),
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)


class UsuarioLoginView(APIView):
    """Vista para login de usuarios"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UsuarioLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Login exitoso',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name or '',
                'last_name': user.last_name or '',
                'rol': user.rol,
                'rol_display': user.get_rol_display(),
                'racha_actual': user.racha_actual,
                'puntos_totales': user.puntos_totales,
                'avatar': user.avatar or '',
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        })


class UsuarioPerfilView(generics.RetrieveUpdateAPIView):
    """Vista para obtener y actualizar perfil de usuario"""
    serializer_class = UsuarioPerfilSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class CambioPasswordView(APIView):
    """Vista para cambiar contraseña"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CambioPasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Contraseña cambiada exitosamente'
        })


class UsuarioLogoutView(APIView):
    """Vista para logout de usuarios"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Logout exitoso'
            })
        except Exception:
            return Response({
                'message': 'Logout exitoso'
            })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usuario_actual(request):
    """Obtener información del usuario actual"""
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name or '',
        'last_name': user.last_name or '',
        'rol': user.rol,
        'rol_display': user.get_rol_display(),
        'racha_actual': user.racha_actual,
        'puntos_totales': user.puntos_totales,
        'avatar': user.avatar or '',
        'ultima_practica': user.ultima_practica,
        'configuracion': user.configuracion,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verificar_username(request):
    """Verificar si un username está disponible"""
    username = request.data.get('username')
    
    if not username:
        return Response({
            'error': 'Username es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    disponible = not User.objects.filter(username=username).exists()
    
    return Response({
        'username': username,
        'disponible': disponible
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verificar_email(request):
    """Verificar si un email está disponible"""
    email = request.data.get('email')
    
    if not email:
        return Response({
            'error': 'Email es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    disponible = not User.objects.filter(email=email).exists()
    
    return Response({
        'email': email,
        'disponible': disponible
    })


class UsuarioBusquedaView(generics.ListAPIView):
    """Vista para buscar usuarios (solo para docentes)"""
    from apps.core.serializers import UsuarioSerializer
    
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Solo docentes pueden buscar usuarios
        if not self.request.user.es_docente:
            return User.objects.none()
        
        queryset = User.objects.filter(rol='estudiante')
        query = self.request.query_params.get('q', None)
        
        if query:
            queryset = queryset.filter(
                Q(username__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query)
            )
        
        return queryset[:20]  # Limitar a 20 resultados
