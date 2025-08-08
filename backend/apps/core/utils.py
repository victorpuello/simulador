"""
Utilidades para el módulo core
"""
from django.utils import timezone
from .models import LogroUsuario, Insignia


def verificar_logros_usuario(usuario_id):
    """
    Función para verificar y otorgar logros a un usuario
    Simula una tarea asíncrona como Celery
    """
    from django.contrib.auth import get_user_model
    
    Usuario = get_user_model()
    
    try:
        usuario = Usuario.objects.get(id=usuario_id)
    except Usuario.DoesNotExist:
        return False
    
    # Verificar insignias disponibles que el usuario no tiene
    insignias_disponibles = Insignia.objects.exclude(
        logros_usuarios__usuario=usuario
    )
    
    logros_otorgados = []
    
    for insignia in insignias_disponibles:
        # Evaluar criterio según el tipo
        criterio = insignia.criterio
        
        if criterio.get('tipo') == 'primera_simulacion':
            # Primera simulación
            from .models import Sesion
            if Sesion.objects.filter(usuario=usuario, completada=True).exists():
                logro, created = LogroUsuario.objects.get_or_create(
                    usuario=usuario,
                    insignia=insignia,
                    defaults={
                        'contexto': {
                            'tipo': 'primera_simulacion',
                            'fecha': timezone.now().isoformat()
                        }
                    }
                )
                if created:
                    # Otorgar puntos de la insignia
                    usuario.puntos_totales += insignia.puntos
                    usuario.save()
                    logros_otorgados.append(logro)
        
        elif criterio.get('tipo') == 'racha':
            # Racha de días
            minimo = criterio.get('minimo', 1)
            if usuario.racha_actual >= minimo:
                logro, created = LogroUsuario.objects.get_or_create(
                    usuario=usuario,
                    insignia=insignia,
                    defaults={
                        'contexto': {
                            'tipo': 'racha',
                            'racha_actual': usuario.racha_actual,
                            'fecha': timezone.now().isoformat()
                        }
                    }
                )
                if created:
                    usuario.puntos_totales += insignia.puntos
                    usuario.save()
                    logros_otorgados.append(logro)
        
        elif criterio.get('tipo') == 'porcentaje_materia':
            # Porcentaje en materia específica
            from .models import Sesion, Materia
            materia_nombre = criterio.get('materia')
            minimo = criterio.get('minimo', 80)
            
            try:
                materia = Materia.objects.get(nombre=materia_nombre)
                sesiones = Sesion.objects.filter(
                    usuario=usuario,
                    materia=materia,
                    completada=True,
                    puntaje_final__isnull=False
                )
                
                if sesiones.exists():
                    from django.db import models
                    promedio = sesiones.aggregate(
                        promedio=models.Avg('puntaje_final')
                    )['promedio']
                    
                    if promedio and promedio >= minimo:
                        logro, created = LogroUsuario.objects.get_or_create(
                            usuario=usuario,
                            insignia=insignia,
                            defaults={
                                'contexto': {
                                    'tipo': 'porcentaje_materia',
                                    'materia': materia_nombre,
                                    'promedio': promedio,
                                    'fecha': timezone.now().isoformat()
                                }
                            }
                        )
                        if created:
                            usuario.puntos_totales += insignia.puntos
                            usuario.save()
                            logros_otorgados.append(logro)
            except Materia.DoesNotExist:
                continue
    
    return logros_otorgados


def calcular_puntos_sesion(sesion):
    """
    Calcula los puntos que debe recibir un usuario por completar una sesión
    """
    puntos_base = 50  # Puntos por completar sesión
    
    if sesion.puntaje_final:
        # Puntos adicionales por rendimiento
        if sesion.puntaje_final >= 90:
            puntos_base += 50  # Excelente
        elif sesion.puntaje_final >= 80:
            puntos_base += 30  # Muy bueno
        elif sesion.puntaje_final >= 70:
            puntos_base += 20  # Bueno
        elif sesion.puntaje_final >= 60:
            puntos_base += 10  # Aceptable
    
    return puntos_base


def calcular_estadisticas_usuario(usuario):
    """
    Calcula estadísticas completas de un usuario
    """
    from .models import Sesion, RespuestaUsuario
    from django.db.models import Avg, Count, Sum
    
    # Sesiones completadas
    sesiones = Sesion.objects.filter(usuario=usuario, completada=True)
    
    # Estadísticas básicas
    stats = {
        'sesiones_totales': sesiones.count(),
        'puntos_totales': usuario.puntos_totales,
        'racha_actual': usuario.racha_actual,
        'promedio_general': 0,
        'tiempo_total_estudio': 0,
        'logros_obtenidos': LogroUsuario.objects.filter(usuario=usuario).count(),
    }
    
    if sesiones.exists():
        # Promedio de puntajes
        promedio = sesiones.aggregate(Avg('puntaje_final'))['puntaje_final__avg']
        stats['promedio_general'] = round(promedio or 0, 2)
        
        # Tiempo total de estudio (en minutos)
        tiempo_total = sesiones.aggregate(Sum('tiempo_total'))['tiempo_total__sum']
        stats['tiempo_total_estudio'] = round((tiempo_total or 0) / 60, 2)
        
        # Estadísticas por materia
        stats['por_materia'] = {}
        for sesion in sesiones.values('materia__nombre', 'materia__nombre_display').annotate(
            count=Count('id'),
            promedio=Avg('puntaje_final')
        ):
            stats['por_materia'][sesion['materia__nombre']] = {
                'nombre': sesion['materia__nombre_display'],
                'sesiones': sesion['count'],
                'promedio': round(sesion['promedio'] or 0, 2)
            }
    
    return stats