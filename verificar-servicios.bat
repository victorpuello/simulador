@echo off
echo 🔍 Verificando estado de servicios del Simulador...
echo.

echo 📊 Backend (Puerto 8000):
curl -s http://localhost:8000/api/core/materias/ 2>nul && echo ✅ Backend ACTIVO || echo ❌ Backend NO responde

echo.
echo 🌐 Frontend (Puerto 3000):
curl -s http://localhost:3000 2>nul && echo ✅ Frontend ACTIVO || echo ❌ Frontend NO responde

echo.
echo 🔗 Proxy del frontend al backend:
curl -s http://localhost:3000/api/core/materias/ 2>nul && echo ✅ Proxy FUNCIONAL || echo ❌ Proxy NO funcional

echo.
echo 📋 Procesos activos:
tasklist | findstr /C:"python.exe" /C:"node.exe"

echo.
echo ✨ ¡Verificación completada!
pause