import os
import django
from django.contrib.auth.models import User

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventario_api.settings')
django.setup()

username = 'admin'
email = 'admin@tudominio.com'
password = 'TuContraseñaSegura'

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=admin, password=admin)
    print("Superusuario creado exitosamente.")
else:
    print("El superusuario ya existe.")
