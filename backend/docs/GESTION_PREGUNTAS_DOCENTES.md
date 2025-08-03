# 📚 Gestión de Preguntas para Docentes - Simulador Saber 11

## 🎯 **Descripción General**

La funcionalidad de **Gestión de Preguntas** permite a los docentes y administradores gestionar completamente el banco de preguntas del simulador. Incluye herramientas para crear, editar, eliminar, filtrar y analizar preguntas de manera eficiente.

---

## 🚀 **Características Principales**

### ✅ **Gestión Completa de Preguntas**
- **Crear** nuevas preguntas manualmente
- **Editar** preguntas existentes
- **Eliminar** preguntas (soft delete)
- **Duplicar** preguntas para reutilizar

### 🔍 **Filtros y Búsqueda Avanzada**
- **Búsqueda por texto** en enunciado y contexto
- **Filtro por materia** con carga dinámica de competencias
- **Filtro por competencia** específica
- **Filtro por dificultad** (fácil, media, difícil)
- **Mostrar/ocultar** preguntas inactivas
- **Filtros múltiples** combinables

### 📊 **Estadísticas y Análisis**
- **Estadísticas generales** del banco de preguntas
- **Distribución por dificultad** con gráficos
- **Análisis por materia** con desglose detallado
- **Recomendaciones** para mejorar el banco
- **Métricas de calidad** automáticas

### 🎨 **Interfaz Intuitiva**
- **Vista de lista** con paginación infinita
- **Vista expandida** de preguntas completas
- **Formularios validados** con retroalimentación
- **Confirmaciones** para acciones destructivas
- **Notificaciones** de éxito y error

---

## 🔐 **Permisos y Seguridad**

### **Roles Autorizados:**
- ✅ **Docentes** (`rol: docente`)
- ✅ **Administradores** (`rol: admin`)
- ✅ **Staff** (`is_staff: true`)

### **Validaciones de Seguridad:**
- ✅ Verificación de permisos en **backend** y **frontend**
- ✅ Tokens JWT para autenticación
- ✅ Validación de datos en el servidor
- ✅ Soft delete para preservar integridad

---

## 📱 **Cómo Usar la Funcionalidad**

### **1. Acceso a la Gestión**
1. **Inicia sesión** como docente o administrador
2. Ve al **sidebar** y haz clic en "**Gestión de Preguntas**"
3. Llegarás a la página principal con **tres pestañas**:
   - 📋 **Lista de Preguntas**
   - ➕ **Crear Pregunta**
   - 📊 **Estadísticas**

### **2. Ver y Filtrar Preguntas**
1. En la pestaña **"Lista de Preguntas"**:
   - Usa los **filtros** para encontrar preguntas específicas
   - **Busca por texto** en el campo de búsqueda
   - **Filtra por materia** y automáticamente se cargan las competencias
   - **Selecciona dificultad** para ver solo preguntas de ese nivel
   - **Activa "Mostrar inactivas"** para ver preguntas eliminadas

2. **Interactúa con las preguntas**:
   - Haz clic en **"Ver más"** para expandir detalles completos
   - Usa **"Editar"** para modificar una pregunta
   - Usa **"Duplicar"** para crear una copia
   - Usa **"Eliminar"** con confirmación de seguridad

### **3. Crear Nueva Pregunta**
1. Ve a la pestaña **"Crear Pregunta"**
2. **Completa el formulario**:
   - ⭐ **Materia** (requerido)
   - **Competencia** (opcional, se carga según la materia)
   - **Contexto** (opcional, situación de la pregunta)
   - ⭐ **Enunciado** (requerido, la pregunta principal)
   - ⭐ **Opciones A, B, C, D** (requeridas)
   - ⭐ **Respuesta correcta** (selecciona con radio button)
   - ⭐ **Retroalimentación** (requerida, explicación)
   - **Explicación adicional** (opcional)
   - **Dificultad** (fácil, media, difícil)
   - **Tiempo estimado** (30-300 segundos)
   - **Tags** (separados por coma)
   - **Habilidad evaluada** (opcional)

3. Haz clic en **"Crear Pregunta"**

### **4. Editar Pregunta Existente**
1. En la lista, haz clic en **"Editar"** en cualquier pregunta
2. Se abrirá el **mismo formulario** con datos precargados
3. **Modifica** los campos necesarios
4. Haz clic en **"Actualizar Pregunta"**

### **5. Ver Estadísticas**
1. Ve a la pestaña **"Estadísticas"**
2. **Revisa las métricas**:
   - **Total de preguntas, materias y competencias**
   - **Distribución por dificultad** con barras de progreso
   - **Análisis por materia** con desglose detallado
   - **Recomendaciones automáticas** para mejorar el banco

---

## 🛠️ **Arquitectura Técnica**

### **Backend (Django)**
```
📁 apps/core/views.py
├── 🔧 PreguntaViewSet (ModelViewSet extendido)
│   ├── create() - Crear pregunta con validaciones
│   ├── update() - Actualizar pregunta
│   ├── destroy() - Soft delete
│   ├── estadisticas() - Métricas del banco
│   ├── duplicar() - Duplicar pregunta
│   └── get_queryset() - Filtros personalizados
│
📁 Endpoints disponibles:
├── GET /api/core/preguntas/ - Listar con filtros
├── POST /api/core/preguntas/ - Crear pregunta
├── GET /api/core/preguntas/{id}/ - Detalle
├── PUT /api/core/preguntas/{id}/ - Actualizar
├── DELETE /api/core/preguntas/{id}/ - Eliminar
├── GET /api/core/preguntas/estadisticas/ - Stats
└── POST /api/core/preguntas/{id}/duplicar/ - Duplicar
```

### **Frontend (React + TypeScript)**
```
📁 pages/GestionPreguntasPage.tsx - Página principal
├── 🎛️ Navegación por pestañas
├── 📊 Manejo de estado global
└── 🔄 Coordinación de componentes

📁 components/admin/
├── 🔍 PreguntaFilters.tsx - Filtros y búsqueda
├── 📋 PreguntasList.tsx - Lista con paginación
├── ✏️ PreguntaForm.tsx - Formulario CRUD
└── 📊 PreguntasStats.tsx - Estadísticas

📁 components/ui/
└── ⚠️ ConfirmDialog.tsx - Confirmaciones
```

---

## 📊 **Formato de Datos**

### **Estructura de Pregunta Completa**
```typescript
interface Pregunta {
  id: number;
  materia: {
    id: number;
    nombre: string;
    nombre_display: string;
  };
  competencia?: {
    id: number;
    nombre: string;
  };
  contexto: string;
  enunciado: string;
  opciones: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  respuesta_correcta: 'A' | 'B' | 'C' | 'D';
  retroalimentacion: string;
  explicacion: string;
  habilidad_evaluada: string;
  explicacion_opciones_incorrectas: Record<string, string>;
  estrategias_resolucion: string;
  errores_comunes: string;
  dificultad: 'facil' | 'media' | 'dificil';
  tiempo_estimado: number; // 30-300 segundos
  tags: string[];
  activa: boolean;
}
```

### **Filtros Disponibles**
```typescript
interface Filtros {
  materia: string;           // ID de materia
  competencia: string;       // ID de competencia
  dificultad: string;        // facil|media|dificil
  busqueda: string;          // Texto libre
  mostrar_inactivas: boolean; // Ver eliminadas
}
```

---

## 🎯 **Validaciones y Reglas de Negocio**

### **Campos Obligatorios**
- ⭐ **Materia**: Debe existir en el sistema
- ⭐ **Enunciado**: Mínimo 10 caracteres
- ⭐ **Opciones A, B, C, D**: Todas deben tener contenido
- ⭐ **Respuesta correcta**: Debe ser una de las opciones
- ⭐ **Retroalimentación**: Explicación de la respuesta

### **Validaciones Automáticas**
- **Tiempo estimado**: Entre 30 y 300 segundos
- **Competencia**: Debe pertenecer a la materia seleccionada
- **Tags**: Se normalizan automáticamente
- **Soft delete**: Las preguntas no se eliminan permanentemente

### **Reglas de Permisos**
- Solo **docentes** y **administradores** pueden gestionar
- Verificación en **backend** y **frontend**
- Tokens JWT obligatorios para todas las operaciones

---

## 📈 **Métricas y Estadísticas**

### **Estadísticas Generales**
- **Total de preguntas** activas
- **Número de materias** con preguntas
- **Cantidad de competencias** cubiertas

### **Distribución por Dificultad**
- **Porcentaje** de preguntas fáciles, medias y difíciles
- **Gráficos de barras** con colores diferenciados
- **Conteos absolutos** y relativos

### **Análisis por Materia**
- **Preguntas por materia** con desglose de dificultades
- **Porcentajes internos** por cada materia
- **Barras de progreso** visuales

### **Recomendaciones Automáticas**
- ⚠️ **Pocas preguntas**: Menos de 50 en total
- 💡 **Distribución desigual**: Materias con menos de 10 preguntas
- 📊 **Falta variedad**: Ausencia de alguna dificultad
- ✅ **Banco excelente**: Más de 100 preguntas bien distribuidas

---

## 🚨 **Mejores Prácticas**

### **Para Docentes**
1. **Crea preguntas balanceadas** en todas las dificultades
2. **Usa contextos claros** y relevantes
3. **Escribe retroalimentaciones educativas** que expliquen el "por qué"
4. **Utiliza tags descriptivos** para facilitar búsquedas
5. **Revisa las estadísticas** regularmente para identificar vacíos

### **Para Administradores**
1. **Monitorea la distribución** de preguntas por materia
2. **Asegura calidad** revisando preguntas creadas
3. **Usa la funcionalidad de duplicar** para acelerar creación
4. **Mantén un mínimo** de 15-20 preguntas por materia
5. **Revisa preguntas inactivas** periódicamente

### **Calidad de Preguntas**
1. **Enunciados claros** y sin ambigüedades
2. **Opciones plausibles** todas las opciones deben ser verosímiles
3. **Una sola respuesta correcta** indiscutible
4. **Retroalimentación educativa** que enseñe conceptos
5. **Tiempo estimado realista** según la complejidad

---

## 🔧 **Solución de Problemas**

### **Problemas Comunes**

**❌ "No tienes permisos"**
- **Causa**: Usuario no es docente/admin
- **Solución**: Verificar rol en perfil de usuario

**❌ "Error al cargar competencias"**
- **Causa**: Materia no seleccionada o sin competencias
- **Solución**: Seleccionar materia primero o crear competencias

**❌ "Campos requeridos faltantes"**
- **Causa**: Formulario incompleto
- **Solución**: Completar todos los campos marcados con *

**❌ "Error al guardar pregunta"**
- **Causa**: Problema de conectividad o validación
- **Solución**: Verificar conexión y datos del formulario

### **Limitaciones Conocidas**
- **Paginación**: 10 preguntas por página en lista
- **Búsqueda**: No busca en explicaciones detalladas
- **Exportación**: No disponible (usar carga masiva)
- **Imágenes**: No soportadas en preguntas actualmente

---

## 🎉 **Beneficios de la Funcionalidad**

### **Para Docentes**
- ✅ **Autonomía completa** para gestionar contenido
- ✅ **Interface intuitiva** sin curva de aprendizaje
- ✅ **Feedback inmediato** sobre calidad del banco
- ✅ **Eficiencia** con filtros y duplicación
- ✅ **Control de calidad** con validaciones automáticas

### **Para Estudiantes** (Beneficio Indirecto)
- ✅ **Mayor variedad** de preguntas disponibles
- ✅ **Mejor calidad** con validaciones estrictas
- ✅ **Contenido actualizado** mantenido por docentes
- ✅ **Distribución equilibrada** de dificultades

### **Para el Sistema**
- ✅ **Escalabilidad** en creación de contenido
- ✅ **Mantenimiento descentralizado**
- ✅ **Calidad controlada** automáticamente
- ✅ **Métricas de rendimiento** del banco de preguntas

---

## 🔮 **Próximas Mejoras Planificadas**

### **Corto Plazo**
- 📷 **Soporte para imágenes** en preguntas
- 📤 **Exportación** de preguntas a Excel/JSON
- 🔄 **Historial de cambios** en preguntas
- 👥 **Revisión colaborativa** entre docentes

### **Mediano Plazo**
- 🤖 **Sugerencias automáticas** de mejoras
- 📊 **Analytics avanzados** de rendimiento
- 🔗 **Integración** con bancos externos
- 🎯 **Plantillas** de preguntas por tema

### **Largo Plazo**
- 🧠 **IA para validación** de calidad
- 📱 **App móvil** para gestión
- 🌐 **Colaboración en tiempo real**
- 📈 **Predictivo** de dificultad automático

---

## 📞 **Soporte y Contacto**

Si tienes problemas con la gestión de preguntas o necesitas ayuda:

1. **Revisa esta documentación** primero
2. **Verifica tu rol** de usuario (debe ser docente/admin)
3. **Consulta las estadísticas** para entender el estado del banco
4. **Contacta al administrador** del sistema si persisten problemas

---

**¡La gestión de preguntas está diseñada para empoderar a los docentes y mejorar la calidad educativa del simulador!** 🎓✨