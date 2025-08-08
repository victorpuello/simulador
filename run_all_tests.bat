@echo off
REM Script principal para ejecutar todos los tests del proyecto en Windows

setlocal enabledelayedexpansion

echo 🚀 Iniciando testing completo del Simulador Saber 11...
echo ==================================================

REM Variables
set "SCRIPT_START_TIME=%TIME%"
set "BACKEND_PASSED=false"
set "FRONTEND_PASSED=false"

REM Crear directorios para reportes
if not exist "reports" mkdir reports
if not exist "reports\backend" mkdir reports\backend
if not exist "reports\frontend" mkdir reports\frontend
if not exist "reports\integration" mkdir reports\integration

echo 📍 Verificando prerrequisitos...

REM Verificar Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python no está instalado o no está en el PATH
    exit /b 1
)

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado o no está en el PATH
    exit /b 1
)

echo ✅ Prerrequisitos verificados

REM ===============================================
REM BACKEND TESTS
REM ===============================================
echo.
echo 📍 Ejecutando tests del backend...

cd backend

REM Activar entorno virtual si existe
if exist "venv\Scripts\activate.bat" (
    echo 🐍 Activando entorno virtual...
    call venv\Scripts\activate.bat
) else (
    echo ⚠️  No se encontró entorno virtual, usando Python global
)

REM Instalar dependencias si es necesario
if not exist ".deps_installed" (
    echo 📦 Instalando dependencias del backend...
    pip install -r requirements.txt
    echo. > .deps_installed
)

echo 🧪 Ejecutando tests del backend con coverage...

REM Ejecutar tests del backend
python -m pytest --verbose --cov=apps --cov-report=html:../reports/backend/htmlcov --cov-report=term-missing --cov-report=xml:../reports/backend/coverage.xml --cov-fail-under=70 --durations=10 --tb=short > ../reports/backend/test_output.log 2>&1

if %errorlevel% equ 0 (
    echo ✅ Tests del backend completados exitosamente
    set "BACKEND_PASSED=true"
) else (
    echo ❌ Tests del backend fallaron
    set "BACKEND_PASSED=false"
)

REM Generar reporte de coverage
python -m coverage report --show-missing > ../reports/backend/coverage_summary.txt

cd ..

REM ===============================================
REM FRONTEND TESTS
REM ===============================================
echo.
echo 📍 Ejecutando tests del frontend...

cd frontend

REM Instalar dependencias si es necesario
if not exist "node_modules" (
    echo 📦 Instalando dependencias del frontend...
    npm ci
    echo. > .deps_installed
)

echo 🧪 Ejecutando tests del frontend con coverage...

REM Ejecutar tests del frontend
npm run test:coverage > ../reports/frontend/test_output.log 2>&1

if %errorlevel% equ 0 (
    echo ✅ Tests del frontend completados exitosamente
    set "FRONTEND_PASSED=true"
    
    REM Mover reportes de coverage
    if exist "coverage" (
        xcopy coverage ..\reports\frontend\coverage\ /E /I /Y >nul
    )
) else (
    echo ❌ Tests del frontend fallaron
    set "FRONTEND_PASSED=false"
)

cd ..

REM ===============================================
REM RESUMEN FINAL
REM ===============================================

echo.
echo ==================================================
echo 🏁 RESUMEN FINAL DE TESTING
echo ==================================================

echo 📊 Resultados:
if "%BACKEND_PASSED%"=="true" (
    echo   Backend:     ✅ PASS
) else (
    echo   Backend:     ❌ FAIL
)

if "%FRONTEND_PASSED%"=="true" (
    echo   Frontend:    ✅ PASS
) else (
    echo   Frontend:    ❌ FAIL
)

echo.
echo 📁 Reportes generados en: .\reports\
echo 📋 Logs disponibles en los subdirectorios de reportes

REM Abrir reporte en navegador si está disponible
if exist "reports\backend\htmlcov\index.html" (
    echo 🌐 Abriendo reporte de coverage del backend...
    start reports\backend\htmlcov\index.html
)

REM Código de salida
if "%BACKEND_PASSED%"=="true" if "%FRONTEND_PASSED%"=="true" (
    echo.
    echo 🎉 Todos los tests completados exitosamente!
    exit /b 0
) else (
    echo.
    echo ⚠️  Algunos tests fallaron. Revisar logs para más detalles.
    exit /b 1
)