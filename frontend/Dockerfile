# Usar una imagen base de Node.js
FROM node:18-slim

# Establecer el directorio de trabajo en /app
WORKDIR /app

# Copiar package.json y package-lock.json para instalar dependencias
COPY package*.json ./

# Instalar las dependencias de Node.js
RUN npm install

# Copiar todo el código de la aplicación
COPY . .

# Configurar las variables de entorno para producción
ENV NODE_ENV=production NEXT_PUBLIC_API_URL=https://web-production-1f58.up.railway.app/api/
# Construir la aplicación Next.js
RUN npm run build

# Exponer el puerto 3000 para la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
