@echo off
setlocal enabledelayedexpansion

echo 🚀 Iniciando deployment del Simulador Saber 11 en AWS...

REM Colores para output
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Función para imprimir mensajes
:print_status
echo %BLUE%[INFO]%NC% %~1
goto :eof

:print_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM Verificar AWS CLI
call :print_status "Verificando AWS CLI..."
where aws >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "AWS CLI no está instalado. Instálalo primero:"
    echo https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
    pause
    exit /b 1
)

REM Verificar configuración de AWS
call :print_status "Verificando configuración de AWS..."
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "AWS no está configurado. Ejecuta 'aws configure' primero."
    pause
    exit /b 1
)

call :print_success "AWS CLI configurado correctamente."

REM Obtener variables de entorno
call :print_status "Configurando variables de entorno..."

REM Solicitar información al usuario
set /p DOMAIN_NAME="Ingresa el nombre del dominio (ej: simulador-saber11.com): "
set /p ENVIRONMENT="Ingresa el environment (development/staging/production): "
set /p AWS_REGION="Ingresa la región AWS (ej: us-east-1): "

REM Generar secretos si no existen
if not exist ".env.aws" (
    call :print_status "Generando secretos seguros..."
    
    REM Generar SECRET_KEY usando PowerShell
    for /f "tokens=*" %%i in ('powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(50, 10)"') do set SECRET_KEY=%%i
    
    REM Generar DB_PASSWORD usando PowerShell
    for /f "tokens=*" %%i in ('powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(32, 10)"') do set DB_PASSWORD=%%i
    
    REM Crear archivo de entorno
    (
        echo # Configuración AWS
        echo AWS_REGION=%AWS_REGION%
        echo DOMAIN_NAME=%DOMAIN_NAME%
        echo ENVIRONMENT=%ENVIRONMENT%
        echo.
        echo # Configuración de la base de datos
        echo DB_PASSWORD=%DB_PASSWORD%
        echo.
        echo # Configuración de Django
        echo SECRET_KEY=%SECRET_KEY%
        echo DEBUG=False
        echo ALLOWED_HOSTS=%DOMAIN_NAME%,*.%DOMAIN_NAME%
        echo CORS_ALLOWED_ORIGINS=https://%DOMAIN_NAME%,https://*.%DOMAIN_NAME%
        echo.
        echo # Configuración del frontend
        echo VITE_API_URL=https://%DOMAIN_NAME%/api
        echo.
        echo # Configuración de seguridad
        echo CSRF_TRUSTED_ORIGINS=https://%DOMAIN_NAME%,https://*.%DOMAIN_NAME%
    ) > .env.aws

    call :print_success "Archivo .env.aws creado con secretos generados."
) else (
    call :print_status "Cargando configuración existente..."
    for /f "tokens=1,* delims==" %%a in (.env.aws) do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
)

REM Configurar región AWS
set AWS_DEFAULT_REGION=%AWS_REGION%

call :print_status "Configurando región AWS: %AWS_REGION%"

REM Crear ECR repositories
call :print_status "Creando ECR repositories..."

REM Backend repository
aws ecr create-repository --repository-name simulador-backend --region %AWS_REGION% >nul 2>&1
for /f "tokens=*" %%i in ('aws ecr describe-repositories --repository-names simulador-backend --query "repositories[0].repositoryUri" --output text --region %AWS_REGION%') do set BACKEND_REPO_URI=%%i

REM Frontend repository
aws ecr create-repository --repository-name simulador-frontend --region %AWS_REGION% >nul 2>&1
for /f "tokens=*" %%i in ('aws ecr describe-repositories --repository-names simulador-frontend --query "repositories[0].repositoryUri" --output text --region %AWS_REGION%') do set FRONTEND_REPO_URI=%%i

call :print_success "ECR repositories creados."

REM Login a ECR
call :print_status "Haciendo login a ECR..."
aws ecr get-login-password --region %AWS_REGION% | docker login --username AWS --password-stdin %BACKEND_REPO_URI:~0,-1%

REM Construir y subir imágenes
call :print_status "Construyendo imagen del backend..."
docker build -t simulador-backend ./backend
docker tag simulador-backend:latest %BACKEND_REPO_URI%:latest
docker push %BACKEND_REPO_URI%:latest

call :print_status "Construyendo imagen del frontend..."
docker build -t simulador-frontend ./frontend
docker tag simulador-frontend:latest %FRONTEND_REPO_URI%:latest
docker push %FRONTEND_REPO_URI%:latest

call :print_success "Imágenes subidas a ECR."

REM Desplegar CloudFormation stack
call :print_status "Desplegando infraestructura con CloudFormation..."

set STACK_NAME=simulador-%ENVIRONMENT%

aws cloudformation deploy ^
    --template-file aws-deploy.yml ^
    --stack-name %STACK_NAME% ^
    --parameter-overrides ^
        Environment=%ENVIRONMENT% ^
        DomainName=%DOMAIN_NAME% ^
        DBPassword=%DB_PASSWORD% ^
        SecretKey=%SECRET_KEY% ^
    --capabilities CAPABILITY_NAMED_IAM ^
    --region %AWS_REGION%

call :print_success "Stack de CloudFormation desplegado."

REM Esperar a que el stack esté completo
call :print_status "Esperando a que el stack esté completo..."
aws cloudformation wait stack-create-complete --stack-name %STACK_NAME% --region %AWS_REGION%

REM Obtener outputs del stack
call :print_status "Obteniendo información del deployment..."

for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" --output text --region %AWS_REGION%') do set LOAD_BALANCER_DNS=%%i

for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" --output text --region %AWS_REGION%') do set DATABASE_ENDPOINT=%%i

for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" --output text --region %AWS_REGION%') do set S3_BUCKET=%%i

REM Configurar DNS (si el usuario tiene Route53)
call :print_status "Configurando DNS..."
set /p HAS_ROUTE53="¿Tienes un dominio registrado en Route53? (y/n): "

if /i "%HAS_ROUTE53%"=="y" (
    REM Crear hosted zone si no existe
    for /f "tokens=*" %%i in ('aws route53 list-hosted-zones --query "HostedZones[?Name=='%DOMAIN_NAME%.'].Id" --output text --region %AWS_REGION%') do set HOSTED_ZONE_ID=%%i
    
    if "%HOSTED_ZONE_ID%"=="" (
        call :print_status "Creando hosted zone..."
        for /f "tokens=*" %%i in ('aws route53 create-hosted-zone --name %DOMAIN_NAME% --caller-reference %time% --query "HostedZone.Id" --output text --region %AWS_REGION%') do set HOSTED_ZONE_ID=%%i
    )
    
    REM Crear registro A
    aws route53 change-resource-record-sets ^
        --hosted-zone-id %HOSTED_ZONE_ID% ^
        --change-batch "{\"Changes\": [{\"Action\": \"UPSERT\",\"ResourceRecordSet\": {\"Name\": \"%DOMAIN_NAME%\",\"Type\": \"A\",\"AliasTarget\": {\"HostedZoneId\": \"Z35SXDOTRQ7X7K\",\"DNSName\": \"%LOAD_BALANCER_DNS%\",\"EvaluateTargetHealth\": true}}}]}" ^
        --region %AWS_REGION%
    
    call :print_success "DNS configurado en Route53."
) else (
    call :print_warning "Configura manualmente el DNS de tu dominio para apuntar a: %LOAD_BALANCER_DNS%"
)

REM Configurar SSL con Certificate Manager
call :print_status "Configurando certificado SSL..."
for /f "tokens=*" %%i in ('aws acm request-certificate --domain-name %DOMAIN_NAME% --subject-alternative-names "*.%DOMAIN_NAME%" --validation-method DNS --query "CertificateArn" --output text --region %AWS_REGION%') do set CERT_ARN=%%i

call :print_warning "Certificado SSL solicitado. Debes validar el certificado en AWS Certificate Manager."

REM Mostrar información final
call :print_success "🎉 ¡Deployment en AWS completado exitosamente!"
echo.
echo 📋 Información del deployment:
echo    🌐 Load Balancer DNS: %LOAD_BALANCER_DNS%
echo    🗄️  Database Endpoint: %DATABASE_ENDPOINT%
echo    📦 S3 Bucket: %S3_BUCKET%
echo    🔒 Certificate ARN: %CERT_ARN%
echo.
echo 🔧 Próximos pasos:
echo    1. Valida el certificado SSL en AWS Certificate Manager
echo    2. Configura el DNS de tu dominio para apuntar a: %LOAD_BALANCER_DNS%
echo    3. Actualiza el stack con el ARN del certificado validado
echo.
echo 📝 Comandos útiles:
echo    Ver logs: aws logs tail /ecs/%ENVIRONMENT%-backend --follow
echo    Verificar servicios: aws ecs describe-services --cluster %ENVIRONMENT%-simulador-cluster
echo    Actualizar stack: aws cloudformation deploy --template-file aws-deploy.yml --stack-name %STACK_NAME%
echo.
call :print_warning "⚠️  IMPORTANTE: Cambia las credenciales por defecto después del primer acceso!"
echo.

pause 