#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para limpiar completamente el JSON
"""
import json
import re

def limpiar_json_completo():
    """Limpia y reconstruye el JSON completamente"""
    try:
        print("🔧 Limpieza completa del JSON...")
        
        # Leer archivo
        with open('Lectura.json', 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Extraer todos los objetos manualmente usando regex
        print("🔍 Extrayendo objetos...")
        
        # Patrón para encontrar objetos completos
        patron = r'\{\s*"materia":\s*"[^"]+",.*?\}'
        objetos_texto = re.findall(patron, contenido, re.DOTALL)
        
        print(f"📊 Objetos encontrados con regex: {len(objetos_texto)}")
        
        # Intentar parsear cada objeto individualmente
        objetos_validos = []
        for i, obj_texto in enumerate(objetos_texto):
            try:
                # Limpiar el objeto
                obj_limpio = obj_texto.strip()
                
                # Intentar parsearlo
                obj = json.loads(obj_limpio)
                objetos_validos.append(obj)
                
            except json.JSONDecodeError as e:
                print(f"⚠️  Objeto {i+1} tiene errores JSON: {e}")
                # Intentar reparaciones básicas
                try:
                    obj_reparado = obj_texto.strip()
                    # Escapar comillas dentro de strings
                    obj_reparado = re.sub(r'(?<!\\)"(?=.*".*":)', '\\"', obj_reparado)
                    obj = json.loads(obj_reparado)
                    objetos_validos.append(obj)
                    print(f"✅ Objeto {i+1} reparado")
                except:
                    print(f"❌ No se pudo reparar objeto {i+1}")
        
        print(f"✅ Objetos válidos: {len(objetos_validos)}")
        
        if objetos_validos:
            # Crear JSON limpio
            with open('Lectura_limpio.json', 'w', encoding='utf-8') as f:
                json.dump(objetos_validos, f, indent=2, ensure_ascii=False)
            
            print("✅ Archivo limpio guardado: Lectura_limpio.json")
            
            # Verificar que sea válido
            with open('Lectura_limpio.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            print(f"✅ JSON limpio es válido: {len(data)} objetos")
            
            # Sobrescribir original
            with open('Lectura.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print("✅ Archivo original reemplazado con versión limpia")
            return True
        else:
            print("❌ No se pudieron extraer objetos válidos")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    limpiar_json_completo()