"""
Utilidades para el cálculo de puntajes ICFES
"""
from typing import Dict, List, Optional
from apps.core.models import Materia
from apps.simulacion.models import SesionSimulacion
from django.db import models


def calcular_puntaje_icfes(estudiante) -> Dict:
    """
    Calcula el puntaje ICFES basado en las simulaciones completadas del estudiante.
    
    Fórmula ICFES:
    1. Obtener puntajes por materia (0-100)
    2. Aplicar ponderaciones: LC, M, SC, CN = 3; I = 1
    3. Sumar productos ponderados
    4. Dividir entre 13 (suma de ponderaciones)
    5. Multiplicar por 5
    6. Redondear al entero más cercano
    
    Returns:
        Dict con puntaje global y detalles por materia
    """
    # Mapeo de materias a códigos ICFES
    materias_icfes = {
        'Lectura Crítica': 'LC',
        'Matemáticas': 'M', 
        'Sociales y Ciudadanas': 'SC',
        'Ciencias Naturales': 'CN',
        'Inglés': 'I'
    }
    
    # Ponderaciones según ICFES
    ponderaciones = {
        'LC': 3,  # Lectura Crítica
        'M': 3,   # Matemáticas
        'SC': 3,  # Sociales y Ciudadanas
        'CN': 3,  # Ciencias Naturales
        'I': 1    # Inglés
    }
    
    # Obtener todas las sesiones completadas del estudiante
    sesiones_completadas = SesionSimulacion.objects.filter(
        estudiante=estudiante,
        completada=True
    ).select_related('materia')
    
    # Calcular puntajes promedio por materia
    puntajes_materias = {}
    detalles_materias = {}
    
    for materia in Materia.objects.filter(activa=True):
        sesiones_materia = sesiones_completadas.filter(materia=materia)
        
        if sesiones_materia.exists():
            # Calcular promedio de puntuación para esta materia
            promedio = sesiones_materia.aggregate(
                promedio=models.Avg('puntuacion')
            )['promedio'] or 0
            
            # Redondear a 1 decimal
            puntaje_materia = round(promedio, 1)
            
            # Obtener código ICFES para esta materia
            codigo_icfes = materias_icfes.get(materia.nombre_display, materia.nombre_display)
            
            puntajes_materias[codigo_icfes] = puntaje_materia
            detalles_materias[codigo_icfes] = {
                'materia_nombre': materia.nombre_display,
                'puntaje': puntaje_materia,
                'ponderacion': ponderaciones.get(codigo_icfes, 0),
                'simulaciones': sesiones_materia.count(),
                'mejor_puntaje': sesiones_materia.aggregate(
                    mejor=models.Max('puntuacion')
                )['mejor'] or 0
            }
    
    # Calcular puntaje global ICFES
    suma_ponderada = 0
    ponderacion_total = 0
    
    for codigo, puntaje in puntajes_materias.items():
        ponderacion = ponderaciones.get(codigo, 0)
        suma_ponderada += puntaje * ponderacion
        ponderacion_total += ponderacion
    
    # Si no hay ponderación total, retornar 0
    if ponderacion_total == 0:
        return {
            'puntaje_global': 0,
            'puntajes_materias': puntajes_materias,
            'detalles_materias': detalles_materias,
            'materias_faltantes': list(materias_icfes.keys())
        }
    
    # Aplicar fórmula ICFES
    promedio_ponderado = suma_ponderada / ponderacion_total
    puntaje_global = round(promedio_ponderado * 5)
    
    # Identificar materias faltantes
    materias_faltantes = [
        nombre for nombre, codigo in materias_icfes.items()
        if codigo not in puntajes_materias
    ]
    
    return {
        'puntaje_global': puntaje_global,
        'puntajes_materias': puntajes_materias,
        'detalles_materias': detalles_materias,
        'materias_faltantes': materias_faltantes,
        'promedio_ponderado': round(promedio_ponderado, 2),
        'suma_ponderada': round(suma_ponderada, 2),
        'ponderacion_total': ponderacion_total
    }


def obtener_percentil_icfes(puntaje_global: int) -> Dict:
    """
    Obtiene el percentil nacional aproximado basado en el puntaje global.
    
    Args:
        puntaje_global: Puntaje ICFES (0-500)
    
    Returns:
        Dict con percentil y nivel de desempeño
    """
    # Tabla de percentiles aproximados (basada en datos históricos del ICFES)
    percentiles = {
        500: 100, 490: 99, 480: 98, 470: 97, 460: 96, 450: 95,
        440: 93, 430: 91, 420: 89, 410: 87, 400: 85, 390: 82,
        380: 79, 370: 76, 360: 73, 350: 70, 340: 67, 330: 64,
        320: 61, 310: 58, 300: 55, 290: 52, 280: 49, 270: 46,
        260: 43, 250: 40, 240: 37, 230: 34, 220: 31, 210: 28,
        200: 25, 190: 22, 180: 19, 170: 16, 160: 13, 150: 10,
        140: 7, 130: 4, 120: 2, 110: 1, 100: 0
    }
    
    # Encontrar el percentil más cercano
    puntaje_redondeado = round(puntaje_global / 10) * 10
    percentil = percentiles.get(puntaje_redondeado, 0)
    
    # Determinar nivel de desempeño
    if puntaje_global >= 400:
        nivel = "Excelente"
    elif puntaje_global >= 350:
        nivel = "Muy Bueno"
    elif puntaje_global >= 300:
        nivel = "Bueno"
    elif puntaje_global >= 250:
        nivel = "Aceptable"
    elif puntaje_global >= 200:
        nivel = "Bajo"
    else:
        nivel = "Muy Bajo"
    
    return {
        'percentil': percentil,
        'nivel': nivel,
        'puntaje_global': puntaje_global
    }


def calcular_estadisticas_icfes(estudiante) -> Dict:
    """
    Calcula estadísticas completas del ICFES para un estudiante.
    
    Returns:
        Dict con puntaje global, percentil, nivel y detalles por materia
    """
    # Calcular puntaje ICFES
    resultado_icfes = calcular_puntaje_icfes(estudiante)
    
    # Obtener percentil y nivel
    info_percentil = obtener_percentil_icfes(resultado_icfes['puntaje_global'])
    
    # Combinar resultados
    return {
        **resultado_icfes,
        **info_percentil,
        'formula_aplicada': {
            'descripcion': 'Puntaje ICFES = (Suma ponderada / 13) * 5',
            'ponderaciones': {
                'Lectura Crítica': 3,
                'Matemáticas': 3,
                'Sociales y Ciudadanas': 3,
                'Ciencias Naturales': 3,
                'Inglés': 1
            }
        }
    } 