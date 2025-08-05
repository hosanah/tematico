FROM node:20.19-alpine AS build

RUN apk add --no-cache python3 make g++ libc6-compat bash

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm install --force

COPY frontend/ ./

RUN npx ng build --configuration production

FROM nginx:alpine AS production

# Copia o build certo (dist/browser)
COPY --from=build /app/frontend/dist/browser /usr/share/nginx/html

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

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
