@echo off
REM Script para ejecutar todos los tests del backend con coverage en Windows

setlocal

echo 🧪 Ejecutando tests del backend...

REM Crear directorio de logs si no existe
if not exist "logs" mkdir logs

REM Limpiar coverage previo
if exist "htmlcov" rmdir /s /q htmlcov
if exist "coverage.xml" del coverage.xml
if exist ".coverage" del .coverage

echo 📊 Ejecutando tests con coverage...

REM Ejecutar tests con coverage
python -m pytest ^
    --verbose ^
    --cov=apps ^
    --cov-report=html:htmlcov ^
    --cov-report=term-missing ^
    --cov-report=xml ^
    --cov-fail-under=80 ^
    --durations=10 ^
    --tb=short

REM Verificar si los tests pasaron
if %errorlevel% equ 0 (
    echo ✅ Todos los tests pasaron exitosamente!
    echo 📊 Reporte de coverage generado en: htmlcov\index.html
) else (
    echo ❌ Algunos tests fallaron
    exit /b 1
)

REM Mostrar resumen de coverage
echo.
echo 📈 Resumen de Coverage:
python -m coverage report --show-missing

echo 🎉 Proceso de testing completado!