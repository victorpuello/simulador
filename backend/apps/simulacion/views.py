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

        # Serializar y agregar información de preguntas/plantillas disponibles
        materias_data = []
        for materia in materias:
            preguntas_disponibles = materia.preguntas.filter(activa=True).count()

            # Plantillas visibles según rol
            if request.user.rol == 'docente':
                # Para docentes, listar solo sus plantillas activas de la materia
                plantillas_qs = PlantillaSimulacion.objects.filter(
                    materia=materia,
                    activa=True,
                    docente=request.user,
                )
            else:
                # Para estudiantes, listar todas las plantillas activas de la materia
                plantillas_qs = PlantillaSimulacion.objects.filter(
                    materia=materia,
                    activa=True,
                )

            plantillas_data = [
                {
                    'id': p.id,
                    'titulo': p.titulo,
                    'descripcion': p.descripcion,
                    'cantidad_preguntas': p.cantidad_preguntas,
                }
                for p in plantillas_qs
            ]

            materias_data.append({
                'id': materia.id,
                'nombre': materia.nombre,
                'nombre_display': materia.nombre_display,
                'color': materia.color,
                'icono': materia.icono,
                'descripcion': materia.descripcion,
                'preguntas_disponibles': preguntas_disponibles,
                'plantillas_disponibles': materia.plantillas_disponibles,
                'plantillas': plantillas_data,
            })

        return Response(materias_data)

class SesionSimulacionViewSet(viewsets.ModelViewSet):
    """ViewSet para sesiones de simulación"""
    queryset = SesionSimulacion.objects.all()
    serializer_class = SesionSimulacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrar sesiones por estudiante"""
        return self.queryset.filter(estudiante=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def test_endpoint(self, request):
        """Endpoint de prueba para verificar autenticación"""
        return Response({
            'message': 'Test endpoint working',
            'user': request.user.username,
            'user_id': request.user.id,
            'user_role': request.user.rol
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def test_simple(self, request):
        """Endpoint de prueba simple sin lógica compleja"""
        try:
            return Response({
                'message': 'Simple test endpoint working',
                'user': request.user.username,
                'user_id': request.user.id,
                'user_role': request.user.rol,
                'timestamp': timezone.now().isoformat()
            })
        except Exception as e:
            return Response({
                'error': str(e),
                'message': 'Error in simple test endpoint'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def test_queryset(self, request):
        """Endpoint de prueba para verificar si el problema está en get_queryset"""
        try:
            # Usar el queryset base sin filtros
            queryset = self.queryset.all()
            count = queryset.count()
            
            # Intentar filtrar por estudiante
            user_sessions = queryset.filter(estudiante=request.user)
            user_count = user_sessions.count()
            
            return Response({
                'message': 'Queryset test working',
                'total_sessions': count,
                'user_sessions': user_count,
                'user': request.user.username,
                'user_id': request.user.id,
                'user_role': request.user.rol
            })
        except Exception as e:
            return Response({
                'error': str(e),
                'message': 'Error in queryset test endpoint'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def test_serializer(self, request):
        """Endpoint de prueba para verificar si el problema está en el serializer"""
        try:
            # Obtener una sesión del usuario
            user_session = self.queryset.filter(estudiante=request.user).first()
            
            if user_session:
                # Usar el serializer básico
                serializer = self.get_serializer(user_session)
                return Response({
                    'message': 'Serializer test working',
                    'session_data': serializer.data,
                    'user': request.user.username,
                    'user_id': request.user.id,
                    'user_role': request.user.rol
                })
            else:
                return Response({
                    'message': 'No sessions found for user',
                    'user': request.user.username,
                    'user_id': request.user.id,
                    'user_role': request.user.rol
                })
        except Exception as e:
            return Response({
                'error': str(e),
                'message': 'Error in serializer test endpoint'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def test_list_method(self, request):
        """Endpoint de prueba para verificar el método list del viewset"""
        try:
            # Simular el método list del viewset
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            
            return Response({
                'message': 'List method test working',
                'count': queryset.count(),
                'data': serializer.data,
                'user': request.user.username,
                'user_id': request.user.id,
                'user_role': request.user.rol
            })
        except Exception as e:
            import traceback
            return Response({
                'error': str(e),
                'traceback': traceback.format_exc(),
                'message': 'Error in list method test endpoint'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                return Response({
                    'detail': 'Ya tienes una sesión activa para esta materia',
                    'sesion_activa': {
                        'id': sesion_activa.id,
                        'materia': sesion_activa.materia.nombre_display,
                        'progreso': progreso
                    }
                }, status=status.HTTP_409_CONFLICT)

        # Crear nueva sesión
        try:
            plantilla = None
            if serializer.validated_data.get('plantilla'):
                plantilla = PlantillaSimulacion.objects.get(
                    pk=serializer.validated_data['plantilla'],
                    activa=True
                )

            # Crear sesión
            sesion = SesionSimulacion.objects.create(
                estudiante=request.user,
                materia=materia,
                plantilla=plantilla
            )

            # Obtener preguntas
            if plantilla and plantilla.preguntas_especificas.exists():
                # Si la plantilla define preguntas específicas, usar exactamente esas
                preguntas = plantilla.preguntas_especificas.all()
            else:
                # Determinar cantidad priorizando: dato del request > cantidad de plantilla > 10 por defecto
                cantidad = serializer.validated_data.get('cantidad_preguntas')
                if cantidad is None and plantilla:
                    cantidad = plantilla.cantidad_preguntas
                if cantidad is None:
                    cantidad = 10

                preguntas = Pregunta.objects.filter(
                    materia=materia,
                    activa=True
                ).order_by('?')[:cantidad]

            # Crear relaciones pregunta-sesión
            for i, pregunta in enumerate(preguntas):
                PreguntaSesion.objects.create(
                    sesion=sesion,
                    pregunta=pregunta,
                    orden=i + 1
                )

            logger.info(f"Nueva sesión creada: ID={sesion.id}, Usuario={request.user.username}, Materia={materia.nombre_display}, Preguntas={preguntas.count()}")

            return Response(SesionSimulacionSerializer(sesion).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error al crear sesión: {str(e)}")
            return Response(
                {'detail': 'Error al crear la sesión'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
        """Endpoint para obtener métricas de sesiones para docentes (shape compatible con frontend)"""
        from django.db.models import Count, Avg, Sum
        from datetime import timedelta
        
        # Parámetros de consulta
        days = int(request.query_params.get('days', 7))
        fecha_fin = timezone.now()
        start_date = fecha_fin - timedelta(days=days)
        
        sesiones_periodo = SesionSimulacion.objects.filter(fecha_inicio__gte=start_date)
        completadas_periodo = sesiones_periodo.filter(completada=True)
        
        # Métricas generales
        total_sesiones = sesiones_periodo.count()
        sesiones_completadas = completadas_periodo.count()
        sesiones_activas = sesiones_periodo.filter(completada=False).count()
        tasa_finalizacion = (sesiones_completadas / total_sesiones * 100) if total_sesiones > 0 else 0
        
        # Tiempo promedio por sesión (en minutos)
        from apps.simulacion.models import PreguntaSesion
        total_tiempo_seg = PreguntaSesion.objects.filter(sesion__in=completadas_periodo).aggregate(total=Sum('tiempo_respuesta'))['total'] or 0
        tiempo_promedio_min = None
        if sesiones_completadas > 0:
            tiempo_promedio_min = round(float(total_tiempo_seg) / sesiones_completadas / 60.0, 1)
        
        # Métricas por materia
        from apps.core.models import Materia
        por_materia = []
        for materia in Materia.objects.all():
            sesiones_materia = sesiones_periodo.filter(materia=materia)
            total_materia = sesiones_materia.count()
            if total_materia > 0:
                completadas_materia = sesiones_materia.filter(completada=True).count()
                promedio_puntuacion = sesiones_materia.filter(completada=True).aggregate(avg_score=Avg('puntuacion'))['avg_score'] or 0
                por_materia.append({
                    'materia': materia.nombre_display,
                    'total_sesiones': total_materia,
                    'completadas': completadas_materia,
                    'activas': total_materia - completadas_materia,
                    'tasa_finalizacion': round((completadas_materia / total_materia * 100), 1),
                    'promedio_puntuacion': round(promedio_puntuacion, 2),
                })
        
        # Top estudiantes activos
        from apps.core.models import Usuario
        estudiantes_qs = Usuario.objects.filter(
            rol='estudiante',
            sesiones_simulacion__fecha_inicio__gte=start_date
        ).annotate(
            sesiones_count=Count('sesiones_simulacion'),
            sesiones_completadas=Count('sesiones_simulacion', filter=Q(sesiones_simulacion__completada=True))
        ).order_by('-sesiones_count')[:10]
        estudiantes_activos = []
        for est in estudiantes_qs:
            total = est.sesiones_count or 0
            comp = est.sesiones_completadas or 0
            tasa = round((comp / total * 100), 1) if total > 0 else 0
            estudiantes_activos.append({
                'username': est.username,
                'nombre_completo': f"{est.first_name} {est.last_name}".strip() or est.username,
                'total_sesiones': total,
                'sesiones_completadas': comp,
                'tasa_finalizacion': tasa,
            })
        
        return Response({
            'periodo': {
                'dias': days,
                'fecha_inicio': start_date,
                'fecha_fin': fecha_fin,
            },
            'generales': {
                'total_sesiones': total_sesiones,
                'sesiones_completadas': sesiones_completadas,
                'sesiones_activas': sesiones_activas,
                'tasa_finalizacion': round(tasa_finalizacion, 1),
                'tiempo_promedio_minutos': tiempo_promedio_min,
            },
            'por_materia': por_materia,
            'estudiantes_activos': estudiantes_activos,
            'timestamp': fecha_fin,
        })

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def cargar_sesion(self, request, pk=None):
        """Carga una sesión activa con todas sus preguntas para continuar"""
        sesion = self.get_object()
        
        # Verificar que la sesión pertenece al usuario actual
        if sesion.estudiante != request.user:
            return Response(
                {'detail': 'No tienes permiso para acceder a esta sesión'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verificar que la sesión no esté completada
        if sesion.completada:
            return Response(
                {'detail': 'Esta sesión ya está completada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener preguntas con sus respuestas
        preguntas_sesion = sesion.preguntas_sesion.select_related('pregunta').order_by('orden')
        
        # Formatear preguntas para el frontend
        preguntas_data = []
        respuestas_data = []
        siguiente_pregunta_index = None
        
        from django.core.files.storage import default_storage
        for i, ps in enumerate(preguntas_sesion):
            # Construir URL absoluta de imagen si existe
            imagen_url = None
            if ps.pregunta.imagen and getattr(ps.pregunta.imagen, 'name', None):
                try:
                    if default_storage.exists(ps.pregunta.imagen.name):
                        if request:
                            imagen_url = request.build_absolute_uri(ps.pregunta.imagen.url)
                        else:
                            imagen_url = ps.pregunta.imagen.url
                except Exception:
                    imagen_url = None
            pregunta_data = {
                'id': ps.pregunta.id,
                'enunciado': ps.pregunta.enunciado,
                'contexto': ps.pregunta.contexto,
                'opciones': ps.pregunta.opciones,
                'imagen_url': imagen_url,
                # Campos adicionales solicitados para retroalimentación
                'respuesta_correcta': ps.pregunta.respuesta_correcta,
                'explicacion': ps.pregunta.explicacion,
                'estrategias_resolucion': ps.pregunta.estrategias_resolucion,
                # Campos de apoyo (mejor UX del modal)
                'retroalimentacion': ps.pregunta.retroalimentacion,
                'retroalimentacion_estructurada': ps.pregunta.retroalimentacion_estructurada,
                'explicacion_opciones_incorrectas': ps.pregunta.explicacion_opciones_incorrectas,
                'dificultad': ps.pregunta.dificultad,
                'tiempo_estimado': ps.pregunta.tiempo_estimado,
                'materia': ps.pregunta.materia.id,
                'competencia': ps.pregunta.competencia.id if ps.pregunta.competencia else None,
                'tags': ps.pregunta.tags,
                'orden': ps.orden
            }
            preguntas_data.append(pregunta_data)
            
            # Si ya fue respondida, agregar a respuestas
            if ps.respuesta_estudiante:
                respuestas_data.append({
                    'pregunta': ps.pregunta.id,
                    'respuesta': ps.respuesta_estudiante,
                    'es_correcta': ps.es_correcta,
                    'tiempo_respuesta': ps.tiempo_respuesta or 0,
                    'orden': ps.orden
                })
            elif siguiente_pregunta_index is None:
                # Esta es la primera pregunta sin responder
                siguiente_pregunta_index = i
        
        # Si no encontramos pregunta sin responder, ir al final
        if siguiente_pregunta_index is None:
            siguiente_pregunta_index = len(preguntas_data) - 1
        
        # Calcular progreso
        progreso = sesion.get_progreso()
        
        # Preparar datos de respuesta
        sesion_data = {
            'id': sesion.id,
            'materia': {
                'id': sesion.materia.id,
                'nombre': sesion.materia.nombre,
                'nombre_display': sesion.materia.nombre_display,
                'color': sesion.materia.color
            },
            'plantilla': {
                'id': sesion.plantilla.id,
                'titulo': sesion.plantilla.titulo,
                'descripcion': sesion.plantilla.descripcion
            } if sesion.plantilla else None,
            'fecha_inicio': sesion.fecha_inicio,
            'completada': sesion.completada,
            'puntuacion': sesion.puntuacion,
            'progreso': progreso,
            'preguntas_sesion': preguntas_data,
            'respuestas_existentes': respuestas_data,
            'siguiente_pregunta_index': siguiente_pregunta_index,
            'puede_continuar': True
        }
        
        logger.info(f"Sesión cargada para continuar: ID={sesion.id}, Usuario={request.user.username}, Progreso={progreso['porcentaje']}%")
        
        return Response(sesion_data, status=status.HTTP_200_OK)