#!/bin/sh
set -eu

template="/etc/nginx/templates/default.conf.template"
output="/etc/nginx/conf.d/default.conf"

if [ -f "$template" ]; then
  envsubst '\
    ${NGINX_SERVER_NAME}\
    ${NGINX_CERTBOT_ROOT}\
    ${NGINX_STATIC_ROOT}\
    ${NGINX_STATIC_CACHE_EXPIRES}\
    ${NGINX_STATIC_CACHE_CONTROL}\
    ${NGINX_BACKEND_HOST}\
    ${NGINX_BACKEND_PORT}\
    ${NGINX_FRONTEND_UPSTREAM}\
  ' < "$template" > "$output"
fi

exit 0
