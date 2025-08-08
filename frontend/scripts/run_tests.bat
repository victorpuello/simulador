@echo off
REM Script para ejecutar todos los tests del frontend con coverage en Windows

setlocal

echo 🧪 Ejecutando tests del frontend...

REM Limpiar coverage previo
if exist "coverage" rmdir /s /q coverage

echo 📊 Ejecutando tests con coverage...

REM Ejecutar tests con coverage
npm run test:coverage

REM Verificar si los tests pasaron
if %errorlevel% equ 0 (
    echo ✅ Todos los tests pasaron exitosamente!
    echo 📊 Reporte de coverage generado en: coverage\index.html
) else (
    echo ❌ Algunos tests fallaron
    exit /b 1
)

echo 🎉 Proceso de testing completado!