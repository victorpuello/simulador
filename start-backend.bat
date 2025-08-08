@echo off
title Simulador Backend - Django
cd /d "%~dp0backend"
call venv\Scripts\activate.bat
echo Iniciando backend Django en 0.0.0.0:8000...
python manage.py runserver 0.0.0.0:8000
pause