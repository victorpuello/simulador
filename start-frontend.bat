@echo off
title Simulador Frontend - React
cd /d "%~dp0frontend"
echo Iniciando frontend React en 0.0.0.0:3000...
npm run dev -- --host 0.0.0.0 --port 3000
pause