from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlantillaSimulacionViewSet, SesionSimulacionViewSet

router = DefaultRouter()
router.register(r'plantillas', PlantillaSimulacionViewSet)
router.register(r'sesiones', SesionSimulacionViewSet)

app_name = 'simulacion'

urlpatterns = [
    path('', include(router.urls)),
]