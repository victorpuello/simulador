"""
Tests para el sistema de sesiones de simulación

Cubre:
- Constraint de sesión única por materia
- Verificación de sesiones activas
- Creación y finalización de sesiones
- Lógica de reinicio forzado
- Manejo de múltiples sesiones por diferentes materias
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import timedelta

from apps.core.models import Materia, Pregunta, Competencia
from apps.simulacion.models import SesionSimulacion, PreguntaSesion
from apps.simulacion.management.commands.cleanup_stale_sessions import Command as CleanupCommand

Usuario = get_user_model()


class SesionModelTestCase(TestCase):
    """Tests para el modelo SesionSimulacion"""
    
    def setUp(self):
        """Configuración inicial para los tests"""
        self.estudiante = Usuario.objects.create_user(
            username='estudiante_test',
            email='estudiante@test.com',
            password='testpass123',
            rol='estudiante',
            first_name='Test',
            last_name='Student'
        )
        
        self.materia1 = Materia.objects.create(
            nombre='matematicas',
            nombre_display='Matemáticas'
        )
        
        self.materia2 = Materia.objects.create(
            nombre='lectura_critica',
            nombre_display='Lectura Crítica'
        )
        
        self.competencia = Competencia.objects.create(
            nombre='test_competencia',
            materia=self.materia1
        )

    def test_crear_sesion_simple(self):
        """Test básico de creación de sesión"""
        sesion = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia1
        )
        
        self.assertEqual(sesion.estudiante, self.estudiante)
        self.assertEqual(sesion.materia, self.materia1)
        self.assertFalse(sesion.completada)
        self.assertEqual(sesion.puntuacion, 0)
        self.assertIsNotNone(sesion.fecha_inicio)
        self.assertIsNone(sesion.fecha_fin)

    def test_constraint_sesion_unica_por_materia(self):
        """Test del constraint: una sesión activa por materia por estudiante"""
        
        # Crear primera sesión activa
        SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia1
        )
        
        # Intentar crear segunda sesión activa en la misma materia debe fallar
        with self.assertRaises(IntegrityError):
            SesionSimulacion.objects.create(
                estudiante=self.estudiante,
                materia=self.materia1
            )

    def test_multiples_sesiones_diferentes_materias(self):
        """Test: permite múltiples sesiones activas en diferentes materias"""
        
        sesion1 = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia1
        )
        
        sesion2 = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia2
        )
        
        self.assertEqual(sesion1.estudiante, self.estudiante)
        self.assertEqual(sesion2.estudiante, self.estudiante)
        self.assertNotEqual(sesion1.materia, sesion2.materia)
        self.assertFalse(sesion1.completada)
        self.assertFalse(sesion2.completada)

    def test_constraint_no_aplica_sesiones_completadas(self):
        """Test: constraint no aplica a sesiones completadas"""
        
        # Crear y completar primera sesión
        sesion1 = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia1
        )
        sesion1.finalizar()
        
        # Debe permitir crear nueva sesión en la misma materia
        sesion2 = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia1
        )
        
        self.assertTrue(sesion1.completada)
        self.assertFalse(sesion2.completada)

    def test_metodo_get_progreso(self):
        """Test del método get_progreso"""
        sesion = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia1
        )
        
        # Crear preguntas de prueba
        preguntas = []
        for i in range(5):
            pregunta = Pregunta.objects.create(
                enunciado=f'Pregunta {i}',
                opciones={'A': 'Opción A', 'B': 'Opción B', 'C': 'Opción C', 'D': 'Opción D'},
                respuesta_correcta='A',
                materia=self.materia1,
                competencia=self.competencia
            )
            preguntas.append(pregunta)
            
            PreguntaSesion.objects.create(
                sesion=sesion,
                pregunta=pregunta,
                orden=i + 1
            )
        
        # Sin respuestas
        progreso = sesion.get_progreso()
        self.assertEqual(progreso['respondidas'], 0)
        self.assertEqual(progreso['total'], 5)
        self.assertEqual(progreso['porcentaje'], 0)
        
        # Responder 3 preguntas
        for i in range(3):
            pregunta_sesion = PreguntaSesion.objects.get(sesion=sesion, orden=i + 1)
            pregunta_sesion.respuesta_estudiante = 'A'
            pregunta_sesion.save()
        
        progreso = sesion.get_progreso()
        self.assertEqual(progreso['respondidas'], 3)
        self.assertEqual(progreso['total'], 5)
        self.assertEqual(progreso['porcentaje'], 60.0)

    def test_metodo_get_sesion_activa_por_materia(self):
        """Test del método get_sesion_activa_por_materia"""
        
        # Sin sesiones
        sesion = SesionSimulacion.get_sesion_activa_por_materia(
            self.estudiante, self.materia1
        )
        self.assertIsNone(sesion)
        
        # Con sesión activa
        sesion_creada = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia1
        )
        
        sesion_encontrada = SesionSimulacion.get_sesion_activa_por_materia(
            self.estudiante, self.materia1
        )
        self.assertEqual(sesion_encontrada, sesion_creada)
        
        # Completar sesión
        sesion_creada.finalizar()
        
        sesion_encontrada = SesionSimulacion.get_sesion_activa_por_materia(
            self.estudiante, self.materia1
        )
        self.assertIsNone(sesion_encontrada)

    def test_metodo_finalizar(self):
        """Test del método finalizar"""
        sesion = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia1
        )
        
        self.assertFalse(sesion.completada)
        self.assertIsNone(sesion.fecha_fin)
        
        sesion.finalizar()
        
        self.assertTrue(sesion.completada)
        self.assertIsNotNone(sesion.fecha_fin)


class SesionAPITestCase(APITestCase):
    """Tests para las APIs de sesiones"""
    
    def setUp(self):
        """Configuración inicial para los tests de API"""
        self.estudiante = Usuario.objects.create_user(
            username='estudiante_api',
            email='estudiante_api@test.com',
            password='testpass123',
            rol='estudiante'
        )
        
        self.docente = Usuario.objects.create_user(
            username='docente_api',
            email='docente_api@test.com',
            password='testpass123',
            rol='docente'
        )
        
        self.materia1 = Materia.objects.create(
            nombre='matematicas',
            nombre_display='Matemáticas'
        )
        
        self.materia2 = Materia.objects.create(
            nombre='ciencias',
            nombre_display='Ciencias Naturales'
        )

    def test_verificar_sesion_activa_sin_sesiones(self):
        """Test verificar sesión activa cuando no hay sesiones"""
        self.client.force_authenticate(user=self.estudiante)
        
        response = self.client.get('/api/simulacion/sesiones/verificar_sesion_activa/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['tiene_sesiones_activas'])
        self.assertEqual(response.data['count'], 0)

    def test_verificar_sesion_activa_con_sesiones(self):
        """Test verificar sesión activa con sesiones existentes"""
        self.client.force_authenticate(user=self.estudiante)
        
        # Crear sesiones activas
        sesion1 = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia1
        )
        sesion2 = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia2
        )
        
        response = self.client.get('/api/simulacion/sesiones/verificar_sesion_activa/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['tiene_sesiones_activas'])
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(len(response.data['sesiones']), 2)

    def test_verificar_sesion_activa_por_materia_especifica(self):
        """Test verificar sesión activa para materia específica"""
        self.client.force_authenticate(user=self.estudiante)
        
        sesion = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia1
        )
        
        # Verificar materia con sesión activa
        response = self.client.get(
            f'/api/simulacion/sesiones/verificar_sesion_activa/?materia_id={self.materia1.id}'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['tiene_sesion_activa'])
        self.assertEqual(response.data['sesion']['id'], sesion.id)
        
        # Verificar materia sin sesión activa
        response = self.client.get(
            f'/api/simulacion/sesiones/verificar_sesion_activa/?materia_id={self.materia2.id}'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['tiene_sesion_activa'])

    def test_iniciar_sesion_nueva(self):
        """Test iniciar nueva sesión"""
        self.client.force_authenticate(user=self.estudiante)
        
        data = {
            'materia': self.materia1.id,
            'cantidad_preguntas': 10
        }
        
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(SesionSimulacion.objects.filter(
            estudiante=self.estudiante,
            materia=self.materia1,
            completada=False
        ).exists())

    def test_iniciar_sesion_con_sesion_activa_existente(self):
        """Test iniciar sesión cuando ya existe una activa en la misma materia"""
        self.client.force_authenticate(user=self.estudiante)
        
        # Crear sesión activa existente
        SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia1
        )
        
        data = {
            'materia': self.materia1.id,
            'cantidad_preguntas': 10
        }
        
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Ya tienes una sesión activa', response.data['detail'])

    def test_iniciar_sesion_con_forzar_reinicio(self):
        """Test iniciar sesión con forzar_reinicio=True"""
        self.client.force_authenticate(user=self.estudiante)
        
        # Crear sesión activa existente
        sesion_anterior = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia1
        )
        
        data = {
            'materia': self.materia1.id,
            'cantidad_preguntas': 10,
            'forzar_reinicio': True
        }
        
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verificar que la sesión anterior fue eliminada
        self.assertFalse(SesionSimulacion.objects.filter(id=sesion_anterior.id).exists())
        
        # Verificar que hay una nueva sesión
        self.assertTrue(SesionSimulacion.objects.filter(
            estudiante=self.estudiante,
            materia=self.materia1,
            completada=False
        ).exists())

    def test_permisos_solo_estudiantes(self):
        """Test que solo estudiantes pueden acceder a las APIs de sesiones"""
        
        # Docente no debe poder crear sesiones
        self.client.force_authenticate(user=self.docente)
        
        data = {
            'materia': self.materia1.id,
            'cantidad_preguntas': 10
        }
        
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verificar sesión activa también debe estar restringido
        response = self.client.get('/api/simulacion/sesiones/verificar_sesion_activa/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class CleanupCommandTestCase(TestCase):
    """Tests para el comando de limpieza de sesiones"""
    
    def setUp(self):
        """Configuración inicial"""
        self.estudiante = Usuario.objects.create_user(
            username='estudiante_cleanup',
            email='estudiante_cleanup@test.com',
            password='testpass123',
            rol='estudiante'
        )
        
        self.materia = Materia.objects.create(
            nombre='test_materia',
            nombre_display='Test Materia'
        )

    def test_cleanup_sesiones_obsoletas(self):
        """Test limpieza de sesiones obsoletas"""
        
        # Crear sesión antigua (más de 24 horas)
        sesion_antigua = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia
        )
        # Modificar la fecha manualmente para simular antigüedad
        sesion_antigua.fecha_inicio = timezone.now() - timedelta(hours=25)
        sesion_antigua.save()
        
        # Completar la sesión antigua
        sesion_antigua.finalizar()
        
        # Crear nueva sesión activa (ahora que la antigua está completada)
        sesion_nueva = SesionSimulacion.objects.create(
            estudiante=self.estudiante,
            materia=self.materia
        )
        
        # Verificar estado inicial
        self.assertEqual(SesionSimulacion.objects.count(), 2)  # antigua y nueva
        
        # Verificar que la sesión antigua esté completada
        self.assertTrue(sesion_antigua.completada)
        self.assertFalse(sesion_nueva.completada)
        
        # Simular comando de limpieza
        from io import StringIO
        import sys
        
        old_stdout = sys.stdout
        sys.stdout = StringIO()
        
        try:
            command = CleanupCommand()
            # El comando no debería eliminar sesiones completadas, solo activas obsoletas
            command.handle(hours=24, dry_run=False, force=True, verbosity=0)
        finally:
            sys.stdout = old_stdout
        
        # Verificar que las sesiones completadas se mantuvieron
        self.assertTrue(SesionSimulacion.objects.filter(id=sesion_antigua.id).exists())
        
        # La sesión activa nueva debe mantenerse (no es obsoleta)
        self.assertTrue(SesionSimulacion.objects.filter(id=sesion_nueva.id).exists())


class IntegrationTestCase(APITestCase):
    """Tests de integración para flujos completos"""
    
    def setUp(self):
        """Configuración para tests de integración"""
        self.estudiante = Usuario.objects.create_user(
            username='estudiante_integration',
            email='estudiante_integration@test.com',
            password='testpass123',
            rol='estudiante'
        )
        
        self.materia1 = Materia.objects.create(
            nombre='matematicas',
            nombre_display='Matemáticas'
        )
        
        self.materia2 = Materia.objects.create(
            nombre='lectura',
            nombre_display='Lectura Crítica'
        )
        
        self.competencia = Competencia.objects.create(
            nombre='test_competencia',
            materia=self.materia1
        )

    def test_flujo_completo_multiples_materias(self):
        """Test del flujo completo con múltiples materias"""
        self.client.force_authenticate(user=self.estudiante)
        
        # 1. Verificar que no hay sesiones activas
        response = self.client.get('/api/simulacion/sesiones/verificar_sesion_activa/')
        self.assertFalse(response.data['tiene_sesiones_activas'])
        
        # 2. Iniciar sesión en Matemáticas
        data = {'materia': self.materia1.id, 'cantidad_preguntas': 5}
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        sesion_mate_id = response.data['id']
        
        # 3. Iniciar sesión en Lectura Crítica (debe permitir)
        data = {'materia': self.materia2.id, 'cantidad_preguntas': 5}
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        sesion_lectura_id = response.data['id']
        
        # 4. Verificar que hay 2 sesiones activas
        response = self.client.get('/api/simulacion/sesiones/verificar_sesion_activa/')
        self.assertTrue(response.data['tiene_sesiones_activas'])
        self.assertEqual(response.data['count'], 2)
        
        # 5. Intentar crear otra sesión en Matemáticas (debe fallar)
        data = {'materia': self.materia1.id, 'cantidad_preguntas': 5}
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # 6. Forzar reinicio en Matemáticas (debe permitir)
        data = {
            'materia': self.materia1.id, 
            'cantidad_preguntas': 5,
            'forzar_reinicio': True
        }
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        nueva_sesion_mate_id = response.data['id']
        
        # 7. Verificar que la sesión anterior de Matemáticas fue eliminada
        self.assertNotEqual(sesion_mate_id, nueva_sesion_mate_id)
        self.assertFalse(SesionSimulacion.objects.filter(id=sesion_mate_id).exists())
        
        # 8. Verificar que la sesión de Lectura Crítica sigue activa
        self.assertTrue(SesionSimulacion.objects.filter(id=sesion_lectura_id).exists())
        
        # 9. Verificar sesiones por materia específica
        response = self.client.get(
            f'/api/simulacion/sesiones/verificar_sesion_activa/?materia_id={self.materia1.id}'
        )
        self.assertTrue(response.data['tiene_sesion_activa'])
        self.assertEqual(response.data['sesion']['id'], nueva_sesion_mate_id)

    def test_flujo_completar_sesion(self):
        """Test del flujo de completar una sesión"""
        self.client.force_authenticate(user=self.estudiante)
        
        # Crear varias preguntas
        preguntas = []
        for i in range(5):
            pregunta = Pregunta.objects.create(
                enunciado=f'¿Cuánto es 2+{i}?',
                opciones={'A': str(i), 'B': str(i+2), 'C': str(i+3), 'D': str(i+4)},
                respuesta_correcta='B',
                materia=self.materia1,
                competencia=self.competencia
            )
            preguntas.append(pregunta)
        
        # Iniciar sesión
        data = {'materia': self.materia1.id, 'cantidad_preguntas': 5}
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        sesion_id = response.data['id']
        
        # Verificar que hay 5 preguntas en la sesión
        sesion = SesionSimulacion.objects.get(id=sesion_id)
        self.assertEqual(sesion.preguntas_sesion.count(), 5)
        
        # Responder todas las preguntas
        for i in range(5):
            data = {'respuesta': 'B', 'tiempo_respuesta': 30}
            response = self.client.post(
                f'/api/simulacion/sesiones/{sesion_id}/responder_pregunta/',
                data
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que la sesión se completó automáticamente
        sesion.refresh_from_db()
        self.assertTrue(sesion.completada)
        self.assertIsNotNone(sesion.fecha_fin)
        self.assertEqual(sesion.puntuacion, 5)  # Todas las respuestas correctas
        
        # Verificar que ahora se puede crear nueva sesión en la misma materia
        data = {'materia': self.materia1.id, 'cantidad_preguntas': 5}
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)