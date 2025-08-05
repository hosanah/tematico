# Dockerfile multi-estágio para ambiente de desenvolvimento e produção
# Imagem base para ambos os ambientes
FROM node:18-alpine AS base

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY frontend/package.json ./
COPY frontend/pnpm-lock.yaml ./

# Instalar pnpm e dependências
RUN npm i --force

# Estágio de build
FROM base AS build
WORKDIR /app

# Copiar todo o código fonte
COPY frontend/ ./

# Construir a aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine AS production

# Copiar arquivos estáticos da build para o Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Verificar se os arquivos foram copiados corretamente
RUN ls -la /usr/share/nginx/html && \
    if [ ! -f /usr/share/nginx/html/index.html ]; then \
      echo "ERRO: index.html não encontrado na pasta de build!" && \
      exit 1; \
    fi

# Configuração do Nginx para SPA (Single Page Application)
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expor porta para produção
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
