#!/usr/bin/env bash
set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<EOF
Usage: certbot-issue.sh -d <domain> [-d <another-domain> ...] -e <email> [--base-dir <path>] [--staging] [--dry-run] [--quiet]

Issue or renew Let's Encrypt certificates using the certbot/certbot container.
This script is intended to run from the gateway/ directory.

Options:
  -d, --domain         Domain to request a certificate for. Repeatable.
  -e, --email          Contact email for Let's Encrypt registration.
  --base-dir           Base directory that contains certbot, letsencrypt/etc|lib|log (default: current directory).
  --staging            Use Let's Encrypt staging environment (rate-limit safe).
  --dry-run            Perform a dry-run renewal to validate configuration.
  -q, --quiet          Reduce logging output and pass --quiet to certbot.
  --compose-project    Docker Compose project name (default: web_project).
  --nginx-service      Nginx service name (default: gateway-nginx).
  -h, --help           Show this help message.

Environment overrides:
  CERTBOT_BASE_DIR     Base directory for certbot data (overrides --base-dir)
  CERTBOT_WEBROOT      Webroot directory exposed to nginx (default: <base>/certbot)
  CERTBOT_ETC          Directory to store /etc/letsencrypt (default: <base>/letsencrypt/etc)
  CERTBOT_LIB          Directory to store /var/lib/letsencrypt (default: <base>/letsencrypt/lib)
  CERTBOT_LOG          Directory to store /var/log/letsencrypt (default: <base>/letsencrypt/log)
  CERTBOT_IMAGE        Docker image to use (default: certbot/certbot:latest)
  COMPOSE_PROJECT      Docker Compose project name (overrides --compose-project)
  NGINX_SERVICE_NAME   Nginx service name (overrides --nginx-service)
EOF
}

DOMAINS=()
EMAIL=""
STAGING=0
DRY_RUN=0
BASE_DIR_INPUT=""
QUIET=0
COMPOSE_PROJECT="web_project"
NGINX_SERVICE="gateway-nginx"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--domain)
      [[ $# -lt 2 ]] && { echo "Error: --domain requires a value" >&2; exit 1; }
      DOMAINS+=("$2")
      shift 2
      ;;
    -e|--email)
      [[ $# -lt 2 ]] && { echo "Error: --email requires a value" >&2; exit 1; }
      EMAIL="$2"
      shift 2
      ;;
    --base-dir)
      [[ $# -lt 2 ]] && { echo "Error: --base-dir requires a value" >&2; exit 1; }
      BASE_DIR_INPUT="$2"
      shift 2
      ;;
    --compose-project)
      [[ $# -lt 2 ]] && { echo "Error: --compose-project requires a value" >&2; exit 1; }
      COMPOSE_PROJECT="$2"
      shift 2
      ;;
    --nginx-service)
      [[ $# -lt 2 ]] && { echo "Error: --nginx-service requires a value" >&2; exit 1; }
      NGINX_SERVICE="$2"
      shift 2
      ;;
    --staging)
      STAGING=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --quiet|-q)
      QUIET=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ${#DOMAINS[@]} -eq 0 ]]; then
  echo "Error: at least one --domain is required" >&2
  usage
  exit 1
fi

if [[ -z "$EMAIL" ]]; then
  echo "Error: --email is required" >&2
  usage
  exit 1
fi
if [[ -n "$BASE_DIR_INPUT" ]]; then
  BASE_DIR="${BASE_DIR_INPUT}"
else
  BASE_DIR="."
fi

BASE_DIR=${CERTBOT_BASE_DIR:-$BASE_DIR}
mkdir -p "$BASE_DIR"
BASE_DIR="$(cd "$BASE_DIR" && pwd)"
WEBROOT=${CERTBOT_WEBROOT:-${BASE_DIR}/certbot}
ETC_DIR=${CERTBOT_ETC:-${BASE_DIR}/letsencrypt/etc}
LIB_DIR=${CERTBOT_LIB:-${BASE_DIR}/letsencrypt/lib}
LOG_DIR=${CERTBOT_LOG:-${BASE_DIR}/letsencrypt/log}
CERTBOT_IMAGE=${CERTBOT_IMAGE:-certbot/certbot:latest}
COMPOSE_PROJECT=${COMPOSE_PROJECT:-${COMPOSE_PROJECT}}
NGINX_SERVICE_NAME=${NGINX_SERVICE_NAME:-${NGINX_SERVICE}}

mkdir -p "$WEBROOT" "$ETC_DIR" "$LIB_DIR" "$LOG_DIR"

CERTBOT_ARGS=(certonly --webroot -w /var/www/certbot --non-interactive --agree-tos --email "$EMAIL")

if [[ $STAGING -eq 1 ]]; then
  CERTBOT_ARGS+=(--staging)
fi

if [[ $DRY_RUN -eq 1 ]]; then
  CERTBOT_ARGS+=(--dry-run)
fi

if [[ $QUIET -eq 1 ]]; then
  CERTBOT_ARGS+=(--quiet)
fi

for domain in "${DOMAINS[@]}"; do
  CERTBOT_ARGS+=(-d "$domain")
done

if [[ $QUIET -ne 1 ]]; then
  echo "Running certbot for domains: ${DOMAINS[*]}"
fi
docker run --rm \
  -v "${WEBROOT}:/var/www/certbot" \
  -v "${ETC_DIR}:/etc/letsencrypt" \
  -v "${LIB_DIR}:/var/lib/letsencrypt" \
  -v "${LOG_DIR}:/var/log/letsencrypt" \
  "$CERTBOT_IMAGE" \
  "${CERTBOT_ARGS[@]}"
# Reload Nginx certificate if renewal was successful (not dry-run)
if [[ $DRY_RUN -eq 0 ]]; then
  if [[ $QUIET -ne 1 ]]; then
    echo "Reloading Nginx configuration to apply new certificates..."
  fi
  
  # Find nginx container by name pattern (e.g., web_project-gateway-nginx-1)
  # Using docker ps --filter for more reliable container discovery
  NGINX_CONTAINER=$(docker ps --filter "name=${COMPOSE_PROJECT}-${NGINX_SERVICE}" --filter "status=running" --format "{{.Names}}" 2>/dev/null | head -1)
  
  if [[ -n "$NGINX_CONTAINER" ]]; then
    if [[ $QUIET -ne 1 ]]; then
      echo "Found Nginx container: $NGINX_CONTAINER"
    fi
    
    # Test nginx configuration before reloading
    if docker exec "$NGINX_CONTAINER" nginx -t >/dev/null 2>&1; then
      # Try graceful reload first
      if docker exec "$NGINX_CONTAINER" nginx -s reload >/dev/null 2>&1; then
        if [[ $QUIET -ne 1 ]]; then
          echo "Nginx configuration reloaded successfully."
        fi
      else
        if [[ $QUIET -ne 1 ]]; then
          echo "Warning: nginx -s reload failed, attempting container restart..."
        fi
        docker restart "$NGINX_CONTAINER" >/dev/null 2>&1
        if [[ $QUIET -ne 1 ]]; then
          echo "Nginx container restarted."
        fi
      fi
    else
      if [[ $QUIET -ne 1 ]]; then
        echo "Warning: nginx configuration test failed, skipping reload."
      fi
    fi
  else
    if [[ $QUIET -ne 1 ]]; then
      echo "Warning: Nginx container (${COMPOSE_PROJECT}-${NGINX_SERVICE}*) not found or not running."
      echo "Please restart it manually with: docker restart ${COMPOSE_PROJECT}-${NGINX_SERVICE}-1"
    fi
  fi
fi