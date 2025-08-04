#!/bin/bash

# 🚀 Script de Deployment para DigitalOcean
# Autor: Simulador Saber 11
# Versión: 1.0

set -e  # Salir si hay error

echo "🚀 Iniciando deployment del Simulador Saber 11..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "No se encontró docker-compose.prod.yml. Ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

# Verificar si existe el archivo de entorno
if [ ! -f ".env.production" ]; then
    print_warning "No se encontró .env.production. Creando desde ejemplo..."
    if [ -f "env.production.example" ]; then
        cp env.production.example .env.production
        print_warning "Por favor, edita .env.production con tus configuraciones antes de continuar."
        print_warning "Presiona Enter cuando hayas configurado las variables de entorno..."
        read
    else
        print_error "No se encontró env.production.example. Crea el archivo .env.production manualmente."
        exit 1
    fi
fi

# Verificar Docker
print_status "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Instálalo primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado. Instálalo primero."
    exit 1
fi

print_success "Docker está disponible."

# Verificar variables de entorno críticas
print_status "Verificando variables de entorno..."
source .env.production

if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "tu_password_super_seguro_aqui" ]; then
    print_error "DB_PASSWORD no está configurado en .env.production"
    exit 1
fi

if [ -z "$SECRET_KEY" ] || [ "$SECRET_KEY" = "tu_secret_key_super_seguro_aqui" ]; then
    print_error "SECRET_KEY no está configurado en .env.production"
    exit 1
fi

print_success "Variables de entorno verificadas."

# Crear directorios necesarios
print_status "Creando directorios necesarios..."
mkdir -p nginx/ssl
mkdir -p logs
mkdir -p backups

print_success "Directorios creados."

# Generar certificados SSL temporales (para desarrollo)
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    print_status "Generando certificados SSL temporales..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=CO/ST=Colombia/L=Bogota/O=Simulador/CN=localhost"
    print_success "Certificados SSL generados."
fi

# Parar contenedores existentes
print_status "Parando contenedores existentes..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Construir imágenes
print_status "Construyendo imágenes Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

print_success "Imágenes construidas."

# Ejecutar migraciones y setup inicial
print_status "Ejecutando setup inicial..."
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput

print_success "Setup inicial completado."

# Crear superusuario si no existe
print_status "Verificando superusuario..."
if ! docker-compose -f docker-compose.prod.yml exec -T backend python manage.py shell -c "from django.contrib.auth.models import User; print('Superuser exists' if User.objects.filter(is_superuser=True).exists() else 'No superuser')" 2>/dev/null | grep -q "Superuser exists"; then
    print_warning "No se encontró superusuario. Creando uno..."
    echo "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@simulador.com', 'admin123') if not User.objects.filter(username='admin').exists() else None" | docker-compose -f docker-compose.prod.yml run --rm backend python manage.py shell
    print_warning "Superusuario creado: admin / admin123"
    print_warning "¡Cambia la contraseña inmediatamente!"
fi

# Levantar servicios
print_status "Levantando servicios..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los servicios
print_status "Verificando estado de los servicios..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_success "Todos los servicios están ejecutándose."
else
    print_error "Algunos servicios no están ejecutándose correctamente."
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Mostrar información de acceso
print_success "🎉 ¡Deployment completado exitosamente!"
echo ""
echo "📋 Información de acceso:"
echo "   🌐 Frontend: http://localhost (o tu IP del servidor)"
echo "   🔧 Backend API: http://localhost/api/"
echo "   📊 Admin Django: http://localhost/api/admin/"
echo ""
echo "🔑 Credenciales por defecto:"
echo "   Usuario: admin"
echo "   Contraseña: admin123"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Reiniciar: docker-compose -f docker-compose.prod.yml restart"
echo "   Parar: docker-compose -f docker-compose.prod.yml down"
echo "   Actualizar: git pull && ./deploy.sh"
echo ""
print_warning "⚠️  IMPORTANTE: Cambia la contraseña del admin inmediatamente!"
echo "" 