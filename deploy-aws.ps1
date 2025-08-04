# 🚀 Script de Deployment para AWS - PowerShell
# Autor: Simulador Saber 11
# Versión: 1.0

# Configurar para salir en caso de error
$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando deployment del Simulador Saber 11 en AWS..." -ForegroundColor Cyan

# Función para imprimir mensajes
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Verificar AWS CLI
Write-Status "Verificando AWS CLI..."
try {
    $null = Get-Command aws -ErrorAction Stop
} catch {
    Write-Error "AWS CLI no está instalado. Instálalo primero:"
    Write-Host "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
}

# Verificar configuración de AWS
Write-Status "Verificando configuración de AWS..."
try {
    $null = aws sts get-caller-identity 2>$null
} catch {
    Write-Error "AWS no está configurado. Ejecuta 'aws configure' primero."
    exit 1
}

Write-Success "AWS CLI configurado correctamente."

# Obtener variables de entorno
Write-Status "Configurando variables de entorno..."

# Solicitar información al usuario
$DomainName = Read-Host "Ingresa el nombre del dominio (ej: simulador-saber11.com)"
$Environment = Read-Host "Ingresa el environment (development/staging/production)"
$AWSRegion = Read-Host "Ingresa la región AWS (ej: us-east-1)"

# Generar secretos si no existen
if (-not (Test-Path ".env.aws")) {
    Write-Status "Generando secretos seguros..."
    
    # Generar SECRET_KEY
    Add-Type -AssemblyName System.Web
    $SecretKey = [System.Web.Security.Membership]::GeneratePassword(50, 10)
    
    # Generar DB_PASSWORD
    $DBPassword = [System.Web.Security.Membership]::GeneratePassword(32, 10)
    
    # Crear archivo de entorno
    @"
# Configuración AWS
AWS_REGION=$AWSRegion
DOMAIN_NAME=$DomainName
ENVIRONMENT=$Environment

# Configuración de la base de datos
DB_PASSWORD=$DBPassword

# Configuración de Django
SECRET_KEY=$SecretKey
DEBUG=False
ALLOWED_HOSTS=$DomainName,*.$DomainName
CORS_ALLOWED_ORIGINS=https://$DomainName,https://*.$DomainName

# Configuración del frontend
VITE_API_URL=https://$DomainName/api

# Configuración de seguridad
CSRF_TRUSTED_ORIGINS=https://$DomainName,https://*.$DomainName
"@ | Out-File -FilePath ".env.aws" -Encoding UTF8

    Write-Success "Archivo .env.aws creado con secretos generados."
} else {
    Write-Status "Cargando configuración existente..."
    Get-Content ".env.aws" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            Set-Variable -Name $matches[1] -Value $matches[2]
        }
    }
}

# Configurar región AWS
$env:AWS_DEFAULT_REGION = $AWSRegion

Write-Status "Configurando región AWS: $AWSRegion"

# Crear ECR repositories
Write-Status "Creando ECR repositories..."

# Backend repository
try {
    aws ecr create-repository --repository-name simulador-backend --region $AWSRegion 2>$null
} catch {
    # Repository ya existe
}

$BackendRepoUri = aws ecr describe-repositories --repository-names simulador-backend --query "repositories[0].repositoryUri" --output text --region $AWSRegion

# Frontend repository
try {
    aws ecr create-repository --repository-name simulador-frontend --region $AWSRegion 2>$null
} catch {
    # Repository ya existe
}

$FrontendRepoUri = aws ecr describe-repositories --repository-names simulador-frontend --query "repositories[0].repositoryUri" --output text --region $AWSRegion

Write-Success "ECR repositories creados."

# Login a ECR
Write-Status "Haciendo login a ECR..."
$ECRLogin = aws ecr get-login-password --region $AWSRegion
$ECRLogin | docker login --username AWS --password-stdin ($BackendRepoUri -replace "/[^/]+$", "")

# Construir y subir imágenes
Write-Status "Construyendo imagen del backend..."
docker build -t simulador-backend ./backend
docker tag simulador-backend:latest "$BackendRepoUri`:latest"
docker push "$BackendRepoUri`:latest"

Write-Status "Construyendo imagen del frontend..."
docker build -t simulador-frontend ./frontend
docker tag simulador-frontend:latest "$FrontendRepoUri`:latest"
docker push "$FrontendRepoUri`:latest"

Write-Success "Imágenes subidas a ECR."

# Desplegar CloudFormation stack
Write-Status "Desplegando infraestructura con CloudFormation..."

$StackName = "simulador-$Environment"

aws cloudformation deploy `
    --template-file aws-deploy.yml `
    --stack-name $StackName `
    --parameter-overrides `
        Environment=$Environment `
        DomainName=$DomainName `
        DBPassword=$DBPassword `
        SecretKey=$SecretKey `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $AWSRegion

Write-Success "Stack de CloudFormation desplegado."

# Esperar a que el stack esté completo
Write-Status "Esperando a que el stack esté completo..."
aws cloudformation wait stack-create-complete --stack-name $StackName --region $AWSRegion

# Obtener outputs del stack
Write-Status "Obteniendo información del deployment..."

$LoadBalancerDNS = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" --output text --region $AWSRegion
$DatabaseEndpoint = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" --output text --region $AWSRegion
$S3Bucket = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" --output text --region $AWSRegion

# Configurar DNS (si el usuario tiene Route53)
Write-Status "Configurando DNS..."
$HasRoute53 = Read-Host "¿Tienes un dominio registrado en Route53? (y/n)"

if ($HasRoute53 -eq "y") {
    # Crear hosted zone si no existe
    $HostedZoneId = aws route53 list-hosted-zones --query "HostedZones[?Name=='$DomainName.'].Id" --output text --region $AWSRegion
    
    if (-not $HostedZoneId) {
        Write-Status "Creando hosted zone..."
        $HostedZoneId = aws route53 create-hosted-zone --name $DomainName --caller-reference (Get-Date -UFormat %s) --query "HostedZone.Id" --output text --region $AWSRegion
    }
    
    # Crear registro A
    $ChangeBatch = @{
        Changes = @(
            @{
                Action = "UPSERT"
                ResourceRecordSet = @{
                    Name = $DomainName
                    Type = "A"
                    AliasTarget = @{
                        HostedZoneId = "Z35SXDOTRQ7X7K"
                        DNSName = $LoadBalancerDNS
                        EvaluateTargetHealth = $true
                    }
                }
            }
        )
    } | ConvertTo-Json -Depth 10
    
    aws route53 change-resource-record-sets --hosted-zone-id $HostedZoneId --change-batch $ChangeBatch --region $AWSRegion
    
    Write-Success "DNS configurado en Route53."
} else {
    Write-Warning "Configura manualmente el DNS de tu dominio para apuntar a: $LoadBalancerDNS"
}

# Configurar SSL con Certificate Manager
Write-Status "Configurando certificado SSL..."
$CertArn = aws acm request-certificate --domain-name $DomainName --subject-alternative-names "*.$DomainName" --validation-method DNS --query "CertificateArn" --output text --region $AWSRegion

Write-Warning "Certificado SSL solicitado. Debes validar el certificado en AWS Certificate Manager."

# Mostrar información final
Write-Success "🎉 ¡Deployment en AWS completado exitosamente!"
Write-Host ""
Write-Host "📋 Información del deployment:"
Write-Host "   🌐 Load Balancer DNS: $LoadBalancerDNS"
Write-Host "   🗄️  Database Endpoint: $DatabaseEndpoint"
Write-Host "   📦 S3 Bucket: $S3Bucket"
Write-Host "   🔒 Certificate ARN: $CertArn"
Write-Host ""
Write-Host "🔧 Próximos pasos:"
Write-Host "   1. Valida el certificado SSL en AWS Certificate Manager"
Write-Host "   2. Configura el DNS de tu dominio para apuntar a: $LoadBalancerDNS"
Write-Host "   3. Actualiza el stack con el ARN del certificado validado"
Write-Host ""
Write-Host "📝 Comandos útiles:"
Write-Host "   Ver logs: aws logs tail /ecs/$Environment-backend --follow"
Write-Host "   Verificar servicios: aws ecs describe-services --cluster $Environment-simulador-cluster"
Write-Host "   Actualizar stack: aws cloudformation deploy --template-file aws-deploy.yml --stack-name $StackName"
Write-Host ""
Write-Warning "⚠️  IMPORTANTE: Cambia las credenciales por defecto después del primer acceso!"
Write-Host ""

Read-Host "Presiona Enter para continuar..." 