from django.contrib import admin
from .models import PlantillaSimulacion, SesionSimulacion, PreguntaSesion

@admin.register(PlantillaSimulacion)
class PlantillaSimulacionAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'materia', 'docente', 'cantidad_preguntas', 'activa', 'fecha_creacion')
    list_filter = ('materia', 'docente', 'activa')
    search_fields = ('titulo', 'descripcion', 'docente__username', 'materia__nombre')
    raw_id_fields = ('docente', 'materia', 'preguntas_especificas')
    filter_horizontal = ('preguntas_especificas',)
    readonly_fields = ('fecha_creacion', 'fecha_modificacion')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            qs = qs.filter(docente=request.user)
        return qs

@admin.register(SesionSimulacion)
class SesionSimulacionAdmin(admin.ModelAdmin):
    list_display = ('estudiante', 'materia', 'fecha_inicio', 'fecha_fin', 'completada', 'puntuacion')
    list_filter = ('materia', 'completada', 'fecha_inicio')
    search_fields = ('estudiante__username', 'materia__nombre')
    raw_id_fields = ('estudiante', 'materia', 'plantilla')
    readonly_fields = ('fecha_inicio', 'fecha_fin')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            if request.user.rol == 'docente':
                qs = qs.filter(materia__in=request.user.materias_asignadas.all())
            else:
                qs = qs.filter(estudiante=request.user)
        return qs

@admin.register(PreguntaSesion)
class PreguntaSesionAdmin(admin.ModelAdmin):
    list_display = ('sesion', 'pregunta', 'orden', 'respuesta_estudiante', 'es_correcta', 'tiempo_respuesta')
    list_filter = ('es_correcta', 'sesion__materia')
    search_fields = ('sesion__estudiante__username', 'pregunta__enunciado')
    raw_id_fields = ('sesion', 'pregunta')
    readonly_fields = ('es_correcta',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            if request.user.rol == 'docente':
                qs = qs.filter(sesion__materia__in=request.user.materias_asignadas.all())
            else:
                qs = qs.filter(sesion__estudiante=request.user)
        return qs