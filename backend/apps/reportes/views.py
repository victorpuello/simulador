from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Sum, Max, Q
from django.utils import timezone
from datetime import timedelta, date
from apps.simulacion.models import SesionSimulacion, PreguntaSesion
from apps.core.models import Materia
from apps.simulacion.permissions import SoloEstudiantes, EsDocente
from .serializers import (
    EstadisticasUsuarioSerializer,
    EstadisticasPorMateriaSerializer,
    HistorialSesionSerializer,
    ProgresoDiarioSerializer
)
from .utils import calcular_estadisticas_icfes

class ReportesViewSet(viewsets.ViewSet):
    """ViewSet para todos los reportes y analytics"""
    permission_classes = [IsAuthenticated, SoloEstudiantes]
    
    @action(detail=False, methods=['get'])
    def estadisticas_generales(self, request):
        """Estadísticas generales del usuario"""
        user = request.user
        
        # Calcular estadísticas básicas
        sesiones = SesionSimulacion.objects.filter(estudiante=user)
        sesiones_completadas = sesiones.filter(completada=True)
        
        # Calcular tiempo total de estudio basado en las respuestas
        tiempo_total_segundos = 0
        for sesion in sesiones_completadas:
            preguntas_sesion = sesion.preguntas_sesion.all()
            tiempo_sesion = sum(p.tiempo_respuesta or 0 for p in preguntas_sesion)
            tiempo_total_segundos += tiempo_sesion
        
        estadisticas = {
            'total_simulaciones': sesiones.count(),
            'simulaciones_completadas': sesiones_completadas.count(),
            'promedio_puntaje': sesiones_completadas.aggregate(
                promedio=Avg('puntuacion')
            )['promedio'] or 0,
            'tiempo_total_estudio': round(tiempo_total_segundos / 60),  # Convertir a minutos
            'mejor_puntaje': sesiones_completadas.aggregate(
                mejor=Max('puntuacion')
            )['mejor'] or 0,
            'ultima_simulacion': sesiones.order_by('-fecha_inicio').first().fecha_inicio if sesiones.exists() and sesiones.order_by('-fecha_inicio').first() else None,
            'racha_actual': getattr(user, 'racha_actual', 0)
        }
        
        # Redondear promedio de puntaje
        estadisticas['promedio_puntaje'] = round(estadisticas['promedio_puntaje'], 1) if estadisticas['promedio_puntaje'] else 0
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
            sesiones = SesionSimulacion.objects.filter(estudiante=user, materia=materia, completada=True)
            preguntas_sesion = PreguntaSesion.objects.filter(sesion__in=sesiones)
            
            if sesiones.exists():
                total_preguntas = preguntas_sesion.count()
                preguntas_correctas = preguntas_sesion.filter(es_correcta=True).count()
                
                estadistica = {
                    'materia_id': materia.id,
                    'materia_nombre': materia.nombre_display,
                    'simulaciones_realizadas': sesiones.count(),
                    'promedio_puntaje': round(sesiones.aggregate(promedio=Avg('puntuacion'))['promedio'] or 0, 1),
                    'mejor_puntaje': sesiones.aggregate(mejor=Max('puntuacion'))['mejor'] or 0,
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
        materia_id = request.GET.get('materia_id')
        limite = int(request.GET.get('limite', 20))
        
        sesiones = SesionSimulacion.objects.filter(estudiante=user).order_by('-fecha_inicio')
        
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
            sesiones_dia = SesionSimulacion.objects.filter(
                estudiante=user,
                fecha_inicio__date=fecha_actual,
                completada=True
            )
            
            if sesiones_dia.exists():
                # Calcular tiempo total de estudio para este día
                tiempo_total_segundos = 0
                for sesion in sesiones_dia:
                    preguntas_sesion = sesion.preguntas_sesion.all()
                    tiempo_sesion = sum(p.tiempo_respuesta or 0 for p in preguntas_sesion)
                    tiempo_total_segundos += tiempo_sesion
                
                datos_dia = {
                    'fecha': fecha_actual,
                    'simulaciones': sesiones_dia.count(),
                    'promedio_puntaje': round(sesiones_dia.aggregate(promedio=Avg('puntuacion'))['promedio'] or 0, 1),
                    'tiempo_estudio': round(tiempo_total_segundos / 60)  # Convertir a minutos
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
            sesiones = SesionSimulacion.objects.filter(estudiante=user, materia=materia, completada=True)
            
            if sesiones.exists():
                promedio = sesiones.aggregate(promedio=Avg('puntuacion'))['promedio'] or 0
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
    
    @action(detail=False, methods=['get'])
    def reporte_icfes(self, request):
        """Reporte completo del puntaje ICFES del estudiante"""
        user = request.user
        
        # Calcular estadísticas ICFES
        estadisticas_icfes = calcular_estadisticas_icfes(user)
        
        return Response(estadisticas_icfes)


class ReportesDocenteViewSet(viewsets.ViewSet):
    """Reportes y métricas para docentes"""
    permission_classes = [IsAuthenticated, EsDocente]

    def _filtrar_clases_estudiantes(self, request):
        docente = request.user
        # Recolectar estudiantes de todas las clases activas del docente
        from apps.core.models import Clase
        clases = Clase.objects.filter(docente=docente, activa=True)
        estudiantes_ids = set()
        for c in clases:
            estudiantes_ids.update(c.estudiantes.values_list('id', flat=True))
        return list(estudiantes_ids)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        estudiantes_ids = self._filtrar_clases_estudiantes(request)
        sesiones = SesionSimulacion.objects.filter(estudiante_id__in=estudiantes_ids)
        completadas = sesiones.filter(completada=True)

        # Activos por ventana de tiempo
        ahora = timezone.now()
        activos_7d = sesiones.filter(fecha_inicio__gte=ahora - timedelta(days=7)).values('estudiante').distinct().count()
        activos_30d = sesiones.filter(fecha_inicio__gte=ahora - timedelta(days=30)).values('estudiante').distinct().count()

        # Tiempo promedio por pregunta
        ps_qs = PreguntaSesion.objects.filter(sesion__in=completadas)
        total_respuestas = ps_qs.count()
        tiempo_promedio = (ps_qs.aggregate(total=Sum('tiempo_respuesta'))['total'] or 0) / total_respuestas if total_respuestas else 0

        data = {
            'simulaciones_totales': sesiones.count(),
            'simulaciones_completadas': completadas.count(),
            'estudiantes_activos_7d': activos_7d,
            'estudiantes_activos_30d': activos_30d,
            'promedio_puntaje': round(completadas.aggregate(p=Avg('puntuacion'))['p'] or 0, 1),
            'tiempo_promedio_pregunta': round(float(tiempo_promedio), 2),
        }

        from .serializers import DocenteResumenSerializer
        return Response(DocenteResumenSerializer(data).data)

    @action(detail=False, methods=['get'])
    def materias(self, request):
        estudiantes_ids = self._filtrar_clases_estudiantes(request)
        materias = Materia.objects.filter(activa=True)
        items = []
        for materia in materias:
            sesiones = SesionSimulacion.objects.filter(estudiante_id__in=estudiantes_ids, materia=materia, completada=True)
            ps = PreguntaSesion.objects.filter(sesion__in=sesiones)
            total = ps.count()
            correctas = ps.filter(es_correcta=True).count()
            tiempo_prom = (ps.aggregate(total=Sum('tiempo_respuesta'))['total'] or 0) / total if total else 0
            if sesiones.exists():
                items.append({
                    'materia_id': materia.id,
                    'materia_nombre': materia.nombre_display,
                    'simulaciones': sesiones.count(),
                    'promedio_puntaje': round(sesiones.aggregate(p=Avg('puntuacion'))['p'] or 0, 1),
                    'porcentaje_acierto': round((correctas / total * 100), 1) if total else 0,
                    'tiempo_promedio_pregunta': round(float(tiempo_prom), 2),
                })
        from .serializers import DocenteMateriaSerializer
        return Response(DocenteMateriaSerializer(items, many=True).data)

    @action(detail=False, methods=['get'])
    def preguntas(self, request):
        estudiantes_ids = self._filtrar_clases_estudiantes(request)
        materia_id = request.GET.get('materia')
        limit = int(request.GET.get('limit', 50))

        ps = PreguntaSesion.objects.filter(sesion__estudiante_id__in=estudiantes_ids)
        if materia_id:
            ps = ps.filter(pregunta__materia_id=materia_id)

        # Agrupar por pregunta
        from django.db.models import Count, Case, When, FloatField
        qs = ps.values('pregunta_id', 'pregunta__enunciado').annotate(
            total=Count('id'),
            correctas=Count(Case(When(es_correcta=True, then=1))),
        ).order_by('pregunta_id')

        items = []
        for row in qs[:limit]:
            total = row['total']
            correctas = row['correctas'] or 0
            acierto = round((correctas / total * 100), 1) if total else 0
            # Opción más elegida entre incorrectas
            opciones = PreguntaSesion.objects.filter(
                sesion__estudiante_id__in=estudiantes_ids,
                pregunta_id=row['pregunta_id'],
            ).values('respuesta_estudiante').annotate(c=Count('id')).order_by('-c')
            opcion_top = opciones[0]['respuesta_estudiante'] if opciones else None
            items.append({
                'pregunta_id': row['pregunta_id'],
                'enunciado_resumen': (row['pregunta__enunciado'] or '')[:120],
                'porcentaje_acierto': acierto,
                'total_respuestas': total,
                'opcion_mas_elegida': opcion_top,
            })

        from .serializers import DocentePreguntaItemSerializer
        return Response(DocentePreguntaItemSerializer(items, many=True).data)

    @action(detail=False, methods=['get'])
    def estudiantes(self, request):
        estudiantes_ids = self._filtrar_clases_estudiantes(request)
        sesiones = SesionSimulacion.objects.filter(estudiante_id__in=estudiantes_ids)
        completadas = sesiones.filter(completada=True)

        # Agregar por estudiante
        from django.db.models import Count
        items = []
        for est_id in sesiones.values_list('estudiante_id', flat=True).distinct():
            ses_est = completadas.filter(estudiante_id=est_id)
            ps = PreguntaSesion.objects.filter(sesion__in=ses_est)
            total = ps.count()
            correctas = ps.filter(es_correcta=True).count()
            tiempo_prom = (ps.aggregate(total=Sum('tiempo_respuesta'))['total'] or 0) / total if total else 0
            from apps.core.models import Usuario
            u = Usuario.objects.filter(id=est_id).first()
            items.append({
                'estudiante_id': est_id,
                'nombre': f"{u.first_name} {u.last_name}".strip() or u.username if u else str(est_id),
                'simulaciones': ses_est.count(),
                'porcentaje_acierto': round((correctas / total * 100), 1) if total else 0,
                'tiempo_promedio_pregunta': round(float(tiempo_prom), 2),
            })

        from .serializers import DocenteEstudianteSerializer
        return Response(DocenteEstudianteSerializer(items, many=True).data)