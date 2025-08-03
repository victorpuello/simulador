# 🖼️ Soporte de Imágenes en Preguntas - Simulador Saber 11

## 🎯 **Descripción General**

El sistema de **Soporte de Imágenes** permite agregar imágenes opcionales a las preguntas del simulador para enriquecer el contenido educativo con elementos visuales como gráficos, diagramas, mapas, ilustraciones y otros recursos que requieren análisis visual.

---

## 🚀 **Características Implementadas**

### ✅ **Funcionalidades Principales**
- **Campo imagen opcional** (`nullable`) en el modelo Pregunta
- **Subida de imágenes** en formularios de creación/edición
- **Visualización optimizada** en lista y detalle de preguntas
- **Soporte en carga masiva** con referencias a archivos
- **Validaciones de seguridad** completas
- **URLs absolutas** para imágenes
- **Almacenamiento organizado** por fecha

### ✅ **Formatos y Limitaciones**
- **Formatos soportados**: JPEG, PNG, WebP, GIF
- **Tamaño máximo**: 5MB por imagen
- **Resolución recomendada**: Máximo 1920x1080px para rendimiento óptimo
- **Almacenamiento**: Organizadas por año/mes (`preguntas/imagenes/YYYY/MM/`)

---

## 🏗️ **Arquitectura Técnica**

### **Backend (Django)**
```
📁 Modelo actualizado
├── Pregunta.imagen = ImageField(
│     upload_to='preguntas/imagenes/%Y/%m/',
│     null=True, blank=True
│   )
│
📁 Serializers extendidos
├── imagen_url = SerializerMethodField()
├── Soporte para URLs absolutas
└── Validación automática de formatos
│
📁 Endpoints actualizados
├── POST/PUT con FormData para archivos
├── Validaciones de tamaño y formato
└── Manejo de errores robusto
│
📁 Carga masiva mejorada
├── Campo 'imagen_archivo' en JSON
├── Directorio temporal 'temp_images'
└── Validaciones durante procesamiento
```

### **Frontend (React + TypeScript)**
```
📁 Componente ImageUpload
├── Drag & Drop interface
├── Vista previa inmediata
├── Validaciones en tiempo real
└── Manejo de errores visuales
│
📁 Formularios actualizados
├── PreguntaForm con ImageUpload
├── Soporte para FormData
└── Estados de carga optimizados
│
📁 Visualización mejorada
├── Lista con imágenes responsive
├── Click para vista completa
└── Fallbacks para errores de carga
```

---

## 📊 **Estructura de Datos**

### **Campo en Modelo Pregunta**
```python
class Pregunta(models.Model):
    # ... otros campos ...
    imagen = models.ImageField(
        upload_to='preguntas/imagenes/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Imagen de Contexto',
        help_text='Imagen opcional para análisis, gráficos, diagramas, mapas, etc.'
    )
    # ... otros campos ...
```

### **Respuesta API con Imagen**
```json
{
  "id": 123,
  "materia": {...},
  "contexto": "Análisis del siguiente gráfico:",
  "imagen": "preguntas/imagenes/2025/03/grafico_temperaturas.png",
  "imagen_url": "http://localhost:8000/media/preguntas/imagenes/2025/03/grafico_temperaturas.png",
  "enunciado": "¿Qué tendencia muestra el gráfico?",
  "opciones": {...},
  "respuesta_correcta": "B",
  "retroalimentacion": "...",
  // ... otros campos
}
```

---

## 🎨 **Uso en Frontend**

### **1. Crear/Editar Preguntas con Imágenes**

**Componente ImageUpload:**
```typescript
<ImageUpload
  onImageSelect={setSelectedImage}
  currentImageUrl={pregunta?.imagen_url}
  disabled={loading}
  maxSizeMB={5}
/>
```

**Características del componente:**
- ✅ **Drag & Drop** intuitivo
- ✅ **Vista previa** inmediata
- ✅ **Validaciones** en tiempo real
- ✅ **Botones** de cambiar/quitar
- ✅ **Información** de formatos soportados

### **2. Visualización en Lista de Preguntas**

```typescript
{pregunta.imagen_url && (
  <div className="mb-3">
    <p className="text-sm font-medium text-gray-700 mb-1">Imagen de Contexto:</p>
    <div className="flex justify-center">
      <img
        src={pregunta.imagen_url}
        alt="Imagen de contexto"
        className="max-w-full max-h-64 rounded-lg shadow-sm border border-gray-200"
        style={{ objectFit: 'contain' }}
        onClick={() => window.open(pregunta.imagen_url, '_blank')}
      />
    </div>
    <p className="text-xs text-gray-500 text-center mt-1">
      Haz clic para ver en tamaño completo
    </p>
  </div>
)}
```

### **3. Subida con FormData**

```typescript
const formDataToSend = new FormData();

// Campos de texto
formDataToSend.append('enunciado', formData.enunciado);
formDataToSend.append('opciones', JSON.stringify(formData.opciones));
// ... otros campos

// Imagen (si se seleccionó)
if (selectedImage) {
  formDataToSend.append('imagen', selectedImage);
}

// Envío sin Content-Type (FormData lo establece automáticamente)
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formDataToSend,
});
```

---

## 📤 **Carga Masiva con Imágenes**

### **Preparación de Archivos**

1. **Estructura de directorios:**
```
📁 Archivos de carga/
├── preguntas_con_imagenes.json
└── 📁 imagenes/
    ├── grafico_matematicas.png
    ├── mapa_geografia.jpg
    ├── diagrama_ciencias.png
    └── ilustracion_lenguaje.jpg
```

2. **Colocar imágenes en servidor:**
   - Subir archivos a: `backend/media/temp_images/`
   - Nombres deben coincidir con el JSON

### **Formato JSON con Imágenes**

```json
[
  {
    "materia": "Ciencias Naturales",
    "competencia": "Interpretación de gráficos",
    "contexto": "Análisis del siguiente experimento",
    "imagen_archivo": "grafico_experimento.png",
    "enunciado": "¿Qué conclusión se puede obtener del gráfico?",
    "opciones": {
      "A": "Relación directa",
      "B": "Relación inversa", 
      "C": "Sin relación",
      "D": "Relación exponencial"
    },
    "respuesta_correcta": "A",
    "retroalimentacion": "El gráfico muestra claramente una tendencia ascendente",
    "dificultad": "media",
    "tiempo_estimado": 150,
    "tags": ["ciencias", "gráficos", "experimentos"]
  }
]
```

### **Validaciones en Carga Masiva**

**Automáticas:**
- ✅ Verificación de existencia del archivo
- ✅ Validación de formato (JPG, PNG, GIF, WebP)
- ✅ Control de tamaño (máximo 5MB)
- ✅ Manejo de errores sin interrumpir carga

**Respuesta con detalles:**
```json
{
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
      "estado": "advertencia", 
      "mensaje": "Imagen no encontrada: grafico_inexistente.png. Pregunta creada sin imagen."
    },
    {
      "fila": 5,
      "estado": "error",
      "mensaje": "Error al procesar imagen 'imagen_muy_grande.jpg': La imagen es muy grande (máximo 5MB)"
    }
  ]
}
```

---

## 🛡️ **Seguridad y Validaciones**

### **Validaciones de Archivo**
- ✅ **Formato**: Solo JPEG, PNG, WebP, GIF
- ✅ **Tamaño**: Máximo 5MB por imagen
- ✅ **Nombres**: Caracteres alfanuméricos y guiones
- ✅ **Ubicación**: Solo directorios permitidos

### **Seguridad en Servidor**
- ✅ **Verificación de tipo MIME** real del archivo
- ✅ **Validación de extensión** vs contenido
- ✅ **Almacenamiento aislado** en media/
- ✅ **URLs absolutas** para evitar problemas de CORS

### **Manejo de Errores**
- ✅ **Fallbacks visuales** para imágenes que no cargan
- ✅ **Validaciones en tiempo real** en frontend
- ✅ **Mensajes descriptivos** de error
- ✅ **Transacciones atómicas** en carga masiva

---

## 📱 **Casos de Uso Principales**

### **1. Preguntas de Matemáticas**
```json
{
  "materia": "Matemáticas",
  "contexto": "Observa la siguiente función graficada",
  "imagen_archivo": "funcion_cuadratica.png",
  "enunciado": "¿Cuál es el vértice de la parábola?",
  "opciones": {
    "A": "(2, -1)",
    "B": "(-2, 1)", 
    "C": "(1, -2)",
    "D": "(-1, 2)"
  },
  "respuesta_correcta": "A"
}
```

### **2. Preguntas de Geografía**
```json
{
  "materia": "Ciencias Sociales",
  "contexto": "Analiza el siguiente mapa climático",
  "imagen_archivo": "mapa_clima_colombia.jpg",
  "enunciado": "¿Qué tipo de clima predomina en la región señalada?",
  "opciones": {
    "A": "Tropical húmedo",
    "B": "Tropical seco",
    "C": "Templado",
    "D": "Frío de montaña"
  },
  "respuesta_correcta": "D"
}
```

### **3. Preguntas de Ciencias**
```json
{
  "materia": "Ciencias Naturales",
  "contexto": "Observa el siguiente diagrama del ciclo del agua",
  "imagen_archivo": "ciclo_agua_completo.png",
  "enunciado": "¿Qué proceso está representado por la flecha número 3?",
  "opciones": {
    "A": "Evaporación",
    "B": "Condensación",
    "C": "Precipitación", 
    "D": "Infiltración"
  },
  "respuesta_correcta": "C"
}
```

---

## 🎯 **Mejores Prácticas**

### **Para Docentes**
1. **Calidad de imagen:**
   - Usar imágenes claras y de alta resolución
   - Evitar fondos con mucho ruido visual
   - Contrastar adecuadamente texto e imágenes

2. **Tamaño optimizado:**
   - Comprimir imágenes antes de subir
   - Usar formatos web-optimizados (WebP, PNG optimizado)
   - Mantener relación de aspecto apropiada

3. **Contenido educativo:**
   - Asegurar que la imagen sea esencial para la pregunta
   - Evitar imágenes decorativas innecesarias
   - Incluir texto alternativo conceptual

### **Para Administradores**
1. **Gestión de archivos:**
   - Limpiar directorio temporal regularmente
   - Monitorear uso de espacio en disco
   - Hacer respaldos de imágenes importantes

2. **Rendimiento:**
   - Configurar CDN para imágenes en producción
   - Implementar lazy loading para listas largas
   - Considerar thumbnails para vistas previas

---

## 🔧 **Configuración Técnica**

### **Settings Django**
```python
# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Maximum file size (5MB)
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880
```

### **URLs Django**
```python
# En urls.py principal
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### **Componente Frontend**
```typescript
interface ImageUploadProps {
  onImageSelect: (file: File | null) => void;
  currentImageUrl?: string | null;
  disabled?: boolean;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}
```

---

## 🚨 **Solución de Problemas**

### **Problemas Comunes**

**❌ "Error al cargar imagen"**
- **Causa**: Archivo no existe o ruta incorrecta
- **Solución**: Verificar que el archivo esté en `media/temp_images/`

**❌ "Formato no soportado"**
- **Causa**: Archivo no es JPG, PNG, WebP o GIF
- **Solución**: Convertir a formato soportado

**❌ "Imagen muy grande"**
- **Causa**: Archivo excede 5MB
- **Solución**: Comprimir imagen o reducir resolución

**❌ "No se muestra en frontend"**
- **Causa**: URL incorrecta o problemas de CORS
- **Solución**: Verificar configuración de MEDIA_URL

### **Debugging**

**Backend:**
```python
# Verificar configuración de media
python manage.py shell
>>> from django.conf import settings
>>> print(settings.MEDIA_ROOT)
>>> print(settings.MEDIA_URL)
```

**Frontend:**
```typescript
// Verificar URL de imagen
console.log('Imagen URL:', pregunta.imagen_url);

// Verificar estado de carga
console.log('Selected image:', selectedImage);
```

---

## 📈 **Métricas y Estadísticas**

### **Información que se puede rastrear:**
- 📊 **Porcentaje de preguntas** con imágenes por materia
- 📊 **Tamaño promedio** de archivos subidos
- 📊 **Formatos más utilizados** por los docentes
- 📊 **Errores de carga** más frecuentes
- 📊 **Uso de espacio** en disco por imágenes

### **Ejemplo de consulta:**
```python
# Preguntas con imágenes por materia
from apps.core.models import Pregunta
stats = Pregunta.objects.filter(activa=True).values('materia__nombre_display').annotate(
    total=Count('id'),
    con_imagen=Count('id', filter=Q(imagen__isnull=False))
)
```

---

## 🔮 **Futuras Mejoras Planificadas**

### **Corto Plazo**
- 🔄 **Redimensionamiento automático** de imágenes
- 📱 **Thumbnails** para listas optimizadas
- 🗂️ **Galería de imágenes** reutilizables
- 📊 **Editor de imágenes** básico integrado

### **Mediano Plazo**
- ☁️ **Almacenamiento en la nube** (AWS S3, Google Cloud)
- 🤖 **Compresión automática** inteligente
- 🔍 **Búsqueda por contenido** de imagen
- 📋 **Plantillas visuales** predefinidas

### **Largo Plazo**
- 🧠 **IA para generación** de preguntas visuales
- 🎨 **Editor visual avanzado** integrado
- 📊 **Analytics de interacción** con imágenes
- 🌐 **CDN global** para mejor rendimiento

---

## 📞 **Soporte y Contacto**

### **Para Problemas Técnicos:**
1. **Verificar configuración** de media files
2. **Revisar logs** de Django para errores específicos
3. **Comprobar permisos** de directorios
4. **Validar formatos** y tamaños de archivo

### **Para Mejoras:**
- Solicitar nuevos formatos de imagen soportados
- Proponer mejoras en la interfaz de usuario
- Sugerir optimizaciones de rendimiento

---

**¡El soporte de imágenes está completamente implementado y listo para enriquecer las preguntas del simulador con contenido visual educativo!** 🖼️📚✨