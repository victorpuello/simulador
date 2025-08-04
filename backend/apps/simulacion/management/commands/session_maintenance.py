from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.utils import timezone
import logging
import io
import sys

logger = logging.getLogger('simulacion.maintenance')

class Command(BaseCommand):
    help = 'Ejecuta mantenimiento completo de sesiones: limpieza + métricas + logging'

    def add_arguments(self, parser):
        parser.add_argument(
            '--cleanup-hours',
            type=int,
            default=24,
            help='Horas para considerar sesiones obsoletas (default: 24)'
        )
        parser.add_argument(
            '--metrics-days',
            type=int,
            default=7,
            help='Días para generar métricas (default: 7)'
        )
        parser.add_argument(
            '--skip-cleanup',
            action='store_true',
            help='Saltar limpieza de sesiones obsoletas'
        )
        parser.add_argument(
            '--skip-metrics',
            action='store_true',
            help='Saltar generación de métricas'
        )
        parser.add_argument(
            '--output-dir',
            type=str,
            default='logs',
            help='Directorio para guardar archivos de salida'
        )

    def handle(self, *args, **options):
        cleanup_hours = options['cleanup_hours']
        metrics_days = options['metrics_days']
        skip_cleanup = options['skip_cleanup']
        skip_metrics = options['skip_metrics']
        output_dir = options['output_dir']
        
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        
        self.stdout.write(
            self.style.SUCCESS(f'🚀 Iniciando mantenimiento de sesiones - {timestamp}')
        )
        
        logger.info(f'Mantenimiento de sesiones iniciado: cleanup_hours={cleanup_hours}, metrics_days={metrics_days}')
        
        # 1. Limpieza de sesiones obsoletas
        if not skip_cleanup:
            self.stdout.write('\n🧹 FASE 1: Limpieza de sesiones obsoletas')
            try:
                # Capturar output del comando de limpieza
                old_stdout = sys.stdout
                sys.stdout = captured_output = io.StringIO()
                
                call_command(
                    'cleanup_stale_sessions',
                    hours=cleanup_hours,
                    force=True,
                    verbosity=1
                )
                
                sys.stdout = old_stdout
                cleanup_output = captured_output.getvalue()
                
                self.stdout.write(cleanup_output)
                logger.info(f'Limpieza completada: {cleanup_output}')
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error en limpieza: {str(e)}')
                )
                logger.error(f'Error en limpieza de sesiones: {str(e)}')
        else:
            self.stdout.write('\n⏭️  Limpieza de sesiones saltada')
        
        # 2. Generación de métricas
        if not skip_metrics:
            self.stdout.write('\n📊 FASE 2: Generación de métricas')
            try:
                # Generar métricas en formato texto
                metrics_file = f'{output_dir}/session_metrics_{timestamp}.txt'
                call_command(
                    'session_metrics',
                    days=metrics_days,
                    format='text',
                    output=metrics_file
                )
                
                # Generar métricas en formato JSON
                json_file = f'{output_dir}/session_metrics_{timestamp}.json'
                call_command(
                    'session_metrics',
                    days=metrics_days,
                    format='json',
                    output=json_file
                )
                
                self.stdout.write(f'✅ Métricas guardadas:')
                self.stdout.write(f'   📄 Texto: {metrics_file}')
                self.stdout.write(f'   📄 JSON: {json_file}')
                
                logger.info(f'Métricas generadas: {metrics_file}, {json_file}')
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error en métricas: {str(e)}')
                )
                logger.error(f'Error en generación de métricas: {str(e)}')
        else:
            self.stdout.write('\n⏭️  Generación de métricas saltada')
        
        # 3. Estadísticas finales
        self.stdout.write('\n📈 FASE 3: Estadísticas del sistema')
        try:
            from apps.simulacion.models import SesionSimulacion
            from apps.core.models import Usuario
            
            total_sesiones = SesionSimulacion.objects.count()
            sesiones_activas = SesionSimulacion.objects.filter(completada=False).count()
            sesiones_completadas = SesionSimulacion.objects.filter(completada=True).count()
            estudiantes_activos = Usuario.objects.filter(
                rol='estudiante',
                sesiones_simulacion__isnull=False
            ).distinct().count()
            
            self.stdout.write(f'📊 Estado actual del sistema:')
            self.stdout.write(f'   Total de sesiones: {total_sesiones}')
            self.stdout.write(f'   Sesiones activas: {sesiones_activas}')
            self.stdout.write(f'   Sesiones completadas: {sesiones_completadas}')
            self.stdout.write(f'   Estudiantes con actividad: {estudiantes_activos}')
            
            # Alertas
            if sesiones_activas > 50:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  ALERTA: {sesiones_activas} sesiones activas (recomendado < 50)')
                )
            
            if sesiones_activas == 0 and total_sesiones > 0:
                self.stdout.write(
                    self.style.SUCCESS('✅ Excelente: No hay sesiones activas abandonadas')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error en estadísticas: {str(e)}')
            )
        
        # 4. Finalización
        end_time = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        self.stdout.write(f'\n🏁 Mantenimiento completado - {end_time}')
        
        logger.info(f'Mantenimiento de sesiones completado exitosamente')
        
        # Recomendaciones
        self.stdout.write(f'\n💡 RECOMENDACIONES:')
        self.stdout.write(f'   • Ejecutar este comando diariamente mediante cron job')
        self.stdout.write(f'   • Monitorear logs en: logs/simulacion.log')
        self.stdout.write(f'   • Revisar métricas semanalmente para insights')
        self.stdout.write(f'   • Próxima ejecución recomendada: {(timezone.now().replace(hour=2, minute=0)).strftime("%Y-%m-%d %H:%M")}')