from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import Materia, Pregunta

class PlantillaSimulacion(models.Model):
    """Modelo para plantillas de simulación creadas por docentes"""
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='plantillas_simulacion',
        verbose_name='Docente'
    )
    materia = models.ForeignKey(
        Materia,
        on_delete=models.CASCADE,
        related_name='plantillas_simulacion',
        verbose_name='Materia'
    )
    titulo = models.CharField(
        max_length=200,
        verbose_name='Título de la Plantilla'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    cantidad_preguntas = models.IntegerField(
        default=10,
        validators=[MinValueValidator(5), MaxValueValidator(100)],
        verbose_name='Cantidad de Preguntas'
    )
    preguntas_especificas = models.ManyToManyField(
        Pregunta,
        blank=True,
        verbose_name='Preguntas Específicas',
        help_text='Selecciona preguntas específicas para esta simulación. Si no se seleccionan, se usarán preguntas aleatorias.'
    )
    activa = models.BooleanField(
        default=True,
        verbose_name='Activa'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    fecha_modificacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Modificación'
    )

    class Meta:
        verbose_name = 'Plantilla de Simulación'
        verbose_name_plural = 'Plantillas de Simulación'
        db_table = 'plantillas_simulacion'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.titulo} ({self.materia.nombre_display})"

class SesionSimulacion(models.Model):
    """Modelo para sesiones de simulación de estudiantes"""
    estudiante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sesiones_simulacion',
        verbose_name='Estudiante'
    )
    materia = models.ForeignKey(
        Materia,
        on_delete=models.CASCADE,
        related_name='sesiones_simulacion',
        verbose_name='Materia'
    )
    plantilla = models.ForeignKey(
        PlantillaSimulacion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sesiones',
        verbose_name='Plantilla de Simulación'
    )
    preguntas = models.ManyToManyField(
        Pregunta,
        through='PreguntaSesion',
        verbose_name='Preguntas'
    )
    fecha_inicio = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Inicio'
    )
    fecha_fin = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Finalización'
    )
    completada = models.BooleanField(
        default=False,
        verbose_name='Completada'
    )
    puntuacion = models.IntegerField(
        default=0,
        verbose_name='Puntuación'
    )

    class Meta:
        verbose_name = 'Sesión de Simulación'
        verbose_name_plural = 'Sesiones de Simulación'
        db_table = 'sesiones_simulacion'
        ordering = ['-fecha_inicio']
        constraints = [
            models.UniqueConstraint(
                fields=['estudiante', 'materia'],
                condition=models.Q(completada=False),
                name='unique_active_session_per_student_subject'
            )
        ]

    def __str__(self):
        return f"Simulación de {self.estudiante.username} - {self.materia.nombre_display}"
    
    def get_progreso(self):
        """Retorna el progreso actual de la sesión"""
        total_preguntas = self.preguntas_sesion.count()
        preguntas_respondidas = self.preguntas_sesion.filter(
            respuesta_estudiante__isnull=False
        ).count()
        
        return {
            'respondidas': preguntas_respondidas,
            'total': total_preguntas,
            'porcentaje': round((preguntas_respondidas / total_preguntas) * 100, 1) if total_preguntas > 0 else 0
        }
    
    def get_siguiente_pregunta(self):
        """Retorna la siguiente pregunta sin responder"""
        return self.preguntas_sesion.filter(
            respuesta_estudiante__isnull=True
        ).order_by('orden').first()
    
    def finalizar(self):
        """Marca la sesión como completada y establece fecha de fin"""
        from django.utils import timezone
        self.completada = True
        self.fecha_fin = timezone.now()
        self.save()
    
    @property
    def duracion(self):
        """Retorna la duración de la sesión"""
        if self.fecha_fin and self.fecha_inicio:
            return self.fecha_fin - self.fecha_inicio
        return None
    
    @classmethod
    def get_sesion_activa_por_materia(cls, estudiante, materia):
        """Obtiene la sesión activa para un estudiante y materia específica"""
        try:
            return cls.objects.get(
                estudiante=estudiante,
                materia=materia,
                completada=False
            )
        except cls.DoesNotExist:
            return None

class PreguntaSesion(models.Model):
    """Modelo para relacionar preguntas con sesiones y guardar respuestas"""
    sesion = models.ForeignKey(
        SesionSimulacion,
        on_delete=models.CASCADE,
        related_name='preguntas_sesion',
        verbose_name='Sesión'
    )
    pregunta = models.ForeignKey(
        Pregunta,
        on_delete=models.CASCADE,
        related_name='sesiones_pregunta',
        verbose_name='Pregunta'
    )
    respuesta_estudiante = models.CharField(
        max_length=1,
        null=True,
        blank=True,
        verbose_name='Respuesta del Estudiante'
    )
    es_correcta = models.BooleanField(
        null=True,
        blank=True,
        verbose_name='¿Es Correcta?'
    )
    tiempo_respuesta = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Tiempo de Respuesta (segundos)'
    )
    orden = models.IntegerField(
        default=0,
        verbose_name='Orden de la Pregunta'
    )

    class Meta:
        verbose_name = 'Pregunta de Sesión'
        verbose_name_plural = 'Preguntas de Sesión'
        db_table = 'preguntas_sesion'
        ordering = ['orden']
        unique_together = ['sesion', 'pregunta']

    def __str__(self):
        return f"Pregunta {self.orden} - Sesión {self.sesion.id}"