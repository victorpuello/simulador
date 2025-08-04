# 🚀 Guía de Deployment en DigitalOcean

## 📋 **PASOS PARA DEPLOY**

### **1. 🏗️ PREPARACIÓN DEL PROYECTO**

#### **1.1 Configurar variables de entorno**
```bash
# Copiar archivo de ejemplo
cp env.production.example .env.production

# Editar variables con tus datos
nano .env.production
```

#### **1.2 Generar secretos seguros**
```bash
# Generar SECRET_KEY
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Generar password de base de datos
openssl rand -base64 32
```

### **2. 🌊 CONFIGURACIÓN EN DIGITALOCEAN**

#### **2.1 Crear Droplet**
- **Ubuntu 22.04 LTS** (recomendado)
- **2GB RAM, 1 vCPU** (mínimo)
- **40GB SSD** (suficiente para empezar)
- **Ubicación**: Cercana a tus usuarios

#### **2.2 Configurar dominio (opcional)**
- Comprar dominio en DigitalOcean o externo
- Configurar DNS A record → IP del droplet
- Configurar SSL con Let's Encrypt

### **3. 🔧 CONFIGURACIÓN DEL SERVIDOR**

#### **3.1 Conectar al servidor**
```bash
ssh root@tu-ip-del-droplet
```

#### **3.2 Actualizar sistema**
```bash
apt update && apt upgrade -y
```

#### **3.3 Instalar Docker**
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Agregar usuario al grupo docker
usermod -aG docker $USER
```

#### **3.4 Instalar Nginx (para SSL)**
```bash
apt install nginx certbot python3-certbot-nginx -y
```

### **4. 📦 DESPLIEGUE DE LA APLICACIÓN**

#### **4.1 Clonar repositorio**
```bash
git clone https://github.com/tu-usuario/simulador.git
cd simulador
```

#### **4.2 Configurar variables**
```bash
# Copiar archivo de entorno
cp env.production.example .env.production

# Editar con tus datos
nano .env.production
```

#### **4.3 Construir y ejecutar**
```bash
# Construir imágenes
docker-compose -f docker-compose.prod.yml build

# Ejecutar en background
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### **5. 🔒 CONFIGURACIÓN SSL**

#### **5.1 Con Let's Encrypt**
```bash
# Obtener certificado
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Configurar renovación automática
crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **6. 📊 MONITOREO Y MANTENIMIENTO**

#### **6.1 Comandos útiles**
```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar servicios
docker-compose -f docker-compose.prod.yml restart

# Actualizar aplicación
git pull
docker-compose -f docker-compose.prod.yml up -d --build

# Backup de base de datos
docker-compose -f docker-compose.prod.yml exec db pg_dump -U simulador_user simulador_db > backup.sql
```

#### **6.2 Monitoreo de recursos**
```bash
# Ver uso de recursos
htop
df -h
docker stats
```

### **7. 🔧 CONFIGURACIONES AVANZADAS**

#### **7.1 Configurar backup automático**
```bash
# Crear script de backup
nano /root/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# Backup de base de datos
docker-compose -f /root/simulador/docker-compose.prod.yml exec -T db pg_dump -U simulador_user simulador_db > $BACKUP_DIR/db_$DATE.sql

# Backup de archivos de media
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /root/simulador/media/

# Eliminar backups antiguos (mantener últimos 7 días)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Hacer ejecutable
chmod +x /root/backup.sh

# Agregar a crontab (backup diario a las 2 AM)
crontab -e
# Agregar: 0 2 * * * /root/backup.sh
```

#### **7.2 Configurar firewall**
```bash
# Instalar ufw
apt install ufw -y

# Configurar reglas
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable
```

### **8. 💰 COSTOS ESTIMADOS**

#### **8.1 Droplet básico**
- **$6/mes**: 1GB RAM, 1 vCPU, 25GB SSD
- **$12/mes**: 2GB RAM, 1 vCPU, 50GB SSD (recomendado)
- **$18/mes**: 2GB RAM, 2 vCPU, 60GB SSD

#### **8.2 Base de datos managed (opcional)**
- **$15/mes**: PostgreSQL managed (recomendado para producción)

#### **8.3 CDN (opcional)**
- **$5/mes**: Spaces CDN para archivos estáticos

### **9. 🚀 ESCALABILIDAD**

#### **9.1 Escalar verticalmente**
- Aumentar RAM/CPU del droplet
- Migrar a droplet más potente

#### **9.2 Escalar horizontalmente**
- Usar DigitalOcean App Platform
- Implementar load balancer
- Usar múltiples droplets

### **10. 🔍 TROUBLESHOOTING**

#### **10.1 Problemas comunes**
```bash
# Ver logs de nginx
tail -f /var/log/nginx/error.log

# Ver logs de Docker
docker-compose -f docker-compose.prod.yml logs backend

# Reiniciar todo
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

#### **10.2 Verificar conectividad**
```bash
# Verificar puertos
netstat -tlnp

# Verificar servicios
systemctl status nginx
docker ps
```

---

## 🎯 **VENTAJAS DE DIGITALOCEAN**

✅ **Simplicidad**: Panel intuitivo  
✅ **Precio**: Muy competitivo  
✅ **Performance**: SSDs rápidos  
✅ **Escalabilidad**: Fácil escalar  
✅ **Soporte**: Documentación excelente  
✅ **Docker**: Soporte nativo  
✅ **SSL**: Let's Encrypt incluido  

## 📞 **SOPORTE**

- **Documentación**: docs.digitalocean.com
- **Comunidad**: community.digitalocean.com
- **Tickets**: Panel de control → Support

---

**¡Tu aplicación estará lista para producción en menos de 1 hora!** 🚀 