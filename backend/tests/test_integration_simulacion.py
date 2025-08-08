"""
Tests de integración para el flujo completo de simulación
"""
import pytest
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.core.models import Sesion, RespuestaUsuario, LogroUsuario
from apps.core.tests.factories import (
    EstudianteFactory, MateriaFactory, CompetenciaFactory, 
    PreguntaFactory, InsigniaFactory
)

Usuario = get_user_model()


@pytest.mark.integration
class SimulacionIntegrationTest(TransactionTestCase):
    """Tests de integración para el sistema de simulación"""
    
    def setUp(self):
        self.client = APIClient()
        self.estudiante = EstudianteFactory()
        self.estudiante.set_password('testpass')
        self.estudiante.save()
        
        # Login
        response = self.client.post('/api/auth/login/', {
            'username': self.estudiante.username,
            'password': 'testpass'
        })
        
        self.access_token = response.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        # Crear materia y preguntas
        self.materia = MateriaFactory()
        self.competencia = CompetenciaFactory(materia=self.materia)
        self.preguntas = PreguntaFactory.create_batch(10, 
                                                     materia=self.materia,
                                                     competencia=self.competencia)

    def test_flujo_completo_simulacion(self):
        """Test del flujo completo de una simulación"""
        
        # 1. Verificar que no hay sesiones activas
        response = self.client.get('/api/simulacion/sesiones/verificar_sesion_activa/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['tiene_sesiones_activas'])
        
        # 2. Iniciar nueva sesión
        data = {
            'materia': self.materia.id,
            'cantidad_preguntas': 5
        }
        
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        sesion_id = response.data['id']
        self.assertIsNotNone(sesion_id)
        
        # 3. Verificar que la sesión se creó correctamente
        sesion = Sesion.objects.get(id=sesion_id)
        self.assertEqual(sesion.usuario, self.estudiante)
        self.assertEqual(sesion.materia, self.materia)
        self.assertFalse(sesion.completada)
        
        # 4. Obtener preguntas de la sesión
        response = self.client.get(f'/api/simulacion/preguntas-sesion/{sesion_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)
        
        preguntas_sesion = response.data
        
        # 5. Responder todas las preguntas
        respuestas_correctas = 0
        for i, pregunta_data in enumerate(preguntas_sesion):
            respuesta_data = {
                'respuesta': 'A',  # Siempre responder A
                'tiempo_respuesta': 30 + (i * 5)  # Tiempo variable
            }
            
            response = self.client.post(
                f'/api/simulacion/sesiones/{sesion_id}/responder_pregunta/',
                respuesta_data
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verificar si la respuesta fue correcta
            pregunta_id = pregunta_data['id']
            pregunta = next(p for p in self.preguntas if p.id == pregunta_id)
            if pregunta.respuesta_correcta == 'A':
                respuestas_correctas += 1
        
        # 6. Verificar que la sesión se completó automáticamente
        sesion.refresh_from_db()
        self.assertTrue(sesion.completada)
        self.assertIsNotNone(sesion.fecha_fin)
        self.assertEqual(sesion.puntaje_final, respuestas_correctas)
        
        # 7. Verificar respuestas en base de datos
        respuestas = RespuestaUsuario.objects.filter(sesion=sesion)
        self.assertEqual(respuestas.count(), 5)
        
        # 8. Verificar actualización de gamificación
        self.estudiante.refresh_from_db()
        self.assertGreater(self.estudiante.puntos_totales, 0)
        
        # 9. Verificar que ahora se puede crear nueva sesión
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_flujo_simulacion_con_forzar_reinicio(self):
        """Test de reinicio forzado de simulación"""
        
        # Crear sesión activa
        data = {
            'materia': self.materia.id,
            'cantidad_preguntas': 3
        }
        
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        sesion_anterior_id = response.data['id']
        
        # Intentar crear otra sesión sin forzar reinicio
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Crear nueva sesión forzando reinicio
        data['forzar_reinicio'] = True
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        nueva_sesion_id = response.data['id']
        self.assertNotEqual(sesion_anterior_id, nueva_sesion_id)
        
        # Verificar que la sesión anterior fue eliminada
        self.assertFalse(Sesion.objects.filter(id=sesion_anterior_id).exists())

    def test_flujo_multiples_materias_simultaneas(self):
        """Test de simulaciones simultáneas en diferentes materias"""
        
        # Crear segunda materia
        materia2 = MateriaFactory()
        competencia2 = CompetenciaFactory(materia=materia2)
        PreguntaFactory.create_batch(5, materia=materia2, competencia=competencia2)
        
        # Iniciar sesión en primera materia
        data1 = {
            'materia': self.materia.id,
            'cantidad_preguntas': 3
        }
        response1 = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data1)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        sesion1_id = response1.data['id']
        
        # Iniciar sesión en segunda materia (debe permitir)
        data2 = {
            'materia': materia2.id,
            'cantidad_preguntas': 3
        }
        response2 = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data2)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        sesion2_id = response2.data['id']
        
        # Verificar que ambas sesiones están activas
        response = self.client.get('/api/simulacion/sesiones/verificar_sesion_activa/')
        self.assertTrue(response.data['tiene_sesiones_activas'])
        self.assertEqual(response.data['count'], 2)

    def test_flujo_gamificacion_primera_simulacion(self):
        """Test de gamificación para primera simulación"""
        
        # Crear insignia de primera simulación
        insignia = InsigniaFactory(
            nombre='Primera Simulación',
            criterio={'tipo': 'primera_simulacion'},
            puntos=50
        )
        
        # Verificar estado inicial
        self.assertEqual(LogroUsuario.objects.filter(usuario=self.estudiante).count(), 0)
        puntos_iniciales = self.estudiante.puntos_totales
        
        # Completar primera simulación
        self._completar_simulacion_basica()
        
        # Verificar logro obtenido
        logro = LogroUsuario.objects.filter(
            usuario=self.estudiante,
            insignia=insignia
        ).first()
        
        self.assertIsNotNone(logro)
        
        # Verificar puntos otorgados
        self.estudiante.refresh_from_db()
        self.assertGreater(self.estudiante.puntos_totales, puntos_iniciales)

    def test_flujo_racha_consecutiva(self):
        """Test de gamificación por racha consecutiva"""
        
        # Crear insignia de racha
        insignia_racha = InsigniaFactory(
            nombre='Racha de 3 días',
            criterio={'tipo': 'racha', 'minimo': 3},
            puntos=100
        )
        
        # Simular 3 días de práctica consecutiva
        from datetime import timedelta
        from django.utils import timezone
        from unittest.mock import patch
        
        for dia in range(3):
            fecha_simulada = timezone.now() - timedelta(days=2-dia)
            
            with patch('django.utils.timezone.now', return_value=fecha_simulada):
                self._completar_simulacion_basica()
        
        # Verificar racha actualizada
        self.estudiante.refresh_from_db()
        self.assertEqual(self.estudiante.racha_actual, 3)
        
        # Verificar logro de racha
        logro_racha = LogroUsuario.objects.filter(
            usuario=self.estudiante,
            insignia=insignia_racha
        ).first()
        
        self.assertIsNotNone(logro_racha)

    def test_flujo_progreso_sesion(self):
        """Test de tracking de progreso en sesión"""
        
        # Iniciar sesión
        data = {
            'materia': self.materia.id,
            'cantidad_preguntas': 5
        }
        
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        sesion_id = response.data['id']
        
        # Obtener preguntas
        response = self.client.get(f'/api/simulacion/preguntas-sesion/{sesion_id}/')
        preguntas = response.data
        
        # Responder gradualmente y verificar progreso
        for i in range(len(preguntas)):
            # Responder pregunta
            respuesta_data = {
                'respuesta': 'A',
                'tiempo_respuesta': 30
            }
            
            response = self.client.post(
                f'/api/simulacion/sesiones/{sesion_id}/responder_pregunta/',
                respuesta_data
            )
            
            # Verificar progreso
            sesion = Sesion.objects.get(id=sesion_id)
            progreso = sesion.get_progreso()
            
            self.assertEqual(progreso['respondidas'], i + 1)
            self.assertEqual(progreso['total'], 5)
            self.assertEqual(progreso['porcentaje'], ((i + 1) / 5) * 100)

    def test_flujo_error_handling(self):
        """Test de manejo de errores en simulación"""
        
        # Intentar responder pregunta sin sesión activa
        response = self.client.post(
            '/api/simulacion/sesiones/999/responder_pregunta/',
            {'respuesta': 'A', 'tiempo_respuesta': 30}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Intentar iniciar sesión con materia inexistente
        data = {
            'materia': 999,
            'cantidad_preguntas': 5
        }
        
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def _completar_simulacion_basica(self):
        """Helper para completar una simulación básica"""
        data = {
            'materia': self.materia.id,
            'cantidad_preguntas': 3
        }
        
        # Iniciar sesión
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        sesion_id = response.data['id']
        
        # Obtener preguntas
        response = self.client.get(f'/api/simulacion/preguntas-sesion/{sesion_id}/')
        preguntas = response.data
        
        # Responder todas las preguntas
        for pregunta in preguntas:
            respuesta_data = {
                'respuesta': 'A',
                'tiempo_respuesta': 30
            }
            
            self.client.post(
                f'/api/simulacion/sesiones/{sesion_id}/responder_pregunta/',
                respuesta_data
            )
        
        return sesion_id


@pytest.mark.integration
class SimulacionPerformanceTest(TransactionTestCase):
    """Tests de performance para simulaciones"""
    
    def setUp(self):
        self.client = APIClient()
        self.estudiante = EstudianteFactory()
        self.estudiante.set_password('testpass')
        self.estudiante.save()
        
        # Login
        response = self.client.post('/api/auth/login/', {
            'username': self.estudiante.username,
            'password': 'testpass'
        })
        
        self.access_token = response.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_performance_simulacion_grande(self):
        """Test de performance con simulación de muchas preguntas"""
        import time
        
        # Crear materia con muchas preguntas
        materia = MateriaFactory()
        competencia = CompetenciaFactory(materia=materia)
        PreguntaFactory.create_batch(50, materia=materia, competencia=competencia)
        
        # Medir tiempo de inicio de sesión
        start_time = time.time()
        
        data = {
            'materia': materia.id,
            'cantidad_preguntas': 20
        }
        
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        
        inicio_tiempo = time.time() - start_time
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertLess(inicio_tiempo, 2.0)  # Menos de 2 segundos
        
        sesion_id = response.data['id']
        
        # Medir tiempo de obtención de preguntas
        start_time = time.time()
        
        response = self.client.get(f'/api/simulacion/preguntas-sesion/{sesion_id}/')
        
        preguntas_tiempo = time.time() - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 20)
        self.assertLess(preguntas_tiempo, 1.0)  # Menos de 1 segundo

    def test_performance_respuestas_rapidas(self):
        """Test de performance con respuestas muy rápidas"""
        
        materia = MateriaFactory()
        competencia = CompetenciaFactory(materia=materia)
        PreguntaFactory.create_batch(10, materia=materia, competencia=competencia)
        
        # Iniciar sesión
        data = {
            'materia': materia.id,
            'cantidad_preguntas': 10
        }
        
        response = self.client.post('/api/simulacion/sesiones/iniciar_sesion/', data)
        sesion_id = response.data['id']
        
        # Obtener preguntas
        response = self.client.get(f'/api/simulacion/preguntas-sesion/{sesion_id}/')
        preguntas = response.data
        
        # Responder muy rápidamente todas las preguntas
        import time
        start_time = time.time()
        
        for i, pregunta in enumerate(preguntas):
            respuesta_data = {
                'respuesta': 'A',
                'tiempo_respuesta': 1  # 1 segundo por respuesta
            }
            
            response = self.client.post(
                f'/api/simulacion/sesiones/{sesion_id}/responder_pregunta/',
                respuesta_data
            )
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        total_tiempo = time.time() - start_time
        
        # Verificar que se procesaron todas las respuestas rápidamente
        self.assertLess(total_tiempo, 5.0)  # Menos de 5 segundos para 10 respuestas
        
        # Verificar que la sesión se completó
        sesion = Sesion.objects.get(id=sesion_id)
        self.assertTrue(sesion.completada)