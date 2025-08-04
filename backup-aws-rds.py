#!/usr/bin/env python3
"""
Script de Backup para AWS RDS
Autor: Simulador Saber 11
Versión: 1.0
"""

import os
import sys
import subprocess
import datetime
import json
import boto3
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

def get_aws_credentials():
    """Obtener credenciales de AWS"""
    try:
        # Intentar obtener credenciales del archivo .env.aws
        if Path(".env.aws").exists():
            with open(".env.aws", "r") as f:
                for line in f:
                    if line.startswith("AWS_ACCESS_KEY_ID="):
                        os.environ["AWS_ACCESS_KEY_ID"] = line.split("=", 1)[1].strip()
                    elif line.startswith("AWS_SECRET_ACCESS_KEY="):
                        os.environ["AWS_SECRET_ACCESS_KEY"] = line.split("=", 1)[1].strip()
                    elif line.startswith("AWS_REGION="):
                        os.environ["AWS_DEFAULT_REGION"] = line.split("=", 1)[1].strip()
        
        # Verificar que las credenciales estén disponibles
        session = boto3.Session()
        sts = session.client('sts')
        identity = sts.get_caller_identity()
        print_success(f"Credenciales AWS válidas para: {identity['Arn']}")
        return True
        
    except Exception as e:
        print_error(f"Error con credenciales AWS: {e}")
        return False

def get_rds_endpoint():
    """Obtener endpoint de RDS desde CloudFormation"""
    try:
        # Obtener stack name
        stack_name = os.getenv('STACK_NAME', 'simulador-production')
        region = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        
        # Crear cliente CloudFormation
        cf = boto3.client('cloudformation', region_name=region)
        
        # Obtener outputs del stack
        response = cf.describe_stacks(StackName=stack_name)
        outputs = response['Stacks'][0]['Outputs']
        
        # Buscar DatabaseEndpoint
        for output in outputs:
            if output['OutputKey'] == 'DatabaseEndpoint':
                return output['OutputValue']
        
        print_error("No se encontró DatabaseEndpoint en el stack")
        return None
        
    except Exception as e:
        print_error(f"Error obteniendo endpoint RDS: {e}")
        return None

def backup_rds_postgresql():
    """Backup de base de datos RDS PostgreSQL"""
    try:
        # Verificar credenciales AWS
        if not get_aws_credentials():
            return False
        
        # Obtener endpoint de RDS
        db_endpoint = get_rds_endpoint()
        if not db_endpoint:
            print_error("No se pudo obtener el endpoint de RDS")
            return False
        
        # Configuración de base de datos
        db_config = {
            'host': db_endpoint,
            'port': '5432',
            'database': 'simulador_db',
            'user': 'simulador_user',
            'password': os.getenv('DB_PASSWORD', '')
        }
        
        # Crear directorio de backups
        backup_dir = create_backup_directory()
        
        # Generar nombre del archivo de backup
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = backup_dir / f"backup_rds_postgres_{timestamp}.sql"
        
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
        
        print_status(f"Conectando a RDS: {db_config['host']}")
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            print_success(f"Backup RDS PostgreSQL creado: {backup_file}")
            
            # Comprimir backup
            compress_backup(backup_file)
            
            return True
        else:
            print_error(f"Error en pg_dump: {result.stderr}")
            return False
            
    except Exception as e:
        print_error(f"Error en backup RDS PostgreSQL: {e}")
        return False

def compress_backup(backup_file):
    """Comprimir archivo de backup"""
    try:
        import gzip
        
        # Comprimir archivo
        compressed_file = str(backup_file) + '.gz'
        with open(backup_file, 'rb') as f_in:
            with gzip.open(compressed_file, 'wb') as f_out:
                f_out.writelines(f_in)
        
        # Eliminar archivo original
        backup_file.unlink()
        
        print_success(f"Backup comprimido: {compressed_file}")
        
    except Exception as e:
        print_error(f"Error comprimiendo backup: {e}")

def upload_to_s3(backup_file):
    """Subir backup a S3"""
    try:
        # Obtener nombre del bucket desde CloudFormation
        stack_name = os.getenv('STACK_NAME', 'simulador-production')
        region = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        
        cf = boto3.client('cloudformation', region_name=region)
        response = cf.describe_stacks(StackName=stack_name)
        outputs = response['Stacks'][0]['Outputs']
        
        bucket_name = None
        for output in outputs:
            if output['OutputKey'] == 'S3BucketName':
                bucket_name = output['OutputValue']
                break
        
        if not bucket_name:
            print_error("No se encontró S3BucketName en el stack")
            return False
        
        # Subir a S3
        s3 = boto3.client('s3')
        s3_key = f"backups/{backup_file.name}"
        
        s3.upload_file(str(backup_file), bucket_name, s3_key)
        
        print_success(f"Backup subido a S3: s3://{bucket_name}/{s3_key}")
        return True
        
    except Exception as e:
        print_error(f"Error subiendo a S3: {e}")
        return False

def create_rds_snapshot():
    """Crear snapshot de RDS"""
    try:
        # Obtener identificador de la instancia RDS
        stack_name = os.getenv('STACK_NAME', 'simulador-production')
        region = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        
        rds = boto3.client('rds', region_name=region)
        
        # Listar instancias RDS
        response = rds.describe_db_instances()
        
        # Buscar instancia del simulador
        db_instance = None
        for instance in response['DBInstances']:
            if 'simulador' in instance['DBInstanceIdentifier'].lower():
                db_instance = instance
                break
        
        if not db_instance:
            print_error("No se encontró instancia RDS del simulador")
            return False
        
        # Crear snapshot
        timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        snapshot_id = f"simulador-backup-{timestamp}"
        
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_instance['DBInstanceIdentifier']
        )
        
        print_success(f"Snapshot RDS creado: {snapshot_id}")
        return True
        
    except Exception as e:
        print_error(f"Error creando snapshot RDS: {e}")
        return False

def main():
    """Función principal"""
    print("🗄️  Iniciando backup de RDS...")
    
    # Verificar que estamos en AWS
    if not get_aws_credentials():
        print_error("No se pudieron obtener credenciales AWS")
        return False
    
    # Crear backup local
    success = backup_rds_postgresql()
    
    if success:
        # Crear snapshot RDS
        create_rds_snapshot()
        
        print_success("✅ Backup de RDS completado exitosamente")
        return True
    else:
        print_error("❌ Error en el backup de RDS")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 