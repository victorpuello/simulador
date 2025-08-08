@echo off
echo ===========================================
echo     SIMULADOR SABER 11 - RED LOCAL
echo ===========================================
echo.
echo Iniciando servicios para acceso de red local...
echo - Frontend: http://192.168.1.53:3000
echo - Backend:  http://192.168.1.53:8000
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo.
echo Iniciando backend...
start "Backend Django" cmd /k "%~dp0start-backend.bat"

timeout /t 3 >nul

echo Iniciando frontend...
start "Frontend React" cmd /k "%~dp0start-frontend.bat"

echo.
echo ===========================================
echo Servicios iniciados!
echo.
echo URLs de acceso:
echo - Desde esta maquina: http://localhost:3000
echo - Desde red local:    http://192.168.1.53:3000
echo.
echo Usuario de prueba: israel
echo ===========================================
echo.
echo Presiona cualquier tecla para salir...
pause >nul