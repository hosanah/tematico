# Imagem base Node
FROM node:18-alpine

# Instalar dependências do sistema necessárias
RUN apk add --no-cache python3 make g++

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY frontend/package*.json ./

# Instalar dependências e servidor estático
RUN npm install --force && npm install -g http-server

# Copiar código
COPY frontend/ ./

# Rodar build do Angular
RUN npx ng build --configuration production

# Expor porta para servir
EXPOSE 8080

# Servir a aplicação com http-server
CMD ["http-server", "dist/frontend", "-p", "8080", "-a", "0.0.0.0"]
