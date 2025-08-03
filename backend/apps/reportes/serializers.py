from rest_framework import serializers
from apps.core.models import Sesion, Materia

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
        model = Sesion
        fields = [
            'id', 'materia_nombre', 'fecha_inicio', 'fecha_fin', 
            'puntaje_final', 'completada', 'modo', 'duracion_minutos'
        ]
    
    def get_duracion_minutos(self, obj):
        if obj.tiempo_total:
            return round(obj.tiempo_total / 60, 1)
        return 0

class ProgresoDiarioSerializer(serializers.Serializer):
    """Serializer para progreso diario (últimos 30 días)"""
    fecha = serializers.DateField()
    simulaciones = serializers.IntegerField()
    promedio_puntaje = serializers.FloatField()
    tiempo_estudio = serializers.IntegerField()  # en minutos