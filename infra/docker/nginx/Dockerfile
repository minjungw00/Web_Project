# syntax=docker/dockerfile:1.7
FROM nginx:1.29.1-alpine

RUN apk add --no-cache bash gettext

COPY infra/nginx/default.conf /etc/nginx/templates/default.conf.template
COPY infra/nginx/proxy-headers.conf /etc/nginx/snippets/proxy-headers.conf
COPY infra/docker/nginx/entrypoint.sh /docker-entrypoint.d/99-envsubst.sh

RUN chmod +x /docker-entrypoint.d/99-envsubst.sh

EXPOSE 80
