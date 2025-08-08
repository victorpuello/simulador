#!/bin/bash

# Script para ejecutar todos los tests del backend con coverage

set -e

echo "🧪 Ejecutando tests del backend..."

# Crear directorio de logs si no existe
mkdir -p logs

# Limpiar coverage previo
rm -rf htmlcov coverage.xml .coverage

echo "📊 Ejecutando tests con coverage..."

# Ejecutar tests con coverage
python -m pytest \
    --verbose \
    --cov=apps \
    --cov-report=html:htmlcov \
    --cov-report=term-missing \
    --cov-report=xml \
    --cov-fail-under=80 \
    --durations=10 \
    --tb=short \
    2>&1 | tee logs/test_results.log

# Verificar si los tests pasaron
if [ $? -eq 0 ]; then
    echo "✅ Todos los tests pasaron exitosamente!"
    echo "📊 Reporte de coverage generado en: htmlcov/index.html"
else
    echo "❌ Algunos tests fallaron"
    exit 1
fi

# Mostrar resumen de coverage
echo ""
echo "📈 Resumen de Coverage:"
python -m coverage report --show-missing

# Generar badge de coverage (opcional)
if command -v coverage-badge &> /dev/null; then
    coverage-badge -o coverage.svg
    echo "🏷️  Badge de coverage generado: coverage.svg"
fi

echo "🎉 Proceso de testing completado!"