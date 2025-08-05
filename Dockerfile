# ================================
# Etapa 1: Build da aplicação Angular
# ================================
FROM node:20.19-alpine AS build

# Instalar pacotes necessários para compilar dependências nativas
RUN apk add --no-cache python3 make g++ libc6-compat bash

# Diretório de trabalho
WORKDIR /app/frontend

# Copiar arquivos de configuração do Angular
COPY frontend/package*.json ./

# Instalar dependências
RUN npm install --force

# Copiar todo o código
COPY frontend/ ./

# Rodar o build de produção do Angular
RUN npx ng build --configuration production

# ================================
# Etapa 2: Servir aplicação com Nginx
# ================================
FROM nginx:alpine AS production

# Copiar build para o Nginx
COPY --from=build /app/frontend/dist/frontend /usr/share/nginx/html

# Configuração SPA Angular no Nginx
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    error_page 500 502 503 504 /index.html; \
}' > /etc/nginx/conf.d/default.conf

# Expor porta HTTP
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
