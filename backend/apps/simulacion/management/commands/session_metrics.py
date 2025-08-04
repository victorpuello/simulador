from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Count, Avg, Sum, Q
from datetime import timedelta
import json

from apps.simulacion.models import SesionSimulacion
from apps.core.models import Materia

class Command(BaseCommand):
    help = 'Genera métricas y estadísticas de sesiones de simulación'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Número de días atrás para generar métricas (default: 7)'
        )
        parser.add_argument(
            '--format',
            choices=['text', 'json'],
            default='text',
            help='Formato de salida (default: text)'
        )
        parser.add_argument(
            '--output',
            type=str,
            help='Archivo de salida (opcional)'
        )

    def handle(self, *args, **options):
        days = options['days']
        format_type = options['format']
        output_file = options['output']
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Recopilar métricas
        metrics = self.generate_metrics(start_date, days)
        
        # Formatear salida
        if format_type == 'json':
            output = self.format_json(metrics)
        else:
            output = self.format_text(metrics)
        
        # Escribir a archivo o consola
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(output)
            self.stdout.write(f'📄 Métricas guardadas en: {output_file}')
        else:
            self.stdout.write(output)

    def generate_metrics(self, start_date, days):
        """Genera todas las métricas de sesiones"""
        
        # Sesiones en el período
        sesiones_periodo = SesionSimulacion.objects.filter(
            fecha_inicio__gte=start_date
        )
        
        # Métricas generales
        total_sesiones = sesiones_periodo.count()
        sesiones_completadas = sesiones_periodo.filter(completada=True).count()
        sesiones_activas = sesiones_periodo.filter(completada=False).count()
        tasa_finalizacion = (sesiones_completadas / total_sesiones * 100) if total_sesiones > 0 else 0
        
        # Métricas por materia
        materias_stats = {}
        for materia in Materia.objects.all():
            sesiones_materia = sesiones_periodo.filter(materia=materia)
            total_materia = sesiones_materia.count()
            
            if total_materia > 0:
                completadas_materia = sesiones_materia.filter(completada=True).count()
                promedio_puntuacion = sesiones_materia.filter(
                    completada=True
                ).aggregate(avg_score=Avg('puntuacion'))['avg_score'] or 0
                
                materias_stats[materia.nombre_display] = {
                    'total_sesiones': total_materia,
                    'completadas': completadas_materia,
                    'activas': total_materia - completadas_materia,
                    'tasa_finalizacion': (completadas_materia / total_materia * 100),
                    'promedio_puntuacion': round(promedio_puntuacion, 2)
                }
        
        # Patrones de abandono
        abandono_stats = self.analyze_abandonment_patterns(sesiones_periodo)
        
        # Usuarios más activos
        usuarios_activos = sesiones_periodo.values(
            'estudiante__username', 'estudiante__first_name', 'estudiante__last_name'
        ).annotate(
            total_sesiones=Count('id'),
            sesiones_completadas=Count('id', filter=Q(completada=True))
        ).order_by('-total_sesiones')[:10]
        
        # Tiempo promedio de sesión
        sesiones_con_tiempo = sesiones_periodo.filter(
            completada=True,
            fecha_fin__isnull=False
        )
        
        tiempo_promedio = None
        if sesiones_con_tiempo.exists():
            tiempos = []
            for sesion in sesiones_con_tiempo:
                if sesion.duracion:
                    tiempos.append(sesion.duracion.total_seconds() / 60)  # en minutos
            
            if tiempos:
                tiempo_promedio = sum(tiempos) / len(tiempos)
        
        return {
            'periodo': {
                'dias': days,
                'fecha_inicio': start_date.strftime('%Y-%m-%d %H:%M:%S'),
                'fecha_fin': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
            },
            'generales': {
                'total_sesiones': total_sesiones,
                'sesiones_completadas': sesiones_completadas,
                'sesiones_activas': sesiones_activas,
                'tasa_finalizacion': round(tasa_finalizacion, 2),
                'tiempo_promedio_minutos': round(tiempo_promedio, 2) if tiempo_promedio else None
            },
            'por_materia': materias_stats,
            'abandono': abandono_stats,
            'usuarios_activos': list(usuarios_activos),
            'timestamp': timezone.now().isoformat()
        }

    def analyze_abandonment_patterns(self, sesiones):
        """Analiza patrones de abandono de sesiones"""
        sesiones_abandonadas = sesiones.filter(completada=False)
        
        abandono_por_pregunta = {}
        total_abandonadas = sesiones_abandonadas.count()
        
        if total_abandonadas > 0:
            for sesion in sesiones_abandonadas:
                progreso = sesion.get_progreso()
                pregunta_abandono = progreso['respondidas']
                
                if pregunta_abandono not in abandono_por_pregunta:
                    abandono_por_pregunta[pregunta_abandono] = 0
                abandono_por_pregunta[pregunta_abandono] += 1
        
        # Convertir a porcentajes
        abandono_porcentajes = {}
        for pregunta, count in abandono_por_pregunta.items():
            abandono_porcentajes[f'pregunta_{pregunta}'] = round((count / total_abandonadas * 100), 2)
        
        return {
            'total_abandonadas': total_abandonadas,
            'por_pregunta': abandono_porcentajes,
            'pregunta_critica': max(abandono_por_pregunta, key=abandono_por_pregunta.get) if abandono_por_pregunta else None
        }

    def format_text(self, metrics):
        """Formatea métricas en texto legible"""
        output = []
        output.append("📊 MÉTRICAS DE SESIONES DE SIMULACIÓN")
        output.append("=" * 50)
        
        # Período
        output.append(f"\n🗓️  PERÍODO ANALIZADO:")
        output.append(f"   Últimos {metrics['periodo']['dias']} días")
        output.append(f"   Desde: {metrics['periodo']['fecha_inicio']}")
        output.append(f"   Hasta: {metrics['periodo']['fecha_fin']}")
        
        # Métricas generales
        gen = metrics['generales']
        output.append(f"\n📈 MÉTRICAS GENERALES:")
        output.append(f"   Total de sesiones: {gen['total_sesiones']}")
        output.append(f"   Sesiones completadas: {gen['sesiones_completadas']}")
        output.append(f"   Sesiones activas: {gen['sesiones_activas']}")
        output.append(f"   Tasa de finalización: {gen['tasa_finalizacion']}%")
        
        if gen['tiempo_promedio_minutos']:
            output.append(f"   Tiempo promedio: {gen['tiempo_promedio_minutos']} minutos")
        
        # Por materia
        output.append(f"\n📚 MÉTRICAS POR MATERIA:")
        for materia, stats in metrics['por_materia'].items():
            output.append(f"   {materia}:")
            output.append(f"     Total: {stats['total_sesiones']} | Completadas: {stats['completadas']} | Activas: {stats['activas']}")
            output.append(f"     Tasa finalización: {stats['tasa_finalizacion']:.1f}% | Promedio puntuación: {stats['promedio_puntuacion']}")
        
        # Abandono
        if metrics['abandono']['total_abandonadas'] > 0:
            output.append(f"\n⚠️  ANÁLISIS DE ABANDONO:")
            output.append(f"   Total abandonadas: {metrics['abandono']['total_abandonadas']}")
            if metrics['abandono']['pregunta_critica'] is not None:
                output.append(f"   Pregunta crítica: #{metrics['abandono']['pregunta_critica']} (donde más abandonan)")
            
            output.append(f"   Distribución por pregunta:")
            for pregunta, porcentaje in metrics['abandono']['por_pregunta'].items():
                output.append(f"     {pregunta}: {porcentaje}%")
        
        # Usuarios activos
        if metrics['usuarios_activos']:
            output.append(f"\n👥 TOP USUARIOS ACTIVOS:")
            for i, usuario in enumerate(metrics['usuarios_activos'][:5], 1):
                nombre = f"{usuario['estudiante__first_name']} {usuario['estudiante__last_name']}".strip()
                if not nombre:
                    nombre = usuario['estudiante__username']
                output.append(f"   {i}. {nombre}: {usuario['total_sesiones']} sesiones ({usuario['sesiones_completadas']} completadas)")
        
        output.append(f"\n⏰ Generado: {metrics['timestamp']}")
        
        return "\n".join(output)

    def format_json(self, metrics):
        """Formatea métricas en JSON"""
        return json.dumps(metrics, indent=2, ensure_ascii=False)