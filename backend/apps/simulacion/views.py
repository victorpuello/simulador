from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count
from django.db.models.functions import Coalesce
import random
import logging

from .models import PlantillaSimulacion, SesionSimulacion, PreguntaSesion
from .serializers import (
    PlantillaSimulacionSerializer, SesionSimulacionSerializer,
    IniciarSesionSerializer, ResponderPreguntaSerializer
)
from .permissions import EsDocente, SoloEstudiantes
from apps.core.models import Pregunta, Materia

# Logger para sesiones
logger = logging.getLogger('simulacion.sessions')
from apps.core.serializers import MateriaSerializer

class PlantillaSimulacionViewSet(viewsets.ModelViewSet):
    """ViewSet para plantillas de simulación"""
    queryset = PlantillaSimulacion.objects.all()
    serializer_class = PlantillaSimulacionSerializer
    permission_classes = [IsAuthenticated]  # Permitir acceso a cualquier usuario autenticado

    def get_permissions(self):
        """Personalizar permisos según la acción"""
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'toggle_activa']:
            permission_classes = [IsAuthenticated, EsDocente]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filtrar plantillas por docente"""
        queryset = super().get_queryset()
        if self.request.user.rol == 'docente':
            return queryset.filter(docente=self.request.user)
        return queryset.none()

    def perform_create(self, serializer):
        serializer.save(docente=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_activa(self, request, pk=None):
        """Activa o desactiva una plantilla"""
        plantilla = self.get_object()
        plantilla.activa = not plantilla.activa
        plantilla.save()
        serializer = self.get_serializer(plantilla)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def vista_previa(self, request, pk=None):
        """Obtiene vista previa de las preguntas"""
        plantilla = self.get_object()
        if plantilla.preguntas_especificas.exists():
            preguntas = plantilla.preguntas_especificas.all()
        else:
            preguntas = Pregunta.objects.filter(
                materia=plantilla.materia,
                activa=True
            )[:plantilla.cantidad_preguntas]
        from apps.core.serializers import PreguntaSerializer
        serializer = PreguntaSerializer(preguntas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def materias_disponibles(self, request):
        """Obtiene las materias que tienen preguntas activas o plantillas disponibles"""
        print(f"Usuario: {request.user}, Rol: {request.user.rol}")
        
        # Base query para materias activas
        materias = Materia.objects.filter(activa=True).annotate(
            preguntas_activas=Count(
                'preguntas',
                filter=Q(preguntas__activa=True)
            ),
            plantillas_disponibles=Count(
                'plantillas_simulacion',
                filter=Q(plantillas_simulacion__activa=True),
                distinct=True
            )
        )

        if request.user.rol == 'docente':
            # Para docentes, mostrar materias donde tienen plantillas o suficientes preguntas
            materias = materias.filter(
                Q(preguntas_activas__gte=5) |
                Q(plantillas_simulacion__activa=True, plantillas_simulacion__docente=request.user)
            ).distinct()
        else:
            # Para estudiantes, mostrar SOLO materias con plantillas activas
            materias = materias.filter(
                plantillas_disponibles__gt=0
            )

        print(f"Materias encontradas: {materias.count()}")
        print(f"Query SQL: {materias.query}")

        serializer = MateriaSerializer(materias, many=True)
        
        # Agregar información adicional a cada materia
        data = serializer.data
        for materia_data in data:
            materia = materias.get(id=materia_data['id'])
            materia_data['preguntas_disponibles'] = materia.preguntas_activas
            materia_data['plantillas_disponibles'] = materia.plantillas_disponibles
            
            # Obtener información de plantillas específicas para estudiantes
            if request.user.rol == 'estudiante':
                plantillas_activas = PlantillaSimulacion.objects.filter(
                    materia_id=materia_data['id'],
                    activa=True
                ).values('id', 'titulo', 'descripcion', 'cantidad_preguntas')
                materia_data['plantillas'] = list(plantillas_activas)
                
                # Debug: Verificar que solo se incluyen plantillas activas
                print(f'Materia {materia_data["nombre_display"]}: {len(materia_data["plantillas"])} plantillas activas')

        print(f"Datos a retornar: {data}")
        return Response(data)

class SesionSimulacionViewSet(viewsets.ModelViewSet):
    """ViewSet para sesiones de simulación"""
    queryset = SesionSimulacion.objects.all()
    serializer_class = SesionSimulacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrar sesiones por estudiante"""
        return self.queryset.filter(estudiante=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, SoloEstudiantes])
    def verificar_sesion_activa(self, request):
        """Verifica sesiones activas del estudiante"""
        materia_id = request.query_params.get('materia_id')
        
        if materia_id:
            # Verificar sesión activa para materia específica
            try:
                materia = Materia.objects.get(pk=materia_id)
                sesion_activa = SesionSimulacion.get_sesion_activa_por_materia(
                    request.user, materia
                )
                
                if sesion_activa:
                    progreso = sesion_activa.get_progreso()
                    return Response({
                        'tiene_sesion_activa': True,
                        'sesion': {
                            'id': sesion_activa.id,
                            'materia': sesion_activa.materia.nombre,
                            'materia_display': sesion_activa.materia.nombre_display,
                            'materia_id': sesion_activa.materia.id,
                            'fecha_inicio': sesion_activa.fecha_inicio,
                            'progreso': progreso
                        }
                    })
                else:
                    return Response({'tiene_sesion_activa': False})
                    
            except Materia.DoesNotExist:
                return Response(
                    {'error': 'Materia no encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Obtener todas las sesiones activas del estudiante
            sesiones_activas = SesionSimulacion.objects.filter(
                estudiante=request.user,
                completada=False
            ).select_related('materia')
            
            if sesiones_activas.exists():
                sesiones_data = []
                for sesion in sesiones_activas:
                    progreso = sesion.get_progreso()
                    sesiones_data.append({
                        'id': sesion.id,
                        'materia': sesion.materia.nombre,
                        'materia_display': sesion.materia.nombre_display,
                        'materia_id': sesion.materia.id,
                        'fecha_inicio': sesion.fecha_inicio,
                        'progreso': progreso
                    })
                
                return Response({
                    'tiene_sesiones_activas': True,
                    'sesiones': sesiones_data,
                    'count': len(sesiones_data)
                })
            else:
                return Response({'tiene_sesiones_activas': False, 'sesiones': [], 'count': 0})

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, SoloEstudiantes])
    def iniciar_sesion(self, request):
        """Inicia una nueva sesión de simulación"""
        serializer = IniciarSesionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            materia = Materia.objects.get(pk=serializer.validated_data['materia'])
        except Materia.DoesNotExist:
            return Response(
                {'detail': 'Materia no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar si hay una sesión activa para esta materia específica
        sesion_activa = SesionSimulacion.get_sesion_activa_por_materia(
            request.user, materia
        )

        if sesion_activa:
            # Si se solicita forzar reinicio, eliminar sesión activa
            forzar_reinicio = serializer.validated_data.get('forzar_reinicio', False)
            if forzar_reinicio:
                logger.info(f"Sesión forzada a reiniciar: ID={sesion_activa.id}, Usuario={request.user.username}, Materia={materia.nombre_display}")
                sesion_activa.delete()
            else:
                progreso = sesion_activa.get_progreso()
                return Response(
                    {
                        'detail': f'Ya tienes una sesión activa para {materia.nombre_display}',
                        'sesion_id': sesion_activa.id,
                        'materia': materia.nombre_display,
                        'progreso': progreso
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Crear nueva sesión
        sesion = SesionSimulacion.objects.create(
            estudiante=request.user,
            materia=materia
        )
        
        # Log de creación de sesión
        logger.info(f"Sesión creada: ID={sesion.id}, Usuario={request.user.username}, Materia={materia.nombre_display}")

        # Obtener preguntas según la configuración
        plantilla_id = serializer.validated_data.get('plantilla')
        if plantilla_id:
            try:
                plantilla = PlantillaSimulacion.objects.get(
                    pk=plantilla_id,
                    activa=True
                )
                sesion.plantilla = plantilla
                sesion.save()
                if plantilla.preguntas_especificas.exists():
                    preguntas = list(plantilla.preguntas_especificas.all())
                else:
                    preguntas = list(Pregunta.objects.filter(
                        materia=materia,
                        activa=True
                    )[:plantilla.cantidad_preguntas])
            except PlantillaSimulacion.DoesNotExist:
                return Response(
                    {'detail': 'Plantilla no encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            cantidad = serializer.validated_data.get('cantidad_preguntas', 10)
            preguntas = list(Pregunta.objects.filter(
                materia=materia,
                activa=True
            ).order_by('?')[:cantidad])

        # Crear PreguntaSesion para cada pregunta
        for i, pregunta in enumerate(preguntas):
            PreguntaSesion.objects.create(
                sesion=sesion,
                pregunta=pregunta,
                orden=i
            )

        serializer = SesionSimulacionSerializer(sesion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def responder_pregunta(self, request, pk=None):
        """Registra la respuesta a una pregunta"""
        sesion = self.get_object()
        if sesion.completada:
            return Response(
                {'detail': 'Esta sesión ya está completada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ResponderPreguntaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        pregunta_actual = sesion.preguntas_sesion.filter(
            respuesta_estudiante=None
        ).order_by('orden').first()

        if not pregunta_actual:
            return Response(
                {'detail': 'No hay preguntas pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Registrar respuesta
        respuesta = serializer.validated_data['respuesta'].upper()
        tiempo = serializer.validated_data['tiempo_respuesta']
        es_correcta = respuesta == pregunta_actual.pregunta.respuesta_correcta

        pregunta_actual.respuesta_estudiante = respuesta
        pregunta_actual.es_correcta = es_correcta
        pregunta_actual.tiempo_respuesta = tiempo
        pregunta_actual.save()

        # Actualizar puntuación
        if es_correcta:
            sesion.puntuacion += 1

        # Verificar si es la última pregunta
        if not sesion.preguntas_sesion.filter(respuesta_estudiante=None).exists():
            sesion.completada = True
            sesion.fecha_fin = timezone.now()
            
            # Log de finalización de sesión
            logger.info(f"Sesión completada: ID={sesion.id}, Usuario={sesion.estudiante.username}, Materia={sesion.materia.nombre_display}, Puntuación={sesion.puntuacion}")

        sesion.save()
        return Response(SesionSimulacionSerializer(sesion).data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, EsDocente])
    def metricas(self, request):
        """Endpoint para obtener métricas de sesiones para docentes"""
        from django.db.models import Count, Avg, Sum
        from datetime import timedelta
        
        # Parámetros de consulta
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)
        
        # Métricas generales
        total_sesiones = SesionSimulacion.objects.filter(fecha_inicio__gte=start_date).count()
        sesiones_completadas = SesionSimulacion.objects.filter(
            fecha_inicio__gte=start_date,
            completada=True
        ).count()
        sesiones_activas = SesionSimulacion.objects.filter(
            fecha_inicio__gte=start_date,
            completada=False
        ).count()
        
        tasa_finalizacion = (sesiones_completadas / total_sesiones * 100) if total_sesiones > 0 else 0
        
        # Métricas por materia
        from apps.core.models import Materia
        materias_stats = []
        for materia in Materia.objects.all():
            sesiones_materia = SesionSimulacion.objects.filter(
                materia=materia,
                fecha_inicio__gte=start_date
            )
            total_materia = sesiones_materia.count()
            
            if total_materia > 0:
                completadas_materia = sesiones_materia.filter(completada=True).count()
                promedio_puntuacion = sesiones_materia.filter(
                    completada=True
                ).aggregate(avg_score=Avg('puntuacion'))['avg_score'] or 0
                
                materias_stats.append({
                    'materia': materia.nombre_display,
                    'total_sesiones': total_materia,
                    'completadas': completadas_materia,
                    'activas': total_materia - completadas_materia,
                    'tasa_finalizacion': round((completadas_materia / total_materia * 100), 1),
                    'promedio_puntuacion': round(promedio_puntuacion, 2)
                })
        
        # Top estudiantes activos
        from apps.core.models import Usuario
        estudiantes_activos = Usuario.objects.filter(
            rol='estudiante',
            sesiones_simulacion__fecha_inicio__gte=start_date
        ).annotate(
            total_sesiones=Count('sesiones_simulacion'),
            sesiones_completadas=Count('sesiones_simulacion', filter=Q(sesiones_simulacion__completada=True))
        ).order_by('-total_sesiones')[:10]
        
        estudiantes_data = []
        for estudiante in estudiantes_activos:
            estudiantes_data.append({
                'username': estudiante.username,
                'nombre_completo': f"{estudiante.first_name} {estudiante.last_name}".strip() or estudiante.username,
                'total_sesiones': estudiante.total_sesiones,
                'sesiones_completadas': estudiante.sesiones_completadas,
                'tasa_finalizacion': round((estudiante.sesiones_completadas / estudiante.total_sesiones * 100), 1) if estudiante.total_sesiones > 0 else 0
            })
        
        # Estadísticas de tiempo
        sesiones_con_tiempo = SesionSimulacion.objects.filter(
            fecha_inicio__gte=start_date,
            completada=True,
            fecha_fin__isnull=False
        )
        
        tiempo_promedio = None
        if sesiones_con_tiempo.exists():
            tiempos = []
            for sesion in sesiones_con_tiempo:
                if sesion.duracion:
                    tiempos.append(sesion.duracion.total_seconds() / 60)  # en minutos
            
            if tiempos:
                tiempo_promedio = round(sum(tiempos) / len(tiempos), 1)
        
        return Response({
            'periodo': {
                'dias': days,
                'fecha_inicio': start_date.isoformat(),
                'fecha_fin': timezone.now().isoformat()
            },
            'generales': {
                'total_sesiones': total_sesiones,
                'sesiones_completadas': sesiones_completadas,
                'sesiones_activas': sesiones_activas,
                'tasa_finalizacion': round(tasa_finalizacion, 1),
                'tiempo_promedio_minutos': tiempo_promedio
            },
            'por_materia': materias_stats,
            'estudiantes_activos': estudiantes_data,
            'timestamp': timezone.now().isoformat()
        })