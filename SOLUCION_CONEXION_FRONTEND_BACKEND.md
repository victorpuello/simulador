# 🔧 Solución: Conexión Frontend-Backend

## ❌ **PROBLEMA IDENTIFICADO**

El frontend no podía cargar las simulaciones porque estaba intentando conectarse a:
```
http://192.168.1.53:8000/api/simulacion/plantillas/materias_disponibles/
```

Pero el backend estaba corriendo en:
```
http://localhost:8000
```

## ✅ **SOLUCIONES APLICADAS**

### 1. **Configuración del Proxy en Vite**
- **Archivo**: `frontend/vite.config.ts`
- **Cambio**: Línea 26
```typescript
// ANTES:
target: 'http://192.168.1.53:8000',

// DESPUÉS:
target: 'http://localhost:8000',
```

### 2. **Configuración de API URL**
- **Archivo**: `frontend/src/services/api.ts`
- **Cambio**: Línea 9
```typescript
// ANTES:
baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api'),

// DESPUÉS:
baseURL: 'http://localhost:8000/api', // Forzar localhost temporalmente
```

### 3. **Archivo de Configuración de Entorno**
- **Archivo creado**: `frontend/.env.local`
```bash
VITE_API_URL=http://localhost:8000/api
```

### 4. **Backend Iniciado**
- El servidor Django backend está corriendo en segundo plano en el puerto 8000
- Endpoints disponibles verificados

---

## 🚀 **ESTADO ACTUAL**

### ✅ **Servicios Activos**
- 🔧 **Backend**: Django corriendo en `http://localhost:8000`
- 🌐 **Frontend**: React/Vite corriendo en `http://localhost:3000`
- 🔗 **Proxy**: Configurado para redirigir `/api/*` al backend

### 🔍 **Verificación**
Ejecuta el script de verificación:
```bash
./verificar-servicios.bat
```

---

## 🎯 **PRÓXIMOS PASOS**

1. **Accede al simulador**: http://localhost:3000
2. **Ve a la página de simulación**
3. **Verifica que las materias cargan correctamente**

### 📱 **Endpoints Principales Disponibles**
- `GET /api/core/materias/` - Lista de materias
- `GET /api/simulacion/plantillas/materias_disponibles/` - Materias para simulación
- `GET /api/auth/profile/` - Perfil del usuario
- `POST /api/auth/login/` - Iniciar sesión

---

## ⚠️ **NOTA IMPORTANTE**

Para **desarrollo en red local** (acceso desde otros dispositivos):
1. Cambiar `localhost` por la IP real de tu máquina
2. Configurar CORS en el backend Django
3. Actualizar `ALLOWED_HOSTS` en Django settings

**Configuración actual es SOLO para desarrollo local.**

---

## 🛠️ **Comandos Útiles**

### Iniciar Backend
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

### Iniciar Frontend
```bash
cd frontend
npm run dev
```

### Verificar Estado
```bash
# Backend
curl http://localhost:8000/api/core/materias/

# Frontend
curl http://localhost:3000

# Proxy
curl http://localhost:3000/api/core/materias/
```

✅ **¡Problema solucionado! Las simulaciones deberían cargar correctamente ahora.**