#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script avanzado para reparar el archivo JSON
"""
import json

def reparar_json_simple():
    """Reparación directa del JSON"""
    try:
        print("🔧 Reparando JSON...")
        
        # Leer archivo
        with open('Lectura.json', 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        print(f"📄 Archivo leído: {len(contenido)} caracteres")
        
        # Limpiar caracteres problemáticos comunes
        contenido_limpio = contenido.replace('\u00A0', ' ')  # Non-breaking space
        contenido_limpio = contenido_limpio.replace('\u2028', '')  # Line separator  
        contenido_limpio = contenido_limpio.replace('\u2029', '')  # Paragraph separator
        
        # Normalizar saltos de línea
        contenido_limpio = contenido_limpio.replace('\r\n', '\n')
        contenido_limpio = contenido_limpio.replace('\r', '\n')
        
        # Intentar parsear
        data = json.loads(contenido_limpio)
        print(f"✅ JSON es válido: {len(data)} objetos")
        
        # Guardar versión limpia
        with open('Lectura.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Archivo reparado y guardado")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Error JSON: línea {e.lineno}, columna {e.colno}")
        print(f"   Mensaje: {e.msg}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    reparar_json_simple()