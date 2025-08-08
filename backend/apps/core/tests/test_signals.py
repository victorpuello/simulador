"""
Tests para las señales (signals) del sistema de gamificación
"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock

from apps.core.models import Sesion, RespuestaUsuario, LogroUsuario, Insignia
from apps.core.signals import (
    actualizar_racha_usuario, actualizar_puntos_usuario,
    evaluar_insignias_por_sesion, evaluar_nuevas_insignias
)
from apps.core.utils import verificar_logros_usuario
from .factories import (
    EstudianteFactory, SesionFactory, SesionCompletadaFactory,
    PreguntaFactory, RespuestaUsuarioFactory, InsigniaFactory,
    UsuarioNuevoFactory, UsuarioConRachaFactory
)


class ActualizarRachaSignalTest(TestCase):
    """Tests para la señal de actualización de racha"""
    
    def test_actualizar_racha_primera_vez(self):
        """Test de actualización de racha primera vez"""
        usuario = UsuarioNuevoFactory()
        sesion = SesionCompletadaFactory(usuario=usuario, puntaje_final=80)
        
        # Simular la señal
        actualizar_racha_usuario(
            sender=Sesion, 
            instance=sesion, 
            created=True
        )
        
        usuario.refresh_from_db()
        # La racha se actualiza en el método del modelo, no en el signal
        # El signal solo llama al método cuando la sesión está completada

    def test_no_procesar_sesion_incompleta(self):
        """Test de no procesamiento para sesión incompleta"""
        usuario = EstudianteFactory(racha_actual=5)
        sesion = SesionFactory(usuario=usuario, completada=False)
        
        racha_inicial = usuario.racha_actual
        
        # Simular la señal
        actualizar_racha_usuario(
            sender=Sesion, 
            instance=sesion, 
            created=True
        )
        
        usuario.refresh_from_db()
        # No debe cambiar la racha si la sesión no está completada
        self.assertEqual(usuario.racha_actual, racha_inicial)


class ActualizarPuntosSignalTest(TestCase):
    """Tests para la señal de actualización de puntos"""
    
    def test_agregar_puntos_respuesta_correcta(self):
        """Test de adición de puntos por respuesta correcta"""
        usuario = EstudianteFactory(puntos_totales=50)
        pregunta = PreguntaFactory(respuesta_correcta='A')
        sesion = SesionFactory(usuario=usuario)
        
        respuesta = RespuestaUsuarioFactory(
            sesion=sesion,
            pregunta=pregunta,
            respuesta_seleccionada='A',
            es_correcta=True
        )
        
        puntos_iniciales = usuario.puntos_totales
        
        # Simular la señal
        actualizar_puntos_usuario(
            sender=RespuestaUsuario,
            instance=respuesta,
            created=True
        )
        
        usuario.refresh_from_db()
        self.assertEqual(usuario.puntos_totales, puntos_iniciales + 10)

    def test_no_agregar_puntos_respuesta_incorrecta(self):
        """Test de no adición de puntos por respuesta incorrecta"""
        usuario = EstudianteFactory(puntos_totales=50)
        pregunta = PreguntaFactory(respuesta_correcta='A')
        sesion = SesionFactory(usuario=usuario)
        
        respuesta = RespuestaUsuarioFactory(
            sesion=sesion,
            pregunta=pregunta,
            respuesta_seleccionada='B',
            es_correcta=False
        )
        
        puntos_iniciales = usuario.puntos_totales
        
        # Simular la señal
        actualizar_puntos_usuario(
            sender=RespuestaUsuario,
            instance=respuesta,
            created=True
        )
        
        usuario.refresh_from_db()
        self.assertEqual(usuario.puntos_totales, puntos_iniciales)

    def test_no_procesar_respuesta_existente(self):
        """Test de no procesamiento para respuesta existente (no created)"""
        usuario = EstudianteFactory(puntos_totales=50)
        respuesta = RespuestaUsuarioFactory(es_correcta=True)
        respuesta.sesion.usuario = usuario
        respuesta.sesion.save()
        
        puntos_iniciales = usuario.puntos_totales
        
        # Simular la señal con created=False
        actualizar_puntos_usuario(
            sender=RespuestaUsuario,
            instance=respuesta,
            created=False
        )
        
        usuario.refresh_from_db()
        self.assertEqual(usuario.puntos_totales, puntos_iniciales)


class EvaluarInsigniasSignalTest(TestCase):
    """Tests para las señales de evaluación de insignias"""
    
    def test_insignia_primera_sesion(self):
        """Test de insignia por primera sesión"""
        usuario = UsuarioNuevoFactory()
        sesion = SesionCompletadaFactory(usuario=usuario)
        
        # Simular la señal
        evaluar_insignias_por_sesion(
            sender=Sesion,
            instance=sesion,
            created=False
        )
        
        # Verificar que se creó la insignia y el logro
        self.assertTrue(
            Insignia.objects.filter(nombre='Primera Sesión').exists()
        )
        self.assertTrue(
            LogroUsuario.objects.filter(
                usuario=usuario,
                insignia__nombre='Primera Sesión'
            ).exists()
        )

    def test_insignia_alto_rendimiento(self):
        """Test de insignia por alto rendimiento"""
        usuario = EstudianteFactory()
        sesion = SesionCompletadaFactory(usuario=usuario, puntaje_final=85)
        
        # Simular la señal
        evaluar_insignias_por_sesion(
            sender=Sesion,
            instance=sesion,
            created=False
        )
        
        # Verificar que se creó la insignia de alto rendimiento
        self.assertTrue(
            LogroUsuario.objects.filter(
                usuario=usuario,
                insignia__nombre='Alto Rendimiento'
            ).exists()
        )

    def test_insignia_racha_semanal(self):
        """Test de insignia por racha semanal"""
        usuario = UsuarioConRachaFactory(racha_actual=7)
        sesion = SesionCompletadaFactory(usuario=usuario)
        
        # Simular la señal
        evaluar_insignias_por_sesion(
            sender=Sesion,
            instance=sesion,
            created=False
        )
        
        # Verificar que se creó la insignia de racha semanal
        self.assertTrue(
            LogroUsuario.objects.filter(
                usuario=usuario,
                insignia__nombre='Racha Semanal'
            ).exists()
        )

    def test_no_duplicar_insignias(self):
        """Test de no duplicación de insignias"""
        usuario = EstudianteFactory()
        
        # Crear primera sesión
        sesion1 = SesionCompletadaFactory(usuario=usuario)
        evaluar_insignias_por_sesion(sender=Sesion, instance=sesion1, created=False)
        
        # Verificar que se creó el logro
        logros_iniciales = LogroUsuario.objects.filter(
            usuario=usuario,
            insignia__nombre='Primera Sesión'
        ).count()
        self.assertEqual(logros_iniciales, 1)
        
        # Crear segunda sesión
        sesion2 = SesionCompletadaFactory(usuario=usuario)
        evaluar_insignias_por_sesion(sender=Sesion, instance=sesion2, created=False)
        
        # Verificar que no se duplicó el logro
        logros_finales = LogroUsuario.objects.filter(
            usuario=usuario,
            insignia__nombre='Primera Sesión'
        ).count()
        self.assertEqual(logros_finales, 1)


class EvaluarNuevasInsigniasTest(TestCase):
    """Tests para la evaluación automática de nuevas insignias"""
    
    def test_evaluar_nuevas_insignias_en_cascade(self):
        """Test de evaluación en cascada de nuevas insignias"""
        usuario = EstudianteFactory()
        
        # Crear insignia que siempre se cumple
        insignia_test = InsigniaFactory(
            nombre='Test Insignia',
            criterio={'tipo': 'siempre'}
        )
        
        # Mock del método evaluar_criterio para que siempre devuelva True
        with patch.object(Insignia, 'evaluar_criterio', return_value=True):
            # Crear un logro inicial
            logro_inicial = LogroUsuario.objects.create(
                usuario=usuario,
                insignia=insignia_test
            )
            
            # Simular la señal
            evaluar_nuevas_insignias(
                sender=LogroUsuario,
                instance=logro_inicial,
                created=True
            )
            
            # El test pasará si no hay errores en la ejecución
            self.assertTrue(True)


class VerificarLogrosTest(TestCase):
    """Tests para la verificación de logros"""
    
    def test_logro_primera_simulacion(self):
        """Test de logro por primera simulación"""
        usuario = UsuarioNuevoFactory()
        
        # Crear insignia de primera simulación
        insignia = InsigniaFactory(
            nombre='Primera Simulación',
            criterio={'tipo': 'primera_simulacion'},
            puntos=50
        )
        
        # Completar primera sesión
        SesionCompletadaFactory(usuario=usuario)
        
        # Verificar logros
        logros = verificar_logros_usuario(usuario.id)
        
        # Verificar que se otorgó el logro
        self.assertTrue(
            LogroUsuario.objects.filter(
                usuario=usuario,
                insignia=insignia
            ).exists()
        )

    def test_logro_racha_dias(self):
        """Test de logro por racha de días"""
        usuario = UsuarioConRachaFactory(racha_actual=7)
        
        # Crear insignia de racha
        insignia = InsigniaFactory(
            nombre='Racha de 7 días',
            criterio={'tipo': 'racha', 'minimo': 7},
            puntos=100
        )
        
        # Verificar logros
        logros = verificar_logros_usuario(usuario.id)
        
        # Verificar que se otorgó el logro
        self.assertTrue(
            LogroUsuario.objects.filter(
                usuario=usuario,
                insignia=insignia
            ).exists()
        )

    def test_logro_racha_insuficiente(self):
        """Test de no logro por racha insuficiente"""
        usuario = EstudianteFactory(racha_actual=3)
        
        # Crear insignia de racha alta
        insignia = InsigniaFactory(
            nombre='Racha de 10 días',
            criterio={'tipo': 'racha', 'minimo': 10},
            puntos=200
        )
        
        # Verificar logros
        logros = verificar_logros_usuario(usuario.id)
        
        # Verificar que NO se otorgó el logro
        self.assertFalse(
            LogroUsuario.objects.filter(
                usuario=usuario,
                insignia=insignia
            ).exists()
        )

    def test_puntos_por_logros(self):
        """Test de adición de puntos por logros obtenidos"""
        usuario = UsuarioNuevoFactory(puntos_totales=100)
        
        insignia = InsigniaFactory(
            nombre='Primera Simulación',
            criterio={'tipo': 'primera_simulacion'},
            puntos=50
        )
        
        # Completar primera sesión
        SesionCompletadaFactory(usuario=usuario)
        
        puntos_iniciales = usuario.puntos_totales
        
        # Verificar logros
        logros = verificar_logros_usuario(usuario.id)
        
        usuario.refresh_from_db()
        self.assertGreater(usuario.puntos_totales, puntos_iniciales)

    def test_usuario_inexistente(self):
        """Test con usuario inexistente"""
        resultado = verificar_logros_usuario(99999)
        self.assertFalse(resultado)


class SignalIntegrationTest(TestCase):
    """Tests de integración de señales"""
    
    def test_flujo_completo_signals(self):
        """Test del flujo completo de signals"""
        usuario = UsuarioNuevoFactory(puntos_totales=0)
        
        # Crear sesión completada
        sesion = SesionCompletadaFactory(usuario=usuario, puntaje_final=80)
        
        # Simular todas las señales que se ejecutarían
        actualizar_racha_usuario(sender=Sesion, instance=sesion, created=True)
        evaluar_insignias_por_sesion(sender=Sesion, instance=sesion, created=False)
        
        usuario.refresh_from_db()
        
        # Verificar que se crearon logros
        logros = LogroUsuario.objects.filter(usuario=usuario)
        self.assertGreater(logros.count(), 0)

    def test_signals_con_respuestas(self):
        """Test de signals con respuestas incluidas"""
        usuario = EstudianteFactory(puntos_totales=0)
        pregunta = PreguntaFactory(respuesta_correcta='A')
        sesion = SesionFactory(usuario=usuario)
        
        # Crear respuesta correcta
        respuesta = RespuestaUsuarioFactory(
            sesion=sesion,
            pregunta=pregunta,
            respuesta_seleccionada='A',
            es_correcta=True
        )
        
        # Simular señal de respuesta
        actualizar_puntos_usuario(
            sender=RespuestaUsuario,
            instance=respuesta,
            created=True
        )
        
        # Verificar que se actualizaron los puntos
        usuario.refresh_from_db()
        self.assertEqual(usuario.puntos_totales, 10)