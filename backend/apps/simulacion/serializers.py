from rest_framework import serializers
from .models import PlantillaSimulacion, SesionSimulacion, PreguntaSesion
from apps.core.serializers import MateriaSerializer, PreguntaSerializer

class PlantillaSimulacionSerializer(serializers.ModelSerializer):
    materia_nombre = serializers.CharField(source='materia.nombre_display', read_only=True)
    docente_username = serializers.CharField(source='docente.username', read_only=True)
    preguntas_count = serializers.IntegerField(read_only=True)
    es_personalizada = serializers.BooleanField(read_only=True)

    class Meta:
        model = PlantillaSimulacion
        fields = [
            'id', 'docente', 'docente_username', 'materia', 'materia_nombre',
            'titulo', 'descripcion', 'cantidad_preguntas', 'preguntas_especificas',
            'preguntas_count', 'es_personalizada', 'activa', 'fecha_creacion',
            'fecha_modificacion'
        ]
        read_only_fields = ['docente', 'fecha_creacion', 'fecha_modificacion']

class PreguntaSesionSerializer(serializers.ModelSerializer):
    pregunta = PreguntaSerializer(read_only=True)
    
    class Meta:
        model = PreguntaSesion
        fields = [
            'id', 'pregunta', 'respuesta_estudiante', 'es_correcta',
            'tiempo_respuesta', 'orden'
        ]
        read_only_fields = ['pregunta', 'es_correcta']

class SesionSimulacionSerializer(serializers.ModelSerializer):
    materia = MateriaSerializer(read_only=True)
    preguntas_sesion = PreguntaSesionSerializer(many=True, read_only=True)
    progreso = serializers.SerializerMethodField()

    class Meta:
        model = SesionSimulacion
        fields = [
            'id', 'estudiante', 'materia', 'plantilla', 'preguntas_sesion',
            'fecha_inicio', 'fecha_fin', 'completada', 'puntuacion', 'progreso'
        ]
        read_only_fields = ['estudiante', 'fecha_inicio', 'fecha_fin', 'completada', 'puntuacion']

    def get_progreso(self, obj):
        total_preguntas = obj.preguntas.count()
        respondidas = obj.preguntas_sesion.exclude(respuesta_estudiante=None).count()
        return {
            'total': total_preguntas,
            'respondidas': respondidas,
            'porcentaje': (respondidas / total_preguntas * 100) if total_preguntas > 0 else 0
        }

class IniciarSesionSerializer(serializers.Serializer):
    materia = serializers.IntegerField()
    plantilla = serializers.IntegerField(required=False, allow_null=True)
    cantidad_preguntas = serializers.IntegerField(required=False, min_value=5, max_value=50)
    forzar_reinicio = serializers.BooleanField(required=False, default=False)

class ResponderPreguntaSerializer(serializers.Serializer):
    respuesta = serializers.CharField(max_length=1)
    tiempo_respuesta = serializers.IntegerField(min_value=0)