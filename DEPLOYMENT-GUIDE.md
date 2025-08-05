# 🚀 Guía de Deployment - AWS Amplify

## 📋 **RUTA RECOMENDADA: AWS AMPLIFY HOSTING**

### **🎯 Ventajas de esta ruta:**
- ✅ **Tiempo de setup**: ~10 minutos
- ✅ **Deployment automático**: Cada push a GitHub
- ✅ **SSL automático**: Sin configuración
- ✅ **CDN global**: CloudFront incluido
- ✅ **Rollback instantáneo**: Cualquier commit
- ✅ **Preview deployments**: Branches separados

## 📋 **PASOS PARA DEPLOY**

### **1. 🏗️ Preparación del Proyecto**

#### **1.1 Subir a GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/simulador.git
git push -u origin main
```

#### **1.2 Verificar configuración**
- ✅ Archivo `amplify.yml` creado
- ✅ Archivo `frontend/public/_redirects` configurado
- ✅ Archivo `frontend/public/_headers` configurado

### **2. 🌐 Configuración en AWS Amplify**

#### **2.1 Acceder a AWS Amplify**
1. Ve a [AWS Console](https://console.aws.amazon.com)
2. Busca "Amplify" en el buscador
3. Haz clic en "AWS Amplify"

#### **2.2 Crear nueva aplicación**
1. Haz clic en **"New app"** → **"Host web app"**
2. Selecciona **GitHub** como proveedor
3. Autoriza AWS Amplify en tu cuenta de GitHub
4. Selecciona tu repositorio: `tu-usuario/simulador`
5. Selecciona la rama: `main`
6. Haz clic en **"Next"**

#### **2.3 Configurar build settings**
Amplify detectará automáticamente que es un proyecto Vite/React:
- **Framework**: React
- **Build settings**: Automático
- **Build commands**: `npm run build`
- **Output directory**: `dist`

#### **2.4 Revisar y desplegar**
1. Revisa la configuración
2. Haz clic en **"Save and deploy"**
3. Espera 5-10 minutos para el primer build

### **3. 🔒 Configuración de Dominio**

#### **3.1 Agregar dominio personalizado**
1. En Amplify Console → **"Domain management"**
2. Haz clic en **"Add domain"**
3. Ingresa tu dominio: `victorpuello.com`
4. Haz clic en **"Configure domain"**

#### **3.2 Configurar DNS en GoDaddy**
Amplify te mostrará los registros CNAME que debes agregar:

```
Name: www
Value: d1234567890.cloudfront.net
Type: CNAME
TTL: 300
```

```
Name: @
Value: d1234567890.cloudfront.net
Type: CNAME
TTL: 300
```

### **4. 🔧 Configuración del Backend**

#### **4.1 Desplegar backend separadamente**
```bash
# Ejecutar script de backend
./deploy-backend-aws.sh
```

#### **4.2 Configurar variables de entorno**
En Amplify Console → **"Environment variables"**:

```
REACT_APP_API_URL=https://tu-backend-api.com
REACT_APP_ENVIRONMENT=production
```

### **5. 🔄 Deployment Automático**

#### **5.1 Cada push genera deploy**
```bash
# Hacer cambios
git add .
git commit -m "Nuevo feature"
git push origin main
```

**Amplify automáticamente:**
1. ✅ Detecta el push
2. ✅ Inicia build automático
3. ✅ Despliega a producción
4. ✅ Invalida CDN
5. ✅ Notifica por email

#### **5.2 Preview deployments**
```bash
# Crear rama para testing
git checkout -b feature/nueva-funcionalidad
git push origin feature/nueva-funcionalidad
```

Amplify creará automáticamente:
- URL de preview: `https://feature-nueva-funcionalidad.amplifyapp.com`
- Build separado
- Sin afectar producción

## 📊 **MONITOREO Y MÉTRICAS**

### **Métricas automáticas**
- **Build time**: Tiempo de compilación
- **Deployment time**: Tiempo de despliegue
- **Error rate**: Tasa de errores
- **Performance**: Core Web Vitals

### **Logs en tiempo real**
```bash
# Ver logs de build
amplify console
# → Build history → Ver logs
```

## 💰 **COSTOS ESTIMADOS**

### **AWS Amplify**
- **$0.01 por build minute** (primeros 1000 minutos gratis)
- **$0.15 por GB transferido** (primeros 15GB gratis)
- **$0.023 por GB almacenado** (primeros 5GB gratis)

### **Backend (ECS Fargate)**
- **$0.04048 por vCPU hora** (t3.micro)
- **$0.004445 por GB RAM hora**

### **Base de datos (RDS)**
- **$12.41/mes**: db.t3.micro PostgreSQL

**Total estimado: ~$15-20/mes**

## 🔍 **TROUBLESHOOTING**

### **Build falla**
```bash
# Verificar logs
amplify console → Build history → Ver logs

# Problemas comunes:
# - Dependencias faltantes
# - Variables de entorno no configuradas
# - Errores de sintaxis
```

### **Dominio no funciona**
1. Verificar DNS en GoDaddy
2. Esperar propagación (hasta 24h)
3. Verificar certificado SSL en Amplify

## 📞 **SOPORTE**

- **Documentación**: docs.amplify.aws
- **Comunidad**: amplify-community.slack.com
- **GitHub Issues**: github.com/aws-amplify/amplify-cli

---

**¡Tu aplicación estará desplegada en menos de 10 minutos!** 🚀 