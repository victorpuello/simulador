from rest_framework import serializers
from apps.simulacion.models import SesionSimulacion
from apps.core.models import Materia

class EstadisticasUsuarioSerializer(serializers.Serializer):
    """Serializer para estadísticas generales del usuario"""
    total_simulaciones = serializers.IntegerField()
    simulaciones_completadas = serializers.IntegerField()
    promedio_puntaje = serializers.FloatField()
    tiempo_total_estudio = serializers.IntegerField()  # en minutos
    mejor_puntaje = serializers.IntegerField()
    ultima_simulacion = serializers.DateTimeField(allow_null=True)
    racha_actual = serializers.IntegerField()

class EstadisticasPorMateriaSerializer(serializers.Serializer):
    """Serializer para estadísticas por materia"""
    materia_id = serializers.IntegerField()
    materia_nombre = serializers.CharField()
    simulaciones_realizadas = serializers.IntegerField()
    promedio_puntaje = serializers.FloatField()
    mejor_puntaje = serializers.IntegerField()
    total_preguntas = serializers.IntegerField()
    preguntas_correctas = serializers.IntegerField()
    porcentaje_acierto = serializers.FloatField()

class HistorialSesionSerializer(serializers.ModelSerializer):
    """Serializer para el historial de sesiones"""
    materia_nombre = serializers.CharField(source='materia.nombre_display', read_only=True)
    duracion_minutos = serializers.SerializerMethodField()
    
    class Meta:
        model = SesionSimulacion
        fields = [
            'id', 'materia_nombre', 'fecha_inicio', 'fecha_fin', 
            'puntuacion', 'completada', 'duracion_minutos'
        ]
    
    def get_duracion_minutos(self, obj):
        # Calcular duración basada en las respuestas de las preguntas
        preguntas_sesion = obj.preguntas_sesion.all()
        tiempo_total_segundos = sum(p.tiempo_respuesta or 0 for p in preguntas_sesion)
        return round(tiempo_total_segundos / 60, 1)

class ProgresoDiarioSerializer(serializers.Serializer):
    """Serializer para progreso diario (últimos 30 días)"""
    fecha = serializers.DateField()
    simulaciones = serializers.IntegerField()
    promedio_puntaje = serializers.FloatField()
    tiempo_estudio = serializers.IntegerField()  # en minutos


# ==== Serializers para reportes de Docentes ====

class DocenteResumenSerializer(serializers.Serializer):
    simulaciones_totales = serializers.IntegerField()
    simulaciones_completadas = serializers.IntegerField()
    estudiantes_activos_7d = serializers.IntegerField()
    estudiantes_activos_30d = serializers.IntegerField()
    promedio_puntaje = serializers.FloatField()
    tiempo_promedio_pregunta = serializers.FloatField()  # en segundos


class DocenteMateriaSerializer(serializers.Serializer):
    materia_id = serializers.IntegerField()
    materia_nombre = serializers.CharField()
    simulaciones = serializers.IntegerField()
    promedio_puntaje = serializers.FloatField()
    porcentaje_acierto = serializers.FloatField()
    tiempo_promedio_pregunta = serializers.FloatField()


class DocentePreguntaItemSerializer(serializers.Serializer):
    pregunta_id = serializers.IntegerField()
    enunciado_resumen = serializers.CharField()
    porcentaje_acierto = serializers.FloatField()
    total_respuestas = serializers.IntegerField()
    opcion_mas_elegida = serializers.CharField(allow_null=True)


class DocenteEstudianteSerializer(serializers.Serializer):
    estudiante_id = serializers.IntegerField()
    nombre = serializers.CharField()
    simulaciones = serializers.IntegerField()
    porcentaje_acierto = serializers.FloatField()
    tiempo_promedio_pregunta = serializers.FloatField()