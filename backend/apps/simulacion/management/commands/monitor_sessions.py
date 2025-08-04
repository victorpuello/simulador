from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Count
from datetime import timedelta
import time
import os
import logging

from apps.simulacion.models import SesionSimulacion
from apps.core.models import Usuario

logger = logging.getLogger('simulacion.monitor')

class Command(BaseCommand):
    help = 'Monitor en tiempo real del estado de las sesiones'

    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=30,
            help='Intervalo en segundos entre actualizaciones (default: 30)'
        )
        parser.add_argument(
            '--alert-threshold',
            type=int,
            default=50,
            help='Número de sesiones activas para mostrar alerta (default: 50)'
        )
        parser.add_argument(
            '--max-iterations',
            type=int,
            default=0,
            help='Número máximo de iteraciones (0 = infinito)'
        )

    def handle(self, *args, **options):
        interval = options['interval']
        alert_threshold = options['alert_threshold']
        max_iterations = options['max_iterations']
        
        self.stdout.write(
            self.style.SUCCESS(f'🚀 Monitor de sesiones iniciado')
        )
        self.stdout.write(f'   Intervalo: {interval} segundos')
        self.stdout.write(f'   Umbral de alerta: {alert_threshold} sesiones activas')
        self.stdout.write(f'   Máximo iteraciones: {"Infinito" if max_iterations == 0 else max_iterations}')
        self.stdout.write(f'   Presiona Ctrl+C para detener\n')
        
        iteration = 0
        
        try:
            while True:
                iteration += 1
                
                if max_iterations > 0 and iteration > max_iterations:
                    break
                
                # Limpiar pantalla (funciona en Windows y Unix)
                os.system('cls' if os.name == 'nt' else 'clear')
                
                # Mostrar timestamp
                current_time = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
                self.stdout.write(
                    self.style.SUCCESS(f'📊 MONITOR DE SESIONES - {current_time}')
                )
                self.stdout.write('=' * 60)
                
                # Estadísticas generales
                stats = self.get_session_statistics()
                self.display_general_stats(stats, alert_threshold)
                
                # Estadísticas por materia
                self.display_subject_stats()
                
                # Sesiones recientes
                self.display_recent_sessions()
                
                # Alertas
                self.display_alerts(stats, alert_threshold)
                
                # Información de iteración
                self.stdout.write(f'\n🔄 Iteración #{iteration} | Próxima actualización en {interval}s')
                
                if max_iterations == 0 or iteration < max_iterations:
                    time.sleep(interval)
                    
        except KeyboardInterrupt:
            self.stdout.write(f'\n\n⏹️  Monitor detenido por el usuario')
            logger.info(f'Monitor de sesiones detenido después de {iteration} iteraciones')

    def get_session_statistics(self):
        """Obtiene estadísticas actuales de sesiones"""
        total_sessions = SesionSimulacion.objects.count()
        active_sessions = SesionSimulacion.objects.filter(completada=False).count()
        completed_sessions = SesionSimulacion.objects.filter(completada=True).count()
        
        # Sesiones recientes (última hora)
        one_hour_ago = timezone.now() - timedelta(hours=1)
        recent_sessions = SesionSimulacion.objects.filter(
            fecha_inicio__gte=one_hour_ago
        ).count()
        
        # Estudiantes activos
        active_students = Usuario.objects.filter(
            rol='estudiante',
            sesiones_simulacion__completada=False
        ).distinct().count()
        
        return {
            'total': total_sessions,
            'active': active_sessions,
            'completed': completed_sessions,
            'recent': recent_sessions,
            'active_students': active_students,
            'completion_rate': (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0
        }

    def display_general_stats(self, stats, alert_threshold):
        """Muestra estadísticas generales"""
        self.stdout.write('\n📈 ESTADÍSTICAS GENERALES:')
        
        # Código de color basado en sesiones activas
        if stats['active'] >= alert_threshold:
            active_style = self.style.ERROR
            active_icon = '🚨'
        elif stats['active'] >= alert_threshold * 0.7:
            active_style = self.style.WARNING
            active_icon = '⚠️'
        else:
            active_style = self.style.SUCCESS
            active_icon = '✅'
        
        self.stdout.write(f'   Total de sesiones: {stats["total"]}')
        self.stdout.write(active_style(f'   {active_icon} Sesiones activas: {stats["active"]}'))
        self.stdout.write(f'   Sesiones completadas: {stats["completed"]}')
        self.stdout.write(f'   Tasa de finalización: {stats["completion_rate"]:.1f}%')
        self.stdout.write(f'   Sesiones recientes (1h): {stats["recent"]}')
        self.stdout.write(f'   Estudiantes activos: {stats["active_students"]}')

    def display_subject_stats(self):
        """Muestra estadísticas por materia"""
        self.stdout.write('\n📚 POR MATERIA:')
        
        subject_stats = SesionSimulacion.objects.values(
            'materia__nombre_display'
        ).annotate(
            total=Count('id'),
            active=Count('id', filter=lambda x: x.filter(completada=False)),
            completed=Count('id', filter=lambda x: x.filter(completada=True))
        ).order_by('-active')
        
        if not subject_stats:
            self.stdout.write('   No hay datos disponibles')
            return
        
        for stat in subject_stats:
            materia = stat['materia__nombre_display']
            total = stat['total']
            active = stat.get('active', 0)
            completed = stat.get('completed', 0)
            
            completion_rate = (completed / total * 100) if total > 0 else 0
            
            self.stdout.write(f'   📖 {materia}:')
            self.stdout.write(f'      Total: {total} | Activas: {active} | Completadas: {completed} | Tasa: {completion_rate:.1f}%')

    def display_recent_sessions(self):
        """Muestra sesiones recientes"""
        self.stdout.write('\n🕐 SESIONES RECIENTES (últimos 30 min):')
        
        thirty_min_ago = timezone.now() - timedelta(minutes=30)
        recent_sessions = SesionSimulacion.objects.filter(
            fecha_inicio__gte=thirty_min_ago
        ).select_related('estudiante', 'materia').order_by('-fecha_inicio')[:5]
        
        if not recent_sessions:
            self.stdout.write('   No hay sesiones recientes')
            return
        
        for session in recent_sessions:
            status_icon = '🟢' if not session.completada else '✅'
            time_str = session.fecha_inicio.strftime('%H:%M')
            progreso = session.get_progreso()
            
            self.stdout.write(f'   {status_icon} {time_str} | {session.estudiante.username} | '
                            f'{session.materia.nombre_display} | '
                            f'Progreso: {progreso["respondidas"]}/{progreso["total"]}')

    def display_alerts(self, stats, alert_threshold):
        """Muestra alertas del sistema"""
        alerts = []
        
        if stats['active'] >= alert_threshold:
            alerts.append(f'🚨 CRÍTICO: {stats["active"]} sesiones activas (umbral: {alert_threshold})')
        
        if stats['active'] > 0 and stats['completion_rate'] < 50:
            alerts.append(f'⚠️  ADVERTENCIA: Baja tasa de finalización ({stats["completion_rate"]:.1f}%)')
        
        # Verificar sesiones muy antiguas
        old_cutoff = timezone.now() - timedelta(hours=6)
        old_sessions = SesionSimulacion.objects.filter(
            completada=False,
            fecha_inicio__lt=old_cutoff
        ).count()
        
        if old_sessions > 0:
            alerts.append(f'🕐 ATENCIÓN: {old_sessions} sesiones activas de más de 6 horas')
        
        if alerts:
            self.stdout.write('\n🚨 ALERTAS:')
            for alert in alerts:
                if '🚨' in alert:
                    self.stdout.write(self.style.ERROR(f'   {alert}'))
                else:
                    self.stdout.write(self.style.WARNING(f'   {alert}'))
        else:
            self.stdout.write('\n✅ Sin alertas - Sistema funcionando correctamente')