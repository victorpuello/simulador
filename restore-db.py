#!/usr/bin/env python3
"""
Script de Restauración de Base de Datos
Autor: Simulador Saber 11
Versión: 1.0
"""

import os
import sys
import subprocess
import datetime
import json
import glob
from pathlib import Path

def print_status(message):
    print(f"[INFO] {message}")

def print_success(message):
    print(f"[SUCCESS] {message}")

def print_error(message):
    print(f"[ERROR] {message}")

def list_backups():
    """Listar backups disponibles"""
    backup_dir = Path("backups")
    if not backup_dir.exists():
        print_error("No existe directorio de backups")
        return []
    
    backups = []
    for file in backup_dir.glob("*"):
        if file.is_file():
            backups.append(file)
    
    return sorted(backups, key=lambda x: x.stat().st_mtime, reverse=True)

def select_backup():
    """Seleccionar backup para restaurar"""
    backups = list_backups()
    
    if not backups:
        print_error("No se encontraron backups")
        return None
    
    print("📋 Backups disponibles:")
    for i, backup in enumerate(backups, 1):
        size = backup.stat().st_size / (1024 * 1024)  # MB
        mtime = datetime.datetime.fromtimestamp(backup.stat().st_mtime)
        print(f"  {i}. {backup.name} ({size:.1f} MB) - {mtime}")
    
    try:
        choice = int(input("\nSelecciona el número del backup a restaurar: ")) - 1
        if 0 <= choice < len(backups):
            return backups[choice]
        else:
            print_error("Selección inválida")
            return None
    except ValueError:
        print_error("Entrada inválida")
        return None

def restore_sqlite(backup_file):
    """Restaurar base de datos SQLite"""
    try:
        # Verificar que el backup existe
        if not backup_file.exists():
            print_error(f"No se encontró el backup: {backup_file}")
            return False
        
        # Crear backup del archivo actual
        current_db = Path("backend/db.sqlite3")
        if current_db.exists():
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_current = Path(f"backups/current_db_{timestamp}.sqlite3")
            import shutil
            shutil.copy2(current_db, backup_current)
            print_status(f"Backup del archivo actual creado: {backup_current}")
        
        # Restaurar backup
        import shutil
        shutil.copy2(backup_file, current_db)
        
        print_success(f"Base de datos SQLite restaurada desde: {backup_file}")
        return True
        
    except Exception as e:
        print_error(f"Error restaurando SQLite: {e}")
        return False

def restore_postgresql(backup_file):
    """Restaurar base de datos PostgreSQL"""
    try:
        # Configuración de base de datos
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'simulador_db'),
            'user': os.getenv('DB_USER', 'simulador_user'),
            'password': os.getenv('DB_PASSWORD', '')
        }
        
        # Verificar que el backup existe
        if not backup_file.exists():
            print_error(f"No se encontró el backup: {backup_file}")
            return False
        
        # Comando psql
        cmd = [
            'psql',
            f'--host={db_config["host"]}',
            f'--port={db_config["port"]}',
            f'--username={db_config["user"]}',
            f'--dbname={db_config["database"]}',
            '--file=' + str(backup_file)
        ]
        
        # Ejecutar comando
        env = os.environ.copy()
        if db_config['password']:
            env['PGPASSWORD'] = db_config['password']
        
        print_status(f"Restaurando desde: {backup_file}")
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            print_success("Base de datos PostgreSQL restaurada exitosamente")
            return True
        else:
            print_error(f"Error en psql: {result.stderr}")
            return False
            
    except Exception as e:
        print_error(f"Error restaurando PostgreSQL: {e}")
        return False

def restore_mysql(backup_file):
    """Restaurar base de datos MySQL"""
    try:
        # Configuración de base de datos
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '3306'),
            'database': os.getenv('DB_NAME', 'simulador_db'),
            'user': os.getenv('DB_USER', 'simulador_user'),
            'password': os.getenv('DB_PASSWORD', '')
        }
        
        # Verificar que el backup existe
        if not backup_file.exists():
            print_error(f"No se encontró el backup: {backup_file}")
            return False
        
        # Comando mysql
        cmd = [
            'mysql',
            f'--host={db_config["host"]}',
            f'--port={db_config["port"]}',
            f'--user={db_config["user"]}',
            f'--password={db_config["password"]}',
            db_config['database']
        ]
        
        # Ejecutar comando
        with open(backup_file, 'r') as f:
            result = subprocess.run(cmd, stdin=f, stderr=subprocess.PIPE, text=True)
        
        if result.returncode == 0:
            print_success("Base de datos MySQL restaurada exitosamente")
            return True
        else:
            print_error(f"Error en mysql: {result.stderr}")
            return False
            
    except Exception as e:
        print_error(f"Error restaurando MySQL: {e}")
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
    print("🔄 Iniciando restauración de base de datos...")
    
    # Seleccionar backup
    backup_file = select_backup()
    if not backup_file:
        return False
    
    # Detectar tipo de base de datos
    db_type = detect_database_type()
    print_status(f"Tipo de base de datos detectado: {db_type}")
    
    # Confirmar restauración
    print(f"\n⚠️  ADVERTENCIA: Esta operación sobrescribirá la base de datos actual.")
    confirm = input("¿Estás seguro de que quieres continuar? (y/N): ")
    
    if confirm.lower() != 'y':
        print_status("Restauración cancelada")
        return True
    
    # Realizar restauración según el tipo
    success = False
    if db_type == "sqlite":
        success = restore_sqlite(backup_file)
    elif db_type == "postgresql":
        success = restore_postgresql(backup_file)
    elif db_type == "mysql":
        success = restore_mysql(backup_file)
    else:
        print_error(f"Tipo de base de datos no soportado: {db_type}")
        return False
    
    if success:
        print_success("✅ Restauración completada exitosamente")
        return True
    else:
        print_error("❌ Error en la restauración")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 