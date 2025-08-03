from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.core.models import Materia, Competencia, Pregunta, Insignia
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'Pobla la base de datos con datos iniciales para el simulador'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando población de datos...')
        
        # Crear materias
        materias_data = [
            {
                'nombre': 'matematicas',
                'nombre_display': 'Matemáticas',
                'color': '#6366f1',
                'icono': 'calculator',
                'descripcion': 'Álgebra, geometría, trigonometría y cálculo'
            },
            {
                'nombre': 'lenguaje',
                'nombre_display': 'Lenguaje',
                'color': '#8b5cf6',
                'icono': 'book-open',
                'descripcion': 'Comprensión lectora, gramática y literatura'
            },
            {
                'nombre': 'ciencias',
                'nombre_display': 'Ciencias Naturales',
                'color': '#10b981',
                'icono': 'flask',
                'descripcion': 'Física, química y biología'
            },
            {
                'nombre': 'sociales',
                'nombre_display': 'Ciencias Sociales',
                'color': '#f59e0b',
                'icono': 'globe',
                'descripcion': 'Historia, geografía y filosofía'
            },
            {
                'nombre': 'ingles',
                'nombre_display': 'Inglés',
                'color': '#ef4444',
                'icono': 'flag',
                'descripcion': 'Comprensión y uso del idioma inglés'
            }
        ]
        
        for materia_data in materias_data:
            materia, created = Materia.objects.get_or_create(
                nombre=materia_data['nombre'],
                defaults=materia_data
            )
            if created:
                self.stdout.write(f'✓ Materia creada: {materia.nombre_display}')
            else:
                self.stdout.write(f'✓ Materia existente: {materia.nombre_display}')
        
        # Crear competencias para cada materia
        competencias_data = {
            'matematicas': [
                {'nombre': 'Álgebra', 'descripcion': 'Ecuaciones, inecuaciones y sistemas'},
                {'nombre': 'Geometría', 'descripcion': 'Áreas, perímetros y volúmenes'},
                {'nombre': 'Trigonometría', 'descripcion': 'Funciones trigonométricas'},
                {'nombre': 'Estadística', 'descripcion': 'Probabilidad y análisis de datos'}
            ],
            'lenguaje': [
                {'nombre': 'Comprensión Lectora', 'descripcion': 'Análisis e interpretación de textos'},
                {'nombre': 'Gramática', 'descripcion': 'Estructura y uso del lenguaje'},
                {'nombre': 'Literatura', 'descripcion': 'Géneros literarios y análisis de obras'}
            ],
            'ciencias': [
                {'nombre': 'Física', 'descripcion': 'Mecánica, termodinámica y electromagnetismo'},
                {'nombre': 'Química', 'descripcion': 'Reacciones químicas y estructura de la materia'},
                {'nombre': 'Biología', 'descripcion': 'Sistemas biológicos y evolución'}
            ],
            'sociales': [
                {'nombre': 'Historia', 'descripcion': 'Historia de Colombia y del mundo'},
                {'nombre': 'Geografía', 'descripcion': 'Geografía física y humana'},
                {'nombre': 'Filosofía', 'descripcion': 'Pensamiento filosófico y ética'}
            ],
            'ingles': [
                {'nombre': 'Comprensión Escrita', 'descripcion': 'Reading comprehension'},
                {'nombre': 'Gramática Inglesa', 'descripcion': 'English grammar and structure'},
                {'nombre': 'Vocabulario', 'descripcion': 'English vocabulary and expressions'}
            ]
        }
        
        for materia_nombre, competencias in competencias_data.items():
            materia = Materia.objects.get(nombre=materia_nombre)
            for comp_data in competencias:
                competencia, created = Competencia.objects.get_or_create(
                    materia=materia,
                    nombre=comp_data['nombre'],
                    defaults=comp_data
                )
                if created:
                    self.stdout.write(f'✓ Competencia creada: {competencia.nombre}')
        
        # Crear preguntas de ejemplo
        preguntas_ejemplo = [
            {
                'materia': 'matematicas',
                'competencia': 'Álgebra',
                'enunciado': 'Si x + 2y = 8 y 2x - y = 1, ¿cuál es el valor de x?',
                'opciones': {'A': '2', 'B': '3', 'C': '4', 'D': '5'},
                'respuesta_correcta': 'B',
                'retroalimentacion': 'Correcto. Al resolver el sistema de ecuaciones, x = 3.',
                'dificultad': 'media'
            },
            {
                'materia': 'lenguaje',
                'competencia': 'Comprensión Lectora',
                'enunciado': '¿Cuál es la idea principal del siguiente texto? "La tecnología ha transformado la forma en que nos comunicamos..."',
                'opciones': {'A': 'La tecnología es mala', 'B': 'La comunicación ha cambiado', 'C': 'Internet es lento', 'D': 'Los teléfonos son caros'},
                'respuesta_correcta': 'B',
                'retroalimentacion': 'Correcto. El texto enfatiza cómo la tecnología ha cambiado la comunicación.',
                'dificultad': 'facil'
            }
        ]
        
        for pregunta_data in preguntas_ejemplo:
            materia = Materia.objects.get(nombre=pregunta_data['materia'])
            competencia = Competencia.objects.get(
                materia=materia,
                nombre=pregunta_data['competencia']
            )
            
            pregunta, created = Pregunta.objects.get_or_create(
                materia=materia,
                competencia=competencia,
                enunciado=pregunta_data['enunciado'],
                defaults={
                    'opciones': pregunta_data['opciones'],
                    'respuesta_correcta': pregunta_data['respuesta_correcta'],
                    'retroalimentacion': pregunta_data['retroalimentacion'],
                    'dificultad': pregunta_data['dificultad']
                }
            )
            if created:
                self.stdout.write(f'✓ Pregunta creada: {pregunta.enunciado[:50]}...')
        
        # Crear insignias básicas
        insignias_data = [
            {
                'nombre': 'Primera Sesión',
                'descripcion': 'Completaste tu primera sesión de práctica',
                'icono': 'star',
                'color': '#10b981',
                'criterio': {'tipo': 'primera_sesion'},
                'puntos': 50
            },
            {
                'nombre': 'Alto Rendimiento',
                'descripcion': 'Obtuviste un puntaje de 80% o más',
                'icono': 'trophy',
                'color': '#f59e0b',
                'criterio': {'tipo': 'puntaje_alto', 'minimo': 80},
                'puntos': 100
            },
            {
                'nombre': 'Racha Semanal',
                'descripcion': 'Practicaste 7 días seguidos',
                'icono': 'fire',
                'color': '#ef4444',
                'criterio': {'tipo': 'racha', 'dias': 7},
                'puntos': 200
            },
            {
                'nombre': 'Estudiante Dedicado',
                'descripcion': 'Completaste 10 sesiones',
                'icono': 'graduation-cap',
                'color': '#6366f1',
                'criterio': {'tipo': 'sesiones_completadas', 'cantidad': 10},
                'puntos': 150
            }
        ]
        
        for insignia_data in insignias_data:
            insignia, created = Insignia.objects.get_or_create(
                nombre=insignia_data['nombre'],
                defaults=insignia_data
            )
            if created:
                self.stdout.write(f'✓ Insignia creada: {insignia.nombre}')
        
        self.stdout.write(
            self.style.SUCCESS('¡Datos poblados exitosamente!')
        ) 