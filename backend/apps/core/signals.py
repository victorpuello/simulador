from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import Sesion, RespuestaUsuario, LogroUsuario, Insignia


@receiver(post_save, sender=Sesion)
def actualizar_racha_usuario(sender, instance, created, **kwargs):
    """Actualiza la racha del usuario cuando se completa una sesión"""
    if instance.completada and created:
        instance.usuario.actualizar_racha()


@receiver(post_save, sender=RespuestaUsuario)
def actualizar_puntos_usuario(sender, instance, created, **kwargs):
    """Actualiza los puntos del usuario cuando responde correctamente"""
    if created and instance.es_correcta:
        # Dar puntos por respuesta correcta
        puntos_por_respuesta = 10
        instance.sesion.usuario.puntos_totales += puntos_por_respuesta
        instance.sesion.usuario.save()


@receiver(post_save, sender=LogroUsuario)
def evaluar_nuevas_insignias(sender, instance, created, **kwargs):
    """Evalúa si el usuario merece nuevas insignias después de obtener una"""
    if created:
        usuario = instance.usuario
        
        # Obtener todas las insignias que el usuario no tiene
        insignias_disponibles = Insignia.objects.exclude(
            logros_usuarios__usuario=usuario
        )
        
        for insignia in insignias_disponibles:
            if insignia.evaluar_criterio(usuario):
                LogroUsuario.objects.create(
                    usuario=usuario,
                    insignia=insignia,
                    contexto={'obtenida_por': 'evaluacion_automatica'}
                )


@receiver(post_save, sender=Sesion)
def evaluar_insignias_por_sesion(sender, instance, created, **kwargs):
    """Evalúa insignias basadas en el rendimiento de la sesión"""
    if instance.completada:
        usuario = instance.usuario
        
        # Insignia por completar primera sesión
        if Sesion.objects.filter(usuario=usuario, completada=True).count() == 1:
            insignia_primer_sesion, _ = Insignia.objects.get_or_create(
                nombre='Primera Sesión',
                defaults={
                    'descripcion': 'Completaste tu primera sesión de práctica',
                    'icono': 'star',
                    'color': '#10b981',
                    'criterio': {'tipo': 'primera_sesion'},
                    'puntos': 50
                }
            )
            
            LogroUsuario.objects.get_or_create(
                usuario=usuario,
                insignia=insignia_primer_sesion,
                defaults={'contexto': {'obtenida_por': 'primera_sesion'}}
            )
        
        # Insignia por puntaje alto (más de 80%)
        if instance.puntaje_final and instance.puntaje_final >= 80:
            insignia_alto_rendimiento, _ = Insignia.objects.get_or_create(
                nombre='Alto Rendimiento',
                defaults={
                    'descripcion': 'Obtuviste un puntaje de 80% o más',
                    'icono': 'trophy',
                    'color': '#f59e0b',
                    'criterio': {'tipo': 'puntaje_alto', 'minimo': 80},
                    'puntos': 100
                }
            )
            
            LogroUsuario.objects.get_or_create(
                usuario=usuario,
                insignia=insignia_alto_rendimiento,
                defaults={'contexto': {'obtenida_por': 'puntaje_alto', 'puntaje': instance.puntaje_final}}
            )
        
        # Insignia por racha de práctica
        if usuario.racha_actual >= 7:
            insignia_racha_semana, _ = Insignia.objects.get_or_create(
                nombre='Racha Semanal',
                defaults={
                    'descripcion': 'Practicaste 7 días seguidos',
                    'icono': 'fire',
                    'color': '#ef4444',
                    'criterio': {'tipo': 'racha', 'dias': 7},
                    'puntos': 200
                }
            )
            
            LogroUsuario.objects.get_or_create(
                usuario=usuario,
                insignia=insignia_racha_semana,
                defaults={'contexto': {'obtenida_por': 'racha_semana', 'racha': usuario.racha_actual}}
            ) 