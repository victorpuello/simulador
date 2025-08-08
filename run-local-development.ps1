# Script para ejecutar el Simulador Saber 11 sin Docker
# Para acceso de red local

Write-Host "=== Simulador Saber 11 - Desarrollo Local ===" -ForegroundColor Green

# Verificar dependencias
Write-Host "`nVerificando dependencias..." -ForegroundColor Yellow

# Verificar Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python no está instalado" -ForegroundColor Red
    Write-Host "Instalar Python desde: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js no está instalado" -ForegroundColor Red
    Write-Host "Instalar Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# IP local
$ip = "192.168.1.53"

Write-Host "`n=== Configuración ===" -ForegroundColor Yellow
Write-Host "IP Local: $ip" -ForegroundColor Cyan
Write-Host "Frontend: http://$ip`:3000" -ForegroundColor Cyan
Write-Host "Backend: http://$ip`:8000" -ForegroundColor Cyan

Write-Host "`n=== Instrucciones de Inicio ===" -ForegroundColor Green

Write-Host "`n1. TERMINAL 1 - Backend (Django):" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   python -m venv venv" -ForegroundColor White
Write-Host "   .\venv\Scripts\activate" -ForegroundColor White
Write-Host "   pip install -r requirements.txt" -ForegroundColor White
Write-Host "   python manage.py migrate" -ForegroundColor White
Write-Host "   python manage.py runserver 192.168.1.53:8000" -ForegroundColor White

Write-Host "`n2. TERMINAL 2 - Frontend (React):" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor White
Write-Host "   npm run dev -- --host 192.168.1.53 --port 3000" -ForegroundColor White

Write-Host "`n=== URLs de Acceso ===" -ForegroundColor Green
Write-Host "• Desde esta máquina: http://localhost:3000" -ForegroundColor White
Write-Host "• Desde red local: http://$ip`:3000" -ForegroundColor White

Write-Host "`n=== Firewall ===" -ForegroundColor Yellow
Write-Host "Asegurate de abrir los puertos 3000 y 8000 en Windows Firewall" -ForegroundColor White

Write-Host "`nListo para comenzar!" -ForegroundColor Green