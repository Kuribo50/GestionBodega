import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Crea un superusuario utilizando variables de entorno'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        username = os.environ.get('admin')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', '')
        password = os.environ.get('admin')

        if not username or not password:
            self.stdout.write(self.style.ERROR('Las variables DJANGO_SUPERUSER_USERNAME y DJANGO_SUPERUSER_PASSWORD son necesarias'))
            return

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Superusuario "{username}" creado exitosamente.'))
        else:
            self.stdout.write(self.style.WARNING(f'El superusuario "{username}" ya existe.'))
