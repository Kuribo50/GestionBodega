# 1. Usar una imagen base de Python
FROM python:3.9-slim

# 2. Establecer variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Establecer el directorio de trabajo
WORKDIR /app

# 4. Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 5. Copiar el archivo de requerimientos y instalar dependencias de Python
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# 6. Copiar el resto del código de la aplicación
COPY . /app/

# 7. Copiar y otorgar permisos al script de entrada
COPY entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh

# 8. Exponer el puerto en el que se ejecutará la aplicación
EXPOSE 8000

# 9. Establecer el script de entrada
ENTRYPOINT ["/app/entrypoint.sh"]
