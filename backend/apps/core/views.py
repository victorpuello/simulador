from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta
import random
import json
from django.db import transaction
from django.core.validators import MinValueValidator, MaxValueValidator
from django.http import JsonResponse

from .models import (
    Materia, Competencia, Pregunta, Sesion, RespuestaUsuario,
    Clase, Asignacion, Insignia, LogroUsuario
)
from .serializers import (
    MateriaSerializer, MateriaDetailSerializer,
    CompetenciaSerializer, CompetenciaDetailSerializer,
    PreguntaSerializer, PreguntaDetailSerializer, PreguntaSimulacionSerializer,
    SesionSerializer, SesionCreateSerializer, SesionDetailSerializer,
    RespuestaUsuarioSerializer, RespuestaUsuarioCreateSerializer,
    ClaseSerializer, ClaseDetailSerializer,
    AsignacionSerializer, InsigniaSerializer, LogroUsuarioSerializer
)


class MateriaViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Materia"""
    queryset = Materia.objects.filter(activa=True)
    serializer_class = MateriaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activa']
    search_fields = ['nombre', 'nombre_display', 'descripcion']
    ordering_fields = ['nombre', 'nombre_display']
    ordering = ['nombre']
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MateriaDetailSerializer
        return MateriaSerializer
    
    @action(detail=True, methods=['get'])
    def estadisticas(self, request, pk=None):
        """Obtener estadísticas de una materia"""
        materia = self.get_object()
        
        # Estadísticas de sesiones
        sesiones = Sesion.objects.filter(materia=materia, completada=True)
        total_sesiones = sesiones.count()
        promedio_puntaje = sesiones.aggregate(avg=Avg('puntaje_final'))['avg'] or 0
        
        # Estadísticas de preguntas
        total_preguntas = materia.preguntas.filter(activa=True).count()
        
        # Estadísticas de competencias
        competencias_stats = materia.competencias.annotate(
            preguntas_count=Count('preguntas')
        ).values('nombre', 'preguntas_count')
        
        return Response({
            'materia': materia.nombre_display,
            'total_sesiones': total_sesiones,
            'promedio_puntaje': round(promedio_puntaje, 2),
            'total_preguntas': total_preguntas,
            'competencias': list(competencias_stats)
        })


class CompetenciaViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Competencia"""
    queryset = Competencia.objects.all()
    serializer_class = CompetenciaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['materia', 'peso_icfes']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'peso_icfes']
    ordering = ['materia__nombre', 'nombre']
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CompetenciaDetailSerializer
        return CompetenciaSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        materia_id = self.request.query_params.get('materia', None)
        if materia_id:
            queryset = queryset.filter(materia_id=materia_id)
        return queryset


class PreguntaViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Pregunta"""
    queryset = Pregunta.objects.filter(activa=True)
    serializer_class = PreguntaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['materia', 'competencia', 'dificultad', 'activa']
    search_fields = ['enunciado', 'contexto', 'materia__nombre', 'competencia__nombre', 'tags']
    ordering_fields = ['dificultad', 'tiempo_estimado', 'materia__nombre', 'created_at']
    ordering = ['materia__nombre', 'dificultad']
    
    def get_permissions(self):
        """Permisos específicos según la acción"""
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'carga_masiva', 'plantilla_carga', 'estadisticas']:
            # Solo docentes y administradores pueden gestionar preguntas
            permission_classes = [IsAuthenticated]
        else:
            # Cualquier usuario autenticado puede ver preguntas
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def check_management_permissions(self, request):
        """Verificar permisos de gestión"""
        if not (request.user.rol in ['docente', 'admin'] or request.user.is_staff):
            return Response(
                {'error': 'No tienes permisos para realizar esta acción'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return None
    
    def get_queryset(self):
        """Filtros personalizados para gestión"""
        queryset = self.queryset
        
        # Para gestión, incluir preguntas inactivas si el usuario es docente/admin
        if self.action in ['list', 'retrieve'] and self.request.user.rol in ['docente', 'admin']:
            show_inactive = self.request.query_params.get('show_inactive', 'false')
            if show_inactive.lower() == 'true':
                queryset = Pregunta.objects.all()
        
        # Filtro por múltiples materias
        materias = self.request.query_params.getlist('materias[]')
        if materias:
            queryset = queryset.filter(materia_id__in=materias)
        
        # Filtro por múltiples dificultades
        dificultades = self.request.query_params.getlist('dificultades[]')
        if dificultades:
            queryset = queryset.filter(dificultad__in=dificultades)
            
        return queryset
    
    def get_serializer_class(self):
        # Para gestión de preguntas (docentes/admin), usar PreguntaSerializer completo
        if self.request.user.rol in ['docente', 'admin'] or self.request.user.is_staff:
            # Para retrieve (obtener una pregunta individual), usar PreguntaDetailSerializer
            if self.action == 'retrieve':
                return PreguntaDetailSerializer
            return PreguntaSerializer
        # Para estudiantes, usar PreguntaSimulacionSerializer (sin campos sensibles)
        return PreguntaSimulacionSerializer
    
    @action(detail=False, methods=['get'])
    def para_simulacion(self, request):
        """Obtener preguntas para una simulación"""
        materia_id = request.query_params.get('materia')
        cantidad = int(request.query_params.get('cantidad', 10))
        dificultad = request.query_params.get('dificultad')
        
        queryset = self.get_queryset()
        
        if materia_id:
            queryset = queryset.filter(materia_id=materia_id)
        
        if dificultad:
            queryset = queryset.filter(dificultad=dificultad)
        
        # Seleccionar preguntas aleatorias
        preguntas = list(queryset)
        if len(preguntas) > cantidad:
            preguntas = random.sample(preguntas, cantidad)
        
        serializer = PreguntaSimulacionSerializer(preguntas, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Crear nueva pregunta con validación de permisos"""
        perm_error = self.check_management_permissions(request)
        if perm_error:
            return perm_error
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Actualizar pregunta con validación de permisos"""
        perm_error = self.check_management_permissions(request)
        if perm_error:
            return perm_error
        
        # Obtener la pregunta existente
        pregunta = self.get_object()
        
        # Log para depuración
        print(f"Actualizando pregunta {pregunta.id}")
        print(f"Request FILES: {request.FILES}")
        print(f"Request DATA: {request.data}")
        
        # Si hay un archivo de imagen en la request, manejarlo correctamente
        if 'imagen' in request.FILES:
            print(f"Imagen encontrada en request.FILES")
            # Eliminar la imagen anterior si existe
            if pregunta.imagen:
                print(f"Eliminando imagen anterior: {pregunta.imagen}")
                pregunta.imagen.delete(save=False)
        
        try:
            result = super().update(request, *args, **kwargs)
            print(f"Actualización exitosa: {result}")
            return result
        except Exception as e:
            print(f"Error en actualización: {e}")
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Eliminar pregunta con validación de permisos"""
        perm_error = self.check_management_permissions(request)
        if perm_error:
            return perm_error
        
        # Soft delete - marcar como inactiva en lugar de eliminar
        pregunta = self.get_object()
        pregunta.activa = False
        pregunta.save()
        
        return Response(
            {'mensaje': 'Pregunta eliminada correctamente'}, 
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de preguntas"""
        perm_error = self.check_management_permissions(request)
        if perm_error:
            return perm_error
        
        from django.db.models import Count
        
        # Estadísticas por materia
        stats_materia = Pregunta.objects.filter(activa=True).values(
            'materia__nombre', 'materia__nombre_display'
        ).annotate(
            total=Count('id'),
            faciles=Count('id', filter=Q(dificultad='facil')),
            medias=Count('id', filter=Q(dificultad='media')),
            dificiles=Count('id', filter=Q(dificultad='dificil'))
        ).order_by('materia__nombre')
        
        # Estadísticas generales
        total_preguntas = Pregunta.objects.filter(activa=True).count()
        total_materias = Materia.objects.filter(activa=True).count()
        total_competencias = Competencia.objects.count()
        
        # Distribución por dificultad
        dificultad_stats = Pregunta.objects.filter(activa=True).values('dificultad').annotate(
            count=Count('id')
        ).order_by('dificultad')
        
        return Response({
            'general': {
                'total_preguntas': total_preguntas,
                'total_materias': total_materias,
                'total_competencias': total_competencias
            },
            'por_materia': list(stats_materia),
            'por_dificultad': list(dificultad_stats)
        })
    
    @action(detail=True, methods=['post'])
    def duplicar(self, request, pk=None):
        """Duplicar una pregunta existente"""
        perm_error = self.check_management_permissions(request)
        if perm_error:
            return perm_error
        
        pregunta_original = self.get_object()
        
        # Crear copia
        pregunta_copia = Pregunta.objects.create(
            materia=pregunta_original.materia,
            competencia=pregunta_original.competencia,
            contexto=pregunta_original.contexto,
            enunciado=f"COPIA: {pregunta_original.enunciado}",
            opciones=pregunta_original.opciones.copy(),
            respuesta_correcta=pregunta_original.respuesta_correcta,
            retroalimentacion=pregunta_original.retroalimentacion,
            explicacion=pregunta_original.explicacion,
            habilidad_evaluada=pregunta_original.habilidad_evaluada,
            explicacion_opciones_incorrectas=pregunta_original.explicacion_opciones_incorrectas.copy(),
            estrategias_resolucion=pregunta_original.estrategias_resolucion,
            errores_comunes=pregunta_original.errores_comunes,
            dificultad=pregunta_original.dificultad,
            tiempo_estimado=pregunta_original.tiempo_estimado,
            tags=pregunta_original.tags.copy()
        )
        
        serializer = PreguntaSerializer(pregunta_copia)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def carga_masiva(self, request):
        """Cargar preguntas de forma masiva desde un archivo JSON"""
        # Verificar permisos: solo docentes y administradores
        if not (request.user.rol in ['docente', 'admin'] or request.user.is_staff):
            return Response(
                {'error': 'No tienes permisos para cargar preguntas masivamente'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Obtener el archivo JSON del request
            archivo = request.FILES.get('archivo')
            if not archivo:
                return Response(
                    {'error': 'No se proporcionó ningún archivo'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar que sea un archivo JSON
            if not archivo.name.endswith('.json'):
                return Response(
                    {'error': 'El archivo debe tener extensión .json'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Leer y parsear el JSON
            contenido = archivo.read().decode('utf-8')
            datos = json.loads(contenido)
            
            # Validar estructura básica
            if not isinstance(datos, list):
                return Response(
                    {'error': 'El JSON debe contener una lista de preguntas'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Procesar las preguntas
            resultados = self._procesar_preguntas(datos)
            
            return Response({
                'mensaje': f'Carga masiva completada',
                'total_procesadas': len(datos),
                'exitosas': resultados['exitosas'],
                'errores': resultados['errores'],
                'detalles': resultados['detalles']
            })
            
        except json.JSONDecodeError:
            return Response(
                {'error': 'El archivo no contiene un JSON válido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _procesar_preguntas(self, datos):
        """Procesar y validar las preguntas para carga masiva"""
        exitosas = 0
        errores = 0
        detalles = []
        
        # Importar aquí para evitar problemas de importación circular
        import os
        from django.core.files import File
        from django.conf import settings
        
        for i, pregunta_data in enumerate(datos):
            try:
                with transaction.atomic():
                    # Validar campos requeridos
                    campos_requeridos = [
                        'materia', 'enunciado', 'opciones', 
                        'respuesta_correcta', 'retroalimentacion'
                    ]
                    
                    for campo in campos_requeridos:
                        if campo not in pregunta_data:
                            raise ValueError(f'Campo requerido faltante: {campo}')
                    
                    # Obtener o crear materia
                    materia_nombre = pregunta_data['materia']
                    try:
                        materia = Materia.objects.get(nombre=materia_nombre)
                    except Materia.DoesNotExist:
                        # Crear materia si no existe
                        materia = Materia.objects.create(
                            nombre=materia_nombre,
                            nombre_display=materia_nombre
                        )
                    
                    # Obtener competencia si se especifica
                    competencia = None
                    if 'competencia' in pregunta_data:
                        try:
                            competencia = Competencia.objects.get(
                                nombre=pregunta_data['competencia']
                            )
                        except Competencia.DoesNotExist:
                            # Crear competencia si no existe
                            competencia = Competencia.objects.create(
                                nombre=pregunta_data['competencia'],
                                descripcion=f"Competencia: {pregunta_data['competencia']}",
                                materia=materia
                            )
                    
                    # Validar opciones
                    opciones = pregunta_data['opciones']
                    if not isinstance(opciones, dict):
                        raise ValueError('Las opciones deben ser un diccionario')
                    
                    respuesta_correcta = pregunta_data['respuesta_correcta'].upper()
                    if respuesta_correcta not in opciones:
                        raise ValueError(f'La respuesta correcta "{respuesta_correcta}" no está en las opciones')
                    
                    # Procesamiento de imagen si existe
                    imagen_procesada = None
                    if 'imagen_archivo' in pregunta_data and pregunta_data['imagen_archivo']:
                        imagen_filename = pregunta_data['imagen_archivo']
                        
                        # Buscar archivo en directorio de imágenes temporales
                        temp_images_dir = os.path.join(settings.MEDIA_ROOT, 'temp_images')
                        imagen_path = os.path.join(temp_images_dir, imagen_filename)
                        
                        if os.path.exists(imagen_path):
                            try:
                                with open(imagen_path, 'rb') as img_file:
                                    imagen_procesada = File(img_file, name=imagen_filename)
                                    # Validar formato de imagen
                                    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
                                    file_extension = os.path.splitext(imagen_filename)[1].lower()
                                    
                                    if file_extension not in allowed_extensions:
                                        raise ValueError(f'Formato de imagen no soportado: {file_extension}')
                                    
                                    # Validar tamaño (máximo 5MB)
                                    if img_file.tell() > 5 * 1024 * 1024:
                                        raise ValueError('La imagen es muy grande (máximo 5MB)')
                                        
                            except Exception as e:
                                raise ValueError(f'Error al procesar imagen "{imagen_filename}": {str(e)}')
                        else:
                            # Solo advertir, no fallar la carga
                            detalles.append({
                                'fila': i + 1,
                                'estado': 'advertencia',
                                'mensaje': f'Imagen no encontrada: {imagen_filename}. Pregunta creada sin imagen.'
                            })
                    
                    # Crear la pregunta
                    pregunta = Pregunta.objects.create(
                        materia=materia,
                        competencia=competencia,
                        contexto=pregunta_data.get('contexto', ''),
                        enunciado=pregunta_data['enunciado'],
                        opciones=opciones,
                        respuesta_correcta=respuesta_correcta,
                        retroalimentacion=pregunta_data['retroalimentacion'],
                        explicacion=pregunta_data.get('explicacion', ''),
                        habilidad_evaluada=pregunta_data.get('habilidad_evaluada', ''),
                        explicacion_opciones_incorrectas=pregunta_data.get('explicacion_opciones_incorrectas', {}),
                        estrategias_resolucion=pregunta_data.get('estrategias_resolucion', ''),
                        errores_comunes=pregunta_data.get('errores_comunes', ''),
                        dificultad=pregunta_data.get('dificultad', 'media'),
                        tiempo_estimado=pregunta_data.get('tiempo_estimado', 60),
                        tags=pregunta_data.get('tags', [])
                    )
                    
                    # Asignar imagen después de crear la pregunta
                    if imagen_procesada:
                        pregunta.imagen.save(imagen_filename, imagen_procesada, save=True)
                    
                    exitosas += 1
                    detalles.append({
                        'fila': i + 1,
                        'estado': 'exitosa',
                        'id_pregunta': pregunta.id,
                        'mensaje': 'Pregunta creada correctamente'
                    })
                    
            except Exception as e:
                errores += 1
                detalles.append({
                    'fila': i + 1,
                    'estado': 'error',
                    'mensaje': str(e)
                })
        
        return {
            'exitosas': exitosas,
            'errores': errores,
            'detalles': detalles
        }
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def plantilla_carga(self, request):
        """Generar plantilla de ejemplo para carga masiva"""
        # Verificar permisos: solo docentes y administradores
        if not (request.user.rol in ['docente', 'admin'] or request.user.is_staff):
            return Response(
                {'error': 'No tienes permisos para acceder a esta funcionalidad'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        plantilla = [
            {
                "materia": "Matemáticas",
                "competencia": "Razonamiento y argumentación",
                "contexto": "En un problema de aplicación de ecuaciones lineales",
                "enunciado": "Si 2x + 5 = 13, ¿cuál es el valor de x?",
                "opciones": {
                    "A": "3",
                    "B": "4", 
                    "C": "5",
                    "D": "6"
                },
                "respuesta_correcta": "B",
                "retroalimentacion": "Para resolver 2x + 5 = 13, restamos 5 de ambos lados: 2x = 8, luego dividimos entre 2: x = 4",
                "explicacion": "Esta es una ecuación lineal simple que se resuelve despejando la variable x",
                "habilidad_evaluada": "Resolución de ecuaciones lineales",
                "explicacion_opciones_incorrectas": {
                    "A": "Este valor no satisface la ecuación original",
                    "C": "Al sustituir este valor, la ecuación no se cumple",
                    "D": "Este resultado viene de un error en el cálculo"
                },
                "estrategias_resolucion": "1. Aislar el término con la variable, 2. Realizar operaciones inversas, 3. Verificar el resultado",
                "errores_comunes": "Olvidar cambiar el signo al pasar términos de un lado al otro",
                "dificultad": "facil",
                "tiempo_estimado": 90,
                "tags": ["álgebra", "ecuaciones", "básico"]
            },
            {
                "materia": "Lenguaje",
                "competencia": "Comprensión lectora",
                "contexto": "Fragmento de texto sobre cambio climático",
                "enunciado": "Según el texto, ¿cuál es la principal causa del calentamiento global?",
                "opciones": {
                    "A": "La deforestación",
                    "B": "Las emisiones de gases de efecto invernadero",
                    "C": "Los fenómenos naturales",
                    "D": "La actividad volcánica"
                },
                "respuesta_correcta": "B",
                "retroalimentacion": "Las emisiones de gases de efecto invernadero son identificadas en el texto como la principal causa antropogénica del calentamiento global",
                "explicacion": "El texto claramente establece que las actividades humanas que generan gases de efecto invernadero son el factor principal",
                "habilidad_evaluada": "Identificación de ideas principales en textos expositivos",
                "dificultad": "media",
                "tiempo_estimado": 120,
                "tags": ["comprensión", "lectura", "textos expositivos"]
            },
            {
                "materia": "Ciencias Naturales",
                "competencia": "Interpretación de gráficos y diagramas",
                "contexto": "Análisis de datos experimentales en un gráfico",
                "imagen_archivo": "grafico_experimento.png",
                "enunciado": "Observando el gráfico, ¿qué se puede concluir sobre la relación entre la temperatura y la velocidad de reacción?",
                "opciones": {
                    "A": "Son inversamente proporcionales",
                    "B": "Son directamente proporcionales",
                    "C": "No hay relación entre las variables",
                    "D": "La relación es exponencial"
                },
                "respuesta_correcta": "B",
                "retroalimentacion": "El gráfico muestra una tendencia lineal ascendente, indicando que a mayor temperatura, mayor velocidad de reacción",
                "explicacion": "Los datos experimentales demuestran una relación directamente proporcional entre ambas variables",
                "habilidad_evaluada": "Interpretación de datos gráficos en contextos científicos",
                "dificultad": "media",
                "tiempo_estimado": 150,
                "tags": ["ciencias", "gráficos", "experimentos"],
                "_comentario_imagen": "Para usar imágenes, coloca los archivos en la carpeta 'temp_images' del servidor y especifica el nombre del archivo en 'imagen_archivo'. Formatos soportados: JPG, PNG, GIF, WEBP (máximo 5MB)"
            }
        ]
        
        return JsonResponse(plantilla, safe=False, json_dumps_params={'indent': 2, 'ensure_ascii': False})


class SesionViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Sesion"""
    serializer_class = SesionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['materia', 'modo', 'completada', 'usuario']
    search_fields = ['materia__nombre_display']
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'puntaje_final']
    ordering = ['-fecha_inicio']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Sesion.objects.filter(usuario=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SesionCreateSerializer
        elif self.action == 'retrieve':
            return SesionDetailSerializer
        return SesionSerializer
    
    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """Finalizar una sesión"""
        sesion = self.get_object()
        
        if sesion.completada:
            return Response(
                {'error': 'La sesión ya está completada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sesion.finalizar_sesion()
        serializer = self.get_serializer(sesion)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas_usuario(self, request):
        """Obtener estadísticas del usuario"""
        usuario = request.user
        
        # Sesiones completadas
        sesiones_completadas = Sesion.objects.filter(
            usuario=usuario, completada=True
        )
        
        total_sesiones = sesiones_completadas.count()
        promedio_puntaje = sesiones_completadas.aggregate(
            avg=Avg('puntaje_final')
        )['avg'] or 0
        
        # Sesiones por materia
        sesiones_por_materia = sesiones_completadas.values(
            'materia__nombre_display'
        ).annotate(
            count=Count('id'),
            avg_puntaje=Avg('puntaje_final')
        )
        
        # Últimas sesiones
        ultimas_sesiones = sesiones_completadas.order_by('-fecha_fin')[:5]
        
        return Response({
            'total_sesiones': total_sesiones,
            'promedio_puntaje': round(promedio_puntaje, 2),
            'racha_actual': usuario.racha_actual,
            'puntos_totales': usuario.puntos_totales,
            'sesiones_por_materia': list(sesiones_por_materia),
            'ultimas_sesiones': SesionSerializer(ultimas_sesiones, many=True).data
        })


class RespuestaUsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo RespuestaUsuario"""
    serializer_class = RespuestaUsuarioSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['sesion', 'pregunta', 'es_correcta', 'revisada']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return RespuestaUsuario.objects.filter(sesion__usuario=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RespuestaUsuarioCreateSerializer
        return RespuestaUsuarioSerializer


class ClaseViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Clase"""
    serializer_class = ClaseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activa', 'docente']
    search_fields = ['nombre', 'codigo_inscripcion']
    ordering_fields = ['fecha_creacion', 'nombre']
    ordering = ['-fecha_creacion']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.es_docente:
            return Clase.objects.filter(docente=user)
        else:
            return Clase.objects.filter(estudiantes=user)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ClaseDetailSerializer
        return ClaseSerializer
    
    def perform_create(self, serializer):
        serializer.save(docente=self.request.user)
    
    @action(detail=True, methods=['post'])
    def inscribir_estudiante(self, request, pk=None):
        """Inscribir un estudiante a una clase usando código"""
        clase = self.get_object()
        codigo = request.data.get('codigo')
        
        if codigo != clase.codigo_inscripcion:
            return Response(
                {'error': 'Código de inscripción incorrecto'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if request.user in clase.estudiantes.all():
            return Response(
                {'error': 'Ya estás inscrito en esta clase'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        clase.estudiantes.add(request.user)
        return Response({'message': 'Inscripción exitosa'})


class AsignacionViewSet(viewsets.ModelViewSet):
    """ViewSet para el modelo Asignacion"""
    serializer_class = AsignacionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['clase', 'materia', 'activa']
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['fecha_creacion', 'fecha_limite']
    ordering = ['-fecha_creacion']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.es_docente:
            return Asignacion.objects.filter(clase__docente=user)
        else:
            return Asignacion.objects.filter(clase__estudiantes=user)


class InsigniaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para el modelo Insignia (solo lectura)"""
    queryset = Insignia.objects.all()
    serializer_class = InsigniaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['rara', 'puntos']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'puntos']
    ordering = ['nombre']


class LogroUsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para el modelo LogroUsuario (solo lectura)"""
    serializer_class = LogroUsuarioSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['usuario', 'insignia']
    ordering_fields = ['fecha_obtenido']
    ordering = ['-fecha_obtenido']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return LogroUsuario.objects.filter(usuario=self.request.user)
