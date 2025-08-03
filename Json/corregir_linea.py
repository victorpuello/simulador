#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corregir específicamente la línea problemática
"""

def corregir_linea_651():
    """Corrige específicamente la línea 651"""
    try:
        print("🔧 Corrigiendo línea 651...")
        
        # Leer archivo línea por línea
        with open('Lectura.json', 'r', encoding='utf-8') as f:
            lineas = f.readlines()
        
        print(f"📄 Total de líneas: {len(lineas)}")
        
        # Examinar líneas alrededor de 651
        for i in range(648, min(655, len(lineas))):
            print(f"Línea {i+1}: {repr(lineas[i])}")
        
        # Reemplazar línea 651 (índice 650) con una versión limpia
        if len(lineas) > 650:
            # Línea original problemática
            linea_original = lineas[650]
            print(f"🔍 Línea original 651: {repr(linea_original)}")
            
            # Crear línea limpia
            linea_limpia = "  {\n"
            lineas[650] = linea_limpia
            
            print(f"✅ Línea 651 corregida: {repr(linea_limpia)}")
            
            # Escribir archivo corregido
            with open('Lectura_corregido.json', 'w', encoding='utf-8') as f:
                f.writelines(lineas)
            
            print("✅ Archivo corregido guardado como: Lectura_corregido.json")
            
            # Verificar si es válido ahora
            import json
            with open('Lectura_corregido.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            print(f"✅ JSON corregido es válido: {len(data)} objetos")
            
            # Sobrescribir original
            with open('Lectura.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print("✅ Archivo original actualizado")
            return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    corregir_linea_651()