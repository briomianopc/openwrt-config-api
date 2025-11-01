FROM node:18-alpine AS frontend_build

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm ci

COPY frontend .

ENV REACT_APP_API_URL=/api

RUN npm run build

FROM nginx:alpine

COPY docker/nginx.conf /etc/nginx/nginx.conf

COPY --from=frontend_build /app/frontend/build /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
