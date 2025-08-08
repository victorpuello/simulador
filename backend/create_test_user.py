#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simulador.settings')
django.setup()

from apps.core.models import Usuario

def create_test_user():
    """Crear un usuario de prueba"""
    print("=== Creando usuario de prueba ===")
    
    # Verificar si el usuario ya existe
    username = "testuser"
    email = "testuser@test.com"
    
    if Usuario.objects.filter(username=username).exists():
        print(f"El usuario {username} ya existe")
        user = Usuario.objects.get(username=username)
        user.set_password("testpass123")
        user.save()
        print(f"Contraseña actualizada para {username}")
    else:
        # Crear nuevo usuario
        user = Usuario.objects.create_user(
            username=username,
            email=email,
            password="testpass123",
            rol="estudiante",
            first_name="Test",
            last_name="User"
        )
        print(f"Usuario {username} creado exitosamente")
    
    print(f"Username: {username}")
    print(f"Password: testpass123")
    print(f"Email: {email}")
    print(f"Rol: estudiante")

if __name__ == '__main__':
    create_test_user() 