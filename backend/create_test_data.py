#!/usr/bin/env python
"""
Script para crear datos de prueba básicos para el Simulador Saber 11
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simulador.settings')
django.setup()

from apps.core.models import Materia, Competencia, Pregunta

def create_test_data():
    """Crear datos de prueba básicos"""
    
    # Crear materias
    materias_data = [
        {
            'nombre': 'matematicas',
            'nombre_display': 'Matemáticas',
            'color': '#6366f1',
            'icono': 'calculator',
            'descripcion': 'Álgebra, geometría, trigonometría y cálculo'
        },
        {
            'nombre': 'lenguaje',
            'nombre_display': 'Lenguaje',
            'color': '#8b5cf6',
            'icono': 'book-open',
            'descripcion': 'Comprensión lectora, gramática y literatura'
        },
        {
            'nombre': 'ciencias',
            'nombre_display': 'Ciencias Naturales',
            'color': '#10b981',
            'icono': 'flask',
            'descripcion': 'Física, química y biología'
        },
        {
            'nombre': 'sociales',
            'nombre_display': 'Ciencias Sociales',
            'color': '#f59e0b',
            'icono': 'globe',
            'descripcion': 'Historia, geografía y cívica'
        }
    ]
    
    materias_creadas = {}
    
    for materia_data in materias_data:
        try:
            materia = Materia.objects.create(**materia_data)
            materias_creadas[materia.nombre] = materia
            print(f"✅ Materia creada: {materia.nombre_display}")
        except Exception as e:
            print(f"⚠️ Materia {materia_data['nombre']} ya existe o error: {e}")
            # Intentar obtener la materia existente
            try:
                materia = Materia.objects.get(nombre=materia_data['nombre'])
                materias_creadas[materia.nombre] = materia
            except:
                continue
    
    # Crear competencias
    competencias_data = [
        # Matemáticas
        {
            'materia': 'matematicas',
            'nombre': 'Álgebra y Funciones',
            'descripcion': 'Ecuaciones, funciones y expresiones algebraicas'
        },
        {
            'materia': 'matematicas',
            'nombre': 'Geometría',
            'descripcion': 'Figuras geométricas, áreas y volúmenes'
        },
        # Lenguaje
        {
            'materia': 'lenguaje',
            'nombre': 'Comprensión Lectora',
            'descripcion': 'Análisis e interpretación de textos'
        },
        {
            'materia': 'lenguaje',
            'nombre': 'Gramática',
            'descripcion': 'Reglas gramaticales y sintaxis'
        },
        # Ciencias
        {
            'materia': 'ciencias',
            'nombre': 'Física',
            'descripcion': 'Mecánica, termodinámica y ondas'
        },
        {
            'materia': 'ciencias',
            'nombre': 'Química',
            'descripcion': 'Reacciones químicas y estructura de la materia'
        },
        # Sociales
        {
            'materia': 'sociales',
            'nombre': 'Historia',
            'descripcion': 'Historia de Colombia y del mundo'
        },
        {
            'materia': 'sociales',
            'nombre': 'Geografía',
            'descripcion': 'Geografía física y humana'
        }
    ]
    
    competencias_creadas = {}
    
    for competencia_data in competencias_data:
        try:
            materia = materias_creadas[competencia_data['materia']]
            competencia = Competencia.objects.create(
                materia=materia,
                nombre=competencia_data['nombre'],
                descripcion=competencia_data['descripcion']
            )
            competencias_creadas[f"{competencia_data['materia']}_{competencia_data['nombre']}"] = competencia
            print(f"✅ Competencia creada: {competencia.nombre}")
        except Exception as e:
            print(f"⚠️ Competencia {competencia_data['nombre']} ya existe o error: {e}")
    
    # Crear preguntas de ejemplo
    preguntas_data = [
        # Matemáticas - Álgebra
        {
            'materia': 'matematicas',
            'competencia': 'Álgebra y Funciones',
            'enunciado': 'Si x + 3 = 7, ¿cuál es el valor de x?',
            'opciones': {
                'A': '3',
                'B': '4',
                'C': '5',
                'D': '6'
            },
            'respuesta_correcta': 'B',
            'retroalimentacion': 'Para resolver x + 3 = 7, restamos 3 a ambos lados: x = 7 - 3 = 4',
            'dificultad': 'facil'
        },
        {
            'materia': 'matematicas',
            'competencia': 'Álgebra y Funciones',
            'enunciado': '¿Cuál es la solución de la ecuación 2x - 5 = 11?',
            'opciones': {
                'A': '3',
                'B': '6',
                'C': '8',
                'D': '10'
            },
            'respuesta_correcta': 'C',
            'retroalimentacion': '2x - 5 = 11 → 2x = 16 → x = 8',
            'dificultad': 'media'
        },
        # Lenguaje - Comprensión
        {
            'materia': 'lenguaje',
            'competencia': 'Comprensión Lectora',
            'contexto': 'El cambio climático es uno de los mayores desafíos que enfrenta la humanidad en el siglo XXI. Las emisiones de gases de efecto invernadero han aumentado significativamente desde la Revolución Industrial.',
            'enunciado': 'Según el texto, ¿cuál es la principal causa del cambio climático?',
            'opciones': {
                'A': 'La Revolución Industrial',
                'B': 'Las emisiones de gases de efecto invernadero',
                'C': 'El siglo XXI',
                'D': 'Los desafíos de la humanidad'
            },
            'respuesta_correcta': 'B',
            'retroalimentacion': 'El texto menciona explícitamente que "Las emisiones de gases de efecto invernadero han aumentado significativamente"',
            'dificultad': 'facil'
        },
        # Ciencias - Física
        {
            'materia': 'ciencias',
            'competencia': 'Física',
            'enunciado': '¿Cuál es la unidad de medida de la fuerza en el Sistema Internacional?',
            'opciones': {
                'A': 'Joule',
                'B': 'Newton',
                'C': 'Watt',
                'D': 'Pascal'
            },
            'respuesta_correcta': 'B',
            'retroalimentacion': 'La unidad de fuerza en el SI es el Newton (N), definido como la fuerza necesaria para acelerar 1 kg a 1 m/s²',
            'dificultad': 'facil'
        },
        # Sociales - Historia
        {
            'materia': 'sociales',
            'competencia': 'Historia',
            'enunciado': '¿En qué año se independizó Colombia de España?',
            'opciones': {
                'A': '1810',
                'B': '1819',
                'C': '1821',
                'D': '1830'
            },
            'respuesta_correcta': 'B',
            'retroalimentacion': 'Colombia se independizó definitivamente de España en 1819 con la Batalla de Boyacá',
            'dificultad': 'media'
        }
    ]
    
    for pregunta_data in preguntas_data:
        try:
            materia = materias_creadas[pregunta_data['materia']]
            competencia = competencias_creadas[f"{pregunta_data['materia']}_{pregunta_data['competencia']}"]
            
            pregunta = Pregunta.objects.create(
                materia=materia,
                competencia=competencia,
                contexto=pregunta_data.get('contexto', ''),
                enunciado=pregunta_data['enunciado'],
                opciones=pregunta_data['opciones'],
                respuesta_correcta=pregunta_data['respuesta_correcta'],
                retroalimentacion=pregunta_data['retroalimentacion'],
                dificultad=pregunta_data['dificultad']
            )
            print(f"✅ Pregunta creada: {pregunta.enunciado[:50]}...")
        except Exception as e:
            print(f"⚠️ Error creando pregunta: {e}")

if __name__ == '__main__':
    print("🚀 Creando datos de prueba...")
    create_test_data()
    print("✅ Proceso completado!") 