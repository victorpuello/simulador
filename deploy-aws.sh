#!/bin/bash

# 🚀 Script de Deployment para AWS
# Autor: Simulador Saber 11
# Versión: 1.0

set -e  # Salir si hay error

echo "🚀 Iniciando deployment del Simulador Saber 11 en AWS..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar AWS CLI
print_status "Verificando AWS CLI..."
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI no está instalado. Instálalo primero:"
    echo "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Verificar configuración de AWS
print_status "Verificando configuración de AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS no está configurado. Ejecuta 'aws configure' primero."
    exit 1
fi

print_success "AWS CLI configurado correctamente."

# Obtener variables de entorno
print_status "Configurando variables de entorno..."

# Solicitar información al usuario
read -p "Ingresa el nombre del dominio (ej: simulador-saber11.com): " DOMAIN_NAME
read -p "Ingresa el environment (development/staging/production): " ENVIRONMENT
read -p "Ingresa la región AWS (ej: us-east-1): " AWS_REGION

# Generar secretos si no existen
if [ ! -f ".env.aws" ]; then
    print_status "Generando secretos seguros..."
    
    # Generar SECRET_KEY
    SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
    
    # Generar DB_PASSWORD
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Crear archivo de entorno
    cat > .env.aws << EOF
# Configuración AWS
AWS_REGION=${AWS_REGION}
DOMAIN_NAME=${DOMAIN_NAME}
ENVIRONMENT=${ENVIRONMENT}

# Configuración de la base de datos
DB_PASSWORD=${DB_PASSWORD}

# Configuración de Django
SECRET_KEY=${SECRET_KEY}
DEBUG=False
ALLOWED_HOSTS=${DOMAIN_NAME},*.${DOMAIN_NAME}
CORS_ALLOWED_ORIGINS=https://${DOMAIN_NAME},https://*.${DOMAIN_NAME}

# Configuración del frontend
VITE_API_URL=https://${DOMAIN_NAME}/api

# Configuración de seguridad
CSRF_TRUSTED_ORIGINS=https://${DOMAIN_NAME},https://*.${DOMAIN_NAME}
EOF

    print_success "Archivo .env.aws creado con secretos generados."
else
    print_status "Cargando configuración existente..."
    source .env.aws
fi

# Configurar región AWS
export AWS_DEFAULT_REGION=${AWS_REGION}

print_status "Configurando región AWS: ${AWS_REGION}"

# Crear ECR repositories
print_status "Creando ECR repositories..."

# Backend repository
aws ecr create-repository --repository-name simulador-backend --region ${AWS_REGION} || true
BACKEND_REPO_URI=$(aws ecr describe-repositories --repository-names simulador-backend --query 'repositories[0].repositoryUri' --output text)

# Frontend repository
aws ecr create-repository --repository-name simulador-frontend --region ${AWS_REGION} || true
FRONTEND_REPO_URI=$(aws ecr describe-repositories --repository-names simulador-frontend --query 'repositories[0].repositoryUri' --output text)

print_success "ECR repositories creados."

# Login a ECR
print_status "Haciendo login a ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${BACKEND_REPO_URI%/*}

# Construir y subir imágenes
print_status "Construyendo imagen del backend..."
docker build -t simulador-backend ./backend
docker tag simulador-backend:latest ${BACKEND_REPO_URI}:latest
docker push ${BACKEND_REPO_URI}:latest

print_status "Construyendo imagen del frontend..."
docker build -t simulador-frontend ./frontend
docker tag simulador-frontend:latest ${FRONTEND_REPO_URI}:latest
docker push ${FRONTEND_REPO_URI}:latest

print_success "Imágenes subidas a ECR."

# Desplegar CloudFormation stack
print_status "Desplegando infraestructura con CloudFormation..."

STACK_NAME="simulador-${ENVIRONMENT}"

aws cloudformation deploy \
    --template-file aws-deploy.yml \
    --stack-name ${STACK_NAME} \
    --parameter-overrides \
        Environment=${ENVIRONMENT} \
        DomainName=${DOMAIN_NAME} \
        DBPassword=${DB_PASSWORD} \
        SecretKey=${SECRET_KEY} \
    --capabilities CAPABILITY_NAMED_IAM \
    --region ${AWS_REGION}

print_success "Stack de CloudFormation desplegado."

# Esperar a que el stack esté completo
print_status "Esperando a que el stack esté completo..."
aws cloudformation wait stack-create-complete --stack-name ${STACK_NAME} --region ${AWS_REGION}

# Obtener outputs del stack
print_status "Obteniendo información del deployment..."

LOAD_BALANCER_DNS=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
    --output text)

DATABASE_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text)

S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
    --output text)

# Configurar DNS (si el usuario tiene Route53)
print_status "Configurando DNS..."
read -p "¿Tienes un dominio registrado en Route53? (y/n): " HAS_ROUTE53

if [ "$HAS_ROUTE53" = "y" ]; then
    # Crear hosted zone si no existe
    HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='${DOMAIN_NAME}.'].Id" --output text)
    
    if [ -z "$HOSTED_ZONE_ID" ]; then
        print_status "Creando hosted zone..."
        HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
            --name ${DOMAIN_NAME} \
            --caller-reference $(date +%s) \
            --query 'HostedZone.Id' \
            --output text)
    fi
    
    # Crear registro A
    aws route53 change-resource-record-sets \
        --hosted-zone-id ${HOSTED_ZONE_ID} \
        --change-batch '{
            "Changes": [
                {
                    "Action": "UPSERT",
                    "ResourceRecordSet": {
                        "Name": "'${DOMAIN_NAME}'",
                        "Type": "A",
                        "AliasTarget": {
                            "HostedZoneId": "Z35SXDOTRQ7X7K",
                            "DNSName": "'${LOAD_BALANCER_DNS}'",
                            "EvaluateTargetHealth": true
                        }
                    }
                }
            ]
        }'
    
    print_success "DNS configurado en Route53."
else
    print_warning "Configura manualmente el DNS de tu dominio para apuntar a: ${LOAD_BALANCER_DNS}"
fi

# Configurar SSL con Certificate Manager
print_status "Configurando certificado SSL..."
CERT_ARN=$(aws acm request-certificate \
    --domain-name ${DOMAIN_NAME} \
    --subject-alternative-names "*.${DOMAIN_NAME}" \
    --validation-method DNS \
    --query 'CertificateArn' \
    --output text)

print_warning "Certificado SSL solicitado. Debes validar el certificado en AWS Certificate Manager."

# Mostrar información final
print_success "🎉 ¡Deployment en AWS completado exitosamente!"
echo ""
echo "📋 Información del deployment:"
echo "   🌐 Load Balancer DNS: ${LOAD_BALANCER_DNS}"
echo "   🗄️  Database Endpoint: ${DATABASE_ENDPOINT}"
echo "   📦 S3 Bucket: ${S3_BUCKET}"
echo "   🔒 Certificate ARN: ${CERT_ARN}"
echo ""
echo "🔧 Próximos pasos:"
echo "   1. Valida el certificado SSL en AWS Certificate Manager"
echo "   2. Configura el DNS de tu dominio para apuntar a: ${LOAD_BALANCER_DNS}"
echo "   3. Actualiza el stack con el ARN del certificado validado"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs: aws logs tail /ecs/${ENVIRONMENT}-backend --follow"
echo "   Verificar servicios: aws ecs describe-services --cluster ${ENVIRONMENT}-simulador-cluster"
echo "   Actualizar stack: aws cloudformation deploy --template-file aws-deploy.yml --stack-name ${STACK_NAME}"
echo ""
print_warning "⚠️  IMPORTANTE: Cambia las credenciales por defecto después del primer acceso!"
echo "" 