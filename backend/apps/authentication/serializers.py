from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer personalizado para obtener tokens JWT"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Agregar información adicional del usuario
        user = self.user
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'rol': user.rol,
            'rol_display': user.get_rol_display(),
            'racha_actual': user.racha_actual,
            'puntos_totales': user.puntos_totales,
            'avatar': user.avatar,
        }
        
        return data


class UsuarioLoginSerializer(serializers.Serializer):
    """Serializer para login de usuarios"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError(
                    'Credenciales inválidas. Por favor, verifica tu usuario y contraseña.'
                )
            if not user.is_active:
                raise serializers.ValidationError(
                    'Tu cuenta está desactivada. Contacta al administrador.'
                )
        else:
            raise serializers.ValidationError(
                'Debes proporcionar usuario y contraseña.'
            )
        
        attrs['user'] = user
        return attrs


class UsuarioRegistroSerializer(serializers.ModelSerializer):
    """Serializer para registro de usuarios"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'rol', 'password', 'password_confirm'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        
        # Validar que el username no exista
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso")
        
        # Validar que el email no exista
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


class UsuarioPerfilSerializer(serializers.ModelSerializer):
    """Serializer para actualizar perfil de usuario"""
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'rol', 'rol_display', 'avatar', 'racha_actual', 'puntos_totales',
            'ultima_practica', 'configuracion'
        ]
        read_only_fields = ['id', 'username', 'racha_actual', 'puntos_totales', 'ultima_practica']
    
    def validate_email(self, value):
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está en uso")
        return value


class CambioPasswordSerializer(serializers.Serializer):
    """Serializer para cambiar contraseña"""
    password_actual = serializers.CharField(write_only=True)
    password_nueva = serializers.CharField(write_only=True, min_length=8)
    password_nueva_confirm = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        user = self.context['request'].user
        
        # Verificar contraseña actual
        if not user.check_password(attrs['password_actual']):
            raise serializers.ValidationError("La contraseña actual es incorrecta")
        
        # Verificar que las nuevas contraseñas coincidan
        if attrs['password_nueva'] != attrs['password_nueva_confirm']:
            raise serializers.ValidationError("Las nuevas contraseñas no coinciden")
        
        return attrs
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['password_nueva'])
        user.save()
        return user


class RefreshTokenSerializer(serializers.Serializer):
    """Serializer para refrescar tokens"""
    refresh = serializers.CharField()
    
    def validate(self, attrs):
        try:
            refresh = RefreshToken(attrs['refresh'])
            attrs['refresh_token'] = refresh
        except Exception:
            raise serializers.ValidationError("Token de refresco inválido")
        
        return attrs 