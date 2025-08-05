# 🚀 Guía de Deployment con AWS Amplify Hosting

## 📋 **ARQUITECTURA AWS AMPLIFY**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React/Vite)  │◄──►│   (Django API)  │◄──►│   (RDS)         │
│   Amplify       │    │   ECS/EC2       │    │   PostgreSQL    │
│   CloudFront    │    │   ALB           │    │   ElastiCache   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 **VENTAJAS DE AWS AMPLIFY**

✅ **Deployment automático**: Cada push a GitHub genera build + deploy  
✅ **CDN global**: CloudFront incluido automáticamente  
✅ **SSL automático**: Certificate Manager integrado  
✅ **Rollback instantáneo**: Volver a cualquier commit  
✅ **Preview deployments**: Branches separados para testing  
✅ **Sin configuración**: Detecta framework automáticamente  
✅ **HTTPS incluido**: Sin configuración adicional  

## 📋 **PASOS PARA DEPLOY**

### **1. 🏗️ PREPARACIÓN DEL PROYECTO**

#### **1.1 Subir a GitHub**
```bash
# Si no tienes repositorio
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/simulador.git
git push -u origin main
```

#### **1.2 Configurar build settings**
Crear archivo `amplify.yml` en la raíz del proyecto:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### **2. 🌐 CONFIGURACIÓN EN AWS AMPLIFY**

#### **2.1 Acceder a AWS Amplify**
1. Ve a [AWS Console](https://console.aws.amazon.com)
2. Busca "Amplify" en el buscador
3. Haz clic en "AWS Amplify"

#### **2.2 Crear nueva aplicación**
1. Haz clic en **"New app"** → **"Host web app"**
2. Selecciona tu proveedor de Git:
   - **GitHub** (recomendado)
   - GitLab
   - Bitbucket
   - AWS CodeCommit

#### **2.3 Conectar repositorio**
1. Autoriza AWS Amplify en tu cuenta de GitHub
2. Selecciona tu repositorio: `tu-usuario/simulador`
3. Selecciona la rama: `main`
4. Haz clic en **"Next"**

#### **2.4 Configurar build settings**
Amplify detectará automáticamente que es un proyecto Vite/React:

- **Framework**: React
- **Build settings**: Automático
- **Build commands**: `npm run build`
- **Output directory**: `dist`

#### **2.5 Revisar y desplegar**
1. Revisa la configuración
2. Haz clic en **"Save and deploy"**
3. Espera 5-10 minutos para el primer build

### **3. 🔒 CONFIGURACIÓN DE DOMINIO**

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

#### **3.3 Verificar configuración**
1. Espera 5-10 minutos para propagación DNS
2. Amplify validará automáticamente el dominio
3. SSL se configurará automáticamente

### **4. 🔧 CONFIGURACIÓN DEL BACKEND**

#### **4.1 Desplegar backend separadamente**
Para el backend Django, puedes usar:

**Opción A: AWS ECS Fargate (Recomendado)**
```bash
# Usar el script existente para backend
./deploy-aws.sh --backend-only
```

**Opción B: AWS EC2 (Más económico)**
```bash
# Crear instancia EC2
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.micro \
  --key-name tu-key-pair \
  --security-group-ids sg-12345678
```

#### **4.2 Configurar variables de entorno**
En Amplify Console → **"Environment variables"**:

```
REACT_APP_API_URL=https://tu-backend-api.com
REACT_APP_ENVIRONMENT=production
```

### **5. 🔄 DEPLOYMENT AUTOMÁTICO**

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
3. ✅ Ejecuta tests (si configurados)
4. ✅ Despliega a producción
5. ✅ Invalida CDN
6. ✅ Notifica por email

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

### **6. 📊 MONITOREO Y MÁTRICAS**

#### **6.1 Métricas automáticas**
- **Build time**: Tiempo de compilación
- **Deployment time**: Tiempo de despliegue
- **Error rate**: Tasa de errores
- **Performance**: Core Web Vitals

#### **6.2 Logs en tiempo real**
```bash
# Ver logs de build
amplify console
# → Build history → Ver logs
```

### **7. 🔧 CONFIGURACIONES AVANZADAS**

#### **7.1 Configurar redirects**
Crear archivo `_redirects` en `public/`:

```
# Redirect para SPA
/*    /index.html   200

# API redirect
/api/*    https://tu-backend-api.com/api/:splat    200
```

#### **7.2 Configurar headers**
Crear archivo `_headers` en `public/`:

```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

#### **7.3 Configurar build optimizations**
En `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npm run lint
    build:
      commands:
        - npm run build
        - npm run test:ci
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .npm-cache/**/*
```

### **8. 💰 COSTOS ESTIMADOS**

#### **8.1 AWS Amplify**
- **$0.01 por build minute** (primeros 1000 minutos gratis)
- **$0.15 por GB transferido** (primeros 15GB gratis)
- **$0.023 por GB almacenado** (primeros 5GB gratis)

#### **8.2 Backend (ECS Fargate)**
- **$0.04048 por vCPU hora** (t3.micro)
- **$0.004445 por GB RAM hora**

#### **8.3 Base de datos (RDS)**
- **$12.41/mes**: db.t3.micro PostgreSQL

**Total estimado: ~$15-20/mes**

### **9. 🚀 ESCALABILIDAD**

#### **9.1 Auto-scaling automático**
- Amplify escala automáticamente
- Sin configuración adicional
- CDN global incluido

#### **9.2 Branch deployments**
- Cada rama = URL separada
- Testing sin afectar producción
- Rollback instantáneo

### **10. 🔍 TROUBLESHOOTING**

#### **10.1 Build falla**
```bash
# Verificar logs
amplify console → Build history → Ver logs

# Problemas comunes:
# - Dependencias faltantes
# - Variables de entorno no configuradas
# - Errores de sintaxis
```

#### **10.2 Dominio no funciona**
1. Verificar DNS en GoDaddy
2. Esperar propagación (hasta 24h)
3. Verificar certificado SSL en Amplify

#### **10.3 Performance lenta**
1. Verificar Core Web Vitals
2. Optimizar imágenes
3. Implementar lazy loading
4. Usar CDN para assets

---

## 🎯 **VENTAJAS DE ESTA RUTA**

✅ **Tiempo de setup**: ~10 minutos  
✅ **Deployment automático**: Cada push  
✅ **SSL automático**: Sin configuración  
✅ **CDN global**: CloudFront incluido  
✅ **Rollback instantáneo**: Cualquier commit  
✅ **Preview deployments**: Branches separados  
✅ **Monitoreo integrado**: Métricas automáticas  
✅ **Escalabilidad**: Sin configuración adicional  

## 📞 **SOPORTE**

- **Documentación**: docs.amplify.aws
- **Comunidad**: amplify-community.slack.com
- **GitHub Issues**: github.com/aws-amplify/amplify-cli

---

**¡Tu aplicación estará desplegada en menos de 10 minutos!** 🚀 