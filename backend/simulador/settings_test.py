"""
Configuración específica para testing
"""
from .settings import *

# Configuración de base de datos para testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'OPTIONS': {
            'timeout': 20,
        }
    }
}

# Configuración de cache para testing
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Configuración de logging para testing (silenciar logs)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'root': {
        'handlers': ['null'],
    },
    'loggers': {
        'django': {
            'handlers': ['null'],
            'propagate': False,
        },
        'apps': {
            'handlers': ['null'],
            'propagate': False,
        },
    }
}

# Desactivar migraciones para tests más rápidos
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Configuración adicional para testing
SECRET_KEY = 'test-secret-key-only-for-testing'
DEBUG = True
ALLOWED_HOSTS = ['*']

# Desactivar carga de archivos durante testing
FILE_UPLOAD_HANDLERS = [
    'django.core.files.uploadhandler.MemoryFileUploadHandler',
]

# Configuración de email para testing
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Timezone para testing
USE_TZ = True

# Password hashers más rápidos para testing
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]