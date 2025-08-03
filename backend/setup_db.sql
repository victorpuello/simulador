-- Crear usuario y base de datos para Simulador Saber 11
CREATE USER simulador_user WITH PASSWORD 'simulador_pass';
CREATE DATABASE simulador_saber11 OWNER simulador_user;
GRANT ALL PRIVILEGES ON DATABASE simulador_saber11 TO simulador_user;
ALTER USER simulador_user CREATEDB;

-- Verificar creación
\l
\du