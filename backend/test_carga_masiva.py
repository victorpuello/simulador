#!/usr/bin/env python
"""
Script de prueba para la carga masiva de preguntas
"""
import os
import sys
import django
import json
from pathlib import Path

# Configurar Django
sys.path.append(str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simulador.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import force_authenticate
from apps.core.views import PreguntaViewSet
from apps.core.models import Usuario

def test_carga_masiva():
    """Probar la carga masiva con un archivo JSON de ejemplo"""
    
    # Crear un usuario docente para la prueba
    User = get_user_model()
    try:
        docente = User.objects.get(username='docente_test')
    except User.DoesNotExist:
        docente = User.objects.create_user(
            username='docente_test',
            email='docente@test.com',
            password='testpass123',
            rol='docente'
        )
    
    # Crear datos de prueba
    datos_prueba = [
        {
            "materia": "Matemáticas",
            "competencia": "Razonamiento y argumentación",
            "contexto": "En un problema de aplicación de ecuaciones lineales",
            "enunciado": "Si 2x + 5 = 13, ¿cuál es el valor de x?",
            "opciones": {
                "A": "3",
                "B": "4",
                "C": "5",
                "D": "6"
            },
            "respuesta_correcta": "B",
            "retroalimentacion": "Para resolver 2x + 5 = 13, restamos 5 de ambos lados: 2x = 8, luego dividimos entre 2: x = 4",
            "explicacion": "Esta es una ecuación lineal simple que se resuelve despejando la variable x",
            "habilidad_evaluada": "Resolución de ecuaciones lineales",
            "explicacion_opciones_incorrectas": {
                "A": "Este valor no satisface la ecuación original",
                "C": "Al sustituir este valor, la ecuación no se cumple",
                "D": "Este resultado viene de un error en el cálculo"
            },
            "estrategias_resolucion": "1. Aislar el término con la variable, 2. Realizar operaciones inversas, 3. Verificar el resultado",
            "errores_comunes": "Olvidar cambiar el signo al pasar términos de un lado al otro",
            "dificultad": "facil",
            "tiempo_estimado": 90,
            "tags": ["álgebra", "ecuaciones", "básico"]
        }
    ]
    
    # Crear archivo JSON temporal
    archivo_json = 'test_preguntas.json'
    with open(archivo_json, 'w', encoding='utf-8') as f:
        json.dump(datos_prueba, f, ensure_ascii=False, indent=2)
    
    print(f"Archivo JSON creado: {archivo_json}")
    
    # Simular request
    factory = RequestFactory()
    request = factory.post('/api/core/preguntas/carga_masiva/')
    
    # Autenticar usuario
    force_authenticate(request, user=docente)
    request.user = docente
    
    # Simular archivo subido
    with open(archivo_json, 'rb') as f:
        from django.core.files.uploadedfile import SimpleUploadedFile
        uploaded_file = SimpleUploadedFile(
            'test_preguntas.json',
            f.read(),
            content_type='application/json'
        )
        request.FILES['archivo'] = uploaded_file
    
    # Crear ViewSet y llamar al método
    viewset = PreguntaViewSet()
    viewset.request = request
    
    try:
        response = viewset.carga_masiva(request)
        print(f"Respuesta exitosa: {response.data}")
    except Exception as e:
        print(f"Error en carga masiva: {e}")
        import traceback
        traceback.print_exc()
    
    # Limpiar archivo temporal
    if os.path.exists(archivo_json):
        os.remove(archivo_json)

if __name__ == '__main__':
    test_carga_masiva() 