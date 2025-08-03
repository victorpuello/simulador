from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import (
    Usuario, Materia, Competencia, Pregunta, Sesion, 
    RespuestaUsuario, Clase, Asignacion, Insignia, LogroUsuario
)


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    """Admin personalizado para el modelo Usuario"""
    list_display = ('username', 'email', 'first_name', 'last_name', 'rol', 'racha_actual', 'puntos_totales', 'ultima_practica')
    list_filter = ('rol', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Información Personalizada', {
            'fields': ('rol', 'avatar', 'racha_actual', 'puntos_totales', 'ultima_practica', 'configuracion')
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Personalizada', {
            'fields': ('rol', 'avatar')
        }),
    )
    
    readonly_fields = ('racha_actual', 'puntos_totales', 'ultima_practica')


@admin.register(Materia)
class MateriaAdmin(admin.ModelAdmin):
    """Admin para el modelo Materia"""
    list_display = ('nombre', 'nombre_display', 'color', 'icono', 'activa', 'preguntas_count')
    list_filter = ('activa',)
    search_fields = ('nombre', 'nombre_display')
    ordering = ('nombre',)
    
    def preguntas_count(self, obj):
        return obj.preguntas.count()
    preguntas_count.short_description = 'Preguntas'


@admin.register(Competencia)
class CompetenciaAdmin(admin.ModelAdmin):
    """Admin para el modelo Competencia"""
    list_display = ('nombre', 'materia', 'peso_icfes', 'preguntas_count')
    list_filter = ('materia', 'peso_icfes')
    search_fields = ('nombre', 'materia__nombre')
    ordering = ('materia__nombre', 'nombre')
    
    def preguntas_count(self, obj):
        return obj.preguntas.count()
    preguntas_count.short_description = 'Preguntas'


@admin.register(Pregunta)
class PreguntaAdmin(admin.ModelAdmin):
    """Admin para el modelo Pregunta"""
    list_display = ('enunciado_short', 'materia', 'competencia', 'dificultad', 'tiempo_estimado', 'activa')
    list_filter = ('materia', 'competencia', 'dificultad', 'activa')
    search_fields = ('enunciado', 'materia__nombre', 'competencia__nombre')
    ordering = ('materia__nombre', 'dificultad')
    readonly_fields = ('tags',)
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('materia', 'competencia', 'activa')
        }),
        ('Contenido', {
            'fields': ('contexto', 'enunciado', 'opciones', 'respuesta_correcta')
        }),
        ('Retroalimentación Básica', {
            'fields': ('retroalimentacion', 'explicacion')
        }),
        ('Retroalimentación Didáctica', {
            'fields': ('habilidad_evaluada', 'estrategias_resolucion', 'errores_comunes', 'explicacion_opciones_incorrectas'),
            'classes': ('collapse',)
        }),
        ('Configuración', {
            'fields': ('dificultad', 'tiempo_estimado', 'tags')
        }),
    )
    
    def enunciado_short(self, obj):
        return obj.enunciado[:100] + '...' if len(obj.enunciado) > 100 else obj.enunciado
    enunciado_short.short_description = 'Enunciado'


@admin.register(Sesion)
class SesionAdmin(admin.ModelAdmin):
    """Admin para el modelo Sesion"""
    list_display = ('usuario', 'materia', 'modo', 'puntaje_final', 'tiempo_total', 'completada', 'fecha_inicio')
    list_filter = ('materia', 'modo', 'completada', 'fecha_inicio')
    search_fields = ('usuario__username', 'materia__nombre')
    ordering = ('-fecha_inicio',)
    readonly_fields = ('fecha_inicio', 'fecha_fin', 'puntaje_final', 'tiempo_total')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('usuario', 'materia', 'asignacion', 'modo')
        }),
        ('Estado', {
            'fields': ('completada', 'fecha_inicio', 'fecha_fin')
        }),
        ('Resultados', {
            'fields': ('puntaje_final', 'tiempo_total')
        }),
    )


@admin.register(RespuestaUsuario)
class RespuestaUsuarioAdmin(admin.ModelAdmin):
    """Admin para el modelo RespuestaUsuario"""
    list_display = ('usuario', 'pregunta_materia', 'respuesta_seleccionada', 'es_correcta', 'tiempo_respuesta', 'timestamp')
    list_filter = ('es_correcta', 'revisada', 'timestamp', 'pregunta__materia')
    search_fields = ('sesion__usuario__username', 'pregunta__enunciado')
    ordering = ('-timestamp',)
    readonly_fields = ('timestamp',)
    
    def usuario(self, obj):
        return obj.sesion.usuario.username
    usuario.short_description = 'Usuario'
    
    def pregunta_materia(self, obj):
        return f"{obj.pregunta.materia.nombre} - {obj.pregunta.enunciado[:50]}..."
    pregunta_materia.short_description = 'Pregunta'


@admin.register(Clase)
class ClaseAdmin(admin.ModelAdmin):
    """Admin para el modelo Clase"""
    list_display = ('nombre', 'docente', 'codigo_inscripcion', 'estudiantes_count', 'activa', 'fecha_creacion')
    list_filter = ('activa', 'fecha_creacion')
    search_fields = ('nombre', 'docente__username', 'codigo_inscripcion')
    ordering = ('-fecha_creacion',)
    readonly_fields = ('codigo_inscripcion', 'fecha_creacion')
    
    def estudiantes_count(self, obj):
        return obj.estudiantes.count()
    estudiantes_count.short_description = 'Estudiantes'


@admin.register(Asignacion)
class AsignacionAdmin(admin.ModelAdmin):
    """Admin para el modelo Asignacion"""
    list_display = ('titulo', 'clase', 'materia', 'cantidad_preguntas', 'tiempo_limite', 'esta_vencida', 'activa')
    list_filter = ('materia', 'activa', 'fecha_creacion', 'fecha_limite')
    search_fields = ('titulo', 'clase__nombre', 'materia__nombre')
    ordering = ('-fecha_creacion',)
    readonly_fields = ('fecha_creacion',)
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('clase', 'materia', 'titulo', 'descripcion')
        }),
        ('Configuración', {
            'fields': ('cantidad_preguntas', 'tiempo_limite', 'fecha_limite')
        }),
        ('Estado', {
            'fields': ('activa', 'fecha_creacion')
        }),
    )


@admin.register(Insignia)
class InsigniaAdmin(admin.ModelAdmin):
    """Admin para el modelo Insignia"""
    list_display = ('nombre', 'icono', 'color_display', 'puntos', 'rara')
    list_filter = ('rara', 'puntos')
    search_fields = ('nombre', 'descripcion')
    ordering = ('nombre',)
    
    def color_display(self, obj):
        return format_html(
            '<span style="color: {};">{}</span>',
            obj.color,
            obj.color
        )
    color_display.short_description = 'Color'


@admin.register(LogroUsuario)
class LogroUsuarioAdmin(admin.ModelAdmin):
    """Admin para el modelo LogroUsuario"""
    list_display = ('usuario', 'insignia', 'fecha_obtenido')
    list_filter = ('fecha_obtenido', 'insignia')
    search_fields = ('usuario__username', 'insignia__nombre')
    ordering = ('-fecha_obtenido',)
    readonly_fields = ('fecha_obtenido',)
