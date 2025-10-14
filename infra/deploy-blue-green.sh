#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: deploy-blue-green.sh [--color <blue|green>] [--skip-pull]

Options:
  --color <value>   강제로 특정 색상 스택으로 배포합니다. 기본은 자동 전환입니다.
  --skip-pull       docker compose pull 단계를 건너뜁니다.
  -h, --help        도움말을 출력합니다.

환경 변수:
  SERVER_ROOT       Compose에서 사용하는 서버 루트 경로(기본: $HOME/srv/web_project).
  ENV_FILE          Compose --env-file 경로(기본: ${SERVER_ROOT}/.env).
  COMPOSE_FILE      Docker Compose 파일 경로(기본: ${SERVER_ROOT}/docker-compose.prod.yml).
EOF
}

log() {
  printf '[deploy] %s\n' "$1"
}

DEFAULT_SERVER_ROOT="${HOME}/srv/web_project"
export SERVER_ROOT="${SERVER_ROOT:-$DEFAULT_SERVER_ROOT}"
COMPOSE_FILE="${COMPOSE_FILE:-${SERVER_ROOT}/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-${SERVER_ROOT}/.env}"
NGINX_ENV_FILE="${NGINX_ENV_FILE:-${SERVER_ROOT}/nginx/.env.production}"
DOCKER_COMPOSE=(docker compose)

if ! command -v docker >/dev/null 2>&1; then
  echo "docker command not found" >&2
  exit 1
fi

COLOR_OVERRIDE=""
RUN_PULL=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --color)
      COLOR_OVERRIDE="${2:-}"
      shift 2
      ;;
    --skip-pull)
      RUN_PULL=0
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

if [[ -n "$COLOR_OVERRIDE" && "$COLOR_OVERRIDE" != "blue" && "$COLOR_OVERRIDE" != "green" ]]; then
  echo "--color 값은 blue 또는 green 이어야 합니다." >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose 파일을 찾을 수 없습니다: $COMPOSE_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "환경 파일(.env)을 찾을 수 없습니다: $ENV_FILE" >&2
  exit 1
fi

mkdir -p "${SERVER_ROOT}/backend/logs" "${SERVER_ROOT}/backend/config" "${SERVER_ROOT}/nginx"

compose() {
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

get_active_color() {
  local host
  if [[ -f "$NGINX_ENV_FILE" ]]; then
    host=$(grep -E '^NGINX_BACKEND_HOST=' "$NGINX_ENV_FILE" | tail -n1 | cut -d= -f2-)
    case "$host" in
      backend-blue*) echo "blue"; return ;;
      backend-green*) echo "green"; return ;;
    esac
  fi
  local services
  services=$(compose ps --services --status=running 2>/dev/null || true)
  if grep -q '^backend-blue$' <<<"$services"; then
    echo "blue"
    return
  fi
  if grep -q '^backend-green$' <<<"$services"; then
    echo "green"
    return
  fi
  echo ""
}

opposite_color() {
  if [[ "$1" == "blue" ]]; then
    echo "green"
  else
    echo "blue"
  fi
}

wait_for_backend_health() {
  local color="$1"
  local service="backend-${color}"
  local retries=24
  local sleep_seconds=5
  local status
  for ((i=1; i<=retries; i++)); do
    local container_id
    container_id=$(compose ps -q "$service" 2>/dev/null || true)
    if [[ -z "$container_id" ]]; then
      sleep "$sleep_seconds"
      continue
    fi
    status=$(docker inspect -f '{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "starting")
    case "$status" in
      healthy)
        return 0
        ;;
      unhealthy)
        docker logs "$container_id" >&2 || true
        echo "${service} 컨테이너가 unhealthy 상태입니다." >&2
        return 1
        ;;
    esac
    sleep "$sleep_seconds"
  done
  echo "${service} 헬스체크 대기 시간 초과" >&2
  return 1
}

sync_frontend_dist() {
  local color="$1"
  compose run --rm "frontend-${color}"
}

update_nginx_backend() {
  local color="$1"
  local tmp_file
  tmp_file="${NGINX_ENV_FILE}.tmp"
  touch "$NGINX_ENV_FILE"
  if grep -q '^NGINX_BACKEND_HOST=' "$NGINX_ENV_FILE"; then
    sed -E "s/^NGINX_BACKEND_HOST=.*/NGINX_BACKEND_HOST=backend-${color}/" "$NGINX_ENV_FILE" >"$tmp_file"
  else
    cat "$NGINX_ENV_FILE" >"$tmp_file"
    printf "\nNGINX_BACKEND_HOST=backend-%s\n" "$color" >>"$tmp_file"
  fi
  mv "$tmp_file" "$NGINX_ENV_FILE"
  chmod 600 "$NGINX_ENV_FILE" 2>/dev/null || true
}

verify_nginx() {
  local retries=12
  local sleep_seconds=5
  for ((i=1; i<=retries; i++)); do
    if compose exec nginx sh -c 'wget -qO- http://localhost/healthz >/dev/null'; then
      return 0
    fi
    sleep "$sleep_seconds"
  done
  return 1
}

ensure_mysql() {
  compose up -d mysql
}

stop_backend() {
  local color="$1"
  compose stop "backend-${color}" >/dev/null 2>&1 || true
  compose rm -f "backend-${color}" >/dev/null 2>&1 || true
}

ACTIVE_COLOR="$(get_active_color)"
TARGET_COLOR="${COLOR_OVERRIDE:-}"

if [[ -z "$TARGET_COLOR" ]]; then
  if [[ -n "$ACTIVE_COLOR" ]]; then
    TARGET_COLOR="$(opposite_color "$ACTIVE_COLOR")"
  else
    TARGET_COLOR="blue"
  fi
fi

if (( RUN_PULL )); then
  log "이미지를 최신 상태로 가져옵니다 (${TARGET_COLOR})."
  compose pull "backend-${TARGET_COLOR}" "frontend-${TARGET_COLOR}" nginx mysql
fi

ensure_mysql

log "backend-${TARGET_COLOR} 서비스를 기동합니다."
compose up -d "backend-${TARGET_COLOR}"

wait_for_backend_health "$TARGET_COLOR"
log "backend-${TARGET_COLOR} 헬스체크 통과."

log "frontend-${TARGET_COLOR} 잡을 실행하여 dist를 동기화합니다."
sync_frontend_dist "$TARGET_COLOR"

PREVIOUS_COLOR="$ACTIVE_COLOR"
update_nginx_backend "$TARGET_COLOR"
log "nginx를 재적용합니다."
compose up -d nginx

if verify_nginx; then
  log "nginx 헬스체크 통과."
else
  log "nginx 헬스체크 실패. 이전 색상으로 롤백합니다."
  if [[ -n "$PREVIOUS_COLOR" ]]; then
    update_nginx_backend "$PREVIOUS_COLOR"
    compose up -d nginx
  fi
  exit 1
fi

if [[ -n "$PREVIOUS_COLOR" && "$PREVIOUS_COLOR" != "$TARGET_COLOR" ]]; then
  log "이전 backend-${PREVIOUS_COLOR} 스택을 정리합니다."
  stop_backend "$PREVIOUS_COLOR"
fi

log "미사용 이미지를 정리합니다."
docker image prune --filter "dangling=true" --force >/dev/null 2>&1 || true

log "${TARGET_COLOR} 스택 배포가 완료되었습니다."
