from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import logging

from apps.simulacion.models import SesionSimulacion

logger = logging.getLogger('simulacion.cleanup')

class Command(BaseCommand):
    help = 'Limpia sesiones de simulación obsoletas'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Horas después de las cuales considerar una sesión como obsoleta (default: 24)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simular la limpieza sin eliminar realmente las sesiones'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Forzar eliminación sin confirmación'
        )

    def handle(self, *args, **options):
        hours = options['hours']
        dry_run = options['dry_run']
        force = options['force']
        
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        # Encontrar sesiones obsoletas
        stale_sessions = SesionSimulacion.objects.filter(
            completada=False,
            fecha_inicio__lt=cutoff_time
        ).select_related('estudiante', 'materia')
        
        count = stale_sessions.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS(f'✅ No se encontraron sesiones obsoletas (más de {hours} horas)')
            )
            return
        
        # Mostrar información detallada
        self.stdout.write(f'\n🔍 Sesiones obsoletas encontradas: {count}')
        self.stdout.write(f'   Criterio: Sesiones incompletas creadas antes de {cutoff_time.strftime("%Y-%m-%d %H:%M:%S")}')
        
        if self.verbosity >= 2:
            self.stdout.write('\n📋 Detalle de sesiones a eliminar:')
            for session in stale_sessions[:10]:  # Mostrar máximo 10
                progreso = session.get_progreso()
                self.stdout.write(f'   - ID: {session.id} | Usuario: {session.estudiante.username} | '
                                f'Materia: {session.materia.nombre_display} | '
                                f'Progreso: {progreso["respondidas"]}/{progreso["total"]} | '
                                f'Creada: {session.fecha_inicio.strftime("%Y-%m-%d %H:%M")}')
            
            if count > 10:
                self.stdout.write(f'   ... y {count - 10} más')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'\n🧪 DRY RUN: Se eliminarían {count} sesiones obsoletas')
            )
            return
        
        # Confirmar eliminación
        if not force:
            confirm = input(f'\n⚠️  ¿Confirmas eliminar {count} sesiones obsoletas? (y/N): ')
            if confirm.lower() not in ['y', 'yes', 'sí', 's']:
                self.stdout.write(self.style.WARNING('❌ Operación cancelada'))
                return
        
        # Guardar estadísticas antes de eliminar
        session_stats = {}
        for session in stale_sessions:
            materia = session.materia.nombre_display
            progreso = session.get_progreso()
            
            if materia not in session_stats:
                session_stats[materia] = {
                    'count': 0,
                    'total_respondidas': 0,
                    'total_preguntas': 0
                }
            
            session_stats[materia]['count'] += 1
            session_stats[materia]['total_respondidas'] += progreso['respondidas']
            session_stats[materia]['total_preguntas'] += progreso['total']
        
        # Eliminar sesiones
        deleted_count, deleted_details = stale_sessions.delete()
        
        # Log de la operación
        logger.info(f'Cleanup ejecutado: {deleted_count} sesiones eliminadas después de {hours} horas')
        
        # Mostrar resultados
        self.stdout.write(f'\n✅ Limpieza completada:')
        self.stdout.write(f'   📊 Sesiones eliminadas: {deleted_count}')
        self.stdout.write(f'   ⏰ Criterio: Más de {hours} horas sin actividad')
        
        if deleted_details:
            self.stdout.write(f'\n📈 Detalles de eliminación:')
            for model, count in deleted_details.items():
                if 'PreguntaSesion' in model:
                    self.stdout.write(f'   - Respuestas asociadas eliminadas: {count}')
        
        if session_stats:
            self.stdout.write(f'\n📚 Estadísticas por materia:')
            for materia, stats in session_stats.items():
                avg_progreso = (stats['total_respondidas'] / stats['total_preguntas'] * 100) if stats['total_preguntas'] > 0 else 0
                self.stdout.write(f'   - {materia}: {stats["count"]} sesiones (progreso promedio: {avg_progreso:.1f}%)')
        
        # Estadísticas finales
        remaining_active = SesionSimulacion.objects.filter(completada=False).count()
        self.stdout.write(f'\n🎯 Sesiones activas restantes: {remaining_active}')
        
        if remaining_active > 0:
            self.stdout.write(f'💡 Próxima ejecución recomendada: {(timezone.now() + timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M")}')

    @property
    def verbosity(self):
        return getattr(self, '_verbosity', 1)

    def set_verbosity(self, verbosity):
        self._verbosity = verbosity