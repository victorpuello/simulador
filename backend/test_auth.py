#!/usr/bin/env python
"""
Script para probar autenticación local
"""
import os
import sys
import django
import requests
import json

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simulador.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.core.models import Usuario

def test_auth():
    """Probar autenticación via API"""
    
    base_url = "http://localhost:8000/api"
    
    # Datos de login
    test_users = [
        {"username": "estudiante@test.com", "password": "password123"},
        {"username": "docente@test.com", "password": "password123"},
        {"username": "admin@test.com", "password": "password123"}
    ]
    
    print("🔍 Probando autenticación...")
    
    for user_data in test_users:
        print(f"\n👤 Probando usuario: {user_data['username']}")
        
        try:
            # Login
            login_response = requests.post(
                f"{base_url}/auth/login/",
                json=user_data,
                headers={"Content-Type": "application/json"}
            )
            
            if login_response.status_code == 200:
                print(f"✅ Login exitoso para {user_data['username']}")
                tokens = login_response.json()
                print(f"📝 Access token: {tokens.get('access', 'N/A')[:50]}...")
                
                # Probar logout
                logout_response = requests.post(
                    f"{base_url}/auth/logout/",
                    headers={
                        "Authorization": f"Bearer {tokens.get('access')}",
                        "Content-Type": "application/json"
                    }
                )
                
                if logout_response.status_code in [200, 204]:
                    print(f"✅ Logout exitoso para {user_data['username']}")
                else:
                    print(f"❌ Logout falló: {logout_response.status_code}")
                    
            else:
                print(f"❌ Login falló: {login_response.status_code}")
                print(f"📝 Error: {login_response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ No se puede conectar al servidor en {base_url}")
            print("🔧 Asegúrate de que el servidor esté corriendo:")
            print("   python manage.py runserver")
            break
        except Exception as e:
            print(f"❌ Error inesperado: {e}")

def check_users():
    """Verificar usuarios en base de datos"""
    print("\n📊 Usuarios en base de datos:")
    
    users = Usuario.objects.all()
    for user in users:
        print(f"   👤 {user.username} - {user.rol} - {'Activo' if user.is_active else 'Inactivo'}")

if __name__ == '__main__':
    check_users()
    test_auth()