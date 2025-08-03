from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, CustomTokenRefreshView,
    UsuarioRegistroView, UsuarioLoginView, UsuarioPerfilView,
    CambioPasswordView, UsuarioLogoutView, usuario_actual,
    verificar_username, verificar_email, UsuarioBusquedaView
)

app_name = 'authentication'

urlpatterns = [
    # JWT Token endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    
    # Authentication endpoints
    path('registro/', UsuarioRegistroView.as_view(), name='registro'),
    path('login/', UsuarioLoginView.as_view(), name='login'),
    path('logout/', UsuarioLogoutView.as_view(), name='logout'),
    
    # User profile endpoints
    path('perfil/', UsuarioPerfilView.as_view(), name='perfil'),
    path('usuario-actual/', usuario_actual, name='usuario_actual'),
    path('cambiar-password/', CambioPasswordView.as_view(), name='cambiar_password'),
    
    # Validation endpoints
    path('verificar-username/', verificar_username, name='verificar_username'),
    path('verificar-email/', verificar_email, name='verificar_email'),
    
    # Search endpoints (for teachers)
    path('buscar-usuarios/', UsuarioBusquedaView.as_view(), name='buscar_usuarios'),
] 