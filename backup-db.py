#!/usr/bin/env python3
"""
Script de Backup para Base de Datos
Autor: Simulador Saber 11
Versión: 1.0
"""

import os
import sys
import subprocess
import datetime
import json
from pathlib import Path

def print_status(message):
    print(f"[INFO] {message}")

def print_success(message):
    print(f"[SUCCESS] {message}")

def print_error(message):
    print(f"[ERROR] {message}")

def create_backup_directory():
    """Crear directorio de backups si no existe"""
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)
    return backup_dir

def backup_sqlite():
    """Backup de base de datos SQLite"""
    try:
        # Verificar si existe db.sqlite3
        db_path = Path("backend/db.sqlite3")
        if not db_path.exists():
            print_error("No se encontró db.sqlite3")
            return False
        
        # Crear directorio de backups
        backup_dir = create_backup_directory()
        
        # Generar nombre del archivo de backup
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = backup_dir / f"backup_sqlite_{timestamp}.sqlite3"
        
        # Copiar archivo de base de datos
        import shutil
        shutil.copy2(db_path, backup_file)
        
        print_success(f"Backup SQLite creado: {backup_file}")
        return True
        
    except Exception as e:
        print_error(f"Error en backup SQLite: {e}")
        return False

def backup_postgresql():
    """Backup de base de datos PostgreSQL"""
    try:
        # Configuración de base de datos
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'simulador_db'),
            'user': os.getenv('DB_USER', 'simulador_user'),
            'password': os.getenv('DB_PASSWORD', '')
        }
        
        # Crear directorio de backups
        backup_dir = create_backup_directory()
        
        # Generar nombre del archivo de backup
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = backup_dir / f"backup_postgres_{timestamp}.sql"
        
        # Comando pg_dump
        cmd = [
            'pg_dump',
            f'--host={db_config["host"]}',
            f'--port={db_config["port"]}',
            f'--username={db_config["user"]}',
            f'--dbname={db_config["database"]}',
            '--verbose',
            '--clean',
            '--no-owner',
            '--no-privileges',
            f'--file={backup_file}'
        ]
        
        # Ejecutar comando
        env = os.environ.copy()
        if db_config['password']:
            env['PGPASSWORD'] = db_config['password']
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            print_success(f"Backup PostgreSQL creado: {backup_file}")
            return True
        else:
            print_error(f"Error en pg_dump: {result.stderr}")
            return False
            
    except Exception as e:
        print_error(f"Error en backup PostgreSQL: {e}")
        return False

def backup_mysql():
    """Backup de base de datos MySQL"""
    try:
        # Configuración de base de datos
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '3306'),
            'database': os.getenv('DB_NAME', 'simulador_db'),
            'user': os.getenv('DB_USER', 'simulador_user'),
            'password': os.getenv('DB_PASSWORD', '')
        }
        
        # Crear directorio de backups
        backup_dir = create_backup_directory()
        
        # Generar nombre del archivo de backup
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = backup_dir / f"backup_mysql_{timestamp}.sql"
        
        # Comando mysqldump
        cmd = [
            'mysqldump',
            f'--host={db_config["host"]}',
            f'--port={db_config["port"]}',
            f'--user={db_config["user"]}',
            f'--password={db_config["password"]}',
            '--single-transaction',
            '--routines',
            '--triggers',
            db_config['database']
        ]
        
        # Ejecutar comando
        with open(backup_file, 'w') as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
        
        if result.returncode == 0:
            print_success(f"Backup MySQL creado: {backup_file}")
            return True
        else:
            print_error(f"Error en mysqldump: {result.stderr}")
            return False
            
    except Exception as e:
        print_error(f"Error en backup MySQL: {e}")
        return False

def detect_database_type():
    """Detectar tipo de base de datos"""
    # Verificar SQLite
    if Path("backend/db.sqlite3").exists():
        return "sqlite"
    
    # Verificar variables de entorno
    db_engine = os.getenv('DATABASE_URL', '').lower()
    if 'postgresql' in db_engine or 'postgres' in db_engine:
        return "postgresql"
    elif 'mysql' in db_engine:
        return "mysql"
    
    # Verificar settings.py
    try:
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simulador.settings')
        django.setup()
        
        from django.conf import settings
        db_engine = settings.DATABASES['default']['ENGINE']
        
        if 'sqlite' in db_engine:
            return "sqlite"
        elif 'postgresql' in db_engine or 'postgres' in db_engine:
            return "postgresql"
        elif 'mysql' in db_engine:
            return "mysql"
    except:
        pass
    
    return "sqlite"  # Por defecto

def main():
    """Función principal"""
    print("🗄️  Iniciando backup de base de datos...")
    
    # Detectar tipo de base de datos
    db_type = detect_database_type()
    print_status(f"Tipo de base de datos detectado: {db_type}")
    
    # Realizar backup según el tipo
    success = False
    if db_type == "sqlite":
        success = backup_sqlite()
    elif db_type == "postgresql":
        success = backup_postgresql()
    elif db_type == "mysql":
        success = backup_mysql()
    else:
        print_error(f"Tipo de base de datos no soportado: {db_type}")
        return False
    
    if success:
        print_success("✅ Backup completado exitosamente")
        return True
    else:
        print_error("❌ Error en el backup")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 