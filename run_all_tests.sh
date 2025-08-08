#!/bin/bash

# Script principal para ejecutar todos los tests del proyecto

set -e

echo "🚀 Iniciando testing completo del Simulador Saber 11..."
echo "=================================================="

# Función para mostrar el tiempo transcurrido
show_duration() {
    local start_time=$1
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local hours=$((duration / 3600))
    local minutes=$(((duration % 3600) / 60))
    local seconds=$((duration % 60))
    
    if [ $hours -gt 0 ]; then
        echo "⏱️  Tiempo transcurrido: ${hours}h ${minutes}m ${seconds}s"
    elif [ $minutes -gt 0 ]; then
        echo "⏱️  Tiempo transcurrido: ${minutes}m ${seconds}s"
    else
        echo "⏱️  Tiempo transcurrido: ${seconds}s"
    fi
}

# Función para mostrar progreso
show_progress() {
    echo ""
    echo "📍 $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Variables globales
SCRIPT_START_TIME=$(date +%s)
BACKEND_PASSED=false
FRONTEND_PASSED=false
INTEGRATION_PASSED=false

# Crear directorios para reportes
mkdir -p reports/{backend,frontend,integration}

show_progress "Verificando prerrequisitos..."

# Verificar que Python está disponible
if ! command -v python &> /dev/null; then
    echo "❌ Python no está instalado o no está en el PATH"
    exit 1
fi

# Verificar que Node.js está disponible
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado o no está en el PATH"
    exit 1
fi

# Verificar que los directorios existen
if [ ! -d "backend" ]; then
    echo "❌ Directorio backend no encontrado"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "❌ Directorio frontend no encontrado"
    exit 1
fi

echo "✅ Prerrequisitos verificados"

# ===============================================
# BACKEND TESTS
# ===============================================
show_progress "Ejecutando tests del backend..."

cd backend

if [ -f "venv/bin/activate" ]; then
    echo "🐍 Activando entorno virtual..."
    source venv/bin/activate
else
    echo "⚠️  No se encontró entorno virtual, usando Python global"
fi

# Instalar dependencias si es necesario
if [ ! -f ".deps_installed" ]; then
    echo "📦 Instalando dependencias del backend..."
    pip install -r requirements.txt
    touch .deps_installed
fi

echo "🧪 Ejecutando tests del backend con coverage..."

# Ejecutar tests del backend
if python -m pytest \
    --verbose \
    --cov=apps \
    --cov-report=html:../reports/backend/htmlcov \
    --cov-report=term-missing \
    --cov-report=xml:../reports/backend/coverage.xml \
    --cov-fail-under=70 \
    --durations=10 \
    --tb=short \
    --junitxml=../reports/backend/junit.xml \
    2>&1 | tee ../reports/backend/test_output.log; then
    
    echo "✅ Tests del backend completados exitosamente"
    BACKEND_PASSED=true
else
    echo "❌ Tests del backend fallaron"
    BACKEND_PASSED=false
fi

# Generar reporte de coverage
python -m coverage report --show-missing > ../reports/backend/coverage_summary.txt

cd ..

# ===============================================
# FRONTEND TESTS
# ===============================================
show_progress "Ejecutando tests del frontend..."

cd frontend

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ] || [ ! -f ".deps_installed" ]; then
    echo "📦 Instalando dependencias del frontend..."
    npm ci
    touch .deps_installed
fi

echo "🧪 Ejecutando tests del frontend con coverage..."

# Ejecutar tests del frontend
if npm run test:coverage 2>&1 | tee ../reports/frontend/test_output.log; then
    echo "✅ Tests del frontend completados exitosamente"
    FRONTEND_PASSED=true
    
    # Mover reportes de coverage
    if [ -d "coverage" ]; then
        cp -r coverage ../reports/frontend/
    fi
else
    echo "❌ Tests del frontend fallaron"
    FRONTEND_PASSED=false
fi

cd ..

# ===============================================
# INTEGRATION TESTS
# ===============================================
show_progress "Ejecutando tests de integración..."

cd backend

echo "🔗 Ejecutando tests de integración end-to-end..."

# Ejecutar solo tests de integración
if python -m pytest tests/ \
    -m integration \
    --verbose \
    --tb=short \
    --junitxml=../reports/integration/junit.xml \
    2>&1 | tee ../reports/integration/test_output.log; then
    
    echo "✅ Tests de integración completados exitosamente"
    INTEGRATION_PASSED=true
else
    echo "❌ Tests de integración fallaron"
    INTEGRATION_PASSED=false
fi

cd ..

# ===============================================
# LINTING Y CALIDAD DE CÓDIGO
# ===============================================
show_progress "Ejecutando análisis de calidad de código..."

echo "🔍 Analizando código del backend..."
cd backend

# Ejecutar linting del backend
{
    echo "=== BLACK ===" > ../reports/backend/linting.log
    black --check . >> ../reports/backend/linting.log 2>&1 || echo "Black: Issues found"
    
    echo -e "\n=== FLAKE8 ===" >> ../reports/backend/linting.log
    flake8 . >> ../reports/backend/linting.log 2>&1 || echo "Flake8: Issues found"
    
    echo -e "\n=== ISORT ===" >> ../reports/backend/linting.log
    isort --check-only . >> ../reports/backend/linting.log 2>&1 || echo "Isort: Issues found"
} || true

cd ..

echo "🔍 Analizando código del frontend..."
cd frontend

# Ejecutar linting del frontend
{
    echo "=== ESLINT ===" > ../reports/frontend/linting.log
    npm run lint >> ../reports/frontend/linting.log 2>&1 || echo "ESLint: Issues found"
    
    echo -e "\n=== TYPESCRIPT ===" >> ../reports/frontend/linting.log
    npx tsc --noEmit >> ../reports/frontend/linting.log 2>&1 || echo "TypeScript: Issues found"
} || true

cd ..

# ===============================================
# GENERACIÓN DE REPORTE FINAL
# ===============================================
show_progress "Generando reporte final..."

cat > reports/test_summary.md << EOF
# 📊 Reporte de Testing - Simulador Saber 11

**Fecha:** $(date '+%Y-%m-%d %H:%M:%S')  
**Duración total:** $(show_duration $SCRIPT_START_TIME)

## 🧪 Resultados de Tests

| Componente | Estado | Coverage | Detalles |
|------------|--------|----------|----------|
| Backend | $([ "$BACKEND_PASSED" = true ] && echo "✅ PASS" || echo "❌ FAIL") | Ver reporte | [Logs](backend/test_output.log) |
| Frontend | $([ "$FRONTEND_PASSED" = true ] && echo "✅ PASS" || echo "❌ FAIL") | Ver reporte | [Logs](frontend/test_output.log) |
| Integración | $([ "$INTEGRATION_PASSED" = true ] && echo "✅ PASS" || echo "❌ FAIL") | N/A | [Logs](integration/test_output.log) |

## 📈 Coverage Reports

- **Backend**: [HTML Report](backend/htmlcov/index.html) | [XML Report](backend/coverage.xml)
- **Frontend**: [HTML Report](frontend/coverage/index.html) | [LCOV Report](frontend/coverage/lcov.info)

## 🔍 Code Quality

- **Backend Linting**: [Report](backend/linting.log)
- **Frontend Linting**: [Report](frontend/linting.log)

## 📁 Estructura de Reportes

\`\`\`
reports/
├── backend/
│   ├── htmlcov/          # Coverage HTML
│   ├── coverage.xml      # Coverage XML
│   ├── junit.xml         # JUnit test results
│   ├── test_output.log   # Test execution log
│   ├── coverage_summary.txt
│   └── linting.log       # Linting results
├── frontend/
│   ├── coverage/         # Coverage reports
│   ├── test_output.log   # Test execution log
│   └── linting.log       # Linting results
├── integration/
│   ├── junit.xml         # Integration test results
│   └── test_output.log   # Integration test log
└── test_summary.md       # Este reporte
\`\`\`

## 🎯 Resumen Ejecutivo

$([ "$BACKEND_PASSED" = true ] && [ "$FRONTEND_PASSED" = true ] && [ "$INTEGRATION_PASSED" = true ] && echo "🎉 **TODOS LOS TESTS PASARON EXITOSAMENTE**" || echo "⚠️ **ALGUNOS TESTS FALLARON - REVISAR LOGS**")

**Próximos pasos:**
- Revisar logs de tests fallidos
- Verificar coverage de código
- Ejecutar tests manualmente si es necesario
- Actualizar documentación de testing

---
*Generado automáticamente por run_all_tests.sh*
EOF

# ===============================================
# RESUMEN FINAL
# ===============================================

echo ""
echo "=================================================="
echo "🏁 RESUMEN FINAL DE TESTING"
echo "=================================================="

echo "📊 Resultados:"
echo "  Backend:     $([ "$BACKEND_PASSED" = true ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "  Frontend:    $([ "$FRONTEND_PASSED" = true ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "  Integración: $([ "$INTEGRATION_PASSED" = true ] && echo "✅ PASS" || echo "❌ FAIL")"

echo ""
show_duration $SCRIPT_START_TIME

echo ""
echo "📁 Reportes generados en: ./reports/"
echo "📋 Resumen completo en: ./reports/test_summary.md"

# Abrir reporte en navegador si está disponible
if command -v xdg-open &> /dev/null; then
    echo "🌐 Abriendo reporte de coverage del backend..."
    xdg-open reports/backend/htmlcov/index.html &> /dev/null &
elif command -v open &> /dev/null; then
    echo "🌐 Abriendo reporte de coverage del backend..."
    open reports/backend/htmlcov/index.html &> /dev/null &
fi

# Código de salida
if [ "$BACKEND_PASSED" = true ] && [ "$FRONTEND_PASSED" = true ] && [ "$INTEGRATION_PASSED" = true ]; then
    echo ""
    echo "🎉 Todos los tests completados exitosamente!"
    exit 0
else
    echo ""
    echo "⚠️  Algunos tests fallaron. Revisar logs para más detalles."
    exit 1
fi