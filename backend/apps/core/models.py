from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta


class Usuario(AbstractUser):
    """Modelo de usuario personalizado con roles y gamificación"""
    ROLES = [
        ('estudiante', 'Estudiante'),
        ('docente', 'Docente'),
        ('admin', 'Administrador'),
    ]
    
    rol = models.CharField(
        max_length=10, 
        choices=ROLES, 
        default='estudiante',
        verbose_name='Rol'
    )
    avatar = models.URLField(
        blank=True, 
        null=True,
        verbose_name='Avatar'
    )
    racha_actual = models.IntegerField(
        default=0,
        verbose_name='Racha Actual'
    )
    puntos_totales = models.IntegerField(
        default=0,
        verbose_name='Puntos Totales'
    )
    ultima_practica = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name='Última Práctica'
    )
    configuracion = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        verbose_name='Configuración'
    )
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        db_table = 'usuarios'
    
    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"
    
    @property
    def es_estudiante(self):
        return self.rol == 'estudiante'
    
    @property
    def es_docente(self):
        return self.rol == 'docente'
    
    def actualizar_racha(self):
        """Actualiza la racha de práctica del usuario"""
        hoy = timezone.now().date()
        
        if self.ultima_practica:
            ultima_fecha = self.ultima_practica.date()
            dias_diferencia = (hoy - ultima_fecha).days
            
            if dias_diferencia == 1:
                self.racha_actual += 1
            elif dias_diferencia > 1:
                self.racha_actual = 1
            # Si es el mismo día, no actualizar racha
        else:
            self.racha_actual = 1
        
        self.ultima_practica = timezone.now()
        self.save()


class Materia(models.Model):
    """Modelo para las materias del ICFES"""
    nombre = models.CharField(
        max_length=100, 
        unique=True,
        verbose_name='Nombre'
    )
    nombre_display = models.CharField(
        max_length=100,
        verbose_name='Nombre para Mostrar'
    )
    color = models.CharField(
        max_length=7, 
        default="#6366f1",
        verbose_name='Color'
    )
    icono = models.CharField(
        max_length=50, 
        default="book",
        verbose_name='Icono'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    activa = models.BooleanField(
        default=True,
        verbose_name='Activa'
    )
    
    class Meta:
        verbose_name = 'Materia'
        verbose_name_plural = 'Materias'
        db_table = 'materias'
    
    def __str__(self):
        return self.nombre_display


class Competencia(models.Model):
    """Modelo para las competencias específicas de cada materia"""
    materia = models.ForeignKey(
        Materia, 
        on_delete=models.CASCADE,
        related_name='competencias',
        verbose_name='Materia'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    peso_icfes = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=1.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        verbose_name='Peso ICFES'
    )
    
    class Meta:
        verbose_name = 'Competencia'
        verbose_name_plural = 'Competencias'
        db_table = 'competencias'
        unique_together = ['materia', 'nombre']
    
    def __str__(self):
        return f"{self.materia.nombre} - {self.nombre}"


class Pregunta(models.Model):
    """Modelo para las preguntas del simulador"""
    DIFICULTAD_CHOICES = [
        ('facil', 'Fácil'),
        ('media', 'Media'),
        ('dificil', 'Difícil'),
    ]
    
    materia = models.ForeignKey(
        Materia, 
        on_delete=models.CASCADE,
        related_name='preguntas',
        verbose_name='Materia'
    )
    competencia = models.ForeignKey(
        Competencia, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='preguntas',
        verbose_name='Competencia'
    )
    contexto = models.TextField(
        blank=True,
        verbose_name='Contexto'
    )
    imagen = models.ImageField(
        upload_to='preguntas/imagenes/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Imagen de Contexto',
        help_text='Imagen opcional para análisis, gráficos, diagramas, mapas, etc.'
    )
    enunciado = models.TextField(
        verbose_name='Enunciado'
    )
    opciones = models.JSONField(
        verbose_name='Opciones'
    )  # {"A": "texto", "B": "texto", ...}
    respuesta_correcta = models.CharField(
        max_length=1,
        verbose_name='Respuesta Correcta'
    )
    retroalimentacion = models.TextField(
        verbose_name='Retroalimentación'
    )
    explicacion = models.TextField(
        blank=True,
        verbose_name='Explicación'
    )
    habilidad_evaluada = models.TextField(
        blank=True,
        verbose_name='Habilidad Evaluada',
        help_text='Descripción de la competencia o habilidad específica que evalúa esta pregunta'
    )
    explicacion_opciones_incorrectas = models.JSONField(
        default=dict,
        verbose_name='Explicación de Opciones Incorrectas',
        help_text='Explicación detallada de por qué cada opción incorrecta no es válida'
    )
    estrategias_resolucion = models.TextField(
        blank=True,
        verbose_name='Estrategias de Resolución',
        help_text='Técnicas y estrategias para abordar este tipo de preguntas'
    )
    errores_comunes = models.TextField(
        blank=True,
        verbose_name='Errores Comunes',
        help_text='Errores frecuentes que cometen los estudiantes en este tipo de pregunta'
    )
    dificultad = models.CharField(
        max_length=10,
        choices=DIFICULTAD_CHOICES,
        default='media',
        verbose_name='Dificultad'
    )
    tiempo_estimado = models.IntegerField(
        default=60,
        validators=[MinValueValidator(30), MaxValueValidator(300)],
        verbose_name='Tiempo Estimado (segundos)'
    )
    activa = models.BooleanField(
        default=True,
        verbose_name='Activa'
    )
    tags = models.JSONField(
        default=list,
        verbose_name='Tags'
    )  # ["álgebra", "ecuaciones"]
    
    class Meta:
        verbose_name = 'Pregunta'
        verbose_name_plural = 'Preguntas'
        db_table = 'preguntas'
    
    def __str__(self):
        return f"{self.materia.nombre} - {self.enunciado[:50]}..."
    
    def clean(self):
        """Validación personalizada"""
        from django.core.exceptions import ValidationError
        
        # Validar que la respuesta correcta esté en las opciones
        if self.respuesta_correcta not in self.opciones.keys():
            raise ValidationError(
                'La respuesta correcta debe estar entre las opciones disponibles'
            )
        
        # Validar que haya al menos 2 opciones
        if len(self.opciones) < 2:
            raise ValidationError(
                'Debe haber al menos 2 opciones de respuesta'
            )


class Sesion(models.Model):
    """Modelo para las sesiones de simulación"""
    MODOS_CHOICES = [
        ('practica', 'Práctica Libre'),
        ('simulacro', 'Simulacro Completo'),
        ('asignada', 'Asignación Docente'),
    ]
    
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='sesiones',
        verbose_name='Usuario'
    )
    materia = models.ForeignKey(
        Materia, 
        on_delete=models.CASCADE,
        related_name='sesiones',
        verbose_name='Materia'
    )
    asignacion = models.ForeignKey(
        'Asignacion', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='sesiones',
        verbose_name='Asignación'
    )
    fecha_inicio = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Inicio'
    )
    fecha_fin = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name='Fecha de Fin'
    )
    puntaje_final = models.IntegerField(
        null=True, 
        blank=True,
        verbose_name='Puntaje Final'
    )
    tiempo_total = models.IntegerField(
        null=True, 
        blank=True,
        verbose_name='Tiempo Total (segundos)'
    )
    completada = models.BooleanField(
        default=False,
        verbose_name='Completada'
    )
    modo = models.CharField(
        max_length=20,
        choices=MODOS_CHOICES,
        default='practica',
        verbose_name='Modo'
    )
    
    class Meta:
        verbose_name = 'Sesión'
        verbose_name_plural = 'Sesiones'
        db_table = 'sesiones'
        ordering = ['-fecha_inicio']
    
    def __str__(self):
        return f"{self.usuario.username} - {self.materia.nombre} ({self.fecha_inicio.strftime('%d/%m/%Y')})"
    
    def calcular_puntaje(self):
        """Calcula el puntaje final de la sesión"""
        respuestas = self.respuestas.all()
        if not respuestas:
            return 0
        
        correctas = respuestas.filter(es_correcta=True).count()
        total = respuestas.count()
        
        return round((correctas / total) * 100, 2)
    
    def finalizar_sesion(self):
        """Finaliza la sesión y calcula el puntaje"""
        self.fecha_fin = timezone.now()
        self.tiempo_total = int((self.fecha_fin - self.fecha_inicio).total_seconds())
        self.puntaje_final = self.calcular_puntaje()
        self.completada = True
        self.save()
        
        # Actualizar racha del usuario
        self.usuario.actualizar_racha()


class RespuestaUsuario(models.Model):
    """Modelo para las respuestas de los usuarios"""
    sesion = models.ForeignKey(
        Sesion, 
        on_delete=models.CASCADE, 
        related_name='respuestas',
        verbose_name='Sesión'
    )
    pregunta = models.ForeignKey(
        Pregunta, 
        on_delete=models.CASCADE,
        related_name='respuestas_usuarios',
        verbose_name='Pregunta'
    )
    respuesta_seleccionada = models.CharField(
        max_length=1,
        verbose_name='Respuesta Seleccionada'
    )
    es_correcta = models.BooleanField(
        verbose_name='Es Correcta'
    )
    tiempo_respuesta = models.IntegerField(
        verbose_name='Tiempo de Respuesta (segundos)'
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Timestamp'
    )
    revisada = models.BooleanField(
        default=False,
        verbose_name='Revisada'
    )
    
    class Meta:
        verbose_name = 'Respuesta de Usuario'
        verbose_name_plural = 'Respuestas de Usuarios'
        db_table = 'respuestas_usuarios'
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sesion.usuario.username} - {self.pregunta.materia.nombre}"


class Clase(models.Model):
    """Modelo para las clases creadas por docentes"""
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='clases_creadas',
        verbose_name='Docente'
    )
    estudiantes = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='clases_inscritas', 
        blank=True,
        verbose_name='Estudiantes'
    )
    codigo_inscripcion = models.CharField(
        max_length=8, 
        unique=True,
        verbose_name='Código de Inscripción'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    activa = models.BooleanField(
        default=True,
        verbose_name='Activa'
    )
    configuracion = models.JSONField(
        default=dict,
        verbose_name='Configuración'
    )
    
    class Meta:
        verbose_name = 'Clase'
        verbose_name_plural = 'Clases'
        db_table = 'clases'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"{self.nombre} - {self.docente.username}"
    
    def generar_codigo_inscripcion(self):
        """Genera un código único de inscripción"""
        import random
        import string
        
        while True:
            codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not Clase.objects.filter(codigo_inscripcion=codigo).exists():
                return codigo
    
    def save(self, *args, **kwargs):
        if not self.codigo_inscripcion:
            self.codigo_inscripcion = self.generar_codigo_inscripcion()
        super().save(*args, **kwargs)


class Asignacion(models.Model):
    """Modelo para las asignaciones creadas por docentes"""
    clase = models.ForeignKey(
        Clase, 
        on_delete=models.CASCADE,
        related_name='asignaciones',
        verbose_name='Clase'
    )
    materia = models.ForeignKey(
        Materia, 
        on_delete=models.CASCADE,
        related_name='asignaciones',
        verbose_name='Materia'
    )
    titulo = models.CharField(
        max_length=200,
        verbose_name='Título'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    cantidad_preguntas = models.IntegerField(
        default=10,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name='Cantidad de Preguntas'
    )
    tiempo_limite = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(5), MaxValueValidator(300)],
        verbose_name='Tiempo Límite (minutos)'
    )
    fecha_limite = models.DateTimeField(
        verbose_name='Fecha Límite'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    activa = models.BooleanField(
        default=True,
        verbose_name='Activa'
    )
    
    class Meta:
        verbose_name = 'Asignación'
        verbose_name_plural = 'Asignaciones'
        db_table = 'asignaciones'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"{self.titulo} - {self.clase.nombre}"
    
    @property
    def esta_vencida(self):
        """Verifica si la asignación está vencida"""
        return timezone.now() > self.fecha_limite


class Insignia(models.Model):
    """Modelo para las insignias de gamificación"""
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        verbose_name='Descripción'
    )
    icono = models.CharField(
        max_length=50,
        verbose_name='Icono'
    )
    color = models.CharField(
        max_length=7, 
        default="#6366f1",
        verbose_name='Color'
    )
    criterio = models.JSONField(
        verbose_name='Criterio'
    )  # Condiciones para obtenerla
    puntos = models.IntegerField(
        default=0,
        verbose_name='Puntos'
    )
    rara = models.BooleanField(
        default=False,
        verbose_name='Rara'
    )
    
    class Meta:
        verbose_name = 'Insignia'
        verbose_name_plural = 'Insignias'
        db_table = 'insignias'
    
    def __str__(self):
        return self.nombre
    
    def evaluar_criterio(self, usuario):
        """Evalúa si un usuario cumple el criterio para obtener la insignia"""
        # Implementar lógica de evaluación según el criterio
        pass


class LogroUsuario(models.Model):
    """Modelo para los logros obtenidos por los usuarios"""
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='logros',
        verbose_name='Usuario'
    )
    insignia = models.ForeignKey(
        Insignia, 
        on_delete=models.CASCADE,
        related_name='logros_usuarios',
        verbose_name='Insignia'
    )
    fecha_obtenido = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha Obtenido'
    )
    contexto = models.JSONField(
        default=dict,
        verbose_name='Contexto'
    )  # Datos adicionales
    
    class Meta:
        verbose_name = 'Logro de Usuario'
        verbose_name_plural = 'Logros de Usuarios'
        db_table = 'logros_usuarios'
        unique_together = ['usuario', 'insignia']
        ordering = ['-fecha_obtenido']
    
    def __str__(self):
        return f"{self.usuario.username} - {self.insignia.nombre}"
