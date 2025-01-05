from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.conf import settings

class Command(BaseCommand):
    help = 'Crea un superusuario con credenciales predeterminadas si no existe.'

    def handle(self, *args, **kwargs):
        username = 'admin'
        password = 'admin'  # **Cambia esto a una contraseña más segura en producción**
        email = ''

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, password=password, email=email)
            self.stdout.write(self.style.SUCCESS(f'Superusuario "{username}" creado exitosamente.'))
        else:
            self.stdout.write(self.style.WARNING(f'El superusuario "{username}" ya existe.'))
