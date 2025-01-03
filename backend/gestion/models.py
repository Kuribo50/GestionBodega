# gestion_bodega/models.py

from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

class Motivo(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'motivo'

    def __str__(self):
        return self.nombre


class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    requiere_codigo_interno = models.BooleanField(default=False)
    requiere_codigo_minvu = models.BooleanField(default=False)
    requiere_numero_serie = models.BooleanField(default=False)
    requiere_mac = models.BooleanField(default=False)

    class Meta:
        db_table = 'categoria'

    def __str__(self):
        return self.nombre


class Marca(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'marca'

    def __str__(self):
        return self.nombre


class Modelo(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    marca = models.ForeignKey(Marca, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'modelo'

    def __str__(self):
        return self.nombre


class Ubicacion(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'ubicacion'

    def __str__(self):
        return self.nombre


class EstadoArticulo(models.Model):
    nombre = models.CharField(max_length=100, unique=True)  # Ej: "Bueno", "Malo", "Baja", etc.
    descripcion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'estado_articulo'

    def __str__(self):
        return self.nombre


class Personal(models.Model):
    nombre = models.CharField(max_length=255)
    seccion = models.CharField(max_length=100, null=True)
    correo_institucional = models.EmailField(unique=True)

    class Meta:
        db_table = 'personal'

    def __str__(self):
        return self.nombre


class Articulo(models.Model):
    nombre = models.CharField(max_length=255, db_index=True)
    stock_actual = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=0)
    descripcion = models.TextField(null=True, blank=True)
    codigo_interno = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    codigo_minvu = models.CharField(max_length=100, null=True, blank=True)
    numero_serie = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    mac = models.CharField(max_length=17, null=True, blank=True)
    categoria = models.ForeignKey('Categoria', on_delete=models.SET_NULL, null=True, blank=True, db_index=True)
    marca = models.ForeignKey('Marca', on_delete=models.SET_NULL, null=True, blank=True)
    modelo = models.ForeignKey('Modelo', on_delete=models.SET_NULL, null=True, blank=True)
    ubicacion = models.ForeignKey('Ubicacion', on_delete=models.SET_NULL, null=True, blank=True)
    estado = models.ForeignKey('EstadoArticulo', on_delete=models.SET_NULL, null=True, blank=True)
    # Nuevo campo para el estado de préstamo
    prestado = models.BooleanField(default=False)  # Indica si el artículo está prestado
    stock_prestado = models.PositiveIntegerField(default=0)  

    class Meta:
        db_table = 'articulo'
        unique_together = [
            ('estado', 'codigo_interno'),
            ('estado', 'codigo_minvu'),
            ('estado', 'numero_serie'),
            ('estado', 'mac'),
        ]

    def __str__(self):
        return self.nombre

    def clean(self):
        # Validaciones según la categoría
        if self.categoria:
            if self.categoria.requiere_codigo_interno and not self.codigo_interno:
                raise ValidationError("El código interno es obligatorio para esta categoría.")
            if self.categoria.requiere_codigo_minvu and not self.codigo_minvu:
                raise ValidationError("El código Minvu es obligatorio para esta categoría.")
            if self.categoria.requiere_numero_serie and not self.numero_serie:
                raise ValidationError("El número de serie es obligatorio para esta categoría.")
            if self.categoria.requiere_mac and not self.mac:
                raise ValidationError("El MAC Address es obligatorio para esta categoría.")

        # Validación específica para categorías que requieren mac
        categorias_requeridas_mac = ["Torre", "PC"]
        if self.categoria and self.categoria.nombre in categorias_requeridas_mac and not self.mac:
            raise ValidationError("El campo MAC Address es obligatorio para artículos de categoría Torre o PC.")

        # Validación adicional para stock_prestado
        if self.stock_prestado < 0:
            raise ValidationError("La cantidad prestada no puede ser negativa.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class HistorialStock(models.Model):
    TIPO_MOVIMIENTO = [
        ('Entrada', 'Entrada'),
        ('Salida', 'Salida'),
        ('Nuevo Articulo', 'Nuevo Articulo'),
        ('Cambio de Estado', 'Cambio de Estado'),
        ('Prestamo', 'Prestamo'),    # Agregado
        ('Regresado', 'Regresado'),  # Agregado
        ('Cambio de Estado por Unidad', 'Cambio de Estado por Unidad'),  # Nueva opción
    ]

    articulo = models.ForeignKey(Articulo, on_delete=models.CASCADE)
    tipo_movimiento = models.CharField(max_length=50, choices=TIPO_MOVIMIENTO)
    cantidad = models.PositiveIntegerField()
    stock_anterior = models.PositiveIntegerField()
    stock_actual = models.PositiveIntegerField()
    fecha = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    comentario = models.TextField(blank=True, null=True)
    motivo = models.ForeignKey(Motivo, on_delete=models.SET_NULL, null=True, blank=True)
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'historial_stock'

    def __str__(self):
        return f'Historial {self.articulo.nombre} - {self.tipo_movimiento} el {self.fecha}'


class HistorialPrestamo(models.Model):
    articulo = models.ForeignKey(Articulo, on_delete=models.CASCADE)
    personal = models.ForeignKey(Personal, on_delete=models.CASCADE)
    fecha_prestamo = models.DateTimeField(auto_now_add=True)
    fecha_devolucion = models.DateTimeField(null=True, blank=True)
    motivo = models.ForeignKey(Motivo, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()
    cantidad_restante = models.PositiveIntegerField()
    movimiento_prestamo = models.OneToOneField(  # <--- Está como OneToOneField en tu código original
        'Movimiento',  # Usar referencia en cadena
        on_delete=models.CASCADE,
        related_name='historial_prestamo',
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Préstamo de {self.articulo.nombre} a {self.personal.nombre} - Restante: {self.cantidad_restante}"


class Movimiento(models.Model):
    TIPO_MOVIMIENTO = [
        ('Entrada', 'Entrada'),
        ('Salida', 'Salida'),
        ('Nuevo Articulo', 'Nuevo Articulo'),
        ('Cambio de Estado', 'Cambio de Estado'),
        ('Cambio de Estado por Unidad', 'Cambio de Estado por Unidad'),  # Nueva opción
        ('Prestamo', 'Prestamo'),
        ('Regresado', 'Regresado'),
    ]

    articulo = models.ForeignKey(Articulo, on_delete=models.CASCADE, related_name='movimientos')
    tipo_movimiento = models.CharField(max_length=50, choices=TIPO_MOVIMIENTO)
    cantidad = models.PositiveIntegerField(default=0)
    fecha = models.DateTimeField(default=timezone.now)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.SET_NULL, null=True, blank=True)
    comentario = models.TextField(blank=True, null=True)
    motivo = models.ForeignKey(Motivo, on_delete=models.SET_NULL, null=True, blank=True)
    personal = models.ForeignKey('Personal', on_delete=models.CASCADE, null=True, blank=True)
    prestamo_relacionado = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='devoluciones'
    )
    estado_nuevo = models.ForeignKey(  # Nuevo campo
        EstadoArticulo,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movimientos_recibidos'
    )

    class Meta:
        db_table = 'movimiento'
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.tipo_movimiento} - {self.articulo.nombre} ({self.cantidad})"

    def clean(self):
        """
        Validaciones específicas según el tipo de movimiento.
        """
        if self.tipo_movimiento == 'Salida':
            if self.cantidad <= 0:
                raise ValidationError("La cantidad debe ser mayor a 0 para una salida.")
            if self.articulo.stock_actual < self.cantidad:
                raise ValidationError("No hay suficiente stock para realizar la salida.")

        elif self.tipo_movimiento == 'Entrada':
            if self.cantidad <= 0:
                raise ValidationError("La cantidad debe ser mayor a 0 para una entrada.")

        elif self.tipo_movimiento == 'Nuevo Articulo':
            if self.cantidad <= 0:
                raise ValidationError("La cantidad inicial debe ser mayor a 0 para un nuevo artículo.")

        elif self.tipo_movimiento == 'Cambio de Estado':
            if not self.comentario:
                raise ValidationError("El comentario es obligatorio para un cambio de estado.")
            if self.cantidad != 0:
                raise ValidationError("No se puede alterar la cantidad en un cambio de estado.")

        elif self.tipo_movimiento == 'Cambio de Estado por Unidad':
            if not self.estado_nuevo:
                raise ValidationError("El nuevo estado es obligatorio para una transferencia de estado.")
            if self.cantidad <= 0:
                raise ValidationError("La cantidad debe ser mayor a 0 para una transferencia de estado.")
            if self.articulo.stock_actual < self.cantidad:
                raise ValidationError("No hay suficiente stock para realizar la transferencia.")

        elif self.tipo_movimiento == 'Prestamo':
            if self.cantidad <= 0:
                raise ValidationError("La cantidad debe ser mayor a 0 para un préstamo.")
            if self.articulo.stock_actual < self.cantidad:
                raise ValidationError("No hay suficiente stock para realizar el préstamo.")
            if not self.personal:
                raise ValidationError("El personal es obligatorio para un préstamo.")

        elif self.tipo_movimiento == 'Regresado':
            if self.cantidad <= 0:
                raise ValidationError("La cantidad debe ser mayor a 0 para una devolución.")
            if self.articulo.stock_prestado < self.cantidad:
                raise ValidationError("La cantidad a devolver excede la cantidad prestada.")
            if not self.personal:
                raise ValidationError("El personal es obligatorio para una devolución.")

    def save(self, *args, **kwargs):
        self.clean()  # Ejecuta las validaciones antes de guardar.

        articulo = self.articulo
        stock_anterior = articulo.stock_actual

        if self.tipo_movimiento == 'Entrada':
            articulo.stock_actual += self.cantidad

        elif self.tipo_movimiento == 'Salida':
            articulo.stock_actual -= self.cantidad

        elif self.tipo_movimiento == 'Prestamo':
            articulo.stock_actual -= self.cantidad
            articulo.stock_prestado += self.cantidad
            articulo.prestado = True

        elif self.tipo_movimiento == 'Regresado':
            articulo.stock_actual += self.cantidad
            articulo.stock_prestado -= self.cantidad
            if articulo.stock_prestado == 0:
                articulo.prestado = False

        elif self.tipo_movimiento == 'Cambio de Estado por Unidad':
            # Disminuir stock del estado actual
            articulo.stock_actual -= self.cantidad

            # Obtener o crear el artículo en el nuevo estado
            articulo_nuevo_estado, created = Articulo.objects.get_or_create(
                nombre=articulo.nombre,
                categoria=articulo.categoria,
                marca=articulo.marca,
                modelo=articulo.modelo,
                ubicacion=articulo.ubicacion,
                estado=self.estado_nuevo,
                defaults={
                    'stock_actual': self.cantidad,
                    'stock_minimo': articulo.stock_minimo,
                    'descripcion': articulo.descripcion,
                    'codigo_interno': articulo.codigo_interno,
                    'codigo_minvu': articulo.codigo_minvu,
                    'numero_serie': articulo.numero_serie,
                    'mac': articulo.mac,
                }
            )
            if not created:
                articulo_nuevo_estado.stock_actual += self.cantidad
                articulo_nuevo_estado.save()

        elif self.tipo_movimiento == 'Cambio de Estado':
            # Actualizar el estado del artículo
            articulo.estado = self.estado_nuevo
            articulo.save()

        articulo.save()

        # Crear historial de stock
        HistorialStock.objects.create(
            articulo=articulo,
            tipo_movimiento=self.tipo_movimiento,
            cantidad=self.cantidad,
            stock_anterior=stock_anterior,
            stock_actual=articulo.stock_actual,
            usuario=self.usuario,
            comentario=self.comentario,
            motivo=self.motivo,
            ubicacion=self.ubicacion
        )

        super().save(*args, **kwargs)


class Task(models.Model):
    title = models.CharField(max_length=255)
    task_type = models.CharField(max_length=100, blank=True, null=True)  # Campo opcional
    start = models.DateField()
    end = models.DateField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.title


class Holiday(models.Model):
    user = models.ForeignKey(User, related_name='holidays', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    date = models.DateField()
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


# Señales para crear HistorialPrestamo automáticamente
@receiver(post_save, sender=Movimiento)
def crear_historial_prestamo(sender, instance, created, **kwargs):
    if created and instance.tipo_movimiento == 'Prestamo':
        HistorialPrestamo.objects.create(
            articulo=instance.articulo,
            personal=instance.personal,
            fecha_prestamo=timezone.now(),
            motivo=instance.motivo,
            cantidad=instance.cantidad,
            cantidad_restante=instance.cantidad,
            movimiento_prestamo=instance
        )


# Señal para enviar notificación antes de realizar un Cambio de Estado por Unidad
@receiver(pre_save, sender=Movimiento)
def notificar_cambio_estado_por_unidad(sender, instance, **kwargs):
    if instance.pk:
        # Obtener la instancia anterior desde la base de datos
        try:
            anterior = Movimiento.objects.get(pk=instance.pk)
        except Movimiento.DoesNotExist:
            anterior = None
    else:
        anterior = None

    if instance.tipo_movimiento == 'Cambio de Estado por Unidad':
        # Aquí puedes implementar la lógica de notificación
        # Por ejemplo, enviar un correo electrónico, una señal a otro servicio, etc.
        # Para este ejemplo, simplemente imprimiremos un mensaje en la consola
        print(f"Notificación: Se realizará un cambio de estado por unidad para el artículo '{instance.articulo.nombre}'.")
