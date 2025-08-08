"""
Configuración global para pytest
"""
import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

# Configurar path para imports
sys.path.insert(0, os.path.dirname(__file__))

def pytest_configure():
    """Configurar Django para testing"""
    
    # Configurar la variable de entorno
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simulador.settings')
    
    # Configurar Django
    django.setup()

def pytest_unconfigure():
    """Limpiar después de los tests"""
    pass