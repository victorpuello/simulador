from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MateriaViewSet, CompetenciaViewSet, PreguntaViewSet,
    SesionViewSet, RespuestaUsuarioViewSet, ClaseViewSet,
    AsignacionViewSet, InsigniaViewSet, LogroUsuarioViewSet
)

router = DefaultRouter()
router.register(r'materias', MateriaViewSet)
router.register(r'competencias', CompetenciaViewSet)
router.register(r'preguntas', PreguntaViewSet)
router.register(r'sesiones', SesionViewSet, basename='sesion')
router.register(r'respuestas', RespuestaUsuarioViewSet, basename='respuesta')
router.register(r'clases', ClaseViewSet, basename='clase')
router.register(r'asignaciones', AsignacionViewSet, basename='asignacion')
router.register(r'insignias', InsigniaViewSet)
router.register(r'logros', LogroUsuarioViewSet, basename='logro')

app_name = 'core'

urlpatterns = [
    path('', include(router.urls)),
] 