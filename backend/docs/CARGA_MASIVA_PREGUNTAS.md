# 📚 Carga Masiva de Preguntas - Simulador Saber 11

## 🎯 Descripción

La funcionalidad de carga masiva permite a profesores y administradores cargar múltiples preguntas de una vez utilizando un archivo JSON. Esta característica agiliza significativamente el proceso de creación de contenido para el simulador.

## 🔐 Permisos Requeridos

- **Profesores** (`rol: docente`)
- **Administradores** (`rol: admin` o `is_staff: true`)

## 📋 Endpoints Disponibles

### 1. Carga Masiva
- **URL**: `/api/core/preguntas/carga_masiva/`
- **Método**: `POST`
- **Content-Type**: `multipart/form-data`
- **Parámetros**: 
  - `archivo`: Archivo JSON con las preguntas

### 2. Plantilla de Ejemplo
- **URL**: `/api/core/preguntas/plantilla_carga/`
- **Método**: `GET`
- **Descripción**: Descarga un archivo JSON de ejemplo

## 📄 Formato del Archivo JSON

### Estructura General
El archivo debe contener un array de objetos, donde cada objeto representa una pregunta:

```json
[
  {
    "materia": "Matemáticas",
    "competencia": "Razonamiento y argumentación",
    "contexto": "En un problema de aplicación de ecuaciones lineales",
    "enunciado": "Si 2x + 5 = 13, ¿cuál es el valor de x?",
    "opciones": {
      "A": "3",
      "B": "4", 
      "C": "5",
      "D": "6"
    },
    "respuesta_correcta": "B",
    "retroalimentacion": "Para resolver 2x + 5 = 13, restamos 5 de ambos lados: 2x = 8, luego dividimos entre 2: x = 4",
    "explicacion": "Esta es una ecuación lineal simple que se resuelve despejando la variable x",
    "habilidad_evaluada": "Resolución de ecuaciones lineales",
    "explicacion_opciones_incorrectas": {
      "A": "Este valor no satisface la ecuación original",
      "C": "Al sustituir este valor, la ecuación no se cumple",
      "D": "Este resultado viene de un error en el cálculo"
    },
    "estrategias_resolucion": "1. Aislar el término con la variable, 2. Realizar operaciones inversas, 3. Verificar el resultado",
    "errores_comunes": "Olvidar cambiar el signo al pasar términos de un lado al otro",
    "dificultad": "facil",
    "tiempo_estimado": 90,
    "tags": ["álgebra", "ecuaciones", "básico"]
  }
]
```

### Campos Requeridos ⭐

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `materia` | String | Nombre de la materia (se crea automáticamente si no existe) |
| `enunciado` | String | Texto de la pregunta |
| `opciones` | Object | Opciones de respuesta (A, B, C, D) |
| `respuesta_correcta` | String | Letra de la respuesta correcta |
| `retroalimentacion` | String | Explicación de la respuesta correcta |

### Campos Opcionales 🔧

| Campo | Tipo | Valor por Defecto | Descripción |
|-------|------|-------------------|-------------|
| `competencia` | String | null | Nombre de la competencia (se crea si no existe) |
| `contexto` | String | "" | Contexto o situación de la pregunta |
| `explicacion` | String | "" | Explicación adicional detallada |
| `habilidad_evaluada` | String | "" | Descripción de la habilidad específica |
| `explicacion_opciones_incorrectas` | Object | {} | Explicación de por qué cada opción incorrecta es inválida |
| `estrategias_resolucion` | String | "" | Técnicas para resolver este tipo de preguntas |
| `errores_comunes` | String | "" | Errores frecuentes de los estudiantes |
| `dificultad` | String | "media" | "facil", "media" o "dificil" |
| `tiempo_estimado` | Number | 60 | Tiempo estimado en segundos (30-300) |
| `tags` | Array | [] | Etiquetas para categorización |

## 📊 Respuesta del Servidor

### Respuesta Exitosa
```json
{
  "mensaje": "Carga masiva completada",
  "total_procesadas": 10,
  "exitosas": 8,
  "errores": 2,
  "detalles": [
    {
      "fila": 1,
      "estado": "exitosa",
      "id_pregunta": 123,
      "mensaje": "Pregunta creada correctamente"
    },
    {
      "fila": 3,
      "estado": "error",
      "mensaje": "Campo requerido faltante: enunciado"
    }
  ]
}
```

### Códigos de Error
- `400`: Archivo inválido o JSON malformado
- `403`: Sin permisos para esta operación
- `500`: Error interno del servidor

## 🚀 Cómo Usar la Funcionalidad

### Desde la Interfaz Web
1. **Acceder**: Ve a `/admin` (solo profesores y administradores)
2. **Descargar plantilla**: Haz clic en "Descargar Plantilla" para obtener un ejemplo
3. **Preparar archivo**: Edita el JSON con tus preguntas
4. **Subir archivo**: Selecciona tu archivo JSON y haz clic en "Cargar Preguntas"
5. **Revisar resultados**: Verifica el reporte de carga con detalles de éxitos y errores

### Desde API (Programático)
```javascript
const formData = new FormData();
formData.append('archivo', archivoJSON);

const response = await fetch('/api/core/preguntas/carga_masiva/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const resultado = await response.json();
```

## ✅ Validaciones Automáticas

### En el Backend
- ✅ Verificación de permisos de usuario
- ✅ Validación de formato JSON
- ✅ Campos requeridos presentes
- ✅ Estructura de opciones válida
- ✅ Respuesta correcta existe en opciones
- ✅ Creación automática de materias y competencias
- ✅ Transacciones atómicas (todo o nada por pregunta)

### En el Frontend
- ✅ Verificación de extensión .json
- ✅ Control de permisos de usuario
- ✅ Interfaz intuitiva con feedback visual
- ✅ Reporte detallado de resultados

## 🔧 Características Técnicas

### Transacciones
Cada pregunta se procesa en una transacción independiente. Si una pregunta falla, no afecta al procesamiento de las demás.

### Creación Automática
- **Materias**: Se crean automáticamente si no existen
- **Competencias**: Se crean y asocian a la materia correspondiente

### Límites
- **Archivo**: Sin límite específico de tamaño
- **Preguntas**: Sin límite de cantidad por archivo
- **Tiempo**: Procesamiento asíncrono para archivos grandes

## 🐛 Errores Comunes y Soluciones

### Error: "Campo requerido faltante"
**Causa**: Falta algún campo obligatorio
**Solución**: Verificar que todas las preguntas tengan: materia, enunciado, opciones, respuesta_correcta, retroalimentacion

### Error: "Las opciones deben ser un diccionario"
**Causa**: El campo opciones no es un objeto válido
**Solución**: Usar formato: `{"A": "texto", "B": "texto", ...}`

### Error: "La respuesta correcta no está en las opciones"
**Causa**: La letra especificada no existe en las opciones
**Solución**: Verificar que respuesta_correcta sea A, B, C o D y esté en opciones

### Error: "El archivo no contiene un JSON válido"
**Causa**: Archivo JSON malformado
**Solución**: Validar JSON en un editor o validador online

## 📈 Mejores Prácticas

1. **Empezar pequeño**: Probar con 2-3 preguntas antes de cargar archivos grandes
2. **Usar plantilla**: Siempre partir de la plantilla descargada
3. **Validar JSON**: Verificar formato antes de subir
4. **Revisar resultados**: Siempre revisar el reporte de carga
5. **Backup**: Mantener copias de seguridad de los archivos JSON

## 🎯 Ejemplo Completo

```json
[
  {
    "materia": "Matemáticas",
    "competencia": "Razonamiento y argumentación",
    "contexto": "En el contexto de funciones cuadráticas",
    "enunciado": "¿Cuál es el vértice de la parábola y = x² - 4x + 3?",
    "opciones": {
      "A": "(2, -1)",
      "B": "(-2, 1)",
      "C": "(2, 1)",
      "D": "(-2, -1)"
    },
    "respuesta_correcta": "A",
    "retroalimentacion": "El vértice de una parábola y = ax² + bx + c está en x = -b/(2a). Para y = x² - 4x + 3: x = 4/2 = 2, y = 4 - 8 + 3 = -1",
    "explicacion": "Para encontrar el vértice, usamos la fórmula x = -b/(2a) y luego sustituimos en la ecuación original",
    "habilidad_evaluada": "Análisis de funciones cuadráticas y cálculo de vértices",
    "explicacion_opciones_incorrectas": {
      "B": "Error en el signo de la coordenada x",
      "C": "Error en el cálculo de la coordenada y",
      "D": "Errores en ambas coordenadas"
    },
    "estrategias_resolucion": "1. Identificar coeficientes a, b, c, 2. Aplicar fórmula x = -b/(2a), 3. Sustituir x en ecuación original",
    "errores_comunes": "Confundir los signos en la fórmula del vértice",
    "dificultad": "media",
    "tiempo_estimado": 120,
    "tags": ["funciones", "cuadráticas", "vértice", "parábolas"]
  },
  {
    "materia": "Lenguaje",
    "competencia": "Comprensión lectora",
    "enunciado": "En el texto 'Don Quijote de la Mancha', ¿cuál es la característica principal del protagonista?",
    "opciones": {
      "A": "Su realismo y pragmatismo",
      "B": "Su idealismo y tendencia a confundir realidad con fantasía",
      "C": "Su cobardía ante los peligros",
      "D": "Su avaricia y materialismo"
    },
    "respuesta_correcta": "B",
    "retroalimentacion": "Don Quijote es caracterizado por su idealismo extremo y su tendencia a ver la realidad a través del prisma de las novelas de caballería",
    "dificultad": "facil",
    "tiempo_estimado": 90,
    "tags": ["literatura", "clásicos", "personajes"]
  }
]
```