#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simulador.settings')
django.setup()

from apps.simulacion.models import SesionSimulacion
from apps.core.models import Usuario, Materia
from django.db import connection

def check_sessions():
    """Verificar el estado de las sesiones"""
    print("=== Verificando sesiones ===")
    
    # Verificar total de sesiones
    total_sessions = SesionSimulacion.objects.count()
    print(f"Total de sesiones: {total_sessions}")
    
    # Verificar sesiones activas
    active_sessions = SesionSimulacion.objects.filter(completada=False)
    print(f"Sesiones activas: {active_sessions.count()}")
    
    # Verificar sesiones completadas
    completed_sessions = SesionSimulacion.objects.filter(completada=True)
    print(f"Sesiones completadas: {completed_sessions.count()}")
    
    # Verificar usuarios
    users = Usuario.objects.all()
    print(f"Total de usuarios: {users.count()}")
    
    # Verificar materias
    materias = Materia.objects.all()
    print(f"Total de materias: {materias.count()}")
    
    # Verificar constraint violations
    print("\n=== Verificando posibles violaciones de constraint ===")
    
    # Buscar sesiones duplicadas activas por estudiante y materia
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT estudiante_id, materia_id, COUNT(*) as count
            FROM sesiones_simulacion
            WHERE completada = 0
            GROUP BY estudiante_id, materia_id
            HAVING COUNT(*) > 1
        """)
        
        duplicates = cursor.fetchall()
        if duplicates:
            print(f"⚠️  Encontradas {len(duplicates)} violaciones de constraint:")
            for estudiante_id, materia_id, count in duplicates:
                print(f"   Estudiante {estudiante_id}, Materia {materia_id}: {count} sesiones activas")
        else:
            print("✅ No se encontraron violaciones de constraint")
    
    # Verificar integridad de datos
    print("\n=== Verificando integridad de datos ===")
    
    # Sesiones sin estudiante
    sessions_without_student = SesionSimulacion.objects.filter(estudiante__isnull=True)
    if sessions_without_student.exists():
        print(f"⚠️  Sesiones sin estudiante: {sessions_without_student.count()}")
    else:
        print("✅ Todas las sesiones tienen estudiante")
    
    # Sesiones sin materia
    sessions_without_materia = SesionSimulacion.objects.filter(materia__isnull=True)
    if sessions_without_materia.exists():
        print(f"⚠️  Sesiones sin materia: {sessions_without_materia.count()}")
    else:
        print("✅ Todas las sesiones tienen materia")
    
    # Verificar relaciones
    print("\n=== Verificando relaciones ===")
    
    for session in SesionSimulacion.objects.all()[:5]:  # Solo las primeras 5
        print(f"Sesión {session.id}:")
        print(f"  - Estudiante: {session.estudiante.username if session.estudiante else 'None'}")
        print(f"  - Materia: {session.materia.nombre_display if session.materia else 'None'}")
        print(f"  - Completada: {session.completada}")
        print(f"  - Preguntas: {session.preguntas_sesion.count()}")

if __name__ == '__main__':
    check_sessions() 