# Script para Actualizar Tiempo Estimado de Preguntas

Este script permite actualizar el tiempo estimado de todas las preguntas activas en la base de datos sin necesidad de tumbar el servidor.

## Ubicación del Script

```
backend/apps/core/management/commands/actualizar_tiempo_preguntas.py
```

## Cómo Ejecutar el Script

### 1. Acceder al directorio del backend

```bash
cd backend
```

### 2. Activar el entorno virtual (si es necesario)

```bash
# En Windows
venv\Scripts\activate

# En Linux/Mac
source venv/bin/activate
```

### 3. Ejecutar el comando

#### Opción 1: Actualizar todas las preguntas a 300 segundos (recomendado)

```bash
python manage.py actualizar_tiempo_preguntas
```

#### Opción 2: Simular la ejecución (modo de prueba)

```bash
python manage.py actualizar_tiempo_preguntas --dry-run
```

#### Opción 3: Especificar un tiempo diferente

```bash
python manage.py actualizar_tiempo_preguntas --tiempo 240
```

#### Opción 4: Combinar opciones

```bash
python manage.py actualizar_tiempo_preguntas --tiempo 300 --dry-run
```

## Parámetros Disponibles

### `--tiempo`
- **Descripción**: Especifica el nuevo tiempo estimado en segundos
- **Valor por defecto**: 300
- **Rango permitido**: 30-300 segundos
- **Ejemplo**: `--tiempo 240`

### `--dry-run`
- **Descripción**: Ejecuta una simulación sin hacer cambios reales en la base de datos
- **Útil para**: Verificar cuántas preguntas serían afectadas antes de hacer el cambio real
- **Ejemplo**: `--dry-run`

## Características del Script

### ✅ Seguridad
- **Transacciones atómicas**: Todos los cambios se realizan dentro de una transacción, garantizando que si algo falla, no se corrompa la base de datos
- **Validación de parámetros**: Verifica que el tiempo esté en el rango permitido (30-300 segundos)
- **Confirmación del usuario**: Solicita confirmación antes de realizar cambios
- **Modo de simulación**: Permite probar sin hacer cambios reales

### ✅ Información Detallada
- **Estadísticas iniciales**: Muestra el estado actual de las preguntas
- **Progreso en tiempo real**: Informa sobre el proceso de actualización
- **Verificación posterior**: Confirma que los cambios se aplicaron correctamente
- **Estadísticas finales**: Muestra el estado después de la actualización

### ✅ Filtros Inteligentes
- **Solo preguntas activas**: Actualiza únicamente las preguntas marcadas como activas
- **Optimización**: Solo actualiza preguntas que realmente necesitan el cambio

## Ejemplo de Ejecución

```bash
python manage.py actualizar_tiempo_preguntas
```

**Salida esperada:**
```
Iniciando actualización de tiempo estimado...
Nuevo tiempo: 300 segundos
Total de preguntas a actualizar: 1250
Tiempos actuales únicos: [60, 90, 120, 180]
Preguntas que necesitan actualización: 1100
¿Deseas continuar con la actualización de 1100 preguntas? (s/N): s
✓ Se actualizaron 1100 preguntas exitosamente
✓ Verificación: 1250 preguntas tienen ahora 300 segundos
¡Actualización completada exitosamente!

--- Estadísticas Finales ---
Tiempos únicos después de la actualización: [300]
  - 300s: 1250 preguntas
```

## Casos de Uso

### 1. Primera vez ejecutando el script
```bash
# Primero simular para ver qué pasaría
python manage.py actualizar_tiempo_preguntas --dry-run

# Si todo se ve bien, ejecutar el cambio real
python manage.py actualizar_tiempo_preguntas
```

### 2. Cambiar a un tiempo específico
```bash
python manage.py actualizar_tiempo_preguntas --tiempo 240
```

### 3. Verificar estado actual sin cambios
```bash
python manage.py actualizar_tiempo_preguntas --dry-run
```

## Notas Importantes

1. **El servidor NO necesita ser detenido** - Este es un comando de Django que se puede ejecutar mientras el servidor está corriendo
2. **Respaldo recomendado** - Aunque el script es seguro, se recomienda hacer un respaldo de la base de datos antes de ejecutar cambios masivos
3. **Solo preguntas activas** - El script solo modifica preguntas marcadas como activas (`activa=True`)
4. **Reversible** - Si necesitas revertir, puedes ejecutar el script nuevamente con el tiempo anterior

## Solución de Problemas

### Error: "El tiempo debe estar entre 30 y 300 segundos"
**Solución**: Asegúrate de que el valor del parámetro `--tiempo` esté entre 30 y 300.

### Error de permisos de base de datos
**Solución**: Verifica que el usuario de Django tenga permisos de escritura en la base de datos.

### Error: "No se encontraron preguntas activas"
**Solución**: Verifica que existan preguntas en la base de datos con `activa=True`.

## Contacto

Si tienes problemas ejecutando el script, revisa los logs de Django o contacta al equipo de desarrollo.