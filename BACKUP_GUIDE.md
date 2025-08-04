# 🗄️ **GUÍA DE BACKUP Y RESTAURACIÓN**

## 📋 **RESUMEN**

Esta guía te explica cómo hacer backup y restaurar la base de datos del Simulador Saber 11, tanto en desarrollo local como en producción AWS.

---

## 🔧 **BACKUP LOCAL**

### **1. Backup Automático**

```bash
# Ejecutar script de backup
python backup-db.py
```

**El script automáticamente:**
- ✅ Detecta el tipo de base de datos (SQLite/PostgreSQL/MySQL)
- ✅ Crea directorio `backups/` si no existe
- ✅ Genera backup con timestamp
- ✅ Comprime archivos grandes

### **2. Backup Manual**

#### **SQLite:**
```bash
# Copiar archivo de base de datos
cp backend/db.sqlite3 backups/backup_sqlite_$(date +%Y%m%d_%H%M%S).sqlite3
```

#### **PostgreSQL:**
```bash
# Backup con pg_dump
pg_dump -h localhost -U simulador_user -d simulador_db > backups/backup_postgres_$(date +%Y%m%d_%H%M%S).sql
```

#### **MySQL:**
```bash
# Backup con mysqldump
mysqldump -h localhost -u simulador_user -p simulador_db > backups/backup_mysql_$(date +%Y%m%d_%H%M%S).sql
```

---

## ☁️ **BACKUP AWS RDS**

### **1. Backup Automático**

```bash
# Ejecutar script de backup AWS
python backup-aws-rds.py
```

**El script automáticamente:**
- ✅ Conecta a AWS RDS
- ✅ Crea backup local comprimido
- ✅ Crea snapshot de RDS
- ✅ Sube backup a S3 (opcional)

### **2. Backup Manual AWS**

#### **Desde AWS Console:**
1. Ve a **RDS → Snapshots**
2. Selecciona tu instancia
3. Click en **"Take snapshot"**
4. Nombra el snapshot
5. Click en **"Take snapshot"**

#### **Desde AWS CLI:**
```bash
# Crear snapshot
aws rds create-db-snapshot \
    --db-instance-identifier production-simulador-db \
    --db-snapshot-identifier simulador-backup-$(date +%Y%m%d-%H%M%S)

# Listar snapshots
aws rds describe-db-snapshots --db-instance-identifier production-simulador-db
```

#### **Backup directo desde RDS:**
```bash
# Obtener endpoint de RDS
ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name simulador-production \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text)

# Backup con pg_dump
pg_dump -h $ENDPOINT -U simulador_user -d simulador_db > backup_rds_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🔄 **RESTAURACIÓN**

### **1. Restauración Automática**

```bash
# Ejecutar script de restauración
python restore-db.py
```

**El script automáticamente:**
- ✅ Lista backups disponibles
- ✅ Te permite seleccionar backup
- ✅ Confirma antes de restaurar
- ✅ Crea backup del estado actual
- ✅ Restaura la base de datos

### **2. Restauración Manual**

#### **SQLite:**
```bash
# Restaurar archivo
cp backups/backup_sqlite_20241201_143022.sqlite3 backend/db.sqlite3
```

#### **PostgreSQL:**
```bash
# Restaurar con psql
psql -h localhost -U simulador_user -d simulador_db < backups/backup_postgres_20241201_143022.sql
```

#### **MySQL:**
```bash
# Restaurar con mysql
mysql -h localhost -u simulador_user -p simulador_db < backups/backup_mysql_20241201_143022.sql
```

### **3. Restauración AWS RDS**

#### **Desde AWS Console:**
1. Ve a **RDS → Snapshots**
2. Selecciona el snapshot
3. Click en **"Restore snapshot"**
4. Configura nueva instancia
5. Click en **"Restore DB Instance"**

#### **Desde AWS CLI:**
```bash
# Restaurar snapshot
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier simulador-restored \
    --db-snapshot-identifier simulador-backup-20241201-143022
```

---

## 📅 **PROGRAMACIÓN DE BACKUPS**

### **1. Cron Job (Linux/macOS)**

```bash
# Editar crontab
crontab -e

# Backup diario a las 2:00 AM
0 2 * * * cd /path/to/simulador && python backup-db.py

# Backup semanal los domingos a las 3:00 AM
0 3 * * 0 cd /path/to/simulador && python backup-aws-rds.py
```

### **2. Task Scheduler (Windows)**

```batch
# Crear script batch
@echo off
cd /d G:\Simulador Saber 11\Simulador
python backup-db.py
```

**Configurar en Task Scheduler:**
1. Abrir **Task Scheduler**
2. **Create Basic Task**
3. Nombre: "Backup Simulador"
4. Trigger: Daily at 2:00 AM
5. Action: Start a program
6. Program: `G:\Simulador Saber 11\Simulador\backup.bat`

### **3. AWS Lambda (Automático)**

```python
# backup-lambda.py
import boto3
import datetime

def lambda_handler(event, context):
    rds = boto3.client('rds')
    
    # Crear snapshot
    timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    snapshot_id = f"simulador-auto-backup-{timestamp}"
    
    rds.create_db_snapshot(
        DBSnapshotIdentifier=snapshot_id,
        DBInstanceIdentifier='production-simulador-db'
    )
    
    return {
        'statusCode': 200,
        'body': f'Snapshot created: {snapshot_id}'
    }
```

---

## 🔍 **VERIFICACIÓN DE BACKUPS**

### **1. Listar Backups Locales**

```bash
# Ver backups disponibles
ls -la backups/

# Ver tamaño y fecha
ls -lh backups/
```

### **2. Verificar Backups AWS**

```bash
# Listar snapshots RDS
aws rds describe-db-snapshots --db-instance-identifier production-simulador-db

# Listar archivos en S3
aws s3 ls s3://production-simulador-static-850219180384/backups/
```

### **3. Verificar Integridad**

```bash
# Verificar archivo SQLite
sqlite3 backups/backup_sqlite_20241201_143022.sqlite3 ".tables"

# Verificar archivo PostgreSQL
head -20 backups/backup_postgres_20241201_143022.sql
```

---

## 🚨 **MEJORES PRÁCTICAS**

### **1. Frecuencia de Backups**
- ✅ **Desarrollo**: Diario o antes de cambios importantes
- ✅ **Producción**: Diario automático + semanal manual
- ✅ **Antes de updates**: Siempre hacer backup

### **2. Almacenamiento**
- ✅ **Local**: Directorio `backups/`
- ✅ **AWS**: S3 + RDS Snapshots
- ✅ **Retención**: 30 días para desarrollo, 90 días para producción

### **3. Seguridad**
- ✅ **Encriptar**: Backups sensibles
- ✅ **Acceso limitado**: Solo administradores
- ✅ **Verificar**: Probar restauraciones periódicamente

### **4. Monitoreo**
- ✅ **Logs**: Revisar logs de backup
- ✅ **Tamaño**: Monitorear tamaño de backups
- ✅ **Espacio**: Verificar espacio disponible

---

## 🔧 **TROUBLESHOOTING**

### **Problemas Comunes**

#### **Error: "pg_dump: command not found"**
```bash
# Instalar PostgreSQL client
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Windows
# Descargar desde: https://www.postgresql.org/download/windows/
```

#### **Error: "mysqldump: command not found"**
```bash
# Instalar MySQL client
# Ubuntu/Debian
sudo apt-get install mysql-client

# macOS
brew install mysql

# Windows
# Descargar desde: https://dev.mysql.com/downloads/mysql/
```

#### **Error: "Permission denied"**
```bash
# Verificar permisos
chmod +x backup-db.py
chmod +x restore-db.py

# Verificar acceso a base de datos
psql -h localhost -U simulador_user -d simulador_db -c "SELECT 1;"
```

#### **Error: "AWS credentials not found"**
```bash
# Configurar credenciales AWS
aws configure

# O verificar archivo .env.aws
cat .env.aws
```

---

## 📞 **SOPORTE**

### **Comandos Útiles**

```bash
# Verificar tipo de base de datos
python -c "import os; print(os.getenv('DATABASE_URL', 'sqlite'))"

# Verificar conectividad
python -c "import django; django.setup(); from django.db import connection; print(connection.ensure_connection())"

# Verificar espacio en disco
df -h backups/

# Verificar logs
tail -f backup.log
```

### **Contacto**
- **Documentación**: Este archivo
- **Issues**: GitHub repository
- **Soporte**: victor.puello@example.com

---

**¡Con estos scripts tendrás un sistema de backup robusto y confiable! 🚀** 