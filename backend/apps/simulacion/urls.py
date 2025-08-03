from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SimulacionViewSet

app_name = 'simulacion'

router = DefaultRouter()
router.register(r'sesiones', SimulacionViewSet, basename='sesiones')

urlpatterns = [
    path('', include(router.urls)),
]