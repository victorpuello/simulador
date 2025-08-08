#!/usr/bin/env python
import requests
import json

# Configuración
BASE_URL = "http://localhost:8000/api"
LOGIN_URL = f"{BASE_URL}/auth/login/"
SESSIONS_URL = f"{BASE_URL}/simulacion/sesiones/"
TEST_URL = f"{BASE_URL}/simulacion/sesiones/test_endpoint/"

def test_login():
    """Probar login"""
    print("=== Probando login ===")
    
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(LOGIN_URL, json=login_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login exitoso")
            print(f"Data: {data}")
            return data.get('tokens', {}).get('access')
        else:
            print(f"❌ Login falló: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error en login: {e}")
        return None

def test_sessions_endpoint(token):
    """Probar endpoint de sesiones"""
    print("\n=== Probando endpoint de sesiones ===")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(SESSIONS_URL, headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Endpoint de sesiones funcionando")
            print(f"Total de sesiones: {len(data.get('results', []))}")
            return True
        else:
            print(f"❌ Error en endpoint de sesiones: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error en endpoint de sesiones: {e}")
        return False

def test_test_endpoint(token):
    """Probar endpoint de prueba"""
    print("\n=== Probando endpoint de prueba ===")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(TEST_URL, headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Endpoint de prueba funcionando")
            print(f"Datos: {data}")
            return True
        else:
            print(f"❌ Error en endpoint de prueba: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error en endpoint de prueba: {e}")
        return False

def main():
    print("🚀 Iniciando pruebas de API...")
    
    # Probar login
    token = test_login()
    
    if token:
        # Probar endpoints
        test_sessions_endpoint(token)
        test_test_endpoint(token)
    else:
        print("❌ No se pudo obtener token de autenticación")

if __name__ == '__main__':
    main() 