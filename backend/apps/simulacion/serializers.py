from rest_framework import serializers
from apps.core.models import Sesion, RespuestaUsuario, Pregunta, Materia, Competencia
from apps.core.serializers import PreguntaSerializer


class IniciarSesionSerializer(serializers.Serializer):
    """Serializer para iniciar una nueva sesión de simulación"""
    materia_id = serializers.IntegerField()
    cantidad_preguntas = serializers.IntegerField(default=10, min_value=1, max_value=50)
    modo = serializers.ChoiceField(
        choices=['practica', 'simulacro', 'asignada'],
        default='practica'
    )
    competencias = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="IDs de competencias específicas (opcional)"
    )
    dificultad = serializers.ChoiceField(
        choices=['facil', 'media', 'dificil', 'mixta'],
        default='mixta',
        required=False
    )
    
    def validate_materia_id(self, value):
        try:
            Materia.objects.get(id=value, activa=True)
        except Materia.DoesNotExist:
            raise serializers.ValidationError("Materia no encontrada o inactiva")
        return value
    
    def validate_competencias(self, value):
        if value:
            for comp_id in value:
                try:
                    Competencia.objects.get(id=comp_id)
                except Competencia.DoesNotExist:
                    raise serializers.ValidationError(f"Competencia {comp_id} no encontrada")
        return value


class SesionSerializer(serializers.ModelSerializer):
    """Serializer para sesiones de simulación"""
    materia_nombre = serializers.CharField(source='materia.nombre_display', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.first_name', read_only=True)
    tiempo_transcurrido = serializers.SerializerMethodField()
    progreso = serializers.SerializerMethodField()
    
    class Meta:
        model = Sesion
        fields = [
            'id', 'usuario', 'materia', 'materia_nombre', 'usuario_nombre',
            'fecha_inicio', 'fecha_fin', 'puntaje_final', 'tiempo_total',
            'completada', 'modo', 'tiempo_transcurrido', 'progreso'
        ]
        read_only_fields = ['id', 'usuario', 'fecha_inicio']
    
    def get_tiempo_transcurrido(self, obj):
        """Calcula el tiempo transcurrido desde el inicio"""
        if not obj.fecha_inicio:
            return 0
        
        from django.utils import timezone
        if obj.fecha_fin:
            delta = obj.fecha_fin - obj.fecha_inicio
        else:
            delta = timezone.now() - obj.fecha_inicio
        
        return int(delta.total_seconds())
    
    def get_progreso(self, obj):
        """Calcula el progreso de la sesión"""
        total_respuestas = obj.respuestas.count()
        if total_respuestas == 0:
            return 0
        
        # Asumiendo que queremos 10 preguntas por defecto
        total_esperado = 10  # Esto podría venir de la configuración de la sesión
        return min(100, (total_respuestas / total_esperado) * 100)


class ResponderPreguntaSerializer(serializers.Serializer):
    """Serializer para responder una pregunta"""
    pregunta_id = serializers.IntegerField()
    respuesta_seleccionada = serializers.CharField(max_length=1)
    tiempo_respuesta = serializers.IntegerField(min_value=1)
    
    def validate_respuesta_seleccionada(self, value):
        if value not in ['A', 'B', 'C', 'D']:
            raise serializers.ValidationError("Respuesta debe ser A, B, C o D")
        return value
    
    def validate_pregunta_id(self, value):
        try:
            Pregunta.objects.get(id=value, activa=True)
        except Pregunta.DoesNotExist:
            raise serializers.ValidationError("Pregunta no encontrada o inactiva")
        return value


class RespuestaUsuarioSerializer(serializers.ModelSerializer):
    """Serializer para respuestas de usuario"""
    pregunta_enunciado = serializers.CharField(source='pregunta.enunciado', read_only=True)
    pregunta_opciones = serializers.JSONField(source='pregunta.opciones', read_only=True)
    respuesta_correcta = serializers.CharField(source='pregunta.respuesta_correcta', read_only=True)
    retroalimentacion = serializers.CharField(source='pregunta.retroalimentacion', read_only=True)
    
    class Meta:
        model = RespuestaUsuario
        fields = [
            'id', 'pregunta', 'pregunta_enunciado', 'pregunta_opciones',
            'respuesta_seleccionada', 'respuesta_correcta', 'es_correcta',
            'tiempo_respuesta', 'timestamp', 'retroalimentacion', 'revisada'
        ]
        read_only_fields = ['id', 'timestamp', 'es_correcta']


class PreguntaSimulacionSerializer(PreguntaSerializer):
    """Serializer específico para preguntas en simulación (sin respuesta correcta)"""
    class Meta:
        model = Pregunta
        fields = [
            'id', 'materia', 'competencia', 'contexto', 'enunciado',
            'opciones', 'dificultad', 'tiempo_estimado', 'tags'
        ]
        # Excluimos respuesta_correcta y retroalimentacion para evitar trampas


class FinalizarSesionSerializer(serializers.Serializer):
    """Serializer para finalizar una sesión"""
    forzar_finalizacion = serializers.BooleanField(default=False)
    
    def validate(self, attrs):
        # Aquí podríamos agregar validaciones adicionales
        # como verificar que el tiempo no haya expirado, etc.
        return attrs


class EstadisticasSesionSerializer(serializers.Serializer):
    """Serializer para estadísticas de una sesión completada"""
    sesion_id = serializers.IntegerField()
    puntaje_final = serializers.IntegerField()
    tiempo_total = serializers.IntegerField()
    total_preguntas = serializers.IntegerField()
    respuestas_correctas = serializers.IntegerField()
    respuestas_incorrectas = serializers.IntegerField()
    porcentaje_acierto = serializers.FloatField()
    tiempo_promedio_pregunta = serializers.FloatField()
    estadisticas_por_competencia = serializers.DictField()
    estadisticas_por_dificultad = serializers.DictField()
    recomendaciones = serializers.ListField(child=serializers.CharField())