# ================================
# Etapa base: Node para build
# ================================
FROM node:18-alpine AS base

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY frontend/package*.json ./

# Instalar dependências
RUN npm install --force

# ================================
# Etapa de build
# ================================
FROM base AS build

# Copiar todo o código fonte do frontend
COPY frontend/ ./

# Gerar build de produção do Angular
# (Isso vai usar o projeto definido no angular.json automaticamente)
RUN npm run build --configuration production

# ================================
# Etapa final: Nginx para servir a aplicação
# ================================
FROM nginx:alpine AS production

# Copiar build para a pasta pública do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração SPA Angular no Nginx
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Porta exposta
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
