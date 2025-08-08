"""
Tests para las vistas y APIs del core
"""
import json
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.authtoken.models import Token

from apps.core.models import Materia, Competencia, Pregunta
from .factories import (
    UsuarioFactory, EstudianteFactory, DocenteFactory, AdminFactory,
    MateriaFactory, CompetenciaFactory, PreguntaFactory
)

Usuario = get_user_model()


class AuthenticationViewsTest(APITestCase):
    """Tests para las vistas de autenticación"""
    
    def test_register_estudiante(self):
        """Test de registro de estudiante"""
        data = {
            'username': 'estudiante_test',
            'email': 'estudiante@test.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'Test',
            'last_name': 'Student',
            'rol': 'estudiante'
        }
        
        response = self.client.post('/api/auth/register/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['username'], 'estudiante_test')
        self.assertEqual(response.data['user']['rol'], 'estudiante')

    def test_register_docente(self):
        """Test de registro de docente"""
        data = {
            'username': 'docente_test',
            'email': 'docente@test.com', 
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'Test',
            'last_name': 'Teacher',
            'rol': 'docente'
        }
        
        response = self.client.post('/api/auth/register/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['rol'], 'docente')

    def test_register_password_mismatch(self):
        """Test de registro con contraseñas que no coinciden"""
        data = {
            'username': 'testuser',
            'email': 'test@test.com',
            'password': 'testpass123',
            'password_confirm': 'differentpass',
            'first_name': 'Test',
            'last_name': 'User',
            'rol': 'estudiante'
        }
        
        response = self.client.post('/api/auth/register/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_username(self):
        """Test de registro con username duplicado"""
        EstudianteFactory(username='existinguser')
        
        data = {
            'username': 'existinguser',
            'email': 'new@test.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'rol': 'estudiante'
        }
        
        response = self.client.post('/api/auth/register/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_valid(self):
        """Test de login válido"""
        usuario = EstudianteFactory(username='testuser')
        usuario.set_password('testpass123')
        usuario.save()
        
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])

    def test_login_invalid_credentials(self):
        """Test de login con credenciales inválidas"""
        EstudianteFactory(username='testuser', password='correctpass')
        
        data = {
            'username': 'testuser',
            'password': 'wrongpass'
        }
        
        response = self.client.post('/api/auth/login/', data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_authenticated(self):
        """Test de perfil con usuario autenticado"""
        usuario = EstudianteFactory()
        self.client.force_authenticate(user=usuario)
        
        response = self.client.get('/api/auth/profile/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], usuario.id)
        self.assertEqual(response.data['username'], usuario.username)

    def test_profile_unauthenticated(self):
        """Test de perfil sin autenticación"""
        response = self.client.get('/api/auth/profile/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_profile(self):
        """Test de actualización de perfil"""
        usuario = EstudianteFactory()
        self.client.force_authenticate(user=usuario)
        
        data = {
            'first_name': 'Nuevo Nombre',
            'configuracion': {
                'tema': 'oscuro',
                'notificaciones': False
            }
        }
        
        response = self.client.put('/api/auth/profile/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Nuevo Nombre')
        self.assertEqual(response.data['configuracion']['tema'], 'oscuro')


class MateriaViewsTest(APITestCase):
    """Tests para las vistas de materias"""
    
    def setUp(self):
        self.estudiante = EstudianteFactory()
        self.docente = DocenteFactory()
        self.client.force_authenticate(user=self.estudiante)

    def test_list_materias(self):
        """Test de listado de materias"""
        MateriaFactory.create_batch(3)
        
        response = self.client.get('/api/materias/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_retrieve_materia(self):
        """Test de detalle de materia"""
        materia = MateriaFactory(nombre_display='Matemáticas')
        
        response = self.client.get(f'/api/materias/{materia.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre_display'], 'Matemáticas')

    def test_filter_materias_activas(self):
        """Test de filtro de materias activas"""
        MateriaFactory(activa=True)
        MateriaFactory(activa=False)
        
        response = self.client.get('/api/materias/?activa=true')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_materia_forbidden_estudiante(self):
        """Test de creación de materia prohibida para estudiante"""
        data = {
            'nombre': 'nueva_materia',
            'nombre_display': 'Nueva Materia',
            'color': '#FF0000'
        }
        
        response = self.client.post('/api/materias/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_materia_allowed_admin(self):
        """Test de creación de materia permitida para admin"""
        admin = AdminFactory()
        self.client.force_authenticate(user=admin)
        
        data = {
            'nombre': 'nueva_materia',
            'nombre_display': 'Nueva Materia',
            'color': '#FF0000',
            'icono': 'test'
        }
        
        response = self.client.post('/api/materias/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nombre'], 'nueva_materia')


class CompetenciaViewsTest(APITestCase):
    """Tests para las vistas de competencias"""
    
    def setUp(self):
        self.estudiante = EstudianteFactory()
        self.materia = MateriaFactory()
        self.client.force_authenticate(user=self.estudiante)

    def test_list_competencias(self):
        """Test de listado de competencias"""
        CompetenciaFactory.create_batch(3, materia=self.materia)
        
        response = self.client.get('/api/competencias/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_filter_competencias_by_materia(self):
        """Test de filtro de competencias por materia"""
        CompetenciaFactory.create_batch(2, materia=self.materia)
        otra_materia = MateriaFactory()
        CompetenciaFactory(materia=otra_materia)
        
        response = self.client.get(f'/api/competencias/?materia={self.materia.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_retrieve_competencia(self):
        """Test de detalle de competencia"""
        competencia = CompetenciaFactory(nombre='Test Competencia')
        
        response = self.client.get(f'/api/competencias/{competencia.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre'], 'Test Competencia')


class PreguntaViewsTest(APITestCase):
    """Tests para las vistas de preguntas"""
    
    def setUp(self):
        self.estudiante = EstudianteFactory()
        self.docente = DocenteFactory()
        self.materia = MateriaFactory()
        self.competencia = CompetenciaFactory(materia=self.materia)
        self.client.force_authenticate(user=self.estudiante)

    def test_list_preguntas(self):
        """Test de listado de preguntas"""
        PreguntaFactory.create_batch(5, materia=self.materia)
        
        response = self.client.get('/api/preguntas/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 5)

    def test_filter_preguntas_by_materia(self):
        """Test de filtro de preguntas por materia"""
        PreguntaFactory.create_batch(3, materia=self.materia)
        otra_materia = MateriaFactory()
        PreguntaFactory.create_batch(2, materia=otra_materia)
        
        response = self.client.get(f'/api/preguntas/?materia={self.materia.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_filter_preguntas_by_dificultad(self):
        """Test de filtro de preguntas por dificultad"""
        PreguntaFactory.create_batch(2, dificultad='facil')
        PreguntaFactory.create_batch(3, dificultad='media')
        PreguntaFactory.create_batch(1, dificultad='dificil')
        
        response = self.client.get('/api/preguntas/?dificultad=media')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_search_preguntas(self):
        """Test de búsqueda en preguntas"""
        PreguntaFactory(enunciado='¿Cuánto es 2+2?')
        PreguntaFactory(enunciado='¿Cuál es la capital de Colombia?')
        PreguntaFactory(enunciado='¿Qué es la fotosíntesis?')
        
        response = self.client.get('/api/preguntas/?search=capital')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_retrieve_pregunta(self):
        """Test de detalle de pregunta"""
        pregunta = PreguntaFactory(enunciado='Test Question')
        
        response = self.client.get(f'/api/preguntas/{pregunta.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['enunciado'], 'Test Question')
        # La respuesta correcta no debe estar expuesta
        self.assertNotIn('respuesta_correcta', response.data)

    def test_create_pregunta_forbidden_estudiante(self):
        """Test de creación de pregunta prohibida para estudiante"""
        data = {
            'enunciado': 'Nueva pregunta',
            'opciones': {'A': 'Op A', 'B': 'Op B', 'C': 'Op C', 'D': 'Op D'},
            'respuesta_correcta': 'A',
            'materia': self.materia.id
        }
        
        response = self.client.post('/api/preguntas/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_pregunta_allowed_docente(self):
        """Test de creación de pregunta permitida para docente"""
        self.client.force_authenticate(user=self.docente)
        
        data = {
            'enunciado': 'Nueva pregunta',
            'opciones': {'A': 'Op A', 'B': 'Op B', 'C': 'Op C', 'D': 'Op D'},
            'respuesta_correcta': 'A',
            'materia': self.materia.id,
            'competencia': self.competencia.id,
            'dificultad': 'media'
        }
        
        response = self.client.post('/api/preguntas/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['enunciado'], 'Nueva pregunta')


class PermissionsTest(APITestCase):
    """Tests de permisos y autorización"""
    
    def setUp(self):
        self.estudiante = EstudianteFactory()
        self.docente = DocenteFactory()
        self.admin = AdminFactory()

    def test_estudiante_permissions(self):
        """Test de permisos de estudiante"""
        self.client.force_authenticate(user=self.estudiante)
        
        # Puede leer materias
        response = self.client.get('/api/materias/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # No puede crear materias
        response = self.client.post('/api/materias/', {})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_docente_permissions(self):
        """Test de permisos de docente"""
        self.client.force_authenticate(user=self.docente)
        
        # Puede leer materias
        response = self.client.get('/api/materias/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Puede crear preguntas
        materia = MateriaFactory()
        data = {
            'enunciado': 'Test',
            'opciones': {'A': '1', 'B': '2', 'C': '3', 'D': '4'},
            'respuesta_correcta': 'A',
            'materia': materia.id,
            'dificultad': 'media'
        }
        response = self.client.post('/api/preguntas/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_permissions(self):
        """Test de permisos de administrador"""
        self.client.force_authenticate(user=self.admin)
        
        # Puede crear materias
        data = {
            'nombre': 'test_materia',
            'nombre_display': 'Test Materia',
            'color': '#FF0000',
            'icono': 'test'
        }
        response = self.client.post('/api/materias/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_unauthenticated_access(self):
        """Test de acceso sin autenticación"""
        # La mayoría de endpoints requieren autenticación
        response = self.client.get('/api/materias/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        response = self.client.get('/api/preguntas/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PaginationTest(APITestCase):
    """Tests de paginación"""
    
    def setUp(self):
        self.estudiante = EstudianteFactory()
        self.client.force_authenticate(user=self.estudiante)

    def test_pagination_materias(self):
        """Test de paginación en materias"""
        MateriaFactory.create_batch(25)  # Más que PAGE_SIZE (20)
        
        response = self.client.get('/api/materias/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 25)
        self.assertEqual(len(response.data['results']), 20)  # PAGE_SIZE

    def test_pagination_preguntas(self):
        """Test de paginación en preguntas"""
        PreguntaFactory.create_batch(30)
        
        response = self.client.get('/api/preguntas/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 30)
        self.assertEqual(len(response.data['results']), 20)
        
        # Test segunda página
        response = self.client.get('/api/preguntas/?page=2')
        self.assertEqual(len(response.data['results']), 10)


class SerializerTest(TestCase):
    """Tests de serializers"""
    
    def test_user_serializer_password_hidden(self):
        """Test que el password no se expone en el serializer"""
        from apps.authentication.serializers import UsuarioSerializer
        
        usuario = EstudianteFactory()
        serializer = UsuarioSerializer(usuario)
        
        self.assertNotIn('password', serializer.data)

    def test_pregunta_serializer_answer_hidden(self):
        """Test que la respuesta correcta no se expone"""
        from apps.core.serializers import PreguntaSerializer
        
        pregunta = PreguntaFactory()
        serializer = PreguntaSerializer(pregunta)
        
        self.assertNotIn('respuesta_correcta', serializer.data)
        self.assertNotIn('retroalimentacion_estructurada', serializer.data)

    def test_materia_serializer_includes_count(self):
        """Test que el serializer de materia incluye conteo de preguntas"""
        from apps.core.serializers import MateriaSerializer
        
        materia = MateriaFactory()
        PreguntaFactory.create_batch(5, materia=materia)
        
        serializer = MateriaSerializer(materia)
        
        self.assertIn('preguntas_count', serializer.data)
        self.assertEqual(serializer.data['preguntas_count'], 5)