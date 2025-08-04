
# 🚀 **DEPLOYMENT MANUAL EN AWS - WINDOWS**

## 📋 **PASOS MANUALES PARA WINDOWS**

### **1. 🏗️ PREPARACIÓN**

#### **1.1 Instalar AWS CLI**
```cmd
# Descargar e instalar AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.msi" -o "AWSCLIV2.msi"
msiexec.exe /i AWSCLIV2.msi /quiet
```

#### **1.2 Configurar AWS CLI**
```cmd
aws configure
# AWS Access Key ID: tu-access-key
# AWS Secret Access Key: tu-secret-key
# Default region name: us-east-1
# Default output format: json
```

#### **1.3 Verificar configuración**
```cmd
aws sts get-caller-identity
```

### **2. 📦 CONFIGURAR VARIABLES DE ENTORNO**

#### **2.1 Crear archivo .env.aws manualmente**
Crea un archivo llamado `.env.aws` con el siguiente contenido:

```bash
# Configuración AWS
AWS_REGION=us-east-1
DOMAIN_NAME=tu-dominio.com
ENVIRONMENT=production

# Configuración de la base de datos
DB_PASSWORD=tu-password-super-seguro-aqui

# Configuración de Django
SECRET_KEY=tu-secret-key-super-seguro-aqui
DEBUG=False
ALLOWED_HOSTS=tu-dominio.com,*.tu-dominio.com
CORS_ALLOWED_ORIGINS=https://tu-dominio.com,https://*.tu-dominio.com

# Configuración del frontend
VITE_API_URL=https://tu-dominio.com/api

# Configuración de seguridad
CSRF_TRUSTED_ORIGINS=https://tu-dominio.com,https://*.tu-dominio.com
```

#### **2.2 Generar secretos seguros**
```cmd
# Generar SECRET_KEY (usa este comando en PowerShell)
powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(50, 10)"

# Generar DB_PASSWORD (usa este comando en PowerShell)
powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(32, 10)"
```

### **3. 🐳 CREAR ECR REPOSITORIES**

#### **3.1 Crear repositorios**
```cmd
# Backend repository
aws ecr create-repository --repository-name simulador-backend --region us-east-1

# Frontend repository
aws ecr create-repository --repository-name simulador-frontend --region us-east-1
```

#### **3.2 Obtener URIs de repositorios**
```cmd
# Backend URI
aws ecr describe-repositories --repository-names simulador-backend --query "repositories[0].repositoryUri" --output text --region us-east-1

# Frontend URI
aws ecr describe-repositories --repository-names simulador-frontend --query "repositories[0].repositoryUri" --output text --region us-east-1
```

### **4. 🐳 CONSTRUIR Y SUBIR IMÁGENES**

#### **4.1 Login a ECR**
```cmd
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin TU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

#### **4.2 Construir imágenes**
```cmd
# Backend
docker build -t simulador-backend ./backend
docker tag simulador-backend:latest TU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/simulador-backend:latest
docker push TU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/simulador-backend:latest

# Frontend
docker build -t simulador-frontend ./frontend
docker tag simulador-frontend:latest TU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/simulador-frontend:latest
docker push TU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/simulador-frontend:latest
```

### **5. ☁️ DESPLEGAR INFRAESTRUCTURA**

#### **5.1 Desplegar CloudFormation stack**
```cmd
aws cloudformation deploy ^
    --template-file aws-deploy.yml ^
    --stack-name simulador-production ^
    --parameter-overrides ^
        Environment=production ^
        DomainName=tu-dominio.com ^
        DBPassword=tu-password ^
        SecretKey=tu-secret-key ^
    --capabilities CAPABILITY_NAMED_IAM ^
    --region us-east-1
```

#### **5.2 Esperar a que el stack esté completo**
```cmd
aws cloudformation wait stack-create-complete --stack-name simulador-production --region us-east-1
```

### **6. 🌐 CONFIGURAR DNS**

#### **6.1 Obtener Load Balancer DNS**
```cmd
aws cloudformation describe-stacks --stack-name simulador-production --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" --output text --region us-east-1
```

#### **6.2 Configurar DNS en tu proveedor**
Ve a tu proveedor de DNS y crea un registro A que apunte al DNS del Load Balancer.

### **7. 🔒 CONFIGURAR SSL**

#### **7.1 Solicitar certificado SSL**
```cmd
aws acm request-certificate --domain-name tu-dominio.com --subject-alternative-names "*.tu-dominio.com" --validation-method DNS --region us-east-1
```

#### **7.2 Validar certificado**
1. Ve a AWS Certificate Manager
2. Busca tu certificado
3. Valida el dominio (DNS o email)
4. Copia el ARN del certificado

#### **7.3 Actualizar stack con certificado**
```cmd
aws cloudformation deploy ^
    --template-file aws-deploy.yml ^
    --stack-name simulador-production ^
    --parameter-overrides ^
        Environment=production ^
        DomainName=tu-dominio.com ^
        CertificateArn=arn:aws:acm:us-east-1:account:certificate/certificate-id ^
    --capabilities CAPABILITY_NAMED_IAM ^
    --region us-east-1
```

### **8. 📊 VERIFICAR DEPLOYMENT**

#### **8.1 Verificar servicios ECS**
```cmd
aws ecs describe-services --cluster production-simulador-cluster --services production-backend-service production-frontend-service --region us-east-1
```

#### **8.2 Ver logs**
```cmd
# Backend logs
aws logs tail /ecs/production-backend --follow --region us-east-1

# Frontend logs
aws logs tail /ecs/production-frontend --follow --region us-east-1
```

### **9. 🔧 COMANDOS ÚTILES**

#### **9.1 Escalar servicios**
```cmd
# Escalar backend a 4 instancias
aws ecs update-service --cluster production-simulador-cluster --service production-backend-service --desired-count 4 --region us-east-1
```

#### **9.2 Actualizar aplicación**
```cmd
# Reconstruir y subir imágenes
docker build -t simulador-backend ./backend
docker tag simulador-backend:latest TU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/simulador-backend:latest
docker push TU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/simulador-backend:latest

# Forzar nuevo deployment
aws ecs update-service --cluster production-simulador-cluster --service production-backend-service --force-new-deployment --region us-east-1
```

#### **9.3 Ver información del stack**
```cmd
aws cloudformation describe-stacks --stack-name simulador-production --region us-east-1
```

---

## 🎯 **VENTAJAS DE ESTE MÉTODO**

✅ **Control total**: Cada paso es manual y verificable  
✅ **Sin dependencias**: No requiere Python ni scripts complejos  
✅ **Debugging fácil**: Puedes ver exactamente qué falla  
✅ **Flexibilidad**: Puedes modificar cualquier paso  
✅ **Aprendizaje**: Entiendes cada parte del proceso  

---

## ⚠️ **IMPORTANTE**

- Reemplaza `TU_ACCOUNT_ID` con tu AWS Account ID
- Reemplaza `tu-dominio.com` con tu dominio real
- Reemplaza `tu-password` y `tu-secret-key` con valores seguros
- Asegúrate de tener Docker instalado y funcionando

---

**¡Con estos pasos manuales tendrás tu aplicación funcionando en AWS sin problemas de compatibilidad con Windows!** 🚀 