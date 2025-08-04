
import json
from collections import Counter
import os

# Ruta absoluta al archivo JSON
file_path = os.path.abspath('g:/Simulador Saber 11/Simulador/Json/Lectura.json')

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Extraer y normalizar los nombres de las materias (quitar espacios y convertir a minúsculas)
    materias = [item.get('materia', 'N/A').strip().lower() for item in data]

    # Contar las ocurrencias de cada materia
    counts = Counter(materias)

    # Filtrar para encontrar las que aparecen más de una vez
    duplicates = {m: c for m, c in counts.items() if c > 1}

    if duplicates:
        print('Materias duplicadas encontradas (ignorando mayúsculas/minúsculas):')
        for materia, count in duplicates.items():
            print(f"- '{materia.title()}': {count} veces")
    else:
        print('No se encontraron materias duplicadas.')

except FileNotFoundError:
    print(f"Error: No se pudo encontrar el archivo en la ruta: {file_path}")
except json.JSONDecodeError:
    print(f"Error: El archivo {file_path} no es un JSON válido.")
except Exception as e:
    print(f"Ocurrió un error inesperado: {e}")
