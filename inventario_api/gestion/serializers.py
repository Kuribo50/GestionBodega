# gestion_bodega/serializers.py

from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime

from .models import (
    Categoria,
    Marca,
    Modelo,
    Task,
    Ubicacion,
    EstadoArticulo,
    Motivo,
    Articulo,
    Movimiento,
    HistorialStock,
    Personal,
    HistorialPrestamo
)

# **Usuario**
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


# **Categoría**
class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = [
            'id',
            'nombre',
            'descripcion',
            'requiere_codigo_interno',
            'requiere_codigo_minvu',
            'requiere_numero_serie',
            'requiere_mac'
        ]


# **Marca**
class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = ['id', 'nombre', 'descripcion']


# **Modelo**
class ModeloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modelo
        fields = ['id', 'nombre', 'descripcion', 'marca']


# **Ubicación**
class UbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicacion
        fields = ['id', 'nombre', 'descripcion']


# **Estado del Artículo**
class EstadoArticuloSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoArticulo
        fields = ['id', 'nombre', 'descripcion', 'fecha_creacion']


# **Motivo**
class MotivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Motivo
        fields = ['id', 'nombre', 'descripcion']


# **Personal**
class PersonalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Personal
        fields = ['id', 'nombre', 'correo_institucional', 'seccion']

    def validate(self, data):
        # Validar el formato o lógica aquí, si es necesario
        return data


# -------------------------------------------------------------------
# NUEVOS serializadores "simples" para anidar en HistorialPrestamo
# -------------------------------------------------------------------
class ArticuloSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Articulo
        fields = ['id', 'nombre']  # Muestra solo ID y nombre del artículo


class PersonalSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Personal
        fields = ['id', 'nombre', 'correo_institucional', 'seccion']
# -------------------------------------------------------------------


# **Artículo**
class ArticuloSerializer(serializers.ModelSerializer):
    # Se hace un "write_only" de la cantidad para manejar movimientos de stock
    cantidad = serializers.IntegerField(write_only=True, required=True, min_value=0)
    stock_actual = serializers.IntegerField(read_only=True)

    class Meta:
        model = Articulo
        fields = [
            'id', 'nombre', 'categoria', 'marca', 'modelo', 'ubicacion', 'estado',
            'numero_serie', 'mac', 'codigo_interno', 'codigo_minvu', 'descripcion','cantidad',
            'stock_minimo', 'stock_actual', 'prestado', 'stock_prestado'
        ]
        read_only_fields = ['id', 'stock_prestado', 'prestado']

    def create(self, validated_data):
        cantidad = validated_data.pop('cantidad', 0)
        usuario = self.context['request'].user

        # Crear el artículo
        articulo = Articulo.objects.create(**validated_data)
        stock_anterior = articulo.stock_actual
        articulo.stock_actual += cantidad
        articulo.save()

        # Crear el movimiento asociado (tipo "Nuevo Articulo")
        if cantidad > 0:
            Movimiento.objects.create(
                articulo=articulo,
                tipo_movimiento="Nuevo Articulo",
                cantidad=cantidad,
                usuario=usuario,
                comentario="Registro inicial de artículo con stock",
                ubicacion=articulo.ubicacion,
                motivo=None,  # Ajustar si hay un motivo por defecto
                personal=None
            )

        return articulo

    def update(self, instance, validated_data):
        cantidad = validated_data.pop('cantidad', 0)
        usuario = self.context['request'].user

        # Actualizar atributos del artículo
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Ajustar stock y registrar movimiento si cantidad > 0
        if cantidad > 0:
            stock_anterior = instance.stock_actual
            instance.stock_actual += cantidad
            instance.save()

            movimiento = Movimiento.objects.create(
                articulo=instance,
                tipo_movimiento="Entrada",
                cantidad=cantidad,
                usuario=usuario,
                comentario="Actualización de stock.",
                ubicacion=instance.ubicacion,
                motivo=None,
                personal=None
            )

            HistorialStock.objects.create(
                articulo=instance,
                tipo_movimiento=movimiento.tipo_movimiento,
                cantidad=movimiento.cantidad,
                stock_anterior=stock_anterior,
                stock_actual=instance.stock_actual,
                usuario=usuario,
                comentario=movimiento.comentario,
                ubicacion=movimiento.ubicacion,
                motivo=movimiento.motivo
            )
        else:
            instance.save()

        return instance


# **HistorialStock**
class HistorialStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialStock
        fields = '__all__'
        read_only_fields = ['id', 'fecha']


# **HistorialPrestamo**
class HistorialPrestamoSerializer(serializers.ModelSerializer):
    # Anidamos los serializadores simples para 'articulo' y 'personal'
    articulo = ArticuloSimpleSerializer(read_only=True)
    personal = PersonalSimpleSerializer(read_only=True)
    motivo = MotivoSerializer(read_only=True)  # Añadido para anidar el motivo

    class Meta:
        model = HistorialPrestamo
        fields = '__all__'
        read_only_fields = ['id', 'fecha_prestamo', 'fecha_devolucion']


# **Movimiento**
class MovimientoSerializer(serializers.ModelSerializer):
    personal = serializers.PrimaryKeyRelatedField(
        queryset=Personal.objects.all(),
        required=False,
        allow_null=True
    )
    prestamo_relacionado = serializers.PrimaryKeyRelatedField(
        read_only=True
    )
    estado_nuevo = serializers.PrimaryKeyRelatedField(  # Nuevo campo
        queryset=EstadoArticulo.objects.all(),
        required=False,  # Será requerido condicionalmente
        allow_null=True
    )
    # Manejo de fecha_devolucion desde el frontend
    fecha_devolucion = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Movimiento
        fields = '__all__'
        read_only_fields = ['id', 'fecha',  'usuario', 'prestamo_relacionado']

    def validate(self, data):
        tipo_movimiento = data.get('tipo_movimiento')
        cantidad = data.get('cantidad', 0)
        articulo = data.get('articulo')
        personal = data.get('personal')

        # Eliminamos la obligación de 'motivo' en cualquier tipo de movimiento
        # Solo mantenemos la obligatoriedad de 'personal' para 'Prestamo' si es necesario

        if tipo_movimiento == 'Prestamo' and not personal:
            raise serializers.ValidationError(
                "El personal es obligatorio para movimientos de tipo Prestamo."
            )

        if tipo_movimiento in ['Entrada', 'Nuevo Articulo'] and cantidad <= 0:
            raise serializers.ValidationError(
                "La cantidad debe ser mayor a 0 para este tipo de movimiento."
            )
        if tipo_movimiento == 'Salida' and articulo.stock_actual < cantidad:
            raise serializers.ValidationError(
                "El stock actual es insuficiente para realizar esta salida."
            )
        if tipo_movimiento == 'Regresado' and articulo.stock_prestado < cantidad:
            raise serializers.ValidationError(
                "La cantidad a devolver excede la cantidad prestada."
            )
        if tipo_movimiento == 'Cambio de Estado por Unidad' and articulo.stock_actual < cantidad:
            raise serializers.ValidationError(
                "No hay suficiente stock para realizar la transferencia de estado por unidad."
            )

   
        # Validación condicional para 'Cambio de Estado por Unidad'
        if tipo_movimiento == 'Cambio de Estado por Unidad':
            if not data.get('estado_nuevo'):
                raise serializers.ValidationError(
                    "El campo 'estado_nuevo' es obligatorio para el tipo de movimiento 'Cambio de Estado por Unidad'."
                )
            if cantidad <= 0:
                raise serializers.ValidationError(
                    "La cantidad debe ser mayor a 0 para el tipo de movimiento 'Cambio de Estado por Unidad'."
                )

        return data

    def create(self, validated_data):
        user = self.context['request'].user
        tipo_movimiento = validated_data.get('tipo_movimiento')
        articulo = validated_data.get('articulo')
        cantidad = validated_data.get('cantidad')
        personal = validated_data.get('personal')
        motivo = validated_data.get('motivo')
        estado_nuevo = validated_data.get('estado_nuevo')

        # Extraemos la 'fecha_devolucion' (si viene) solo para parsear la fecha
        fecha_devolucion_str = validated_data.pop('fecha_devolucion', None)

        if tipo_movimiento == 'Prestamo':
            with transaction.atomic():
                # Se crea el movimiento
                movimiento_prestamo = Movimiento.objects.create(
                    usuario=user,
                    articulo=articulo,
                    tipo_movimiento='Prestamo',
                    cantidad=cantidad,
                    personal=personal,
                    motivo=motivo,
                    ubicacion=articulo.ubicacion
                )
                # HistorialPrestamo se crea automáticamente mediante la señal post_save

                return movimiento_prestamo

        elif tipo_movimiento == 'Regresado':
            with transaction.atomic():
                # Buscar HistorialPrestamo correspondiente
                historial_prestamo = HistorialPrestamo.objects.filter(
                    articulo=articulo,
                    personal=personal,
                    cantidad_restante__gte=cantidad
                ).order_by('fecha_prestamo').first()

                if not historial_prestamo:
                    raise serializers.ValidationError(
                        "No se encontró un historial de préstamo correspondiente para esta devolución."
                    )

                movimiento_regresado = Movimiento.objects.create(
                    usuario=user,
                    articulo=articulo,
                    tipo_movimiento='Regresado',
                    cantidad=cantidad,
                    personal=personal,
                    motivo=motivo,
                    prestamo_relacionado=historial_prestamo.movimiento_prestamo,
                    ubicacion=articulo.ubicacion
                )

                # Parseamos la fecha_devolucion para no perder ese dato,
                # pero NO actualizamos stock aquí para evitar la duplicación.
                fecha_dev_dt = None
                if fecha_devolucion_str:
                    try:
                        fecha_dev_dt = datetime.fromisoformat(fecha_devolucion_str)
                    except ValueError:
                        raise serializers.ValidationError(
                            "El formato de 'fecha_devolucion' no es válido. Usa 'YYYY-MM-DD HH:mm:ss' o ISO 8601."
                        )
                else:
                    fecha_dev_dt = timezone.now()

                # Actualizar HistorialPrestamo
                historial_prestamo.cantidad_restante -= cantidad
                if historial_prestamo.cantidad_restante == 0:
                    historial_prestamo.fecha_devolucion = fecha_dev_dt
                historial_prestamo.save()

                return movimiento_regresado

        elif tipo_movimiento == 'Cambio de Estado por Unidad':
            with transaction.atomic():
                # Enviar notificación antes de realizar la modificación
                print(f"Notificación: Se realizará un cambio de estado por unidad para el artículo '{articulo.nombre}'.")

                # Crear el movimiento
                movimiento_cambio_estado = Movimiento.objects.create(
                    usuario=user,
                    articulo=articulo,
                    tipo_movimiento='Cambio de Estado por Unidad',
                    cantidad=cantidad,
                    estado_nuevo=estado_nuevo,
                    comentario=validated_data.get('comentario', ''),
                    ubicacion=articulo.ubicacion,
                    motivo=motivo,
                    personal=None  # Asumiendo que no es necesario en este tipo de movimiento
                )

                return movimiento_cambio_estado

        else:
            # Manejar otros tipos de movimientos (Entrada, Salida, Cambio de Estado, etc.)
            movimiento = Movimiento.objects.create(
                usuario=user,
                **validated_data
            )
            return movimiento


# **UserSerializer** (para registrar usuarios vía API)
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']
        read_only_fields = ['id']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'user', 'title', 'task_type', 'start', 'end', 'completed']
        read_only_fields = ['id', 'user']