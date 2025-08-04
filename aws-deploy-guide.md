# 🚀 Guía de Deployment en AWS

## 📋 **ARQUITECTURA AWS**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Django)      │◄──►│   (RDS)         │
│   CloudFront    │    │   ECS Fargate   │    │   PostgreSQL    │
│   S3            │    │   ALB           │    │   ElastiCache   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 **VENTAJAS DE AWS**

✅ **Escalabilidad**: Auto-scaling automático  
✅ **Serverless**: Sin gestión de servidores  
✅ **Seguridad**: IAM, VPC, Security Groups  
✅ **Monitoreo**: CloudWatch integrado  
✅ **CDN**: CloudFront global  
✅ **SSL**: Certificate Manager  
✅ **Backup**: RDS automático  

## 📋 **PASOS PARA DEPLOY**

### **1. 🏗️ PREPARACIÓN LOCAL**

#### **1.1 Instalar AWS CLI**
```bash
# Windows
curl "https://awscli.amazonaws.com/AWSCLIV2.msi" -o "AWSCLIV2.msi"
msiexec.exe /i AWSCLIV2.msi /quiet

# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

#### **1.2 Configurar AWS CLI**
```bash
aws configure
# AWS Access Key ID: tu-access-key
# AWS Secret Access Key: tu-secret-key
# Default region name: us-east-1
# Default output format: json
```

#### **1.3 Verificar configuración**
```bash
aws sts get-caller-identity
```

### **2. 🌐 CONFIGURACIÓN EN AWS**

#### **2.1 Crear cuenta AWS**
1. Ve a [aws.amazon.com](https://aws.amazon.com)
2. Crea una cuenta gratuita
3. Configura MFA (Multi-Factor Authentication)
4. Crea un usuario IAM con permisos de administrador

#### **2.2 Configurar región**
- **Recomendado**: `us-east-1` (N. Virginia) o `us-west-2` (Oregon)
- **Para Colombia**: `us-east-1` tiene mejor latencia

### **3. 📦 DESPLIEGUE AUTOMATIZADO**

#### **3.1 Ejecutar script de deployment**
```bash
# Hacer ejecutable
chmod +x deploy-aws.sh

# Ejecutar deployment
./deploy-aws.sh
```

#### **3.2 El script hará automáticamente:**
1. ✅ Crear ECR repositories
2. ✅ Construir y subir imágenes Docker
3. ✅ Desplegar infraestructura con CloudFormation
4. ✅ Configurar VPC, subnets, security groups
5. ✅ Crear RDS PostgreSQL
6. ✅ Configurar ECS Fargate
7. ✅ Configurar Application Load Balancer
8. ✅ Configurar CloudWatch logs
9. ✅ Crear S3 bucket para archivos estáticos

### **4. 🔒 CONFIGURACIÓN SSL**

#### **4.1 Validar certificado SSL**
1. Ve a **AWS Certificate Manager**
2. Busca tu certificado
3. Valida el dominio (DNS o email)
4. Copia el ARN del certificado

#### **4.2 Actualizar stack con certificado**
```bash
aws cloudformation deploy \
    --template-file aws-deploy.yml \
    --stack-name simulador-production \
    --parameter-overrides \
        Environment=production \
        DomainName=tu-dominio.com \
        CertificateArn=arn:aws:acm:region:account:certificate/certificate-id
```

### **5. 🌐 CONFIGURACIÓN DNS**

#### **5.1 Con Route53 (recomendado)**
```bash
# El script lo hace automáticamente si tienes Route53
```

#### **5.2 Con DNS externo**
1. Ve a tu proveedor de DNS
2. Crea registro A
3. Apunta a: `tu-load-balancer-dns.amazonaws.com`

### **6. 📊 MONITOREO Y MANTENIMIENTO**

#### **6.1 Ver logs en tiempo real**
```bash
# Logs del backend
aws logs tail /ecs/production-backend --follow

# Logs del frontend
aws logs tail /ecs/production-frontend --follow
```

#### **6.2 Verificar servicios**
```bash
# Ver estado de servicios ECS
aws ecs describe-services \
    --cluster production-simulador-cluster \
    --services production-backend-service production-frontend-service
```

#### **6.3 Escalar servicios**
```bash
# Escalar backend a 4 instancias
aws ecs update-service \
    --cluster production-simulador-cluster \
    --service production-backend-service \
    --desired-count 4
```

### **7. 🔧 CONFIGURACIONES AVANZADAS**

#### **7.1 Configurar auto-scaling**
```bash
# Crear target tracking scaling policy
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id service/production-simulador-cluster/production-backend-service \
    --min-capacity 2 \
    --max-capacity 10

aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id service/production-simulador-cluster/production-backend-service \
    --policy-name cpu-target-tracking \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration '{
        "TargetValue": 70.0,
        "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
        }
    }'
```

#### **7.2 Configurar CloudFront CDN**
```bash
# Crear distribución CloudFront
aws cloudfront create-distribution \
    --distribution-config '{
        "CallerReference": "'$(date +%s)'",
        "Origins": {
            "Quantity": 1,
            "Items": [
                {
                    "Id": "ALB-Origin",
                    "DomainName": "tu-load-balancer.amazonaws.com",
                    "CustomOriginConfig": {
                        "HTTPPort": 80,
                        "HTTPSPort": 443,
                        "OriginProtocolPolicy": "https-only"
                    }
                }
            ]
        },
        "DefaultCacheBehavior": {
            "TargetOriginId": "ALB-Origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "TrustedSigners": {
                "Enabled": false,
                "Quantity": 0
            },
            "ForwardedValues": {
                "QueryString": true,
                "Cookies": {
                    "Forward": "all"
                },
                "Headers": {
                    "Quantity": 0
                },
                "QueryStringCacheKeys": {
                    "Quantity": 0
                }
            },
            "MinTTL": 0,
            "DefaultTTL": 86400,
            "MaxTTL": 31536000
        },
        "Enabled": true,
        "Comment": "Simulador Saber 11 CDN"
    }'
```

### **8. 💰 COSTOS ESTIMADOS**

#### **8.1 Infraestructura básica**
- **ECS Fargate**: $0.04048/hora por vCPU + $0.004445/hora por GB RAM
- **RDS PostgreSQL**: $0.017/hora (db.t3.micro)
- **ALB**: $0.0225/hora
- **CloudWatch Logs**: $0.50/GB
- **S3**: $0.023/GB/mes

#### **8.2 Estimación mensual**
- **2 instancias backend** (0.5 vCPU, 1GB RAM): ~$30/mes
- **2 instancias frontend** (0.5 vCPU, 1GB RAM): ~$30/mes
- **RDS PostgreSQL**: ~$12/mes
- **ALB**: ~$16/mes
- **CloudWatch + S3**: ~$5/mes
- **CloudFront** (opcional): ~$10/mes

**Total estimado**: $93-103/mes

### **9. 🚀 ESCALABILIDAD**

#### **9.1 Escalar verticalmente**
```bash
# Aumentar CPU/Memory de tareas
aws ecs register-task-definition \
    --family production-backend-task \
    --cpu 1024 \
    --memory 2048
```

#### **9.2 Escalar horizontalmente**
```bash
# Aumentar número de instancias
aws ecs update-service \
    --cluster production-simulador-cluster \
    --service production-backend-service \
    --desired-count 10
```

### **10. 🔍 TROUBLESHOOTING**

#### **10.1 Problemas comunes**
```bash
# Ver logs de errores
aws logs filter-log-events \
    --log-group-name /ecs/production-backend \
    --filter-pattern "ERROR"

# Verificar conectividad de base de datos
aws rds describe-db-instances \
    --db-instance-identifier production-simulador-db

# Verificar security groups
aws ec2 describe-security-groups \
    --group-ids sg-xxxxxxxxx
```

#### **10.2 Reiniciar servicios**
```bash
# Forzar nuevo deployment
aws ecs update-service \
    --cluster production-simulador-cluster \
    --service production-backend-service \
    --force-new-deployment
```

---

## 🎯 **BENEFICIOS DE AWS**

✅ **Alta disponibilidad**: Multi-AZ deployment  
✅ **Auto-scaling**: Escala automáticamente  
✅ **Seguridad**: IAM, VPC, Security Groups  
✅ **Monitoreo**: CloudWatch integrado  
✅ **Backup**: RDS automático  
✅ **CDN**: CloudFront global  
✅ **SSL**: Certificate Manager  
✅ **Logs**: CloudWatch Logs  

## 📞 **SOPORTE**

- **Documentación**: docs.aws.amazon.com
- **Foros**: forums.aws.amazon.com
- **Soporte**: aws.amazon.com/support

---

**¡Tu aplicación estará lista para producción en AWS en menos de 30 minutos!** 🚀 