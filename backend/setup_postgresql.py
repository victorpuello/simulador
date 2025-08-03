#!/usr/bin/env python
"""
Script para configurar PostgreSQL para el Simulador Saber 11
"""
import os
import sys
import subprocess

def print_step(step, description):
    print(f"\n🔧 Paso {step}: {description}")
    print("=" * 60)

def run_command(command, description):
    print(f"Ejecutando: {command}")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} - Éxito")
            if result.stdout:
                print(result.stdout)
        else:
            print(f"❌ {description} - Error")
            print(result.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error ejecutando comando: {e}")
        return False

def main():
    print("🐘 CONFIGURACIÓN DE POSTGRESQL PARA SIMULADOR SABER 11")
    print("=" * 60)
    
    print_step(1, "Información de configuración")
    print("""
    Esta configuración creará:
    - Base de datos: simulador_saber11
    - Usuario: simulador_user
    - Contraseña: simulador_pass
    - Puerto: 5432 (por defecto)
    """)
    
    print_step(2, "Comandos SQL para PostgreSQL")
    sql_commands = """
    -- Conectarse a PostgreSQL como superusuario (postgres)
    -- psql -U postgres
    
    CREATE USER simulador_user WITH PASSWORD 'simulador_pass';
    CREATE DATABASE simulador_saber11 OWNER simulador_user;
    GRANT ALL PRIVILEGES ON DATABASE simulador_saber11 TO simulador_user;
    ALTER USER simulador_user CREATEDB;
    
    -- Verificar que se creó correctamente
    \\l
    \\du
    """
    
    print("Comandos SQL a ejecutar:")
    print(sql_commands)
    
    print_step(3, "Configuración de variables de entorno")
    print("""
    Para usar PostgreSQL, ejecuta en tu terminal:
    
    Windows (PowerShell):
    $env:DATABASE_URL="postgresql://simulador_user:simulador_pass@localhost:5432/simulador_saber11"
    
    Linux/Mac:
    export DATABASE_URL="postgresql://simulador_user:simulador_pass@localhost:5432/simulador_saber11"
    
    O crea un archivo .env en el directorio backend/ con:
    DATABASE_URL=postgresql://simulador_user:simulador_pass@localhost:5432/simulador_saber11
    """)
    
    print_step(4, "Comandos para migrar")
    print("""
    Una vez configurado PostgreSQL:
    
    1. Configurar variable de entorno
    2. python manage.py migrate
    3. python manage.py createsuperuser
    4. python manage.py populate_data
    5. python manage.py runserver
    """)
    
    print_step(5, "Verificación de dependencias")
    try:
        import psycopg2
        print("✅ psycopg2-binary está instalado")
    except ImportError:
        print("❌ psycopg2-binary no está instalado")
        print("   Ejecuta: pip install psycopg2-binary")
    
    try:
        import dj_database_url
        print("✅ dj-database-url está instalado")
    except ImportError:
        print("❌ dj-database-url no está instalado")
        print("   Ejecuta: pip install dj-database-url")
    
    print("\n🎯 SIGUIENTE PASO:")
    print("1. Instala PostgreSQL si no lo tienes")
    print("2. Ejecuta los comandos SQL mostrados arriba")
    print("3. Configura la variable DATABASE_URL")
    print("4. Ejecuta las migraciones")

if __name__ == "__main__":
    main()