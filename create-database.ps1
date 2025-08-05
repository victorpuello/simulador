# 🚀 Script Simple para Crear Base de Datos AWS RDS

param(
    [string]$DBName = "simulador-db",
    [string]$DBUser = "simulador_user", 
    [string]$DBPassword = "SimuladorPass123!",
    [string]$DatabaseName = "simulador_db",
    [string]$Region = "us-east-1"
)

Write-Host "🚀 Creando base de datos PostgreSQL en AWS RDS..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Configuración:" -ForegroundColor Yellow
Write-Host "   Nombre BD: $DBName"
Write-Host "   Usuario: $DBUser"
Write-Host "   Database: $DatabaseName"
Write-Host "   Región: $Region"
Write-Host ""

$confirm = Read-Host "¿Continuar? (y/n)"
if ($confirm -ne "y") {
    Write-Host "❌ Cancelado" -ForegroundColor Red
    exit 0
}

Write-Host "💾 Creando instancia RDS..." -ForegroundColor Cyan

# Crear instancia RDS
aws rds create-db-instance `
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
    --region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de datos creada exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ La base de datos tardará ~10-15 minutos en estar disponible" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Para obtener el endpoint cuando esté lista:" -ForegroundColor Cyan
    Write-Host "aws rds describe-db-instances --db-instance-identifier $DBName --region $Region" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Credenciales:" -ForegroundColor Yellow
    Write-Host "   Host: [Obtener con comando anterior]"
    Write-Host "   Port: 5432"
    Write-Host "   Database: $DatabaseName"
    Write-Host "   Username: $DBUser"
    Write-Host "   Password: $DBPassword"
} else {
    Write-Host "❌ Error creando la base de datos" -ForegroundColor Red
    Write-Host "💡 Posiblemente ya existe. Verifica con:" -ForegroundColor Yellow
    Write-Host "aws rds describe-db-instances --db-instance-identifier $DBName --region $Region" -ForegroundColor White
}

Write-Host ""
Write-Host "Script completado!" -ForegroundColor Green