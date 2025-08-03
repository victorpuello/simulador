# 🐘 Configuración de PostgreSQL para Simulador Saber 11

## 📋 Introducción

El Simulador Saber 11 soporta tanto SQLite (por defecto) como PostgreSQL para producción. PostgreSQL ofrece mejor rendimiento, concurrencia y escalabilidad.

## 🛠️ Instalación de PostgreSQL

### Windows
1. Descargar desde: https://www.postgresql.org/download/windows/
2. Ejecutar el instalador
3. Durante la instalación, recordar la contraseña del usuario `postgres`

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### macOS
```bash
brew install postgresql
brew services start postgresql
```

## ⚙️ Configuración de la Base de Datos

### 1. Acceder a PostgreSQL
```bash
# Windows
psql -U postgres

# Linux/Mac
sudo -u postgres psql
```

### 2. Crear usuario y base de datos
```sql
CREATE USER simulador_user WITH PASSWORD 'simulador_pass';
CREATE DATABASE simulador_saber11 OWNER simulador_user;
GRANT ALL PRIVILEGES ON DATABASE simulador_saber11 TO simulador_user;
ALTER USER simulador_user CREATEDB;
```

### 3. Verificar la configuración
```sql
\l          -- Listar bases de datos
\du         -- Listar usuarios
\q          -- Salir
```

## 🔧 Configuración de Django

### 1. Configurar variable de entorno

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://simulador_user:simulador_pass@localhost:5432/simulador_saber11"
```

**Linux/Mac:**
```bash
export DATABASE_URL="postgresql://simulador_user:simulador_pass@localhost:5432/simulador_saber11"
```

### 2. Migrar a PostgreSQL
```bash
python manage_db.py migrate-pg
```

O manualmente:
```bash
python manage.py migrate
python manage.py populate_data
python manage.py runserver
```

## 🔄 Gestión de Base de Datos

El proyecto incluye un script de gestión (`manage_db.py`) con los siguientes comandos:

```bash
# Ver configuración actual
python manage_db.py status

# Mostrar instrucciones de PostgreSQL
python manage_db.py setup-pg

# Migrar a PostgreSQL
python manage_db.py migrate-pg

# Volver a SQLite
python manage_db.py reset-sqlite
```

## 📊 Comparación SQLite vs PostgreSQL

| Característica | SQLite | PostgreSQL |
|----------------|--------|------------|
| **Concurrencia** | Limitada | Excelente |
| **Rendimiento** | Bueno para desarrollo | Superior en producción |
| **Escalabilidad** | Limitada | Alta |
| **Backup** | Archivo único | Herramientas avanzadas |
| **Seguridad** | Básica | Avanzada |
| **Configuración** | Ninguna | Requiere instalación |

## 🚀 Recomendaciones

- **Desarrollo local**: SQLite (por defecto)
- **Staging/Producción**: PostgreSQL
- **Múltiples usuarios**: PostgreSQL
- **Alta concurrencia**: PostgreSQL

## 🛡️ Configuración de Producción

Para producción, considera:

1. **Configuración de conexiones**:
```python
DATABASES['default']['CONN_MAX_AGE'] = 600  # 10 minutos
DATABASES['default']['OPTIONS'] = {
    'MAX_CONNS': 20,
    'connect_timeout': 10,
}
```

2. **Variables de entorno seguras**:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

3. **Backup automático**:
```bash
pg_dump simulador_saber11 > backup_$(date +%Y%m%d).sql
```

## 🔍 Solución de Problemas

### Error de conexión
```
FATAL: password authentication failed
```
**Solución**: Verificar usuario y contraseña en la URL de conexión.

### Error de base de datos no existe
```
FATAL: database "simulador_saber11" does not exist
```
**Solución**: Crear la base de datos con los comandos SQL anteriores.

### Error de permisos
```
permission denied for table
```
**Solución**: Otorgar permisos con `GRANT ALL PRIVILEGES`.

## 📞 Soporte

Si tienes problemas:
1. Revisar logs de PostgreSQL
2. Verificar configuración de red (puerto 5432)
3. Comprobar que PostgreSQL esté ejecutándose
4. Usar `python manage_db.py status` para diagnóstico

---

**¡Con PostgreSQL tu simulador tendrá mejor rendimiento y podrá soportar más usuarios concurrentes!** 🚀