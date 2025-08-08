#!/bin/bash

# Script para ejecutar todos los tests del frontend con coverage

set -e

echo "🧪 Ejecutando tests del frontend..."

# Limpiar coverage previo
rm -rf coverage

echo "📊 Ejecutando tests con coverage..."

# Ejecutar tests con coverage
npm run test:coverage 2>&1 | tee test_results.log

# Verificar si los tests pasaron
if [ $? -eq 0 ]; then
    echo "✅ Todos los tests pasaron exitosamente!"
    echo "📊 Reporte de coverage generado en: coverage/index.html"
else
    echo "❌ Algunos tests fallaron"
    exit 1
fi

echo "🎉 Proceso de testing completado!"