#!/usr/bin/env python
"""
Script para crear usuarios de prueba para el Simulador Saber 11
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simulador.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.core.models import Usuario

User = get_user_model()

def create_test_users():
    """Crear usuarios de prueba"""
    
    # Usuario Estudiante
    try:
        estudiante = Usuario.objects.create_user(
            username='estudiante@test.com',
            email='estudiante@test.com',
            password='password123',
            first_name='Juan',
            last_name='Pérez',
            rol='estudiante'
        )
        print(f"✅ Usuario estudiante creado: {estudiante.username}")
    except Exception as e:
        print(f"⚠️ Usuario estudiante ya existe o error: {e}")
    
    # Usuario Docente
    try:
        docente = Usuario.objects.create_user(
            username='docente@test.com',
            email='docente@test.com',
            password='password123',
            first_name='María',
            last_name='García',
            rol='docente'
        )
        print(f"✅ Usuario docente creado: {docente.username}")
    except Exception as e:
        print(f"⚠️ Usuario docente ya existe o error: {e}")
    
    # Usuario Admin
    try:
        admin = Usuario.objects.create_user(
            username='admin@test.com',
            email='admin@test.com',
            password='password123',
            first_name='Admin',
            last_name='Sistema',
            rol='estudiante',  # Por defecto, pero puede ser cambiado
            is_staff=True,
            is_superuser=True
        )
        print(f"✅ Usuario admin creado: {admin.username}")
    except Exception as e:
        print(f"⚠️ Usuario admin ya existe o error: {e}")

if __name__ == '__main__':
    print("🚀 Creando usuarios de prueba...")
    create_test_users()
    print("✅ Proceso completado!") 