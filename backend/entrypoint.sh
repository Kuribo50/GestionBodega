#!/bin/bash

# Salir inmediatamente si un comando falla
set -e

# Ejecutar migraciones
echo "Ejecutando migraciones..."
python manage.py migrate

# Crear superusuario si no existe
echo "Creando superusuario si no existe..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); username = os.environ.get('DJANGO_SUPERUSER_USERNAME'); email = os.environ.get('DJANGO_SUPERUSER_EMAIL'); password = os.environ.get('DJANGO_SUPERUSER_PASSWORD'); if not User.objects.filter(username=username).exists(): User.objects.create_superuser(username=admin, password=admin)" | python manage.py shell

# Recoger archivos estáticos (si aplica)
echo "Recogiendo archivos estáticos..."
python manage.py collectstatic --noinput

# Iniciar Gunicorn
echo "Iniciando Gunicorn..."
gunicorn inventario_api.wsgi:application --bind 0.0.0.0:8000
