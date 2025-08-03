#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para recrear completamente el archivo JSON
"""
import json
import re

def recrear_json_completo():
    """Recrea el archivo JSON completamente desde cero"""
    try:
        print("🔧 Recreando archivo JSON desde cero...")
        
        # Leer archivo original
        with open('Lectura.json', 'r', encoding='utf-8') as f:
            contenido_original = f.read()
        
        print(f"📄 Contenido original: {len(contenido_original)} caracteres")
        
        # Intentar extraer solo el contenido válido hasta el error
        lineas = contenido_original.split('\n')
        
        # Encontrar donde termina el objeto anterior al problemático
        print("🔍 Buscando último objeto válido...")
        
        # Buscar líneas que contengan "tags" seguidas de "}," 
        ultimo_objeto_valido = 0
        for i, linea in enumerate(lineas):
            if '"tags":' in linea and i < 650:
                # Buscar el cierre de este objeto
                for j in range(i+1, min(i+10, len(lineas))):
                    if lineas[j].strip() == '},':
                        ultimo_objeto_valido = j
                        print(f"✅ Último objeto válido encontrado en línea {j+1}")
                        break
        
        if ultimo_objeto_valido == 0:
            print("❌ No se pudo encontrar último objeto válido")
            return False
        
        # Crear contenido válido hasta el punto problemático
        contenido_valido = '\n'.join(lineas[:ultimo_objeto_valido+1])
        
        # Agregar cierre del array
        contenido_valido = contenido_valido.rstrip(',') + '\n]'
        
        print("🧪 Probando contenido truncado...")
        
        try:
            # Verificar que sea JSON válido
            data_parcial = json.loads(contenido_valido)
            print(f"✅ JSON parcial válido: {len(data_parcial)} objetos")
            
            # Guardar versión válida
            with open('Lectura_parcial.json', 'w', encoding='utf-8') as f:
                json.dump(data_parcial, f, indent=2, ensure_ascii=False)
            
            print("✅ Archivo parcial válido guardado: Lectura_parcial.json")
            
            # Intentar recuperar objetos restantes manualmente
            print("🔧 Intentando recuperar objetos restantes...")
            
            # Buscar el siguiente objeto válido después del problema
            contenido_restante = '\n'.join(lineas[ultimo_objeto_valido+1:])
            
            # Buscar patrones de objetos que empiecen con "materia"
            patron_objeto = r'\{\s*"materia":\s*"[^"]+",.*?\}'
            objetos_encontrados = re.findall(patron_objeto, contenido_restante, re.DOTALL)
            
            print(f"🔍 Objetos adicionales encontrados: {len(objetos_encontrados)}")
            
            # Si encontramos objetos adicionales, intentar añadirlos
            if objetos_encontrados:
                print("⚠️  Se encontraron objetos adicionales pero pueden tener errores")
                print("📝 Revisa Lectura_parcial.json que contiene los objetos válidos")
            
            return True
            
        except json.JSONDecodeError as e:
            print(f"❌ Error en contenido truncado: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    recrear_json_completo()