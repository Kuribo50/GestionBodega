# Usar una imagen base de Python
FROM python:3.11-slim

# Evitar que Python escriba archivos pyc
ENV PYTHONDONTWRITEBYTECODE=1

# Evitar que Python bufferice las salidas
ENV PYTHONUNBUFFERED=1

# Establecer el directorio de trabajo en /app
WORKDIR /app

# Instalar las dependencias del sistema necesarias
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

# Copiar el archivo requirements.txt y instalar dependencias
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copiar el resto del código de la aplicación
COPY . /app/

# Comando para ejecutar Gunicorn
CMD ["gunicorn", "inventario_api.wsgi:application", "--bind", "0.0.0.0:8080"]
