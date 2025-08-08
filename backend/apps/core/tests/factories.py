"""
Factory Boy factories para testing
"""
import factory
from django.contrib.auth import get_user_model
from faker import Faker

from apps.core.models import (
    Materia, Competencia, Pregunta, Sesion, RespuestaUsuario,
    Clase, Asignacion, Insignia, LogroUsuario
)

fake = Faker('es_ES')  # Faker en español para datos más realistas
Usuario = get_user_model()


class UsuarioFactory(factory.django.DjangoModelFactory):
    """Factory para crear usuarios de prueba"""
    
    class Meta:
        model = Usuario
        skip_postgeneration_save = True
    
    username = factory.Sequence(lambda n: f"usuario{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@test.com")
    first_name = factory.Faker('first_name', locale='es_ES')
    last_name = factory.Faker('last_name', locale='es_ES')
    rol = 'estudiante'
    racha_actual = factory.Faker('random_int', min=0, max=30)
    puntos_totales = factory.Faker('random_int', min=0, max=5000)
    configuracion = factory.Dict({
        'tema': 'claro',
        'notificaciones': True,
        'sonido': True
    })
    
    @factory.post_generation
    def password(obj, create, extracted, **kwargs):
        if not create:
            return
        password = extracted or 'testpass123'
        obj.set_password(password)
        obj.save()


class EstudianteFactory(UsuarioFactory):
    """Factory específico para estudiantes"""
    rol = 'estudiante'


class DocenteFactory(UsuarioFactory):
    """Factory específico para docentes"""
    rol = 'docente'


class AdminFactory(UsuarioFactory):
    """Factory específico para administradores"""
    rol = 'admin'


class MateriaFactory(factory.django.DjangoModelFactory):
    """Factory para materias"""
    
    class Meta:
        model = Materia
        django_get_or_create = ('nombre',)
    
    nombre = factory.Iterator([
        'matematicas',
        'lectura_critica', 
        'ciencias_naturales',
        'sociales_ciudadanas',
        'ingles'
    ])
    nombre_display = factory.LazyAttribute(lambda obj: {
        'matematicas': 'Matemáticas',
        'lectura_critica': 'Lectura Crítica',
        'ciencias_naturales': 'Ciencias Naturales', 
        'sociales_ciudadanas': 'Sociales y Ciudadanas',
        'ingles': 'Inglés'
    }.get(obj.nombre, obj.nombre.title()))
    
    color = factory.Iterator([
        '#4F46E5', '#DC2626', '#059669', '#7C3AED', '#EA580C'
    ])
    icono = factory.Iterator([
        'calculator', 'book', 'flask', 'globe', 'language'
    ])
    descripcion = factory.Faker('text', max_nb_chars=200, locale='es_ES')
    activa = True


class CompetenciaFactory(factory.django.DjangoModelFactory):
    """Factory para competencias"""
    
    class Meta:
        model = Competencia
    
    materia = factory.SubFactory(MateriaFactory)
    nombre = factory.Faker('sentence', nb_words=3, locale='es_ES')
    descripcion = factory.Faker('text', max_nb_chars=300, locale='es_ES')
    peso_icfes = factory.Faker('pydecimal', left_digits=1, right_digits=2, positive=True, max_value=1)


class PreguntaFactory(factory.django.DjangoModelFactory):
    """Factory para preguntas"""
    
    class Meta:
        model = Pregunta
    
    materia = factory.SubFactory(MateriaFactory)
    competencia = factory.SubFactory(CompetenciaFactory)
    enunciado = factory.Faker('sentence', nb_words=10, locale='es_ES')
    opciones = factory.Dict({
        'A': factory.Faker('sentence', nb_words=5, locale='es_ES'),
        'B': factory.Faker('sentence', nb_words=5, locale='es_ES'),
        'C': factory.Faker('sentence', nb_words=5, locale='es_ES'),
        'D': factory.Faker('sentence', nb_words=5, locale='es_ES'),
    })
    respuesta_correcta = factory.Iterator(['A', 'B', 'C', 'D'])
    retroalimentacion = factory.Faker('text', max_nb_chars=300, locale='es_ES')
    dificultad = factory.Iterator(['facil', 'media', 'dificil'])
    tiempo_estimado = factory.Faker('random_int', min=30, max=180)
    activa = True


class SesionFactory(factory.django.DjangoModelFactory):
    """Factory para sesiones"""
    
    class Meta:
        model = Sesion
    
    usuario = factory.SubFactory(EstudianteFactory)
    materia = factory.SubFactory(MateriaFactory)
    modo = factory.Iterator(['practica', 'simulacro', 'asignada'])
    completada = False
    puntaje_final = None
    tiempo_total = None


class SesionCompletadaFactory(SesionFactory):
    """Factory para sesiones completadas"""
    completada = True
    puntaje_final = factory.Faker('random_int', min=0, max=100)
    tiempo_total = factory.Faker('random_int', min=300, max=3600)  # 5min - 1h
    fecha_fin = factory.Faker('date_time_this_month')


class RespuestaUsuarioFactory(factory.django.DjangoModelFactory):
    """Factory para respuestas de usuario"""
    
    class Meta:
        model = RespuestaUsuario
    
    sesion = factory.SubFactory(SesionFactory)
    pregunta = factory.SubFactory(PreguntaFactory)
    respuesta_seleccionada = factory.Iterator(['A', 'B', 'C', 'D'])
    tiempo_respuesta = factory.Faker('random_int', min=10, max=300)
    revisada = False
    
    es_correcta = factory.LazyAttribute(lambda obj: obj.respuesta_seleccionada == obj.pregunta.respuesta_correcta)


class ClaseFactory(factory.django.DjangoModelFactory):
    """Factory para clases"""
    
    class Meta:
        model = Clase
    
    nombre = factory.Faker('sentence', nb_words=3, locale='es_ES')
    docente = factory.SubFactory(DocenteFactory)
    codigo_inscripcion = factory.Faker('lexify', text='????????', letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
    activa = True
    configuracion = factory.Dict({
        'duracion_simulacro': 120,
        'intentos_maximos': 3,
        'mostrar_resultados': True
    })
    
    @factory.post_generation
    def estudiantes(self, create, extracted, **kwargs):
        if not create:
            return
        
        if extracted:
            for estudiante in extracted:
                self.estudiantes.add(estudiante)
        else:
            # Crear 3-5 estudiantes por defecto
            estudiantes = EstudianteFactory.create_batch(
                factory.Faker('random_int', min=3, max=5).evaluate(None, None, {'locale': None})
            )
            for estudiante in estudiantes:
                self.estudiantes.add(estudiante)


class AsignacionFactory(factory.django.DjangoModelFactory):
    """Factory para asignaciones"""
    
    class Meta:
        model = Asignacion
    
    clase = factory.SubFactory(ClaseFactory)
    materia = factory.SubFactory(MateriaFactory)
    titulo = factory.Faker('sentence', nb_words=4, locale='es_ES')
    descripcion = factory.Faker('text', max_nb_chars=300, locale='es_ES')
    cantidad_preguntas = factory.Faker('random_int', min=5, max=20)
    tiempo_limite = factory.Faker('random_int', min=30, max=120)  # minutos
    fecha_limite = factory.Faker('future_datetime', end_date='+30d')
    activa = True


class InsigniaFactory(factory.django.DjangoModelFactory):
    """Factory para insignias"""
    
    class Meta:
        model = Insignia
    
    nombre = factory.Iterator([
        'Primera Simulación',
        'Racha de 3 días',
        'Racha de 7 días',
        'Matemático Expert',
        'Lector Crítico',
        'Científico',
        'Historiador',
        'Políglota'
    ])
    descripcion = factory.Faker('text', max_nb_chars=200, locale='es_ES')
    icono = factory.Iterator([
        'trophy', 'fire', 'star', 'calculator', 'book', 'flask', 'scroll', 'language'
    ])
    color = factory.Iterator([
        '#FFD700', '#FF6B35', '#4F46E5', '#DC2626', '#059669', '#7C3AED', '#EA580C'
    ])
    criterio = factory.Dict({
        'tipo': factory.Iterator(['primera_simulacion', 'racha', 'porcentaje_materia']),
        'minimo': factory.Faker('random_int', min=1, max=10)
    })
    puntos = factory.Faker('random_int', min=50, max=500)
    rara = factory.Faker('boolean', chance_of_getting_true=20)


class LogroUsuarioFactory(factory.django.DjangoModelFactory):
    """Factory para logros de usuario"""
    
    class Meta:
        model = LogroUsuario
    
    usuario = factory.SubFactory(EstudianteFactory)
    insignia = factory.SubFactory(InsigniaFactory)
    contexto = factory.Dict({
        'sesion_id': factory.Faker('random_int', min=1, max=1000),
        'puntaje': factory.Faker('random_int', min=60, max=100),
        'racha': factory.Faker('random_int', min=1, max=30)
    })


# Factories para casos específicos de testing

class PreguntaMatemáticasFactory(PreguntaFactory):
    """Factory específico para preguntas de matemáticas"""
    materia = factory.SubFactory(MateriaFactory, nombre='matematicas')
    enunciado = factory.Iterator([
        '¿Cuál es el resultado de 2 + 2?',
        '¿Cuánto es 5 × 3?',
        '¿Cuál es la raíz cuadrada de 16?',
        'Si x + 3 = 7, ¿cuánto vale x?',
        '¿Cuál es el 20% de 100?'
    ])
    opciones = factory.Dict({
        'A': '3',
        'B': '4', 
        'C': '5',
        'D': '6'
    })
    respuesta_correcta = 'B'


class PreguntaLecturaFactory(PreguntaFactory):
    """Factory específico para preguntas de lectura crítica"""
    materia = factory.SubFactory(MateriaFactory, nombre='lectura_critica')
    contexto = factory.Faker('text', max_nb_chars=400, locale='es_ES')
    enunciado = 'Según el texto anterior, ¿cuál es la idea principal?'


class UsuarioConRachaFactory(EstudianteFactory):
    """Factory para usuario con racha alta"""
    racha_actual = factory.Faker('random_int', min=7, max=30)
    puntos_totales = factory.Faker('random_int', min=1000, max=10000)
    ultima_practica = factory.Faker('date_time_this_week')


class UsuarioNuevoFactory(EstudianteFactory):
    """Factory para usuario nuevo"""
    racha_actual = 0
    puntos_totales = 0
    ultima_practica = None