#!/usr/bin/env python
"""
Script para gestionar la base de datos del Simulador Saber 11
Permite cambiar entre SQLite y PostgreSQL fácilmente
"""
import os
import sys
import subprocess
import django
from django.core.management import execute_from_command_line

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🎯 {title}")
    print(f"{'='*60}")

def print_step(step, description):
    print(f"\n🔧 Paso {step}: {description}")
    print("-" * 40)

def run_django_command(command):
    """Ejecuta un comando de Django management"""
    try:
        print(f"Ejecutando: python manage.py {' '.join(command)}")
        execute_from_command_line(['manage.py'] + command)
        print("✅ Comando ejecutado exitosamente")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def show_current_db():
    """Muestra la configuración actual de la base de datos"""
    print_header("CONFIGURACIÓN ACTUAL DE BASE DE DATOS")
    
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        if database_url.startswith('postgresql'):
            print("🐘 Usando PostgreSQL")
            print(f"URL: {database_url}")
        else:
            print(f"🔗 Usando base de datos externa: {database_url}")
    else:
        print("📁 Usando SQLite (por defecto)")
        print("Archivo: db.sqlite3")

def setup_postgresql():
    """Configura PostgreSQL"""
    print_header("CONFIGURACIÓN POSTGRESQL")
    
    print("Para configurar PostgreSQL, necesitas:")
    print("1. Tener PostgreSQL instalado")
    print("2. Crear la base de datos y usuario")
    print("3. Configurar la variable de entorno")
    
    print("\nComandos SQL para ejecutar en PostgreSQL:")
    print("psql -U postgres")
    print("CREATE USER simulador_user WITH PASSWORD 'simulador_pass';")
    print("CREATE DATABASE simulador_saber11 OWNER simulador_user;")
    print("GRANT ALL PRIVILEGES ON DATABASE simulador_saber11 TO simulador_user;")
    print("ALTER USER simulador_user CREATEDB;")
    
    print("\nPara configurar la variable de entorno:")
    print("$env:DATABASE_URL=\"postgresql://simulador_user:simulador_pass@localhost:5432/simulador_saber11\"")

def migrate_to_postgresql():
    """Migra los datos de SQLite a PostgreSQL"""
    print_header("MIGRACIÓN DE SQLITE A POSTGRESQL")
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url or not database_url.startswith('postgresql'):
        print("❌ Variable DATABASE_URL no configurada para PostgreSQL")
        print("Configura primero: $env:DATABASE_URL=\"postgresql://simulador_user:simulador_pass@localhost:5432/simulador_saber11\"")
        return False
    
    print_step(1, "Verificando conexión a PostgreSQL")
    if not run_django_command(['check']):
        return False
    
    print_step(2, "Aplicando migraciones")
    if not run_django_command(['migrate']):
        return False
    
    print_step(3, "Poblando datos iniciales")
    if not run_django_command(['populate_data']):
        print("⚠️  Comando populate_data falló, pero puedes continuar")
    
    print("\n✅ Migración a PostgreSQL completada!")
    print("Ahora puedes ejecutar: python manage.py runserver")
    return True

def reset_sqlite():
    """Resetea la base de datos SQLite"""
    print_header("RESET DE SQLITE")
    
    # Eliminar variable de entorno si existe
    if 'DATABASE_URL' in os.environ:
        del os.environ['DATABASE_URL']
        print("🗑️  Variable DATABASE_URL removida")
    
    print_step(1, "Aplicando migraciones a SQLite")
    if not run_django_command(['migrate']):
        return False
    
    print_step(2, "Poblando datos iniciales")
    if not run_django_command(['populate_data']):
        print("⚠️  Comando populate_data falló, pero puedes continuar")
    
    print("\n✅ SQLite configurado correctamente!")
    return True

def main():
    # Configurar Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simulador.settings')
    django.setup()
    
    print("🎯 GESTOR DE BASE DE DATOS - SIMULADOR SABER 11")
    
    if len(sys.argv) < 2:
        print("\nUso: python manage_db.py [comando]")
        print("\nComandos disponibles:")
        print("  status          - Mostrar configuración actual")
        print("  setup-pg        - Mostrar instrucciones para PostgreSQL")
        print("  migrate-pg      - Migrar a PostgreSQL")
        print("  reset-sqlite    - Volver a SQLite")
        return
    
    command = sys.argv[1]
    
    if command == 'status':
        show_current_db()
    elif command == 'setup-pg':
        setup_postgresql()
    elif command == 'migrate-pg':
        migrate_to_postgresql()
    elif command == 'reset-sqlite':
        reset_sqlite()
    else:
        print(f"❌ Comando desconocido: {command}")
        print("Usa: status, setup-pg, migrate-pg, o reset-sqlite")

if __name__ == "__main__":
    main()