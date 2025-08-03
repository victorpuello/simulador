import random
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Count, Avg
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin, ListModelMixin
from .permissions import SoloEstudiantes

from apps.core.models import Sesion, Pregunta, RespuestaUsuario, Materia, Competencia
from .serializers import (
    IniciarSesionSerializer, SesionSerializer, ResponderPreguntaSerializer,
    RespuestaUsuarioSerializer, PreguntaSimulacionSerializer, FinalizarSesionSerializer,
    EstadisticasSesionSerializer
)
from apps.core.serializers import PreguntaRetroalimentacionSerializer


class SimulacionViewSet(GenericViewSet, CreateModelMixin, RetrieveModelMixin, ListModelMixin):
    """ViewSet para gestionar sesiones de simulación"""
    serializer_class = SesionSerializer
    permission_classes = [IsAuthenticated, SoloEstudiantes]
    
    def get_queryset(self):
        """Obtener sesiones del usuario actual"""
        return Sesion.objects.filter(usuario=self.request.user).order_by('-fecha_inicio')
    
    @action(detail=False, methods=['post'])
    def iniciar_sesion(self, request):
        """Iniciar una nueva sesión de simulación"""
        serializer = IniciarSesionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Obtener datos validados
        materia_id = serializer.validated_data['materia_id']
        cantidad_preguntas = serializer.validated_data['cantidad_preguntas']
        modo = serializer.validated_data['modo']
        
        try:
            with transaction.atomic():
                # Crear la sesión
                materia = Materia.objects.get(id=materia_id)
                sesion = Sesion.objects.create(
                    usuario=request.user,
                    materia=materia,
                    modo=modo,
                    fecha_inicio=timezone.now()
                )
                
                # Obtener preguntas según los criterios
                preguntas = self._seleccionar_preguntas(materia_id, cantidad_preguntas)
                
                # Serializar sesión y preguntas
                sesion_data = SesionSerializer(sesion).data
                preguntas_data = PreguntaSimulacionSerializer(preguntas, many=True).data
                
                return Response({
                    'sesion': sesion_data,
                    'preguntas': preguntas_data,
                    'mensaje': f'Sesión iniciada con {len(preguntas)} preguntas'
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            error_message = str(e).lower()
            if 'database is locked' in error_message or 'locked' in error_message:
                return Response({
                    'error': 'La base de datos está temporalmente ocupada. Por favor, inténtalo de nuevo en unos segundos.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            else:
                return Response({
                    'error': f'Error al iniciar sesión: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def responder_pregunta(self, request, pk=None):
        """Responder una pregunta de la sesión"""
        sesion = self.get_object()
        
        # Verificar que la sesión no esté completada
        if sesion.completada:
            return Response({
                'error': 'La sesión ya está completada'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que la sesión pertenece al usuario
        if sesion.usuario != request.user:
            return Response({
                'error': 'No tienes permisos para esta sesión'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ResponderPreguntaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        pregunta_id = serializer.validated_data['pregunta_id']
        respuesta_seleccionada = serializer.validated_data['respuesta_seleccionada']
        tiempo_respuesta = serializer.validated_data['tiempo_respuesta']
        
        try:
            with transaction.atomic():
                # Verificar que la pregunta existe
                pregunta = Pregunta.objects.get(
                    id=pregunta_id,
                    materia=sesion.materia,
                    activa=True
                )
                
                # Verificar que no se haya respondido ya esta pregunta
                if RespuestaUsuario.objects.filter(sesion=sesion, pregunta=pregunta).exists():
                    return Response({
                        'error': 'Esta pregunta ya ha sido respondida'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Evaluar si la respuesta es correcta
                es_correcta = pregunta.respuesta_correcta == respuesta_seleccionada
                
                # Crear la respuesta
                respuesta = RespuestaUsuario.objects.create(
                    sesion=sesion,
                    pregunta=pregunta,
                    respuesta_seleccionada=respuesta_seleccionada,
                    es_correcta=es_correcta,
                    tiempo_respuesta=tiempo_respuesta
                )
                
                # Preparar retroalimentación exhaustiva
                retroalimentacion_serializer = PreguntaRetroalimentacionSerializer(pregunta)
                
                return Response({
                    'es_correcta': es_correcta,
                    'respuesta_seleccionada': respuesta_seleccionada,
                    'pregunta': retroalimentacion_serializer.data,
                    'mensaje': 'Respuesta registrada correctamente'
                })
                
        except Pregunta.DoesNotExist:
            return Response({
                'error': 'Pregunta no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def finalizar_sesion(self, request, pk=None):
        """Finalizar una sesión y calcular estadísticas"""
        sesion = self.get_object()
        
        # Verificar permisos
        if sesion.usuario != request.user:
            return Response({
                'error': 'No tienes permisos para esta sesión'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if sesion.completada:
            return Response({
                'error': 'La sesión ya está completada'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Finalizar sesión
                sesion.fecha_fin = timezone.now()
                sesion.completada = True
                
                # Calcular tiempo total
                if sesion.fecha_inicio:
                    delta = sesion.fecha_fin - sesion.fecha_inicio
                    sesion.tiempo_total = int(delta.total_seconds())
                
                # Calcular estadísticas
                estadisticas = self._calcular_estadisticas_sesion(sesion)
                sesion.puntaje_final = estadisticas['puntaje_final']
                sesion.save()
                
                # Actualizar racha del usuario si es necesario
                request.user.actualizar_racha()
                
                # Obtener todas las respuestas de la sesión
                respuestas = RespuestaUsuario.objects.filter(sesion=sesion)
                respuestas_data = [{
                    'pregunta_id': r.pregunta.id,
                    'respuesta_seleccionada': r.respuesta_seleccionada,
                    'es_correcta': r.es_correcta,
                    'tiempo_respuesta': r.tiempo_respuesta
                } for r in respuestas]
                
                return Response({
                    'sesion': SesionSerializer(sesion).data,
                    'estadisticas': estadisticas,
                    'respuestas': respuestas_data,
                    'mensaje': 'Sesión finalizada correctamente'
                })
                
        except Exception as e:
            return Response({
                'error': f'Error al finalizar sesión: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _seleccionar_preguntas(self, materia_id, cantidad):
        """Lógica inteligente para seleccionar preguntas"""
        queryset = Pregunta.objects.filter(
            materia_id=materia_id,
            activa=True
        )
        
        preguntas_disponibles = list(queryset)
        
        if len(preguntas_disponibles) < cantidad:
            return preguntas_disponibles
        
        # Selección aleatoria
        return random.sample(preguntas_disponibles, cantidad)
    
    def _calcular_estadisticas_sesion(self, sesion):
        """Calcular estadísticas básicas de una sesión"""
        respuestas = sesion.respuestas.all()
        total_preguntas = respuestas.count()
        
        if total_preguntas == 0:
            return {
                'puntaje_final': 0,
                'porcentaje_acierto': 0,
                'tiempo_promedio': 0
            }
        
        correctas = respuestas.filter(es_correcta=True).count()
        incorrectas = total_preguntas - correctas
        
        porcentaje_acierto = (correctas / total_preguntas) * 100
        puntaje_final = int(porcentaje_acierto)
        
        tiempo_promedio = respuestas.aggregate(Avg('tiempo_respuesta'))['tiempo_respuesta__avg'] or 0
        
        return {
            'puntaje_final': puntaje_final,
            'total_preguntas': total_preguntas,
            'correctas': correctas,
            'incorrectas': incorrectas,
            'porcentaje_acierto': round(porcentaje_acierto, 2),
            'tiempo_promedio': round(tiempo_promedio, 2)
        }