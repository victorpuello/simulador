# 🚀 Script de Deployment Backend para AWS (Windows PowerShell)
# Este script despliega el backend Django en AWS ECS + RDS

param(
    [string]$Region = "us-east-1",
    [string]$ProjectName = "simulador-backend",
    [switch]$SkipBuild = $false,
    [switch]$OnlyDB = $false,
    [switch]$Help = $false
)

if ($Help) {
    Write-Host "🚀 Script de Deployment Backend AWS" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso:"
    Write-Host "  .\deploy-backend-windows.ps1                  # Deployment completo"
    Write-Host "  .\deploy-backend-windows.ps1 -OnlyDB         # Solo crear base de datos"
    Write-Host "  .\deploy-backend-windows.ps1 -SkipBuild      # Saltar build de Docker"
    Write-Host "  .\deploy-backend-windows.ps1 -Help           # Mostrar esta ayuda"
    Write-Host ""
    exit 0
}

# Colores para output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }

Write-Info "🚀 Iniciando deployment del backend..."
Write-Info "📍 Región: $Region"
Write-Info "📦 Proyecto: $ProjectName"

# Verificar requisitos
Write-Info "🔍 Verificando requisitos..."

if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI no está instalado. Instálalo desde: https://aws.amazon.com/cli/"
    exit 1
}

if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker no está instalado. Instálalo desde: https://www.docker.com/products/docker-desktop"
    exit 1
}

try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Success "AWS CLI configurado para cuenta: $($identity.Account)"
} catch {
    Write-Error "AWS CLI no está configurado. Ejecuta 'aws configure' primero."
    exit 1
}

# Variables
$ECR_REPO = "$ProjectName"
$CLUSTER_NAME = "$ProjectName-cluster"
$SERVICE_NAME = "$ProjectName-service"
$DB_NAME = "$ProjectName-db"
$ACCOUNT_ID = $identity.Account

Write-Info "📋 Configuración:"
Write-Host "   🏗️  ECR Repository: $ECR_REPO" -ForegroundColor White
Write-Host "   🎯 ECS Cluster: $CLUSTER_NAME" -ForegroundColor White
Write-Host "   🚀 ECS Service: $SERVICE_NAME" -ForegroundColor White
Write-Host "   💾 RDS Database: $DB_NAME" -ForegroundColor White

# Función para crear RDS
function Create-RDS {
    Write-Info "💾 Configurando base de datos RDS..."
    
    # Crear subnet group
    try {
        aws rds create-db-subnet-group --db-subnet-group-name "$DB_NAME-subnet-group" --db-subnet-group-description "Subnet group for $DB_NAME" --subnet-ids "subnet-12345678" "subnet-87654321" --region $Region 2>$null
        Write-Success "Subnet group creado"
    } catch {
        Write-Warning "Subnet group ya existe o error creándolo"
    }
    
    # Crear security group para RDS
    try {
        $sg_id = aws ec2 create-security-group --group-name "$DB_NAME-sg" --description "Security group for $DB_NAME" --region $Region --output text --query 'GroupId'
        Write-Success "Security group creado: $sg_id"
        
        # Permitir acceso PostgreSQL desde ECS
        aws ec2 authorize-security-group-ingress --group-id $sg_id --protocol tcp --port 5432 --source-group $sg_id --region $Region
        Write-Success "Reglas de firewall configuradas"
    } catch {
        Write-Warning "Security group ya existe o error"
    }
    
    # Crear instancia RDS
    Write-Info "🛠️  Creando instancia PostgreSQL..."
    try {
        aws rds create-db-instance --db-instance-identifier $DB_NAME --db-instance-class db.t3.micro --engine postgres --engine-version 14.9 --master-username simulador_user --master-user-password "SimuladorPass123!" --allocated-storage 20 --storage-type gp2 --db-name simulador_db --vpc-security-group-ids $sg_id --db-subnet-group-name "$DB_NAME-subnet-group" --backup-retention-period 7 --multi-az false --publicly-accessible false --storage-encrypted true --region $Region
        
        Write-Success "✅ Instancia RDS creada exitosamente!"
        Write-Info "⏳ La base de datos tardará ~10-15 minutos en estar disponible"
        Write-Info "📝 Credenciales de la BD:"
        Write-Host "   🏗️  Host: $DB_NAME.$Region.rds.amazonaws.com" -ForegroundColor Yellow
        Write-Host "   👤 Usuario: simulador_user" -ForegroundColor Yellow
        Write-Host "   🔑 Password: SimuladorPass123!" -ForegroundColor Yellow
        Write-Host "   💾 Database: simulador_db" -ForegroundColor Yellow
        
    } catch {
        Write-Warning "Instancia RDS ya existe o error creándola"
    }
}

# Función para crear ECS
function Create-ECS {
    Write-Info "🎯 Configurando ECS..."
    
    # Crear cluster
    try {
        aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $Region
        Write-Success "ECS Cluster creado: $CLUSTER_NAME"
    } catch {
        Write-Warning "ECS Cluster ya existe"
    }
    
    # Crear ECR repository
    try {
        aws ecr create-repository --repository-name $ECR_REPO --region $Region
        Write-Success "ECR Repository creado: $ECR_REPO"
    } catch {
        Write-Warning "ECR Repository ya existe"
    }
    
    # Login a ECR
    Write-Info "🔐 Haciendo login a ECR..."
    $ECR_LOGIN = aws ecr get-login-password --region $Region
    echo $ECR_LOGIN | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$Region.amazonaws.com"
    Write-Success "Login a ECR exitoso"
    
    if (!$SkipBuild) {
        # Build imagen Docker
        Write-Info "🐳 Construyendo imagen Docker..."
        docker build -t $ECR_REPO ./backend
        Write-Success "Imagen Docker construida"
        
        # Tag y push imagen
        $ECR_URI = "$ACCOUNT_ID.dkr.ecr.$Region.amazonaws.com/$ECR_REPO:latest"
        docker tag "$ECR_REPO:latest" $ECR_URI
        docker push $ECR_URI
        Write-Success "Imagen subida a ECR: $ECR_URI"
    }
    
    Write-Success "✅ ECS configurado exitosamente!"
}

# Ejecutar deployment
if ($OnlyDB) {
    Create-RDS
} else {
    Create-RDS
    Create-ECS
    
    Write-Success "🎉 ¡Deployment completado!"
    Write-Info "📋 Próximos pasos:"
    Write-Host "   1. Esperar que RDS esté disponible (~15 min)" -ForegroundColor Cyan
    Write-Host "   2. Crear task definition en ECS Console" -ForegroundColor Cyan
    Write-Host "   3. Crear ECS Service" -ForegroundColor Cyan
    Write-Host "   4. Configurar Application Load Balancer" -ForegroundColor Cyan
    Write-Host "   5. Actualizar variable VITE_API_URL en Amplify" -ForegroundColor Cyan
}

Write-Info "✅ Script completado!"