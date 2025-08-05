# 🎯 Simulador Pruebas Saber 11

Una plataforma web integral para la preparación de las Pruebas Saber 11, diseñada para estudiantes y docentes con funcionalidades gamificadas y análisis avanzado de rendimiento.

## 🚀 Características Principales

### Para Estudiantes
- ✅ Simulaciones interactivas con retroalimentación instantánea
- 🎮 Sistema de gamificación con insignias y rachas
- 📊 Reportes detallados de rendimiento por competencia
- 📱 Diseño responsive para móvil, tablet y desktop
- 🔄 Modo offline para práctica sin conexión

### Para Docentes
- 👥 Gestión de clases y estudiantes
- 📝 Creación de asignaciones personalizadas
- 📈 Dashboard de seguimiento de progreso
- 📋 Reportes agregados de clase
- 🔔 Sistema de notificaciones

## 🏗️ Arquitectura

- **Backend**: Django 4.2+ con Django REST Framework
- **Frontend**: React 18+ con TypeScript y Vite
- **Base de Datos**: PostgreSQL
- **Cache**: Redis
- **UI**: Tailwind CSS + Headless UI
- **Testing**: pytest, Vitest, Playwright

## 📁 Estructura del Proyecto

```
simulador-saber-11/
├── backend/                 # API Django
│   ├── apps/
│   │   ├── core/           # Modelos principales
│   │   ├── auth/           # Autenticación
│   │   ├── simulacion/     # Lógica de simulación
│   │   ├── reportes/       # Analytics y reportes
│   │   └── gamificacion/   # Sistema de gamificación
│   ├── requirements.txt
│   └── manage.py
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas principales
│   │   ├── hooks/          # Custom hooks
│   │   ├── stores/         # Estado global (Zustand)
│   │   └── utils/          # Utilidades
│   ├── package.json
│   └── vite.config.ts
├── docs/                   # Documentación
├── docker-compose.yml      # Entorno de desarrollo
└── README.md
```

## 🛠️ Instalación y Desarrollo

### Prerrequisitos
- Python 3.11+
- Node.js 18+
- Docker y Docker Compose
- Git

### Configuración Rápida

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd simulador-saber-11
```

2. **Iniciar con Docker Compose**
```bash
docker-compose up -d
```

3. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Django: http://localhost:8000/admin

### Desarrollo Local

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

### E2E
```bash
npm run test:e2e
```

## 📊 Métricas de Éxito

- **Performance**: < 2s tiempo de carga inicial
- **Disponibilidad**: 99.9% uptime
- **Test Coverage**: > 80%
- **Retención**: 70% de usuarios regresan semanalmente

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🚀 Deployment

### AWS Amplify Hosting (Recomendado)

Para un deployment rápido y automático:

1. **Subir a GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Configurar AWS Amplify**
- Ve a [AWS Console](https://console.aws.amazon.com)
- Busca "Amplify" → "New app" → "Host web app"
- Conecta tu repositorio de GitHub
- Amplify detectará automáticamente el framework

3. **Configurar dominio**
- En Amplify Console → "Domain management"
- Agrega tu dominio: `victorpuello.com`
- Configura los registros CNAME en GoDaddy

4. **Backend separado**
```bash
./deploy-backend-aws.sh
```

**Ventajas:**
- ✅ Deployment automático en cada push
- ✅ SSL automático con CloudFront CDN
- ✅ Rollback instantáneo
- ✅ Preview deployments por rama
- ✅ Tiempo de setup: ~10 minutos

Ver [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) para instrucciones detalladas.

## 📞 Contacto

- **Desarrollador**: [Tu Nombre]
- **Email**: [tu-email@ejemplo.com]
- **Proyecto**: [https://github.com/usuario/simulador-saber-11]

---

*Desarrollado con ❤️ para mejorar la educación en Colombia* 