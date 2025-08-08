# Script para configurar acceso de red local al Simulador Saber 11
# Ejecutar como administrador si es necesario

Write-Host "=== Configurando acceso de red local ===" -ForegroundColor Green

# Obtener IP local
$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress
if (-not $ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress | Select-Object -First 1
}

Write-Host "IP detectada: $ip" -ForegroundColor Yellow

# Copiar archivos de configuración
Write-Host "Copiando archivos de configuración..." -ForegroundColor Yellow

if (Test-Path "backend/env.local.example") {
    Copy-Item "backend/env.local.example" "backend/.env" -Force
    Write-Host "✓ Archivo backend/.env creado" -ForegroundColor Green
}

if (Test-Path "frontend/env.local.example") {
    Copy-Item "frontend/env.local.example" "frontend/.env.local" -Force
    Write-Host "✓ Archivo frontend/.env.local creado" -ForegroundColor Green
}

# Verificar reglas de firewall (solo informativo)
Write-Host "`n=== Verificación de Firewall ===" -ForegroundColor Yellow
Write-Host "Asegurate de que los puertos 3000 y 8000 estén abiertos en el firewall" -ForegroundColor Yellow
Write-Host "Frontend: puerto 3000" -ForegroundColor Cyan
Write-Host "Backend: puerto 8000" -ForegroundColor Cyan

Write-Host "`n=== Instrucciones para acceso de red ===" -ForegroundColor Green
Write-Host "1. Desde esta máquina: http://localhost:3000" -ForegroundColor White
Write-Host "2. Desde otras máquinas de la red: http://$ip`:3000" -ForegroundColor White
Write-Host "`nNota: El backend estará disponible en http://$ip`:8000" -ForegroundColor Cyan

Write-Host "`n=== Comandos para iniciar ===" -ForegroundColor Green
Write-Host "docker-compose up --build" -ForegroundColor White

Write-Host "`nConfiguracion completada!" -ForegroundColor Green