# 🚀 Deployment Simplificado AWS - Solo Base de Datos
# Este script crea solo la base de datos RDS para empezar

param(
    [string]$Region = "us-east-1",
    [string]$DBName = "simulador-db",
    [string]$DBUser = "simulador_user",
    [string]$DBPassword = "SimuladorPass123!",
    [string]$DatabaseName = "simulador_db",
    [switch]$Help = $false
)

if ($Help) {
    Write-Host "🚀 Deployment Simplificado AWS" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Este script crea una base de datos PostgreSQL en AWS RDS"
    Write-Host ""
    Write-Host "Uso:"
    Write-Host "  .\deploy-simple-aws.ps1                       # Crear BD con valores por defecto"
    Write-Host "  .\deploy-simple-aws.ps1 -DBPassword MiPass    # Personalizar password"
    Write-Host "  .\deploy-simple-aws.ps1 -Help                # Mostrar esta ayuda"
    Write-Host ""
    exit 0
}

# Colores para output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }

Write-Info "🚀 Iniciando deployment simplificado..."

# Verificar AWS CLI
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI no está instalado. Instálalo desde: https://aws.amazon.com/cli/"
    exit 1
}

try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Success "AWS CLI configurado para cuenta: $($identity.Account)"
} catch {
    Write-Error "AWS CLI no está configurado. Ejecuta 'aws configure' primero."
    exit 1
}

Write-Info "📋 Configuración de la Base de Datos:"
Write-Host "   🗄️  Nombre BD: $DBName" -ForegroundColor White
Write-Host "   👤 Usuario: $DBUser" -ForegroundColor White
Write-Host "   🔑 Password: $DBPassword" -ForegroundColor White
Write-Host "   💾 Database: $DatabaseName" -ForegroundColor White
Write-Host "   📍 Región: $Region" -ForegroundColor White

$confirm = Read-Host "¿Continuar con estos valores? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Info "Deployment cancelado"
    exit 0
}

Write-Info "💾 Creando base de datos PostgreSQL en AWS RDS..."

# Crear instancia RDS con configuración pública para facilitar testing
try {
    $result = aws rds create-db-instance `
        --db-instance-identifier $DBName `
        --db-instance-class db.t3.micro `
        --engine postgres `
        --engine-version 14.9 `
        --master-username $DBUser `
        --master-user-password $DBPassword `
        --allocated-storage 20 `
        --storage-type gp2 `
        --db-name $DatabaseName `
        --backup-retention-period 7 `
        --multi-az false `
        --publicly-accessible true `
        --storage-encrypted false `
        --region $Region `
        --output json
        
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✅ Base de datos creada exitosamente!"
        Write-Info "⏳ La base de datos tardará ~10-15 minutos en estar disponible"
        
        # Esperar un momento y obtener información del endpoint
        Write-Info "⏳ Esperando información del endpoint..."
        Start-Sleep -Seconds 30
        
        try {
            $dbinfo = aws rds describe-db-instances --db-instance-identifier $DBName --region $Region --output json | ConvertFrom-Json
            $endpoint = $dbinfo.DBInstances[0].Endpoint.Address
            $port = $dbinfo.DBInstances[0].Endpoint.Port
            
            Write-Success "📝 Información de conexión:"
            Write-Host ""
            Write-Host "🔗 Endpoint de conexión:" -ForegroundColor Yellow
            Write-Host "   Host: $endpoint" -ForegroundColor Green
            Write-Host "   Port: $port" -ForegroundColor Green
            Write-Host "   Database: $DatabaseName" -ForegroundColor Green
            Write-Host "   Username: $DBUser" -ForegroundColor Green
            Write-Host "   Password: $DBPassword" -ForegroundColor Green
            Write-Host ""
            Write-Host "🔗 URL de conexión completa:" -ForegroundColor Yellow
            Write-Host "   postgresql://$DBUser`:$DBPassword@$endpoint`:$port/$DatabaseName" -ForegroundColor Green
            Write-Host ""
            Write-Host "🔧 Para usar en Django (settings.py):" -ForegroundColor Yellow
            Write-Host "   DATABASE_URL=postgresql://$DBUser`:$DBPassword@$endpoint`:$port/$DatabaseName" -ForegroundColor Green
            Write-Host ""
            Write-Host "🔧 Para Amplify Environment Variables:" -ForegroundColor Yellow
            Write-Host "   VITE_API_URL=https://tu-backend-desplegado.com/api" -ForegroundColor Green
            
        } catch {
            Write-Warning "No se pudo obtener el endpoint aún. Ejecuta este comando en 10-15 minutos:"
            Write-Host "aws rds describe-db-instances --db-instance-identifier $DBName --region $Region" -ForegroundColor Cyan
        }
        
        Write-Info "📋 Próximos pasos:"
        Write-Host "   1. ✅ Base de datos creada (esperando disponibilidad)" -ForegroundColor Green
        Write-Host "   2. 🔄 Esperar ~15 minutos para que esté disponible" -ForegroundColor Cyan
        Write-Host "   3. 🚀 Desplegar backend en AWS App Runner o ECS" -ForegroundColor Cyan
        Write-Host "   4. 🔧 Configurar variables de entorno en Amplify" -ForegroundColor Cyan
        
    } else {
        Write-Error "Error creando la base de datos"
        exit 1
    }
    
} catch {
    Write-Error "Error: $_"
    Write-Warning "La instancia posiblemente ya existe. Para verificar:"
    Write-Host "aws rds describe-db-instances --db-instance-identifier $DBName --region $Region" -ForegroundColor Cyan
}

Write-Success "✅ Script completado!"
Write-Info "🔍 Para verificar el estado: aws rds describe-db-instances --db-instance-identifier $DBName"