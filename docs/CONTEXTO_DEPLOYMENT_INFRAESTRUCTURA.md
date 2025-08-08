# 🚀 Contexto de Deployment e Infraestructura - Simulador Saber 11

## 📋 **INFORMACIÓN GENERAL**

### **Proyecto**: Simulador Pruebas Saber 11 - Deployment
### **Arquitectura**: Frontend (React) + Backend (Django) separados
### **Hosting Recomendado**: AWS Amplify (Frontend) + AWS ECS/Railway (Backend)
### **Estado**: Configuraciones listas para deployment automático

---

## 🏗️ **ARQUITECTURA DE DEPLOYMENT**

### **Diagrama de Infraestructura**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React/Vite)  │◄──►│   (Django API)  │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ AWS Amplify     │    │ Railway/ECS     │    │ AWS RDS         │
│ CloudFront CDN  │    │ Load Balancer   │    │ ElastiCache     │
│ Auto SSL        │    │ Auto Scaling    │    │ Automated       │
│ Git Deploy      │    │ Health Checks   │    │ Backups         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Separación de Responsabilidades**
- **Frontend**: Servido estáticamente desde CDN
- **Backend**: API REST independiente con base de datos
- **Cache**: Redis para sesiones y cache de consultas
- **Storage**: AWS S3 para archivos estáticos y media
- **CDN**: CloudFront para distribución global

---

## 🌐 **FRONTEND DEPLOYMENT (AWS AMPLIFY)**

### **Configuración AWS Amplify**

#### **1. Archivo amplify.yml**
```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
        - echo "Instalando dependencias..."
    build:
      commands:
        - npm run build
        - echo "Build completado"
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

#### **2. Variables de Entorno**
```bash
# Variables en AWS Amplify Console
VITE_API_URL=https://tu-backend-api.com/api
VITE_ENVIRONMENT=production
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

#### **3. Configuración de Redirects**
```
# frontend/public/_redirects
# Single Page Application redirects
/*    /index.html   200

# API proxy (opcional)
/api/*    https://tu-backend-api.com/api/:splat    200
```

#### **4. Headers de Seguridad**
```
# frontend/public/_headers
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### **Proceso de Deployment Automático**

#### **1. Configuración Inicial**
```bash
# 1. Conectar repositorio GitHub a Amplify
# 2. Amplify detecta automáticamente React/Vite
# 3. Configurar rama de deployment (main)
# 4. Primera build automática
```

#### **2. Deployment Continuo**
```bash
# Cada push a main activa automáticamente:
git add .
git commit -m "Nueva funcionalidad"
git push origin main

# Amplify ejecuta:
# - Detecta cambios en GitHub
# - Ejecuta npm ci && npm run build
# - Despliega a CloudFront CDN
# - Invalida cache
# - Notifica resultado por email
```

#### **3. Preview Deployments**
```bash
# Crear rama para feature
git checkout -b feature/nueva-funcionalidad
git push origin feature/nueva-funcionalidad

# Amplify automáticamente crea:
# - URL preview: https://feature-nueva-funcionalidad.d1234567.amplifyapp.com
# - Build independiente
# - No afecta producción
```

### **Configuración de Dominio Personalizado**

#### **1. En AWS Amplify Console**
```
Domain management → Add domain
Domain: victorpuello.com
Subdomain: www (opcional)
```

#### **2. Configuración DNS en GoDaddy**
```
# Registros CNAME proporcionados por Amplify
Name: @
Value: d1234567890.cloudfront.net
Type: CNAME
TTL: 300

Name: www
Value: d1234567890.cloudfront.net
Type: CNAME
TTL: 300
```

#### **3. SSL Automático**
- Certificate Manager se configura automáticamente
- SSL gratuito con renovación automática
- HTTPS forzado en todas las peticiones

---

## 🔧 **BACKEND DEPLOYMENT**

### **Opción A: Railway (Recomendado para desarrollo)**

#### **1. Configuración Railway**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y conectar repositorio
railway login
railway init
railway connect

# Variables de entorno en Railway
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://user:pass@host:port
SECRET_KEY=tu-secret-key-muy-segura
DEBUG=False
ALLOWED_HOSTS=tu-app.railway.app,victorpuello.com
```

#### **2. Archivo railway.toml**
```toml
[build]
builder = "nixpacks"
buildCommand = "pip install -r requirements.txt && python manage.py collectstatic --noinput"

[deploy]
startCommand = "gunicorn simulador.wsgi:application --bind 0.0.0.0:$PORT"
healthcheckPath = "/api/health/"
healthcheckTimeout = 300
restartPolicyType = "on-failure"

[env]
PYTHONPATH = "/app"
PORT = "8000"
```

#### **3. Deployment Automático**
```bash
# Railway detecta cambios automáticamente
git push origin main

# Railway ejecuta:
# - Build de imagen Docker
# - Instalación de dependencias
# - Migraciones de base de datos
# - Recolección de archivos estáticos
# - Deployment con zero downtime
```

### **Opción B: AWS ECS Fargate (Producción)**

#### **1. Dockerfile para Producción**
```dockerfile
# backend/Dockerfile.aws
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Crear usuario no-root
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Exponer puerto
EXPOSE 8000

# Comando de inicio
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "simulador.wsgi:application"]
```

#### **2. Task Definition para ECS**
```json
{
  "family": "simulador-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "simulador-backend",
      "image": "your-ecr-repo/simulador-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DEBUG",
          "value": "False"
        },
        {
          "name": "ALLOWED_HOSTS",
          "value": "simulador-api.victorpuello.com"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:prod/database-url"
        },
        {
          "name": "SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:prod/secret-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/simulador-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8000/api/health/ || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### **3. Script de Deployment**
```bash
#!/bin/bash
# deploy-backend-aws.sh

set -e

echo "🚀 Iniciando deployment del backend..."

# 1. Build y push de imagen Docker
echo "📦 Building Docker image..."
docker build -f backend/Dockerfile.aws -t simulador-backend:latest backend/
docker tag simulador-backend:latest $ECR_REGISTRY/simulador-backend:latest
docker push $ECR_REGISTRY/simulador-backend:latest

# 2. Actualizar service en ECS
echo "🔄 Actualizando ECS service..."
aws ecs update-service \
  --cluster simulador-cluster \
  --service simulador-backend-service \
  --force-new-deployment

# 3. Esperar deployment
echo "⏳ Esperando deployment..."
aws ecs wait services-stable \
  --cluster simulador-cluster \
  --services simulador-backend-service

# 4. Verificar health
echo "🏥 Verificando health check..."
curl -f https://simulador-api.victorpuello.com/api/health/

echo "✅ Deployment completado exitosamente!"
```

---

## 🗄️ **BASE DE DATOS Y PERSISTENCIA**

### **PostgreSQL en AWS RDS**

#### **1. Configuración RDS**
```bash
# Especificaciones recomendadas
Instance Class: db.t3.micro (desarrollo) / db.t3.small (producción)
Engine: PostgreSQL 14+
Multi-AZ: Yes (producción)
Storage: 20GB SSD (auto-escalable)
Backup: 7 días retención
Maintenance Window: Sunday 03:00-04:00 UTC
```

#### **2. Variables de Conexión**
```bash
# Variables de entorno para Django
DATABASE_URL=postgresql://username:password@simulador-db.cluster-xyz.us-east-1.rds.amazonaws.com:5432/simulador_saber

# Configuración en settings.py
import dj_database_url

DATABASES = {
    'default': dj_database_url.parse(
        os.environ.get('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}
```

#### **3. Backup Automático**
```python
# backend/management/commands/backup_db.py
import os
import boto3
from datetime import datetime
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    def handle(self, *args, **options):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"simulador_backup_{timestamp}.sql"
        
        # Crear backup
        os.system(f"""
            pg_dump {os.environ['DATABASE_URL']} > /tmp/{backup_name}
        """)
        
        # Subir a S3
        s3 = boto3.client('s3')
        s3.upload_file(
            f'/tmp/{backup_name}',
            'simulador-backups',
            f'database/{backup_name}'
        )
        
        self.stdout.write(f"Backup creado: {backup_name}")
```

### **Redis Cache**

#### **1. AWS ElastiCache**
```bash
# Configuración ElastiCache
Node Type: cache.t3.micro
Redis Version: 6.2+
Number of Replicas: 1 (producción)
Subnet Group: private-subnets
Security Group: redis-sg
```

#### **2. Configuración Django**
```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            }
        },
        'KEY_PREFIX': 'simulador',
        'TIMEOUT': 300,
    }
}

# Cache para sesiones
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
```

---

## 📁 **ARCHIVOS ESTÁTICOS Y MEDIA**

### **AWS S3 + CloudFront**

#### **1. Configuración S3**
```python
# settings.py
if not DEBUG:
    # S3 Storage para archivos estáticos
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = 'simulador-static-files'
    AWS_S3_REGION_NAME = 'us-east-1'
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    
    # Configuración de archivos estáticos
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'
    
    # Configuración de archivos media
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
```

#### **2. CloudFront Distribution**
```json
{
  "DistributionConfig": {
    "CallerReference": "simulador-static-cdn",
    "Origins": [
      {
        "Id": "S3-simulador-static",
        "DomainName": "simulador-static-files.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ],
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-simulador-static",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
      "Compress": true
    },
    "Comment": "CDN for Simulador Saber 11 static files",
    "Enabled": true
  }
}
```

---

## 🔐 **SEGURIDAD Y CONFIGURACIÓN**

### **Variables de Entorno de Producción**

#### **1. Backend (Django)**
```bash
# Seguridad
SECRET_KEY=tu-secret-key-muy-larga-y-segura-de-50-caracteres
DEBUG=False
ALLOWED_HOSTS=simulador-api.victorpuello.com,api.simulador.com

# Base de datos
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://user:pass@host:port

# AWS
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=simulador-static-files

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=noreply@victorpuello.com
EMAIL_HOST_PASSWORD=app-specific-password
```

#### **2. Frontend (React)**
```bash
# API
VITE_API_URL=https://simulador-api.victorpuello.com/api
VITE_ENVIRONMENT=production

# Analytics
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Monitoring
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### **Configuración de Seguridad Django**
```python
# settings.py - Producción
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_SECONDS = 31536000
SECURE_REDIRECT_EXEMPT = []
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# CORS
CORS_ALLOWED_ORIGINS = [
    "https://victorpuello.com",
    "https://www.victorpuello.com",
    "https://simulador.victorpuello.com",
]

CORS_ALLOW_CREDENTIALS = True
```

---

## 📊 **MONITOREO Y OBSERVABILIDAD**

### **1. Health Checks**

#### **Backend Health Endpoint**
```python
# backend/apps/core/views.py
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache

def health_check(request):
    """Health check endpoint para load balancers"""
    try:
        # Verificar base de datos
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        # Verificar cache
        cache.set('health_check', 'ok', 10)
        cache_status = cache.get('health_check')
        
        return JsonResponse({
            'status': 'healthy',
            'database': 'ok',
            'cache': 'ok' if cache_status else 'error',
            'version': '1.0.0'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)
```

### **2. Logging Centralizado**

#### **Configuración de Logging**
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/app/logs/django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.simulacion': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
```

### **3. Métricas con Sentry**

#### **Configuración Sentry**
```python
# requirements.txt
sentry-sdk[django]==1.40.0

# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.redis import RedisIntegration

sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN'),
    integrations=[
        DjangoIntegration(
            transaction_style='url',
            middleware_spans=True,
        ),
        RedisIntegration(),
    ],
    traces_sample_rate=0.1,
    send_default_pii=True,
    environment=os.environ.get('ENVIRONMENT', 'production'),
)
```

---

## 🔄 **CI/CD PIPELINE**

### **GitHub Actions Workflow**

#### **1. Archivo .github/workflows/deploy.yml**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: simulador-backend

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_simulador
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
        
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        
    - name: Run tests
      run: |
        cd backend
        python manage.py test
        
    - name: Run linting
      run: |
        cd backend
        flake8 .
        black --check .

  test-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
        
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
        
    - name: Run tests
      run: |
        cd frontend
        npm test
        
    - name: Run linting
      run: |
        cd frontend
        npm run lint
        
    - name: Build
      run: |
        cd frontend
        npm run build

  deploy-backend:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build and push Docker image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -f backend/Dockerfile.aws -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG backend/
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        
    - name: Deploy to ECS
      run: |
        aws ecs update-service \
          --cluster simulador-cluster \
          --service simulador-backend-service \
          --force-new-deployment

  deploy-frontend:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to Amplify
      run: |
        echo "Frontend se despliega automáticamente via AWS Amplify"
        echo "✅ Amplify detectará el push y ejecutará el build automáticamente"
```

---

## 💰 **COSTOS ESTIMADOS**

### **Costos Mensuales AWS**

#### **Desarrollo**
```
AWS Amplify (Frontend):
- Builds: 1000 min/mes gratuitos
- Hosting: 15GB gratuitos
- Transfers: 15GB gratuitos
Total: $0/mes

Railway (Backend):
- Hobby Plan: $5/mes
- 512MB RAM, 1GB storage
Total: $5/mes

Total Desarrollo: ~$5/mes
```

#### **Producción**
```
AWS Amplify (Frontend):
- Builds: ~$5/mes (500 min adicionales)
- Hosting: ~$1/mes (5GB adicionales)
- Transfers: ~$10/mes (100GB)
Subtotal Amplify: ~$16/mes

AWS ECS Fargate (Backend):
- vCPU: $0.04048/hora × 24h × 30d = ~$29/mes
- RAM: $0.004445/GB/hora × 0.5GB × 24h × 30d = ~$1.6/mes
Subtotal ECS: ~$31/mes

AWS RDS PostgreSQL:
- db.t3.micro: ~$12/mes
- Storage: ~$2/mes (20GB)
Subtotal RDS: ~$14/mes

AWS ElastiCache Redis:
- cache.t3.micro: ~$11/mes
Subtotal Redis: ~$11/mes

Otros servicios:
- S3 + CloudFront: ~$5/mes
- Load Balancer: ~$18/mes
- Monitoring: ~$5/mes
Subtotal Otros: ~$28/mes

Total Producción: ~$100/mes
```

---

## 🛠️ **COMANDOS DE DEPLOYMENT**

### **Scripts Útiles**

#### **1. Deployment Completo**
```bash
#!/bin/bash
# deploy-full.sh

echo "🚀 Iniciando deployment completo..."

# Frontend (automático via Amplify)
echo "📱 Frontend: Push trigger automático"
git add frontend/
git commit -m "Update frontend"
git push origin main

# Backend
echo "🔧 Deploying backend..."
./scripts/deploy-backend-aws.sh

# Verificar deployments
echo "🔍 Verificando deployments..."
curl -f https://victorpuello.com/
curl -f https://simulador-api.victorpuello.com/api/health/

echo "✅ Deployment completo exitoso!"
```

#### **2. Rollback de Emergencia**
```bash
#!/bin/bash
# rollback.sh

echo "🔄 Iniciando rollback de emergencia..."

# Frontend - Rollback en Amplify Console
echo "📱 Frontend: Rollback manual requerido en Amplify Console"

# Backend - Rollback ECS
echo "🔧 Backend: Rollback ECS service..."
aws ecs update-service \
  --cluster simulador-cluster \
  --service simulador-backend-service \
  --task-definition simulador-backend:PREVIOUS_REVISION

echo "✅ Rollback completado!"
```

#### **3. Backup Manual**
```bash
#!/bin/bash
# backup.sh

echo "💾 Iniciando backup manual..."

# Database backup
python backend/manage.py backup_db

# Media files backup
aws s3 sync s3://simulador-media-files s3://simulador-backups/media/$(date +%Y%m%d)/

echo "✅ Backup completado!"
```

---

## 🔧 **CONFIGURACIÓN DE DESARROLLO LOCAL**

### **Docker Compose para Desarrollo**
```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: simulador_saber
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DEBUG=True
      - DATABASE_URL=postgresql://postgres:password@db:5432/simulador_saber
      - REDIS_URL=redis://redis:6379

  frontend:
    build: ./frontend
    command: npm run dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:8000/api

volumes:
  postgres_data:
```

### **Scripts de Desarrollo**
```bash
# start-simulador.bat (Windows)
@echo off
echo 🚀 Iniciando Simulador Saber 11...

echo 📦 Iniciando servicios con Docker Compose...
docker-compose up -d

echo ⏳ Esperando que los servicios estén listos...
timeout /t 10

echo 🌐 Abriendo aplicación en el navegador...
start http://localhost:3000

echo ✅ Simulador iniciado correctamente!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8000
echo 👑 Admin: http://localhost:8000/admin
echo 📚 API Docs: http://localhost:8000/api/docs/
echo.
pause
```

---

## 🚀 **PRÓXIMAS MEJORAS DE INFRAESTRUCTURA**

### **Escalabilidad**
- [ ] Kubernetes para orchestración avanzada
- [ ] Microservicios con API Gateway
- [ ] Database sharding para escalabilidad
- [ ] Auto-scaling basado en métricas
- [ ] CDN multi-región

### **Seguridad**
- [ ] WAF (Web Application Firewall)
- [ ] Secrets management con AWS Secrets Manager
- [ ] Network segmentation con VPC
- [ ] Regular security audits
- [ ] Penetration testing

### **Monitoring**
- [ ] Distributed tracing con Jaeger
- [ ] Custom metrics con Prometheus
- [ ] Alerting avanzado con PagerDuty
- [ ] Performance monitoring con New Relic
- [ ] User analytics con Mixpanel

---

**🎯 La infraestructura está configurada para deployment automático, escalabilidad y alta disponibilidad. Las configuraciones permiten desarrollo local eficiente y deployment a producción con zero downtime.**