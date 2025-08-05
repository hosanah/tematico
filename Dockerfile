# ================================
# Etapa 1: Build da aplicação Angular
# ================================
FROM node:18-alpine AS build

# Instalar pacotes necessários para compilar dependências nativas
RUN apk add --no-cache python3 make g++ libc6-compat bash

# Criar diretório de trabalho (onde ficará o projeto Angular)
WORKDIR /app/frontend

# Copiar arquivos de configuração do projeto
COPY frontend/package*.json ./

# Instalar dependências do Angular
RUN npm install --force

# Copiar todo o código do projeto para dentro do container
COPY frontend/ ./

# Rodar o build de produção do Angular
RUN npx ng build --configuration production

# ================================
# Etapa 2: Servir aplicação com Nginx
# ================================
FROM nginx:alpine AS production

# Copiar arquivos gerados pelo build para o diretório público do Nginx
COPY --from=build /app/frontend/dist/frontend /usr/share/nginx/html

# Configuração do Nginx para SPA Angular (rotas funcionarem)
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

# Expor porta padrão HTTP
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
