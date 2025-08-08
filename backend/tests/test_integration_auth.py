"""
Tests de integración para el flujo de autenticación completo
"""
import pytest
from django.test import TransactionTestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.core.tests.factories import EstudianteFactory, DocenteFactory, MateriaFactory

Usuario = get_user_model()


@pytest.mark.integration
class AuthIntegrationTest(TransactionTestCase):
    """Tests de integración para el sistema de autenticación"""
    
    def setUp(self):
        self.client = APIClient()
        
    def test_flujo_completo_registro_login(self):
        """Test del flujo completo de registro y login"""
        
        # 1. Registro de usuario
        register_data = {
            'username': 'usuario_integra',
            'email': 'usuario@integra.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'Usuario',
            'last_name': 'Integración',
            'rol': 'estudiante'
        }
        
        register_response = self.client.post('/api/auth/register/', register_data)
        
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', register_response.data)
        self.assertIn('tokens', register_response.data)
        self.assertEqual(register_response.data['user']['username'], 'usuario_integra')
        
        # 2. Verificar que el usuario se creó en la base de datos
        usuario = Usuario.objects.get(username='usuario_integra')
        self.assertEqual(usuario.email, 'usuario@integra.com')
        self.assertEqual(usuario.rol, 'estudiante')
        self.assertEqual(usuario.racha_actual, 0)
        self.assertEqual(usuario.puntos_totales, 0)
        
        # 3. Login con las mismas credenciales
        login_data = {
            'username': 'usuario_integra',
            'password': 'testpass123'
        }
        
        login_response = self.client.post('/api/auth/login/', login_data)
        
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('user', login_response.data)
        self.assertIn('tokens', login_response.data)
        self.assertEqual(login_response.data['user']['id'], usuario.id)
        
        # 4. Acceder al perfil con el token
        access_token = login_response.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        profile_response = self.client.get('/api/auth/profile/')
        
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data['username'], 'usuario_integra')
        
        # 5. Actualizar perfil
        update_data = {
            'first_name': 'Usuario Actualizado',
            'configuracion': {
                'tema': 'oscuro',
                'notificaciones': False
            }
        }
        
        update_response = self.client.put('/api/auth/profile/', update_data, format='json')
        
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['first_name'], 'Usuario Actualizado')
        self.assertEqual(update_response.data['configuracion']['tema'], 'oscuro')
        
        # 6. Verificar en base de datos
        usuario.refresh_from_db()
        self.assertEqual(usuario.first_name, 'Usuario Actualizado')
        self.assertEqual(usuario.configuracion['tema'], 'oscuro')

    def test_flujo_login_invalido(self):
        """Test de flujo de login con credenciales inválidas"""
        
        # Crear usuario válido
        usuario = EstudianteFactory(username='testuser')
        usuario.set_password('correctpass')
        usuario.save()
        
        # Intentar login con contraseña incorrecta
        login_data = {
            'username': 'testuser',
            'password': 'wrongpass'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_acceso_sin_autenticacion(self):
        """Test de acceso a endpoints protegidos sin autenticación"""
        
        # Intentar acceder al perfil sin token
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Intentar acceder a materias sin token
        response = self.client.get('/api/materias/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_acceso_con_token_invalido(self):
        """Test de acceso con token inválido"""
        
        # Usar token inválido
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_flujo_permisos_por_rol(self):
        """Test de permisos diferenciados por rol"""
        
        # Crear estudiante
        estudiante = EstudianteFactory()
        estudiante.set_password('testpass')
        estudiante.save()
        
        # Crear docente
        docente = DocenteFactory()
        docente.set_password('testpass')
        docente.save()
        
        # Crear materia para tests
        materia = MateriaFactory()
        
        # Login como estudiante
        login_data = {
            'username': estudiante.username,
            'password': 'testpass'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        token_estudiante = response.data['tokens']['access']
        
        # Verificar que estudiante puede leer materias
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_estudiante}')
        response = self.client.get('/api/materias/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que estudiante NO puede crear preguntas
        pregunta_data = {
            'enunciado': 'Test pregunta',
            'opciones': {'A': '1', 'B': '2', 'C': '3', 'D': '4'},
            'respuesta_correcta': 'A',
            'materia': materia.id,
            'dificultad': 'media'
        }
        response = self.client.post('/api/preguntas/', pregunta_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Login como docente
        login_data = {
            'username': docente.username,
            'password': 'testpass'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        token_docente = response.data['tokens']['access']
        
        # Verificar que docente puede crear preguntas
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_docente}')
        response = self.client.post('/api/preguntas/', pregunta_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_refresh_token_flow(self):
        """Test del flujo de refresh token"""
        
        usuario = EstudianteFactory()
        usuario.set_password('testpass')
        usuario.save()
        
        # Login
        login_data = {
            'username': usuario.username,
            'password': 'testpass'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        refresh_token = response.data['tokens']['refresh']
        
        # Usar refresh token para obtener nuevo access token
        refresh_data = {'refresh': refresh_token}
        
        response = self.client.post('/api/auth/refresh/', refresh_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        
        # Verificar que el nuevo token funciona
        new_access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access_token}')
        
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


@pytest.mark.integration  
class AuthPerformanceTest(TransactionTestCase):
    """Tests de performance para autenticación"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_multiples_logins_concurrentes(self):
        """Test de múltiples logins concurrentes"""
        import threading
        import time
        
        # Crear usuarios
        usuarios = []
        for i in range(5):
            usuario = EstudianteFactory(username=f'user{i}')
            usuario.set_password('testpass')
            usuario.save()
            usuarios.append(usuario)
        
        results = []
        
        def login_usuario(usuario):
            client = APIClient()
            start_time = time.time()
            
            response = client.post('/api/auth/login/', {
                'username': usuario.username,
                'password': 'testpass'
            })
            
            end_time = time.time()
            results.append({
                'usuario': usuario.username,
                'status': response.status_code,
                'tiempo': end_time - start_time
            })
        
        # Ejecutar logins en paralelo
        threads = []
        for usuario in usuarios:
            thread = threading.Thread(target=login_usuario, args=(usuario,))
            threads.append(thread)
            thread.start()
        
        # Esperar a que terminen todos
        for thread in threads:
            thread.join()
        
        # Verificar resultados
        self.assertEqual(len(results), 5)
        for result in results:
            self.assertEqual(result['status'], 200)
            self.assertLess(result['tiempo'], 2.0)  # Menos de 2 segundos

    def test_carga_perfil_con_datos_grandes(self):
        """Test de carga de perfil con configuración grande"""
        
        # Crear usuario con configuración grande
        configuracion_grande = {
            'tema': 'oscuro',
            'notificaciones': True,
            'preferencias': {f'opcion_{i}': f'valor_{i}' for i in range(100)}
        }
        
        usuario = EstudianteFactory(configuracion=configuracion_grande)
        usuario.set_password('testpass')
        usuario.save()
        
        # Login
        response = self.client.post('/api/auth/login/', {
            'username': usuario.username,
            'password': 'testpass'
        })
        
        token = response.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Medir tiempo de carga del perfil
        import time
        start_time = time.time()
        
        response = self.client.get('/api/auth/profile/')
        
        end_time = time.time()
        tiempo_carga = end_time - start_time
        
        self.assertEqual(response.status_code, 200)
        self.assertLess(tiempo_carga, 1.0)  # Menos de 1 segundo
        self.assertEqual(
            response.data['configuracion']['preferencias']['opcion_0'], 
            'valor_0'
        )