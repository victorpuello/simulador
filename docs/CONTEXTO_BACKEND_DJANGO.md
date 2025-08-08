# 🔧 Contexto del Backend - Simulador Saber 11

## 📋 **INFORMACIÓN GENERAL**

### **Proyecto**: Simulador Pruebas Saber 11
### **Backend**: Django 4.2+ con Django REST Framework
### **Base de Datos**: PostgreSQL (desarrollo) / SQLite (pruebas)
### **Cache**: Redis
### **Estado**: Backend 100% completado y funcional

---

## 🏗️ **ARQUITECTURA GENERAL**

### **Estructura de Apps Django**
```
backend/
├── simulador/                 # Configuración principal
│   ├── settings.py           # Configuraciones del proyecto
│   ├── urls.py              # URLs principales
│   └── wsgi.py              # Configuración WSGI
├── apps/                     # Aplicaciones modulares
│   ├── core/                # Modelos principales y lógica central
│   ├── authentication/      # Autenticación JWT personalizada
│   ├── usuarios/            # Gestión de usuarios
│   ├── simulacion/          # Lógica de simulaciones
│   ├── reportes/            # Analytics y reportes
│   └── gamificacion/        # Sistema de gamificación
├── requirements.txt         # Dependencias Python
└── manage.py               # CLI de Django
```

### **Dependencias Principales**
```python
# Framework y API
Django==4.2.7
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0

# Base de datos y cache
psycopg2-binary==2.9.7
django-redis==5.4.0

# Utilidades y desarrollo
django-cors-headers==4.3.1
django-filter==23.3
drf-spectacular==0.26.5
python-decouple==3.8
```

---

## 📊 **MODELOS DE DATOS**

### **1. Gestión de Usuarios**

#### **Usuario (CustomUser)**
```python
class Usuario(AbstractUser):
    """Modelo de usuario personalizado con gamificación"""
    ROLES = [
        ('estudiante', 'Estudiante'),
        ('docente', 'Docente'),
        ('admin', 'Administrador'),
    ]
    
    # Campos de gamificación
    rol = models.CharField(max_length=10, choices=ROLES, default='estudiante')
    avatar = models.URLField(blank=True, null=True)
    racha_actual = models.IntegerField(default=0)
    puntos_totales = models.IntegerField(default=0)
    ultima_practica = models.DateTimeField(null=True, blank=True)
    configuracion = models.JSONField(default=dict, blank=True)
    
    # Métodos importantes
    def actualizar_racha(self):
        """Actualiza la racha de práctica automáticamente"""
        # Lógica de rachas implementada
```

**Campos clave para gamificación**:
- `racha_actual`: Días consecutivos de práctica
- `puntos_totales`: Puntos acumulados total
- `ultima_practica`: Para calcular rachas
- `configuracion`: JSON con preferencias del usuario

### **2. Contenido Educativo**

#### **Materia**
```python
class Materia(models.Model):
    """Materias del ICFES"""
    nombre = models.CharField(max_length=100, unique=True)
    nombre_display = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default="#6366f1")  # Hex color
    icono = models.CharField(max_length=50, default="book")
    descripcion = models.TextField(blank=True)
    activa = models.BooleanField(default=True)
```

**Materias implementadas**:
- Matemáticas (#4F46E5)
- Lectura Crítica (#DC2626)
- Ciencias Naturales (#059669)
- Sociales y Ciudadanas (#7C3AED)
- Inglés (#EA580C)

#### **Competencia**
```python
class Competencia(models.Model):
    """Competencias específicas por materia"""
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    peso_icfes = models.DecimalField(max_digits=3, decimal_places=2, default=1.0)
```

#### **Pregunta**
```python
class Pregunta(models.Model):
    """Preguntas con retroalimentación estructurada"""
    DIFICULTADES = [
        ('facil', 'Fácil'),
        ('media', 'Media'),
        ('dificil', 'Difícil'),
    ]
    
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE)
    competencia = models.ForeignKey(Competencia, on_delete=models.SET_NULL, null=True)
    contexto = models.TextField(blank=True)  # Contexto de la pregunta
    enunciado = models.TextField()
    opciones = models.JSONField()  # {"A": "texto", "B": "texto", ...}
    respuesta_correcta = models.CharField(max_length=1)
    
    # Retroalimentación estructurada
    retroalimentacion_estructurada = models.JSONField(default=dict)
    
    dificultad = models.CharField(max_length=10, choices=DIFICULTADES, default='media')
    tiempo_estimado = models.IntegerField(default=60)  # segundos
    activa = models.BooleanField(default=True)
    tags = models.JSONField(default=list)
```

**Estructura de retroalimentación**:
```json
{
    "correcta": {
        "mensaje": "¡Excelente! Has identificado correctamente...",
        "explicacion": "La respuesta es correcta porque...",
        "refuerzo": "Para dominar este tema..."
    },
    "incorrecta": {
        "A": "Esta opción es incorrecta porque...",
        "B": "Aunque esta opción puede parecer...",
        "C": "Esta alternativa no es correcta ya que..."
    },
    "conceptos_clave": ["concepto1", "concepto2"],
    "recursos_adicionales": ["url1", "url2"]
}
```

### **3. Sistema de Simulación**

#### **Sesion**
```python
class Sesion(models.Model):
    """Sesiones de simulación/práctica"""
    MODOS = [
        ('practica', 'Práctica Libre'),
        ('simulacro', 'Simulacro Completo'),
        ('asignada', 'Asignación Docente'),
    ]
    
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE)
    asignacion = models.ForeignKey('Asignacion', on_delete=models.SET_NULL, null=True)
    
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    puntaje_final = models.IntegerField(null=True, blank=True)
    tiempo_total = models.IntegerField(null=True, blank=True)  # segundos
    completada = models.BooleanField(default=False)
    modo = models.CharField(max_length=20, choices=MODOS, default='practica')
```

#### **RespuestaUsuario**
```python
class RespuestaUsuario(models.Model):
    """Respuestas individuales con tracking detallado"""
    sesion = models.ForeignKey(Sesion, on_delete=models.CASCADE, related_name='respuestas')
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE)
    respuesta_seleccionada = models.CharField(max_length=1)
    es_correcta = models.BooleanField()
    tiempo_respuesta = models.IntegerField()  # segundos
    timestamp = models.DateTimeField(auto_now_add=True)
    revisada = models.BooleanField(default=False)  # Para docentes
```

### **4. Gestión Docente**

#### **Clase**
```python
class Clase(models.Model):
    """Clases gestionadas por docentes"""
    nombre = models.CharField(max_length=100)
    docente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    estudiantes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='clases_inscritas')
    codigo_inscripcion = models.CharField(max_length=8, unique=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    activa = models.BooleanField(default=True)
    configuracion = models.JSONField(default=dict)
```

#### **Asignacion**
```python
class Asignacion(models.Model):
    """Asignaciones de docentes a estudiantes"""
    clase = models.ForeignKey(Clase, on_delete=models.CASCADE)
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    cantidad_preguntas = models.IntegerField(default=10)
    tiempo_limite = models.IntegerField(null=True, blank=True)  # minutos
    fecha_limite = models.DateTimeField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    activa = models.BooleanField(default=True)
```

### **5. Sistema de Gamificación**

#### **Insignia**
```python
class Insignia(models.Model):
    """Sistema de insignias automático"""
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    icono = models.CharField(max_length=50)  # Nombre del icono
    color = models.CharField(max_length=7, default="#6366f1")
    criterio = models.JSONField()  # Condiciones para obtenerla
    puntos = models.IntegerField(default=0)
    rara = models.BooleanField(default=False)
```

**Insignias implementadas**:
```json
[
    {
        "nombre": "Primera Simulación",
        "criterio": {"tipo": "primera_simulacion"},
        "puntos": 50
    },
    {
        "nombre": "Racha de 3 días",
        "criterio": {"tipo": "racha", "minimo": 3},
        "puntos": 100
    },
    {
        "nombre": "Matemático Expert",
        "criterio": {"tipo": "porcentaje_materia", "materia": "matematicas", "minimo": 80},
        "puntos": 200
    }
]
```

#### **LogroUsuario**
```python
class LogroUsuario(models.Model):
    """Registro de logros obtenidos"""
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    insignia = models.ForeignKey(Insignia, on_delete=models.CASCADE)
    fecha_obtenido = models.DateTimeField(auto_now_add=True)
    contexto = models.JSONField(default=dict)  # Datos adicionales
```

---

## 🔧 **CONFIGURACIÓN DJANGO**

### **Settings.py - Configuraciones Clave**

#### **Apps Instaladas**
```python
INSTALLED_APPS = [
    # Django base
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',  # Documentación API
    'django_extensions',
    
    # Local apps
    'apps.core',
    'apps.authentication',
    'apps.usuarios',
    'apps.simulacion',
    'apps.reportes',
    'apps.gamificacion',
]
```

#### **Configuración REST Framework**
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```

#### **Configuración JWT**
```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}
```

#### **Configuración de Cache (Redis)**
```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'simulador',
        'TIMEOUT': 300,  # 5 minutos por defecto
    }
}
```

#### **Configuración CORS**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.53:3000",
]

CORS_ALLOW_CREDENTIALS = True
```

---

## 📡 **API REST ENDPOINTS**

### **Autenticación**
```
POST   /api/auth/register/     # Registro de usuarios
POST   /api/auth/login/        # Login con JWT
POST   /api/auth/refresh/      # Refresh token
POST   /api/auth/logout/       # Logout
GET    /api/auth/profile/      # Perfil del usuario
PUT    /api/auth/profile/      # Actualizar perfil
```

### **Materias y Preguntas**
```
GET    /api/materias/          # Lista de materias
GET    /api/materias/{id}/     # Detalle de materia
GET    /api/competencias/      # Lista de competencias
GET    /api/preguntas/         # Lista de preguntas con filtros
GET    /api/preguntas/{id}/    # Detalle de pregunta
```

**Filtros disponibles para preguntas**:
- `materia`: Filtrar por materia
- `competencia`: Filtrar por competencia  
- `dificultad`: facil, media, dificil
- `tags`: Filtrar por tags
- `search`: Búsqueda en enunciado

### **Simulación**
```
GET    /api/simulacion/sesiones/           # Sesiones del usuario
POST   /api/simulacion/sesiones/           # Crear nueva sesión
GET    /api/simulacion/sesiones/{id}/      # Detalle de sesión
PUT    /api/simulacion/sesiones/{id}/      # Actualizar sesión
POST   /api/simulacion/sesiones/{id}/finalizar/  # Finalizar sesión

GET    /api/simulacion/preguntas-sesion/{sesion_id}/  # Preguntas de una sesión
POST   /api/simulacion/responder/          # Responder pregunta
GET    /api/simulacion/respuestas/         # Respuestas del usuario
```

### **Gamificación**
```
GET    /api/gamificacion/insignias/        # Lista de insignias
GET    /api/gamificacion/logros/           # Logros del usuario
GET    /api/gamificacion/estadisticas/     # Estadísticas del usuario
POST   /api/gamificacion/verificar-logros/ # Verificar nuevos logros
```

### **Gestión Docente**
```
GET    /api/clases/                        # Clases del docente
POST   /api/clases/                        # Crear clase
GET    /api/clases/{id}/estudiantes/       # Estudiantes de la clase
POST   /api/clases/{id}/inscribir/         # Inscribir estudiante

GET    /api/asignaciones/                  # Asignaciones
POST   /api/asignaciones/                  # Crear asignación
GET    /api/asignaciones/{id}/resultados/  # Resultados de asignación
```

### **Reportes**
```
GET    /api/reportes/usuario/              # Reportes del usuario
GET    /api/reportes/materia/{id}/         # Reporte por materia
GET    /api/reportes/competencia/{id}/     # Reporte por competencia
GET    /api/reportes/tendencias/           # Análisis de tendencias
```

---

## 🔧 **SERIALIZERS Y VIEWSETS**

### **Ejemplo: Sesion ViewSet**
```python
class SesionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de sesiones"""
    serializer_class = SesionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['materia', 'modo', 'completada']
    ordering_fields = ['fecha_inicio', 'puntaje_final']
    ordering = ['-fecha_inicio']

    def get_queryset(self):
        """Solo sesiones del usuario autenticado"""
        return Sesion.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        """Asignar usuario automáticamente"""
        serializer.save(usuario=self.request.user)

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """Finalizar sesión y calcular puntaje"""
        sesion = self.get_object()
        if not sesion.completada:
            sesion.finalizar_sesion()
            # Verificar logros automáticamente
            verificar_logros_usuario.delay(request.user.id)
        return Response(SesionSerializer(sesion).data)
```

### **Ejemplo: Pregunta Serializer**
```python
class PreguntaSerializer(serializers.ModelSerializer):
    """Serializer para preguntas"""
    materia_nombre = serializers.CharField(source='materia.nombre_display', read_only=True)
    competencia_nombre = serializers.CharField(source='competencia.nombre', read_only=True)

    class Meta:
        model = Pregunta
        fields = [
            'id', 'materia', 'materia_nombre', 'competencia', 'competencia_nombre',
            'contexto', 'enunciado', 'opciones', 'dificultad', 'tiempo_estimado',
            'tags', 'activa'
        ]
        # Ocultar respuesta correcta en simulaciones
        read_only_fields = ['respuesta_correcta', 'retroalimentacion_estructurada']
```

---

## 🔄 **SEÑALES DJANGO**

### **Sistema de Gamificación Automático**
```python
# apps/core/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Sesion)
def sesion_completada_handler(sender, instance, created, **kwargs):
    """Actualizar gamificación cuando se completa una sesión"""
    if instance.completada and instance.puntaje_final is not None:
        usuario = instance.usuario
        
        # Actualizar racha
        usuario.actualizar_racha()
        
        # Agregar puntos base
        puntos_base = calcular_puntos_sesion(instance)
        usuario.puntos_totales += puntos_base
        usuario.save()
        
        # Verificar logros en background
        verificar_logros_usuario.delay(usuario.id)

@receiver(post_save, sender=RespuestaUsuario)
def respuesta_guardada_handler(sender, instance, created, **kwargs):
    """Procesar respuesta individual"""
    if created and instance.es_correcta:
        # Puntos por respuesta correcta
        usuario = instance.sesion.usuario
        usuario.puntos_totales += 10
        usuario.save()
```

---

## 🗄️ **COMANDOS DE GESTIÓN**

### **Poblar Datos Iniciales**
```bash
python manage.py populate_data
```

**Este comando crea**:
- 5 materias principales del ICFES
- 3-5 competencias por materia
- 20-50 preguntas por materia
- Sistema de insignias básico
- Usuarios de prueba

### **Limpiar Sesiones Obsoletas**
```bash
python manage.py cleanup_stale_sessions
```

### **Generar Preguntas (IA)**
```bash
python manage.py generate_questions --materia matematicas --cantidad 50
```

---

## 🔐 **SEGURIDAD Y PERMISOS**

### **Permisos Personalizados**
```python
# apps/simulacion/permissions.py
class EsPropietarioODocente(permissions.BasePermission):
    """Solo el propietario o su docente puede ver la sesión"""
    
    def has_object_permission(self, request, view, obj):
        # El usuario es propietario
        if obj.usuario == request.user:
            return True
        
        # El usuario es docente de una clase donde está el propietario
        if request.user.rol == 'docente':
            clases_docente = request.user.clases_creadas.all()
            for clase in clases_docente:
                if obj.usuario in clase.estudiantes.all():
                    return True
        
        return False
```

### **Validaciones de Negocio**
```python
# apps/core/models.py
def clean(self):
    """Validaciones personalizadas"""
    if self.fecha_fin and self.fecha_inicio:
        if self.fecha_fin <= self.fecha_inicio:
            raise ValidationError('La fecha fin debe ser posterior al inicio')
    
    if self.puntaje_final is not None:
        if not (0 <= self.puntaje_final <= 100):
            raise ValidationError('El puntaje debe estar entre 0 y 100')
```

---

## 📈 **OPTIMIZACIÓN Y PERFORMANCE**

### **Consultas Optimizadas**
```python
# Uso de select_related y prefetch_related
def get_queryset(self):
    return Sesion.objects.select_related(
        'usuario', 'materia'
    ).prefetch_related(
        'respuestas__pregunta'
    ).filter(usuario=self.request.user)
```

### **Cache de Consultas Frecuentes**
```python
from django.core.cache import cache

def get_estadisticas_usuario(usuario_id):
    """Estadísticas con cache de 15 minutos"""
    cache_key = f'stats_user_{usuario_id}'
    stats = cache.get(cache_key)
    
    if stats is None:
        stats = calcular_estadisticas(usuario_id)
        cache.set(cache_key, stats, 900)  # 15 minutos
    
    return stats
```

---

## 🐛 **DEBUGGING Y LOGGING**

### **Configuración de Logging**
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/simulador.log',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'apps.simulacion': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

---

## 🧪 **TESTING**

### **Estructura de Tests**
```
backend/
├── apps/core/tests/
│   ├── test_models.py
│   ├── test_views.py
│   ├── test_signals.py
│   └── factories.py
├── apps/simulacion/tests/
│   ├── test_simulacion_flow.py
│   ├── test_permissions.py
│   └── test_gamificacion.py
```

### **Ejemplo de Test**
```python
# apps/core/tests/test_models.py
class UsuarioModelTest(TestCase):
    def test_actualizar_racha_primer_dia(self):
        """Primera práctica debe iniciar racha en 1"""
        usuario = UsuarioFactory()
        usuario.actualizar_racha()
        
        self.assertEqual(usuario.racha_actual, 1)
        self.assertIsNotNone(usuario.ultima_practica)
    
    def test_actualizar_racha_dia_consecutivo(self):
        """Práctica al día siguiente debe incrementar racha"""
        usuario = UsuarioFactory()
        # Simular práctica ayer
        ayer = timezone.now() - timedelta(days=1)
        usuario.ultima_practica = ayer
        usuario.racha_actual = 1
        usuario.save()
        
        # Actualizar racha hoy
        usuario.actualizar_racha()
        
        self.assertEqual(usuario.racha_actual, 2)
```

---

## 🚀 **COMANDOS ÚTILES PARA DESARROLLO**

### **Desarrollo**
```bash
# Iniciar servidor de desarrollo
python manage.py runserver

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Acceder al shell de Django
python manage.py shell

# Recopilar archivos estáticos
python manage.py collectstatic
```

### **Datos de Prueba**
```bash
# Poblar datos iniciales
python manage.py populate_data

# Crear usuarios de prueba
python manage.py loaddata fixtures/usuarios_prueba.json

# Limpiar base de datos
python manage.py flush
```

---

## 📚 **RECURSOS Y DOCUMENTACIÓN**

### **URLs Útiles (Desarrollo)**
- **Admin Django**: http://localhost:8000/admin
- **API Root**: http://localhost:8000/api/
- **Documentación API**: http://localhost:8000/api/docs/
- **Schema OpenAPI**: http://localhost:8000/api/schema/

### **Credenciales de Prueba**
```
Superusuario:
- Username: admin
- Password: (configurada durante setup)

Estudiante de prueba:
- Username: estudiante1
- Password: testpass123
- Rol: estudiante

Docente de prueba:
- Username: docente1
- Password: testpass123
- Rol: docente
```

---

## ⚡ **PRÓXIMAS MEJORAS PLANIFICADAS**

### **Backend Avanzado**
- [ ] Sistema de notificaciones push
- [ ] API para webhooks
- [ ] Integración con LMS externos
- [ ] Sistema de backup automático
- [ ] Análisis de rendimiento con IA
- [ ] Sistema de recomendaciones personalizadas

### **Optimizaciones**
- [ ] Implementar GraphQL
- [ ] Cache distribuido
- [ ] Database sharding
- [ ] Async views con Django Channels
- [ ] Task queue con Celery

---

**🎯 El backend está 100% funcional y listo para soportar todas las funcionalidades del simulador Saber 11. La arquitectura modular permite escalabilidad y fácil mantenimiento.**