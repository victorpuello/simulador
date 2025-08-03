#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script avanzado para reparar el archivo JSON con caracteres problemáticos
"""
import json
import re

def limpiar_y_reparar_json():
    """Limpia caracteres problemáticos y repara JSON"""
    try:
        print("🔧 Iniciando reparación avanzada...")
        
        # Leer archivo línea por línea
        with open('Lectura.json', 'r', encoding='utf-8') as f:
            lineas = f.readlines()
        
        print(f"📄 Archivo tiene {len(lineas)} líneas")
        
        # Examinar línea problemática específicamente
        linea_651 = lineas[650] if len(lineas) > 650 else ""
        print(f"🔍 Línea 651 original: {repr(linea_651)}")
        
        # Buscar caracteres no ASCII o problemáticos
        for i, char in enumerate(linea_651):
            if ord(char) > 127 or ord(char) < 32 and char not in ['\n', '\r', '\t']:
                print(f"⚠️  Carácter problemático en posición {i}: {repr(char)} (código: {ord(char)})")
        
        # Reparar todas las líneas
        lineas_reparadas = []
        for i, linea in enumerate(lineas):
            # Eliminar caracteres de control invisibles (excepto espacios, tabs, newlines)
            linea_limpia = ''.join(char for char in linea if ord(char) >= 32 or char in ['\n', '\r', '\t', ' '])
            
            # Reemplazar caracteres problemáticos específicos
            linea_limpia = linea_limpia.replace('\u00A0', ' ')  # Non-breaking space
            linea_limpia = linea_limpia.replace('\u2028', '')   # Line separator
            linea_limpia = linea_limpia.replace('\u2029', '')   # Paragraph separator
            
            # Normalizar espacios en blanco
            if linea_limpia.strip():
                # Mantener indentación pero limpiar espacios extra
                indentacion = len(linea_limpia) - len(linea_limpia.lstrip())
                contenido = linea_limpia.strip()
                linea_limpia = ' ' * indentacion + contenido + '\n'
            
            lineas_reparadas.append(linea_limpia)
            
            if i == 650:  # Línea 651 (0-indexed)
                print(f"🔧 Línea 651 reparada: {repr(linea_limpia)}")
        
        # Unir todas las líneas
        contenido_reparado = ''.join(lineas_reparadas)
        
        # Intentar parsear JSON reparado
        try:
            data = json.loads(contenido_reparado)
            print(f"✅ JSON reparado es válido!")
            print(f"📊 Encontrados {len(data)} objetos")
            
            # Guardar archivo reparado
            with open('Lectura_reparado.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Archivo reparado guardado como: Lectura_reparado.json")
            
            # También sobrescribir el original
            with open('Lectura.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Archivo original actualizado con versión reparada")
            return True
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON sigue siendo inválido después de reparación:")
            print(f"   Línea: {e.lineno}, Columna: {e.colno}")
            print(f"   Mensaje: {e.msg}")
            
            # Guardar contenido reparado para inspección manual
            with open('Lectura_debug.json', 'w', encoding='utf-8') as f:
                f.write(contenido_reparado)
            
            print(f"🔍 Contenido reparado guardado como: Lectura_debug.json")
            return False
            
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    exito = limpiar_y_reparar_json()
    
    if exito:
        print(f"\n🎉 ¡Archivo JSON reparado exitosamente!")
        print(f"📝 El archivo Lectura.json ahora es válido")
    else:
        print(f"\n💥 No se pudo reparar completamente")
        print(f"📝 Revisa Lectura_debug.json para inspección manual")