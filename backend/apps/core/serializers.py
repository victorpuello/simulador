from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Materia, Competencia, Pregunta, Sesion, RespuestaUsuario,
    Clase, Asignacion, Insignia, LogroUsuario
)

User = get_user_model()


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Usuario"""
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'rol', 'rol_display', 'avatar', 'racha_actual', 'puntos_totales',
            'ultima_practica', 'configuracion', 'date_joined'
        ]
        read_only_fields = ['id', 'racha_actual', 'puntos_totales', 'ultima_practica', 'date_joined']


class UsuarioRegistroSerializer(serializers.ModelSerializer):
    """Serializer para registro de usuarios"""
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'rol', 'password', 'password_confirm'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class MateriaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Materia"""
    preguntas_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Materia
        fields = [
            'id', 'nombre', 'nombre_display', 'color', 'icono',
            'descripcion', 'activa', 'preguntas_count'
        ]
    
    def get_preguntas_count(self, obj):
        return obj.preguntas.count()


class CompetenciaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Competencia"""
    materia_nombre = serializers.CharField(source='materia.nombre_display', read_only=True)
    preguntas_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Competencia
        fields = [
            'id', 'materia', 'materia_nombre', 'nombre', 'descripcion',
            'peso_icfes', 'preguntas_count'
        ]
    
    def get_preguntas_count(self, obj):
        return obj.preguntas.count()


class PreguntaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Pregunta"""
    materia_nombre = serializers.CharField(source='materia.nombre_display', read_only=True)
    competencia_nombre = serializers.CharField(source='competencia.nombre', read_only=True)
    imagen_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Pregunta
        fields = [
            'id', 'materia', 'materia_nombre', 'competencia', 'competencia_nombre',
            'contexto', 'imagen', 'imagen_url', 'enunciado', 'opciones', 'respuesta_correcta',
            'retroalimentacion', 'retroalimentacion_estructurada', 'explicacion', 'habilidad_evaluada', 
            'explicacion_opciones_incorrectas', 'estrategias_resolucion', 
            'errores_comunes', 'dificultad', 'tiempo_estimado', 'activa', 'tags'
        ]
        read_only_fields = ['id', 'imagen_url']
    
    def get_imagen_url(self, obj):
        """Obtener URL de imagen de forma segura (evita 500 si el archivo no existe)."""
        try:
            if obj.imagen and getattr(obj.imagen, 'name', None):
                # Verificar existencia en el storage antes de acceder a .url
                from django.core.files.storage import default_storage
                if default_storage.exists(obj.imagen.name):
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(obj.imagen.url)
                    return obj.imagen.url
        except Exception:
            # Si hay cualquier problema con el archivo, no bloquear la respuesta
            return None
        return None
    
    def validate_opciones(self, value):
        """Validar formato de opciones (texto o texto+imagen)"""
        if not isinstance(value, dict):
            raise serializers.ValidationError('Las opciones deben ser un diccionario')
        
        for key, opcion in value.items():
            if isinstance(opcion, dict):
                # Formato: {"texto": "...", "imagen": "url"}
                if 'texto' not in opcion:
                    raise serializers.ValidationError(f'La opción {key} debe tener campo "texto"')
                if not opcion['texto'] or not opcion['texto'].strip():
                    raise serializers.ValidationError(f'La opción {key} no puede estar vacía')
            elif isinstance(opcion, str):
                # Formato simple: "texto"
                if not opcion or not opcion.strip():
                    raise serializers.ValidationError(f'La opción {key} no puede estar vacía')
            else:
                raise serializers.ValidationError(f'Formato inválido para opción {key}')
        
        return value


class PreguntaDetailSerializer(PreguntaSerializer):
    """Serializer detallado para Pregunta con objetos completos de materia y competencia"""
    materia = MateriaSerializer(read_only=True)
    competencia = CompetenciaSerializer(read_only=True)


class PreguntaSimulacionSerializer(serializers.ModelSerializer):
    """Serializer para preguntas en simulaciones (sin respuesta correcta)"""
    materia_nombre = serializers.CharField(source='materia.nombre_display', read_only=True)
    competencia_nombre = serializers.CharField(source='competencia.nombre', read_only=True)
    imagen_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Pregunta
        fields = [
            'id', 'materia', 'materia_nombre', 'competencia', 'competencia_nombre',
            'contexto', 'imagen', 'imagen_url', 'enunciado', 'opciones', 'respuesta_correcta', 'dificultad', 'tiempo_estimado', 'retroalimentacion_estructurada'
        ]
    
    def get_imagen_url(self, obj):
        """Obtener URL de imagen de forma segura (evita 500 si el archivo no existe)."""
        try:
            if obj.imagen and getattr(obj.imagen, 'name', None):
                from django.core.files.storage import default_storage
                if default_storage.exists(obj.imagen.name):
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(obj.imagen.url)
                    return obj.imagen.url
        except Exception:
            return None
        return None


class PreguntaRetroalimentacionSerializer(serializers.ModelSerializer):
    """Serializer para retroalimentación completa después de responder"""
    materia_nombre = serializers.CharField(source='materia.nombre_display', read_only=True)
    competencia_nombre = serializers.CharField(source='competencia.nombre', read_only=True)
    imagen_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Pregunta
        fields = [
            'id', 'materia_nombre', 'competencia_nombre', 'contexto', 'imagen', 'imagen_url', 'enunciado', 'opciones',
            'respuesta_correcta', 'retroalimentacion', 'retroalimentacion_estructurada', 'explicacion', 'habilidad_evaluada',
            'explicacion_opciones_incorrectas', 'estrategias_resolucion', 'errores_comunes'
        ]
    
    def get_imagen_url(self, obj):
        """Obtener URL de imagen de forma segura (evita 500 si el archivo no existe)."""
        try:
            if obj.imagen and getattr(obj.imagen, 'name', None):
                from django.core.files.storage import default_storage
                if default_storage.exists(obj.imagen.name):
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(obj.imagen.url)
                    return obj.imagen.url
        except Exception:
            return None
        return None


class RespuestaUsuarioSerializer(serializers.ModelSerializer):
    """Serializer para el modelo RespuestaUsuario"""
    pregunta_enunciado = serializers.CharField(source='pregunta.enunciado', read_only=True)
    
    class Meta:
        model = RespuestaUsuario
        fields = [
            'id', 'sesion', 'pregunta', 'pregunta_enunciado',
            'respuesta_seleccionada', 'es_correcta', 'tiempo_respuesta',
            'timestamp', 'revisada'
        ]
        read_only_fields = ['id', 'es_correcta', 'timestamp']


class RespuestaUsuarioCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear respuestas de usuario"""
    
    class Meta:
        model = RespuestaUsuario
        fields = [
            'sesion', 'pregunta', 'respuesta_seleccionada', 'tiempo_respuesta'
        ]
    
    def create(self, validated_data):
        # Determinar si la respuesta es correcta
        pregunta = validated_data['pregunta']
        respuesta_seleccionada = validated_data['respuesta_seleccionada']
        
        validated_data['es_correcta'] = (
            respuesta_seleccionada == pregunta.respuesta_correcta
        )
        
        return super().create(validated_data)


class SesionSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Sesion"""
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    materia_nombre = serializers.CharField(source='materia.nombre_display', read_only=True)
    modo_display = serializers.CharField(source='get_modo_display', read_only=True)
    respuestas_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Sesion
        fields = [
            'id', 'usuario', 'usuario_nombre', 'materia', 'materia_nombre',
            'asignacion', 'fecha_inicio', 'fecha_fin', 'puntaje_final',
            'tiempo_total', 'completada', 'modo', 'modo_display', 'respuestas_count'
        ]
        read_only_fields = ['id', 'fecha_inicio', 'fecha_fin', 'puntaje_final', 'tiempo_total']
    
    def get_respuestas_count(self, obj):
        return obj.respuestas.count()


class SesionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear sesiones"""
    
    class Meta:
        model = Sesion
        fields = ['materia', 'asignacion', 'modo']
    
    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)


class ClaseSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Clase"""
    docente_nombre = serializers.CharField(source='docente.username', read_only=True)
    estudiantes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Clase
        fields = [
            'id', 'nombre', 'docente', 'docente_nombre', 'estudiantes',
            'codigo_inscripcion', 'fecha_creacion', 'activa', 'configuracion',
            'estudiantes_count'
        ]
        read_only_fields = ['id', 'codigo_inscripcion', 'fecha_creacion']
    
    def get_estudiantes_count(self, obj):
        return obj.estudiantes.count()


class AsignacionSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Asignacion"""
    clase_nombre = serializers.CharField(source='clase.nombre', read_only=True)
    materia_nombre = serializers.CharField(source='materia.nombre_display', read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Asignacion
        fields = [
            'id', 'clase', 'clase_nombre', 'materia', 'materia_nombre',
            'titulo', 'descripcion', 'cantidad_preguntas', 'tiempo_limite',
            'fecha_limite', 'fecha_creacion', 'activa', 'esta_vencida'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class InsigniaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Insignia"""
    
    class Meta:
        model = Insignia
        fields = [
            'id', 'nombre', 'descripcion', 'icono', 'color',
            'criterio', 'puntos', 'rara'
        ]


class LogroUsuarioSerializer(serializers.ModelSerializer):
    """Serializer para el modelo LogroUsuario"""
    insignia_nombre = serializers.CharField(source='insignia.nombre', read_only=True)
    insignia_icono = serializers.CharField(source='insignia.icono', read_only=True)
    insignia_color = serializers.CharField(source='insignia.color', read_only=True)
    
    class Meta:
        model = LogroUsuario
        fields = [
            'id', 'usuario', 'insignia', 'insignia_nombre', 'insignia_icono',
            'insignia_color', 'fecha_obtenido', 'contexto'
        ]
        read_only_fields = ['id', 'fecha_obtenido']


# Serializers para listas y detalles
class MateriaDetailSerializer(MateriaSerializer):
    """Serializer detallado para Materia con competencias"""
    competencias = CompetenciaSerializer(many=True, read_only=True)
    
    class Meta(MateriaSerializer.Meta):
        fields = MateriaSerializer.Meta.fields + ['competencias']


class CompetenciaDetailSerializer(CompetenciaSerializer):
    """Serializer detallado para Competencia con preguntas"""
    preguntas = PreguntaSimulacionSerializer(many=True, read_only=True)
    
    class Meta(CompetenciaSerializer.Meta):
        fields = CompetenciaSerializer.Meta.fields + ['preguntas']


class SesionDetailSerializer(SesionSerializer):
    """Serializer detallado para Sesion con respuestas"""
    respuestas = RespuestaUsuarioSerializer(many=True, read_only=True)
    
    class Meta(SesionSerializer.Meta):
        fields = SesionSerializer.Meta.fields + ['respuestas']


class ClaseDetailSerializer(ClaseSerializer):
    """Serializer detallado para Clase con asignaciones"""
    asignaciones = AsignacionSerializer(many=True, read_only=True)
    
    class Meta(ClaseSerializer.Meta):
        fields = ClaseSerializer.Meta.fields + ['asignaciones'] 