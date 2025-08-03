from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Sum, Max, Q
from django.utils import timezone
from datetime import timedelta, date
from apps.core.models import Sesion, RespuestaUsuario, Materia
from apps.simulacion.permissions import SoloEstudiantes
from .serializers import (
    EstadisticasUsuarioSerializer,
    EstadisticasPorMateriaSerializer,
    HistorialSesionSerializer,
    ProgresoDiarioSerializer
)

class ReportesViewSet(viewsets.ViewSet):
    """ViewSet para todos los reportes y analytics"""
    permission_classes = [IsAuthenticated, SoloEstudiantes]
    
    @action(detail=False, methods=['get'])
    def estadisticas_generales(self, request):
        """Estadísticas generales del usuario"""
        user = request.user
        
        # Calcular estadísticas básicas
        sesiones = Sesion.objects.filter(usuario=user)
        sesiones_completadas = sesiones.filter(completada=True)
        
        estadisticas = {
            'total_simulaciones': sesiones.count(),
            'simulaciones_completadas': sesiones_completadas.count(),
            'promedio_puntaje': sesiones_completadas.aggregate(
                promedio=Avg('puntaje_final')
            )['promedio'] or 0,
            'tiempo_total_estudio': sesiones_completadas.aggregate(
                total=Sum('tiempo_total')
            )['total'] or 0,
            'mejor_puntaje': sesiones_completadas.aggregate(
                mejor=Max('puntaje_final')
            )['mejor'] or 0,
            'ultima_simulacion': sesiones.order_by('-fecha_inicio').first().fecha_inicio if sesiones.exists() else None,
            'racha_actual': user.racha_actual if hasattr(user, 'racha_actual') else 0
        }
        
        # Convertir tiempo de segundos a minutos
        estadisticas['tiempo_total_estudio'] = round(estadisticas['tiempo_total_estudio'] / 60) if estadisticas['tiempo_total_estudio'] else 0
        estadisticas['promedio_puntaje'] = round(estadisticas['promedio_puntaje'], 1) if estadisticas['promedio_puntaje'] else 0
        
        serializer = EstadisticasUsuarioSerializer(estadisticas)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas_por_materia(self, request):
        """Estadísticas desglosadas por materia"""
        user = request.user
        materias = Materia.objects.filter(activa=True)
        
        estadisticas_materias = []
        
        for materia in materias:
            sesiones = Sesion.objects.filter(usuario=user, materia=materia, completada=True)
            respuestas = RespuestaUsuario.objects.filter(sesion__in=sesiones)
            
            if sesiones.exists():
                total_preguntas = respuestas.count()
                preguntas_correctas = respuestas.filter(es_correcta=True).count()
                
                estadistica = {
                    'materia_id': materia.id,
                    'materia_nombre': materia.nombre_display,
                    'simulaciones_realizadas': sesiones.count(),
                    'promedio_puntaje': round(sesiones.aggregate(promedio=Avg('puntaje_final'))['promedio'] or 0, 1),
                    'mejor_puntaje': sesiones.aggregate(mejor=Max('puntaje_final'))['mejor'] or 0,
                    'total_preguntas': total_preguntas,
                    'preguntas_correctas': preguntas_correctas,
                    'porcentaje_acierto': round((preguntas_correctas / total_preguntas * 100), 1) if total_preguntas > 0 else 0
                }
                
                estadisticas_materias.append(estadistica)
        
        serializer = EstadisticasPorMateriaSerializer(estadisticas_materias, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def historial(self, request):
        """Historial de simulaciones del usuario"""
        user = request.user
        
        # Parámetros de filtrado opcionales
        materia_id = request.query_params.get('materia_id')
        limite = int(request.query_params.get('limite', 20))
        
        sesiones = Sesion.objects.filter(usuario=user).order_by('-fecha_inicio')
        
        if materia_id:
            sesiones = sesiones.filter(materia_id=materia_id)
        
        sesiones = sesiones[:limite]
        
        serializer = HistorialSesionSerializer(sesiones, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def progreso_diario(self, request):
        """Progreso diario de los últimos 30 días"""
        user = request.user
        
        # Calcular fecha de inicio (30 días atrás)
        fecha_fin = date.today()
        fecha_inicio = fecha_fin - timedelta(days=30)
        
        progreso = []
        
        # Iterar día por día
        fecha_actual = fecha_inicio
        while fecha_actual <= fecha_fin:
            # Sesiones de este día
            sesiones_dia = Sesion.objects.filter(
                usuario=user,
                fecha_inicio__date=fecha_actual,
                completada=True
            )
            
            if sesiones_dia.exists():
                datos_dia = {
                    'fecha': fecha_actual,
                    'simulaciones': sesiones_dia.count(),
                    'promedio_puntaje': round(sesiones_dia.aggregate(promedio=Avg('puntaje_final'))['promedio'] or 0, 1),
                    'tiempo_estudio': round((sesiones_dia.aggregate(total=Sum('tiempo_total'))['total'] or 0) / 60)
                }
            else:
                datos_dia = {
                    'fecha': fecha_actual,
                    'simulaciones': 0,
                    'promedio_puntaje': 0,
                    'tiempo_estudio': 0
                }
            
            progreso.append(datos_dia)
            fecha_actual += timedelta(days=1)
        
        serializer = ProgresoDiarioSerializer(progreso, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ranking_materias(self, request):
        """Ranking de materias por rendimiento del usuario"""
        user = request.user
        
        materias_stats = []
        
        for materia in Materia.objects.filter(activa=True):
            sesiones = Sesion.objects.filter(usuario=user, materia=materia, completada=True)
            
            if sesiones.exists():
                promedio = sesiones.aggregate(promedio=Avg('puntaje_final'))['promedio'] or 0
                materias_stats.append({
                    'materia_id': materia.id,
                    'materia_nombre': materia.nombre_display,
                    'promedio_puntaje': round(promedio, 1),
                    'color': materia.color,
                    'simulaciones': sesiones.count()
                })
        
        # Ordenar por promedio de puntaje (descendente)
        materias_stats.sort(key=lambda x: x['promedio_puntaje'], reverse=True)
        
        return Response(materias_stats)