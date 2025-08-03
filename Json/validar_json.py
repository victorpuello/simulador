#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para validar y reparar el archivo JSON de preguntas
"""
import json
import re

def validar_y_reparar_json(archivo_entrada, archivo_salida=None):
    """Valida y repara un archivo JSON"""
    if archivo_salida is None:
        archivo_salida = archivo_entrada
    
    try:
        print(f"📋 Leyendo archivo: {archivo_entrada}")
        
        # Leer el archivo
        with open(archivo_entrada, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        print(f"📄 Archivo leído: {len(contenido)} caracteres")
        
        # Intentar parsear el JSON
        try:
            data = json.loads(contenido)
            print(f"✅ JSON válido: {len(data)} objetos encontrados")
            
            # Reescribir el archivo con formato limpio
            with open(archivo_salida, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Archivo guardado correctamente: {archivo_salida}")
            return True
            
        except json.JSONDecodeError as e:
            print(f"❌ Error JSON encontrado:")
            print(f"   Línea: {e.lineno}")
            print(f"   Columna: {e.colno}")
            print(f"   Mensaje: {e.msg}")
            
            # Mostrar contexto del error
            lineas = contenido.split('\n')
            inicio = max(0, e.lineno - 3)
            fin = min(len(lineas), e.lineno + 2)
            
            print(f"\n🔍 Contexto del error:")
            for i in range(inicio, fin):
                marcador = ">>> " if i == e.lineno - 1 else "    "
                print(f"{marcador}{i+1:4d}: {lineas[i]}")
            
            # Intentar reparaciones básicas
            print(f"\n🔧 Intentando reparaciones automáticas...")
            
            # Eliminar líneas vacías dentro de objetos
            contenido_reparado = re.sub(r',\s*\n\s*\n\s*"', ',\n      "', contenido)
            
            # Eliminar comas finales
            contenido_reparado = re.sub(r',\s*}', '\n    }', contenido_reparado)
            contenido_reparado = re.sub(r',\s*]', '\n  ]', contenido_reparado)
            
            try:
                data = json.loads(contenido_reparado)
                print(f"✅ Reparación exitosa!")
                
                with open(archivo_salida, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                print(f"✅ Archivo reparado guardado: {archivo_salida}")
                return True
                
            except json.JSONDecodeError as e2:
                print(f"❌ No se pudo reparar automáticamente")
                print(f"   Error persistente: {e2.msg}")
                return False
    
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    resultado = validar_y_reparar_json("Lectura.json", "Lectura_reparado.json")
    
    if resultado:
        print(f"\n🎉 ¡Proceso completado exitosamente!")
        print(f"📁 Archivo original: Lectura.json")
        print(f"📁 Archivo reparado: Lectura_reparado.json")
    else:
        print(f"\n💥 No se pudo reparar el archivo automáticamente")
        print(f"📝 Revisa los errores arriba y corrige manualmente")