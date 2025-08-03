# 🔗 Endpoints de la API - Simulador Saber 11

## 📋 Información General

- **Base URL**: `http://localhost:8000/api/`
- **Autenticación**: JWT Bearer Token
- **Formato**: JSON
- **Documentación**: `http://localhost:8000/api/docs/`

## 🔐 Autenticación

### Obtener Token JWT
```http
POST /api/auth/token/
Content-Type: application/json

{
    "username": "admin",
    "password": "tu_password"
}
```

### Refrescar Token
```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
    "refresh": "tu_refresh_token"
}
```

### Registro de Usuario
```http
POST /api/auth/registro/
Content-Type: application/json

{
    "username": "nuevo_usuario",
    "email": "usuario@ejemplo.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "rol": "estudiante",
    "password": "password123",
    "password_confirm": "password123"
}
```

### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
    "username": "usuario",
    "password": "password123"
}
```

### Obtener Usuario Actual
```http
GET /api/auth/usuario-actual/
Authorization: Bearer <token>
```

### Actualizar Perfil
```http
PUT /api/auth/perfil/
Authorization: Bearer <token>
Content-Type: application/json

{
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "nuevo@email.com",
    "avatar": "https://ejemplo.com/avatar.jpg"
}
```

## 📚 Core - Materias y Contenido

### Listar Materias
```http
GET /api/core/materias/
Authorization: Bearer <token>
```

### Obtener Materia Específica
```http
GET /api/core/materias/{id}/
Authorization: Bearer <token>
```

### Estadísticas de Materia
```http
GET /api/core/materias/{id}/estadisticas/
Authorization: Bearer <token>
```

### Listar Competencias
```http
GET /api/core/competencias/
Authorization: Bearer <token>
```

### Listar Preguntas
```http
GET /api/core/preguntas/
Authorization: Bearer <token>
```

### Preguntas para Simulación
```http
GET /api/core/preguntas/para_simulacion/?materia=1&cantidad=10&dificultad=media
Authorization: Bearer <token>
```

## 🎮 Simulación

### Crear Sesión
```http
POST /api/core/sesiones/
Authorization: Bearer <token>
Content-Type: application/json

{
    "materia": 1,
    "modo": "practica"
}
```

### Finalizar Sesión
```http
POST /api/core/sesiones/{id}/finalizar/
Authorization: Bearer <token>
```

### Estadísticas del Usuario
```http
GET /api/core/sesiones/estadisticas_usuario/
Authorization: Bearer <token>
```

### Crear Respuesta
```http
POST /api/core/respuestas/
Authorization: Bearer <token>
Content-Type: application/json

{
    "sesion": 1,
    "pregunta": 1,
    "respuesta_seleccionada": "A",
    "tiempo_respuesta": 45
}
```

## 👥 Gestión de Clases (Docentes)

### Crear Clase
```http
POST /api/core/clases/
Authorization: Bearer <token>
Content-Type: application/json

{
    "nombre": "Matemáticas 11A",
    "configuracion": {
        "tema": "dark",
        "notificaciones": true
    }
}
```

### Inscribir Estudiante
```http
POST /api/core/clases/{id}/inscribir_estudiante/
Authorization: Bearer <token>
Content-Type: application/json

{
    "codigo": "ABC12345"
}
```

### Crear Asignación
```http
POST /api/core/asignaciones/
Authorization: Bearer <token>
Content-Type: application/json

{
    "clase": 1,
    "materia": 1,
    "titulo": "Práctica de Álgebra",
    "descripcion": "Resolver ecuaciones lineales",
    "cantidad_preguntas": 15,
    "tiempo_limite": 30,
    "fecha_limite": "2025-08-15T23:59:59Z"
}
```

## 🏆 Gamificación

### Listar Insignias
```http
GET /api/core/insignias/
Authorization: Bearer <token>
```

### Logros del Usuario
```http
GET /api/core/logros/
Authorization: Bearer <token>
```

## 🔍 Búsqueda y Filtros

### Filtros Disponibles

**Materias:**
- `?activa=true` - Solo materias activas

**Competencias:**
- `?materia=1` - Por materia específica
- `?peso_icfes=0.5` - Por peso ICFES

**Preguntas:**
- `?materia=1` - Por materia
- `?competencia=1` - Por competencia
- `?dificultad=media` - Por dificultad
- `?activa=true` - Solo activas

**Sesiones:**
- `?materia=1` - Por materia
- `?modo=practica` - Por modo
- `?completada=true` - Solo completadas

**Clases:**
- `?activa=true` - Solo activas
- `?docente=1` - Por docente

**Asignaciones:**
- `?clase=1` - Por clase
- `?materia=1` - Por materia
- `?activa=true` - Solo activas

### Búsqueda

**Preguntas:**
```http
GET /api/core/preguntas/?search=ecuación
```

**Clases:**
```http
GET /api/core/clases/?search=matemáticas
```

**Usuarios (solo docentes):**
```http
GET /api/auth/buscar-usuarios/?q=juan
```

## 📊 Ejemplos de Respuestas

### Respuesta de Login
```json
{
    "message": "Login exitoso",
    "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@simulador.com",
        "first_name": "Admin",
        "last_name": "User",
        "rol": "docente",
        "rol_display": "Docente",
        "racha_actual": 5,
        "puntos_totales": 1250,
        "avatar": null
    },
    "tokens": {
        "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
}
```

### Respuesta de Estadísticas de Usuario
```json
{
    "total_sesiones": 15,
    "promedio_puntaje": 78.5,
    "racha_actual": 7,
    "puntos_totales": 1250,
    "sesiones_por_materia": [
        {
            "materia__nombre_display": "Matemáticas",
            "count": 8,
            "avg_puntaje": 82.5
        },
        {
            "materia__nombre_display": "Lenguaje",
            "count": 7,
            "avg_puntaje": 74.2
        }
    ],
    "ultimas_sesiones": [...]
}
```

## 🚨 Códigos de Error

- `400` - Bad Request (datos inválidos)
- `401` - Unauthorized (token inválido o faltante)
- `403` - Forbidden (sin permisos)
- `404` - Not Found (recurso no encontrado)
- `429` - Too Many Requests (rate limit)

## 🔧 Headers Requeridos

Para endpoints autenticados:
```
Authorization: Bearer <tu_token_jwt>
Content-Type: application/json
```

## 📝 Notas Importantes

1. **Tokens JWT**: Los tokens expiran en 60 minutos. Usa el endpoint de refresh para renovarlos.

2. **Permisos**: 
   - Solo docentes pueden crear clases y asignaciones
   - Solo docentes pueden buscar usuarios
   - Los estudiantes solo ven sus propias sesiones

3. **Filtros**: Todos los endpoints soportan filtrado, búsqueda y ordenamiento.

4. **Paginación**: Las listas están paginadas (20 elementos por página).

5. **Validación**: Todos los datos son validados antes de ser procesados.

---

*Para más detalles, consulta la documentación interactiva en: `http://localhost:8000/api/docs/`* 