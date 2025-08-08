from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportesViewSet, ReportesDocenteViewSet

router = DefaultRouter()
router.register(r'', ReportesViewSet, basename='reportes')
router.register(r'docente', ReportesDocenteViewSet, basename='reportes-docente')

urlpatterns = [
    path('', include(router.urls)),
]