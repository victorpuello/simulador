#!/usr/bin/env python
"""
Script para arreglar problemas de autenticación
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simulador.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.core.models import Usuario

def fix_users():
    """Arreglar usuarios y passwords"""
    
    users_data = [
        {
            'username': 'estudiante@test.com',
            'email': 'estudiante@test.com',
            'password': 'password123',
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'rol': 'estudiante'
        },
        {
            'username': 'docente@test.com',
            'email': 'docente@test.com',
            'password': 'password123',
            'first_name': 'María',
            'last_name': 'García',
            'rol': 'docente'
        },
        {
            'username': 'admin@test.com',
            'email': 'admin@test.com',
            'password': 'password123',
            'first_name': 'Admin',
            'last_name': 'Sistema',
            'rol': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    ]
    
    for user_data in users_data:
        username = user_data['username']
        password = user_data.pop('password')
        
        try:
            # Obtener o crear usuario
            user, created = Usuario.objects.get_or_create(
                username=username,
                defaults=user_data
            )
            
            if not created:
                # Actualizar datos del usuario existente
                for key, value in user_data.items():
                    setattr(user, key, value)
            
            # Establecer password
            user.set_password(password)
            user.is_active = True
            user.save()
            
            status = "creado" if created else "actualizado"
            print(f"✅ Usuario {username} {status}")
            
            # Verificar password
            from django.contrib.auth import authenticate
            auth_user = authenticate(username=username, password='password123')
            if auth_user:
                print(f"✅ Password verificado para {username}")
            else:
                print(f"❌ Password NO funciona para {username}")
                
        except Exception as e:
            print(f"❌ Error con usuario {username}: {e}")

def test_authentication():
    """Probar autenticación Django"""
    from django.contrib.auth import authenticate
    
    test_users = [
        'estudiante@test.com',
        'docente@test.com', 
        'admin@test.com'
    ]
    
    print("\n🔍 Probando autenticación Django:")
    for username in test_users:
        user = authenticate(username=username, password='password123')
        if user:
            print(f"✅ {username} - Autenticación exitosa")
        else:
            print(f"❌ {username} - Autenticación falló")

if __name__ == '__main__':
    print("🔧 Arreglando usuarios...")
    fix_users()
    test_authentication()
    print("\n✅ Proceso completado!")
    print("\n📋 Datos de acceso:")
    print("   Username: estudiante@test.com")
    print("   Username: docente@test.com") 
    print("   Username: admin@test.com")
    print("   Password: password123")