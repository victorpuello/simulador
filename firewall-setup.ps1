# Script para configurar el Firewall de Windows para acceso de red local
# Ejecutar como Administrador

Write-Host "=== Configurando Firewall para Simulador Saber 11 ===" -ForegroundColor Green

# Agregar reglas para los puertos del simulador
try {
    # Puerto 3000 - Frontend
    New-NetFirewallRule -DisplayName "Simulador Saber 11 - Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Domain,Private
    Write-Host "✓ Puerto 3000 (Frontend) agregado al firewall" -ForegroundColor Green
    
    # Puerto 8000 - Backend  
    New-NetFirewallRule -DisplayName "Simulador Saber 11 - Backend" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -Profile Domain,Private
    Write-Host "✓ Puerto 8000 (Backend) agregado al firewall" -ForegroundColor Green
    
    Write-Host "`nFirewall configurado correctamente!" -ForegroundColor Green
    Write-Host "El simulador ahora es accesible desde otras máquinas en la red local" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error configurando firewall: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Ejecuta este script como Administrador" -ForegroundColor Yellow
}

Write-Host "`n=== URLs de acceso ===" -ForegroundColor Cyan
Write-Host "• Desde esta máquina: http://localhost:3000" -ForegroundColor White
Write-Host "• Desde red local: http://192.168.1.53:3000" -ForegroundColor White