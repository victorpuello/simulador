# 🚀 Guía de Deployment Backend - AWS

## 📋 **Opciones de Deployment**

### **Opción 1: Deployment Rápido (Solo Base de Datos)**
Para empezar rápidamente, crea solo la base de datos y usa el mock API en el frontend.

### **Opción 2: Deployment Completo**
Backend completo con base de datos, servidor de aplicación y balanceador de carga.

---

## 🎯 **Opción 1: Deployment Rápido**

### **Paso 1: Crear Base de Datos**
```powershell
# Ejecutar script simplificado
.\deploy-simple-aws.ps1

# O con password personalizado
.\deploy-simple-aws.ps1 -DBPassword "TuPasswordSeguro123!"
```

### **Paso 2: Configurar Variables en Amplify**
1. Ve a **AWS Amplify Console**
2. Selecciona tu aplicación
3. Ve a **"Environment variables"**
4. Agrega:
   ```
   VITE_API_URL=mock
   VITE_USE_MOCK_API=true
   ```

### **Paso 3: Probar Login**
Usa las credenciales de prueba:
- **Username**: `estudiante@test.com`
- **Password**: `password123`

---

## 🚀 **Opción 2: Deployment Completo**

### **Prerequisitos**
- ✅ AWS CLI configurado
- ✅ Docker instalado
- ✅ Cuenta AWS activa

### **Paso 1: Crear Infraestructura**
```powershell
# Deployment completo
.\deploy-backend-windows.ps1

# Solo base de datos
.\deploy-backend-windows.ps1 -OnlyDB

# Saltar build de Docker
.\deploy-backend-windows.ps1 -SkipBuild
```

### **Paso 2: Configurar Task Definition**
1. Ve a **AWS ECS Console**
2. Crea nueva **Task Definition**
3. Configuración:
   ```json
   {
     "family": "simulador-backend",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "containerDefinitions": [{
       "name": "simulador-backend",
       "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/simulador-backend:latest",
       "portMappings": [{
         "containerPort": 8000,
         "protocol": "tcp"
       }],
       "environment": [
         {"name": "DATABASE_URL", "value": "postgresql://simulador_user:SimuladorPass123!@simulador-db.REGION.rds.amazonaws.com:5432/simulador_db"},
         {"name": "DEBUG", "value": "False"},
         {"name": "ALLOWED_HOSTS", "value": "*"}
       ]
     }]
   }
   ```

### **Paso 3: Crear ECS Service**
1. En ECS Cluster → **"Create Service"**
2. Configuración:
   - **Task Definition**: simulador-backend
   - **Service Name**: simulador-backend-service
   - **Desired Tasks**: 1
   - **Launch Type**: Fargate

### **Paso 4: Configurar Load Balancer**
1. **Application Load Balancer** → Create
2. **Target Group** → ECS Service
3. **Health Check**: `/health/`

---

## 🔧 **Configuración de Variables de Entorno**

### **En AWS Amplify (Frontend):**
```
VITE_API_URL=https://tu-alb-endpoint.amazonaws.com/api
VITE_USE_MOCK_API=false
```

### **En ECS Task Definition (Backend):**
```
DATABASE_URL=postgresql://simulador_user:SimuladorPass123!@endpoint:5432/simulador_db
DEBUG=False
ALLOWED_HOSTS=*
SECRET_KEY=tu-secret-key-super-seguro
```

---

## 📊 **Costos Estimados**

### **Base de Datos (RDS t3.micro)**
- **$12.41/mes**: PostgreSQL 14.9
- **20GB SSD**: Incluido
- **Backup**: 7 días incluidos

### **Backend (ECS Fargate)**
- **$0.04048/hora vCPU**: ~$30/mes
- **$0.004445/hora GB RAM**: ~$2/mes

### **Load Balancer (ALB)**
- **$16.20/mes**: Application Load Balancer
- **$0.008/LCU hora**: ~$6/mes

**Total estimado: ~$50-60/mes**

---

## 🔍 **Verificación del Deployment**

### **1. Verificar Base de Datos**
```powershell
aws rds describe-db-instances --db-instance-identifier simulador-db
```

### **2. Verificar ECS Service**
```powershell
aws ecs describe-services --cluster simulador-cluster --services simulador-backend-service
```

### **3. Probar Conectividad**
```bash
curl https://tu-alb-endpoint.amazonaws.com/api/health/
```

---

## 🚨 **Troubleshooting**

### **Base de Datos no se conecta**
1. Verificar security groups
2. Verificar subnet groups
3. Verificar credenciales

### **ECS Task falla**
1. Revisar logs en CloudWatch
2. Verificar variables de entorno
3. Verificar permisos IAM

### **Frontend no conecta**
1. Verificar CORS en Django
2. Verificar VITE_API_URL
3. Verificar certificados SSL

---

## 📞 **Comandos Útiles**

### **Ver logs ECS**
```powershell
aws logs get-log-events --log-group-name "/ecs/simulador-backend"
```

### **Conectar a RDS**
```bash
psql postgresql://simulador_user:SimuladorPass123!@endpoint:5432/simulador_db
```

### **Actualizar ECS Service**
```powershell
aws ecs update-service --cluster simulador-cluster --service simulador-backend-service --force-new-deployment
```

---

**¡Sigue esta guía paso a paso para un deployment exitoso!** 🎉