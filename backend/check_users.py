#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simulador.settings')
django.setup()

from apps.core.models import Usuario

def check_users():
    """Verificar usuarios existentes"""
    print("=== Verificando usuarios ===")
    
    users = Usuario.objects.all()
    print(f"Total de usuarios: {users.count()}")
    
    print("\n=== Lista de usuarios ===")
    for user in users:
        print(f"ID: {user.id}")
        print(f"  Username: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  Rol: {user.rol}")
        print(f"  Activo: {user.is_active}")
        print(f"  Staff: {user.is_staff}")
        print(f"  Superuser: {user.is_superuser}")
        print("---")

if __name__ == '__main__':
    check_users() 