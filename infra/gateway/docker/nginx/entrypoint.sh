#!/bin/sh
set -eu

# Remove symlinks and create real log files for Telegraf
rm -f /var/log/nginx/access.log /var/log/nginx/error.log
touch /var/log/nginx/access.log /var/log/nginx/error.log
chown nginx:nginx /var/log/nginx/access.log /var/log/nginx/error.log

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
    ${NGINX_SSL_CERT}\
    ${NGINX_SSL_CERT_KEY}\
    ${NGINX_SSL_TRUSTED_CERT}\
    ${GRAFANA_HOST}\
    ${PROMETHEUS_HOST}\
    ${ALERTMANAGER_HOST}\
    ${LOKI_HOST}\
    ${LOKI_ORG_ID}\
    ${NGINX_MONITORING_AUTH_REALM}\
    ${NGINX_MONITORING_AUTH_FILE}\
    ${NGINX_MONITORING_INTERNAL_CIDR}\
  ' < "$template" > "$output"
fi

exit 0