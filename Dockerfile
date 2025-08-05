# ================================
# Etapa base para build do Angular
# ================================
FROM node:18-alpine AS build

# Instalar dependências do sistema necessárias para compilar pacotes nativos
RUN apk add --no-cache python3 make g++ libc6-compat bash

# Diretório de trabalho
WORKDIR /app/frontend

# Copiar arquivos de configuração do Angular
COPY frontend/package*.json ./

# Instalar dependências
RUN npm install --force

# Copiar todo o código do projeto
COPY frontend/ ./

# Rodar build de produção do Angular
RUN npx ng build --configuration production

# ================================
# Etapa final para servir a aplicação
# ================================
FROM nginx:alpine AS production

# Copiar arquivos gerados pelo Angular para o Nginx
COPY --from=build /app/frontend/dist/frontend /usr/share/nginx/html

# Configuração SPA Angular no Nginx
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expor porta HTTP
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
