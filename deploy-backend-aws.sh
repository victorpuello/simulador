#!/bin/bash

# 🚀 Script de Deployment Backend para AWS Amplify
# Este script despliega solo el backend Django en AWS ECS/EC2

set -e

echo "🚀 Iniciando deployment del backend..."

# Configuración
PROJECT_NAME="simulador-backend"
REGION="us-east-1"
CLUSTER_NAME="simulador-cluster"
SERVICE_NAME="simulador-backend-service"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI no está instalado. Por favor instálalo primero."
    exit 1
fi

# Verificar configuración AWS
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI no está configurado. Ejecuta 'aws configure' primero."
    exit 1
fi

print_status "AWS CLI configurado correctamente"

# Crear ECR repository si no existe
print_status "Creando ECR repository..."
aws ecr create-repository --repository-name $PROJECT_NAME --region $REGION 2>/dev/null || print_warning "Repository ya existe"

# Obtener ECR URI
ECR_URI=$(aws ecr describe-repositories --repository-names $PROJECT_NAME --region $REGION --query 'repositories[0].repositoryUri' --output text)

print_status "ECR URI: $ECR_URI"

# Login a ECR
print_status "Haciendo login a ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

# Construir imagen Docker
print_status "Construyendo imagen Docker..."
docker build -t $PROJECT_NAME ./backend

# Tag imagen
docker tag $PROJECT_NAME:latest $ECR_URI:latest

# Push imagen
print_status "Subiendo imagen a ECR..."
docker push $ECR_URI:latest

# Crear ECS cluster si no existe
print_status "Creando ECS cluster..."
aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $REGION 2>/dev/null || print_warning "Cluster ya existe"

# Crear task definition
print_status "Creando task definition..."
cat > task-definition.json << EOF
{
    "family": "$PROJECT_NAME",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "256",
    "memory": "512",
    "executionRoleArn": "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/ecsTaskExecutionRole",
    "containerDefinitions": [
        {
            "name": "$PROJECT_NAME",
            "image": "$ECR_URI:latest",
            "portMappings": [
                {
                    "containerPort": 8000,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {
                    "name": "DJANGO_SETTINGS_MODULE",
                    "value": "simulador.settings"
                },
                {
                    "name": "DATABASE_URL",
                    "value": "postgresql://user:password@host:5432/dbname"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/$PROJECT_NAME",
                    "awslogs-region": "$REGION",
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }
    ]
}
EOF

# Registrar task definition
print_status "Registrando task definition..."
aws ecs register-task-definition --cli-input-json file://task-definition.json --region $REGION

# Crear security group
print_status "Creando security group..."
aws ec2 create-security-group \
    --group-name $PROJECT_NAME-sg \
    --description "Security group for $PROJECT_NAME" \
    --region $REGION 2>/dev/null || print_warning "Security group ya existe"

SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$PROJECT_NAME-sg" \
    --region $REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

# Autorizar puerto 8000
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 8000 \
    --cidr 0.0.0.0/0 \
    --region $REGION 2>/dev/null || print_warning "Regla ya existe"

# Crear Application Load Balancer
print_status "Creando Application Load Balancer..."
aws elbv2 create-load-balancer \
    --name $PROJECT_NAME-alb \
    --subnets subnet-12345678 subnet-87654321 \
    --security-groups $SG_ID \
    --region $REGION 2>/dev/null || print_warning "ALB ya existe"

# Obtener ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names $PROJECT_NAME-alb \
    --region $REGION \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

# Crear target group
print_status "Creando target group..."
aws elbv2 create-target-group \
    --name $PROJECT_NAME-tg \
    --protocol HTTP \
    --port 8000 \
    --vpc-id vpc-12345678 \
    --target-type ip \
    --region $REGION 2>/dev/null || print_warning "Target group ya existe"

TG_ARN=$(aws elbv2 describe-target-groups \
    --names $PROJECT_NAME-tg \
    --region $REGION \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

# Crear listener
print_status "Creando listener..."
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN \
    --region $REGION 2>/dev/null || print_warning "Listener ya existe"

# Crear ECS service
print_status "Creando ECS service..."
aws ecs create-service \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_NAME \
    --task-definition $PROJECT_NAME \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$TG_ARN,containerName=$PROJECT_NAME,containerPort=8000" \
    --region $REGION 2>/dev/null || print_warning "Service ya existe"

# Obtener URL del ALB
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names $PROJECT_NAME-alb \
    --region $REGION \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

print_status "✅ Deployment completado!"
print_status "🌐 URL del backend: http://$ALB_DNS"
print_status "📊 Monitoreo: https://console.aws.amazon.com/ecs/home?region=$REGION#/clusters/$CLUSTER_NAME/services/$SERVICE_NAME"

# Limpiar archivos temporales
rm -f task-definition.json

echo ""
echo "🔧 Próximos pasos:"
echo "1. Configurar variables de entorno en ECS"
echo "2. Configurar base de datos RDS"
echo "3. Actualizar REACT_APP_API_URL en Amplify"
echo "4. Configurar dominio personalizado" 