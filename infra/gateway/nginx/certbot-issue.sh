#!/usr/bin/env bash
set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<EOF
Usage: certbot-issue.sh -d <domain> [-d <another-domain> ...] -e <email> [--base-dir <path>] [--staging] [--dry-run] [--quiet]

Issue or renew Let's Encrypt certificates using the certbot/certbot container.
Options:
  -d, --domain    Domain to request a certificate for. Repeatable.
  -e, --email     Contact email for Let's Encrypt registration.
  --base-dir  Base directory that contains certbot, letsencrypt/etc|lib|log (default: script directory).
  --staging   Use Let's Encrypt staging environment (rate-limit safe).
  --dry-run   Perform a dry-run renewal to validate configuration.
  -q, --quiet  Reduce logging output and pass --quiet to certbot.
  -h, --help      Show this help message.

Environment overrides:
  CERTBOT_BASE_DIR    Base directory for certbot data (overrides --base-dir)
  CERTBOT_WEBROOT     Webroot directory exposed to nginx (default: <base>/certbot)
  CERTBOT_ETC         Directory to store /etc/letsencrypt (default: <base>/letsencrypt/etc)
  CERTBOT_LIB         Directory to store /var/lib/letsencrypt (default: <base>/letsencrypt/lib)
  CERTBOT_LOG         Directory to store /var/log/letsencrypt (default: <base>/letsencrypt/log)
  CERTBOT_IMAGE       Docker image to use (default: certbot/certbot:latest)
EOF
}

DOMAINS=()
EMAIL=""
STAGING=0
DRY_RUN=0
BASE_DIR_INPUT=""
QUIET=0

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
  BASE_DIR="$SCRIPT_DIR"
fi

BASE_DIR=${CERTBOT_BASE_DIR:-$BASE_DIR}
mkdir -p "$BASE_DIR"
BASE_DIR="$(cd "$BASE_DIR" && pwd)"
WEBROOT=${CERTBOT_WEBROOT:-${BASE_DIR}/certbot}
ETC_DIR=${CERTBOT_ETC:-${BASE_DIR}/letsencrypt/etc}
LIB_DIR=${CERTBOT_LIB:-${BASE_DIR}/letsencrypt/lib}
LOG_DIR=${CERTBOT_LOG:-${BASE_DIR}/letsencrypt/log}
CERTBOT_IMAGE=${CERTBOT_IMAGE:-certbot/certbot:latest}

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
