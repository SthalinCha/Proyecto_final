# Usar imagen oficial de nginx con Alpine Linux para menor tamaño
FROM nginx:1.27-alpine

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Crear directorios necesarios
RUN mkdir -p /usr/share/nginx/html/css \
    && mkdir -p /usr/share/nginx/html/js

# Copiar archivos del frontend al directorio web
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/

# Establecer permisos correctos
RUN chmod -R 755 /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

# El comando por defecto de nginx:alpine ya inicia nginx
CMD ["nginx", "-g", "daemon off;"]