from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, UsuarioSearchView, UsuarioExportView
)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
    path('', include(router.urls)),
    path('usuarios/buscar/', UsuarioSearchView.as_view(), name='usuario-buscar'),
    path('usuarios/exportar/', UsuarioExportView.as_view(), name='usuario-exportar'),
] 