from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UsuarioListSerializer(serializers.ModelSerializer):
    """Serializer para listar usuarios (vista resumida)"""
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    nombre_completo = serializers.SerializerMethodField()
    ultima_actividad = serializers.SerializerMethodField()
    estado_display = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'rol', 'rol_display', 'nombre_completo', 'is_active',
            'date_joined', 'ultima_actividad', 'estado_display',
            'racha_actual', 'puntos_totales'
        ]
        read_only_fields = ['id', 'date_joined', 'racha_actual', 'puntos_totales']
    
    def get_nombre_completo(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username
    
    def get_ultima_actividad(self, obj):
        if obj.ultima_practica:
            return obj.ultima_practica.strftime('%d/%m/%Y %H:%M')
        return 'Nunca'
    
    def get_estado_display(self, obj):
        return 'Activo' if obj.is_active else 'Inactivo'


class UsuarioDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalles completos de usuario"""
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    nombre_completo = serializers.SerializerMethodField()
    ultima_actividad = serializers.SerializerMethodField()
    estadisticas = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'rol', 'rol_display', 'nombre_completo', 'is_active',
            'date_joined', 'ultima_actividad', 'avatar',
            'racha_actual', 'puntos_totales', 'estadisticas',
            'configuracion'
        ]
        read_only_fields = ['id', 'date_joined', 'racha_actual', 'puntos_totales']
    
    def get_nombre_completo(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username
    
    def get_ultima_actividad(self, obj):
        if obj.ultima_practica:
            return obj.ultima_practica.strftime('%d/%m/%Y %H:%M')
        return 'Nunca'
    
    def get_estadisticas(self, obj):
        return {
            'dias_registrado': (obj.date_joined - obj.date_joined.replace(tzinfo=None)).days if obj.date_joined else 0,
            'puntos_promedio': obj.puntos_totales / max(1, (obj.date_joined - obj.date_joined.replace(tzinfo=None)).days) if obj.date_joined else 0,
            'racha_maxima': obj.racha_actual  # TODO: Implementar tracking de racha máxima
        }


class UsuarioCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'rol', 'password', 'password_confirm', 'is_active'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'is_active': {'default': True}
        }
    
    def validate(self, attrs):
        # Validar contraseñas
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        
        # Validar contraseña con validadores de Django
        validate_password(attrs['password'])
        
        # Validar username único
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso")
        
        # Validar email único
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError("Este email ya está registrado")
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        return user


class UsuarioUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar usuarios"""
    password = serializers.CharField(write_only=True, required=False, min_length=8, allow_blank=True)
    password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'rol', 'is_active', 'password', 'password_confirm',
            'avatar', 'configuracion'
        ]
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'rol': {'required': False},
            'is_active': {'required': False},
            'avatar': {'required': False},
            'configuracion': {'required': False}
        }
    
    def validate(self, attrs):
        user = self.instance
        
        # Validar contraseñas si se proporcionan
        if 'password' in attrs and 'password_confirm' in attrs:
            if attrs['password'] and attrs['password_confirm']:
                if attrs['password'] != attrs['password_confirm']:
                    raise serializers.ValidationError("Las contraseñas no coinciden")
                validate_password(attrs['password'])
        elif 'password' in attrs or 'password_confirm' in attrs:
            # Si solo se proporciona una contraseña, limpiar ambas
            attrs.pop('password', None)
            attrs.pop('password_confirm', None)
        
        # Validar username único (excluyendo el usuario actual)
        if 'username' in attrs and attrs['username']:
            if User.objects.exclude(pk=user.pk).filter(username=attrs['username']).exists():
                raise serializers.ValidationError("Este nombre de usuario ya está en uso")
        
        # Validar email único (excluyendo el usuario actual)
        if 'email' in attrs and attrs['email']:
            if User.objects.exclude(pk=user.pk).filter(email=attrs['email']).exists():
                raise serializers.ValidationError("Este email ya está registrado")
        
        # Asegurar que configuracion tenga un valor por defecto si no se proporciona
        if 'configuracion' not in attrs:
            attrs['configuracion'] = {}
        
        return attrs
    
    def update(self, instance, validated_data):
        # Manejar contraseña por separado
        password = validated_data.pop('password', None)
        validated_data.pop('password_confirm', None)
        
        # Actualizar usuario - solo campos que están en validated_data
        for attr, value in validated_data.items():
            if hasattr(instance, attr):
                setattr(instance, attr, value)
        
        # Actualizar contraseña si se proporcionó
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class UsuarioBulkSerializer(serializers.Serializer):
    """Serializer para operaciones masivas"""
    usuarios = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="Lista de IDs de usuarios"
    )
    accion = serializers.ChoiceField(
        choices=['activar', 'desactivar', 'eliminar'],
        help_text="Acción a realizar"
    )


class UsuarioStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de usuarios"""
    total_usuarios = serializers.IntegerField()
    usuarios_activos = serializers.IntegerField()
    usuarios_inactivos = serializers.IntegerField()
    por_rol = serializers.DictField()
    nuevos_este_mes = serializers.IntegerField()
    actividad_reciente = serializers.IntegerField()
    top_usuarios = serializers.ListField() 