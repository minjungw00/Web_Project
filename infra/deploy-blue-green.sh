#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: deploy-blue-green.sh [--env <prod|dev>] [--color <blue|green>] [--skip-pull] [--phase <prepare|finalize|full>]

Options:
  --env <value>       실행 환경 선택(dev|prod). 기본 prod. dev 모드에서 로컬 레포의 compose를 사용해 테스트합니다.
  --color <value>     강제로 특정 색상 스택으로 배포합니다. 기본은 자동 전환입니다.
  --skip-pull         docker compose pull 단계를 건너뜁니다.
  --phase <value>     배포 단계를 선택합니다. prepare: 신규 색상 기동 및 dist 동기화 / finalize: 이전 색상 정리 / full: (기본) prepare → gateway 갱신 → finalize 순으로 실행합니다.
  -h, --help          도움말을 출력합니다.

환경 변수(주요):
  SERVER_ROOT               prod 환경에서 서버 루트 경로(기본: $HOME/srv/web_project)
  ENV_FILE                  prod: ${SERVER_ROOT}/.env.server.prod (fallback: .env.server)
  APP_ENV_FILE              prod: ${SERVER_ROOT}/application/.env.application.prod
  GATEWAY_ENV_FILE          prod: ${SERVER_ROOT}/gateway/.env.gateway.prod (선택)
  NGINX_ENV_FILE            prod: ${SERVER_ROOT}/gateway/nginx/.env.production

dev 모드 경로(레포 기준):
  infra/.env.server.dev, infra/application/.env.application.dev,
  infra/gateway/.env.gateway.dev,
  infra/gateway/nginx/.env.development
EOF
}

log() {
  printf '[deploy] %s\n' "$1"
}

DEFAULT_SERVER_ROOT="${HOME}/srv/web_project"
export SERVER_ROOT="${SERVER_ROOT:-$DEFAULT_SERVER_ROOT}"

# repo root (for dev mode)
REPO_ROOT="$(cd -- "$(dirname -- "$0")/.." && pwd)"

# mode: prod | dev
ENV_MODE="prod"

# phase: prepare | finalize | full
PHASE="full"

STATE_FILE="${SERVER_ROOT}/application/.blue-green-state"

DOCKER_COMPOSE=(docker compose)

if ! command -v docker >/dev/null 2>&1; then
  echo "docker command not found" >&2
  exit 1
fi

COLOR_OVERRIDE=""
RUN_PULL=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_MODE="${2:-}"
      shift 2
      ;;
    --color)
      COLOR_OVERRIDE="${2:-}"
      shift 2
      ;;
    --skip-pull)
      RUN_PULL=0
      shift
      ;;
    --phase)
      PHASE="${2:-}"
      shift 2
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

if [[ "$ENV_MODE" != "prod" && "$ENV_MODE" != "dev" ]]; then
  echo "--env 값은 prod 또는 dev 이어야 합니다." >&2
  exit 1
fi

if [[ "$PHASE" != "full" && "$PHASE" != "prepare" && "$PHASE" != "finalize" ]]; then
  echo "--phase 값은 prepare, finalize, full 중 하나여야 합니다." >&2
  exit 1
fi

if [[ -n "$COLOR_OVERRIDE" && "$COLOR_OVERRIDE" != "blue" && "$COLOR_OVERRIDE" != "green" ]]; then
  echo "--color 값은 blue 또는 green 이어야 합니다." >&2
  exit 1
fi

#############################################
# Resolve compose files and envs per ENV_MODE
#############################################

if [[ "$ENV_MODE" == "prod" ]]; then
  APP_COMPOSE_FILE="${SERVER_ROOT}/application/docker-compose.application.prod.yml"
  GATEWAY_COMPOSE_FILE="${SERVER_ROOT}/gateway/docker-compose.gateway.prod.yml"

  ENV_FILE="${ENV_FILE:-${SERVER_ROOT}/.env.server.prod}"
  [[ -f "$ENV_FILE" ]] || ENV_FILE="${SERVER_ROOT}/.env.server"
  APP_ENV_FILE="${APP_ENV_FILE:-${SERVER_ROOT}/application/.env.application.prod}"
  GATEWAY_ENV_FILE="${GATEWAY_ENV_FILE:-${SERVER_ROOT}/gateway/.env.gateway.prod}"
  NGINX_ENV_FILE="${NGINX_ENV_FILE:-${SERVER_ROOT}/gateway/nginx/.env.production}"

  # Ensure host directories exist for backend mounts (logs/config)
  mkdir -p "${SERVER_ROOT}/application/backend/logs" "${SERVER_ROOT}/application/backend/config" || true
else
  APP_COMPOSE_FILE="${REPO_ROOT}/infra/application/docker-compose.application.dev.yml"
  GATEWAY_COMPOSE_FILE="${REPO_ROOT}/infra/gateway/docker-compose.gateway.dev.yml"

  ENV_FILE="${REPO_ROOT}/infra/.env.server.dev"
  APP_ENV_FILE="${REPO_ROOT}/infra/application/.env.application.dev"
  GATEWAY_ENV_FILE="${REPO_ROOT}/infra/gateway/.env.gateway.dev"
  NGINX_ENV_FILE="${REPO_ROOT}/infra/gateway/nginx/.env.development"
fi

if [[ ! -f "$APP_COMPOSE_FILE" ]]; then
  echo "Compose 파일을 찾을 수 없습니다: $APP_COMPOSE_FILE" >&2
  exit 1
fi

if [[ "$PHASE" == "full" && ! -f "$GATEWAY_COMPOSE_FILE" ]]; then
  echo "Compose 파일을 찾을 수 없습니다: $GATEWAY_COMPOSE_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "서버 공통 환경 파일을 찾을 수 없습니다: $ENV_FILE" >&2
  exit 1
fi

if [[ "$PHASE" != "finalize" && ! -f "$APP_ENV_FILE" ]]; then
  echo "애플리케이션 환경 파일을 찾을 수 없습니다: $APP_ENV_FILE" >&2
  exit 1
fi

if [[ -f "$GATEWAY_ENV_FILE" ]]; then
  :
else
  touch "$GATEWAY_ENV_FILE" 2>/dev/null || true
fi

# helper: merge multiple .env files (last wins) into a temp file
merge_env_files() {
  local out
  out="$(mktemp -t env-merged.XXXXXX)"
  : >"$out"
  for f in "$@"; do
    if [[ -f "$f" ]]; then
      # strip comments/blank lines
      sed -e '/^\s*#/d' -e '/^\s*$/d' "$f" >>"$out"
    fi
  done
  echo "$out"
}

# Build merged envs per layer
MERGED_APP_ENV="$(merge_env_files "$ENV_FILE" "$APP_ENV_FILE")"
chmod 600 "$MERGED_APP_ENV" 2>/dev/null || true

MERGED_GATEWAY_ENV=""
if [[ "$PHASE" == "full" ]]; then
  MERGED_GATEWAY_ENV="$(merge_env_files "$ENV_FILE" "$GATEWAY_ENV_FILE")"
  chmod 600 "$MERGED_GATEWAY_ENV" 2>/dev/null || true
fi

compose_app() { "${DOCKER_COMPOSE[@]}" -f "$APP_COMPOSE_FILE" --env-file "$MERGED_APP_ENV" "$@"; }

compose_gateway() {
  if [[ "$PHASE" == "full" ]]; then
    "${DOCKER_COMPOSE[@]}" -f "$GATEWAY_COMPOSE_FILE" --env-file "$MERGED_GATEWAY_ENV" "$@"
  else
    echo "compose_gateway 호출은 full phase에서만 지원됩니다." >&2
    exit 1
  fi
}

# util: get value from merged env (strips simple quotes)
get_env() {
  local key="$1"; local default="${2:-}"
  local val
  val="$(grep -E "^[[:space:]]*${key}=" "$MERGED_APP_ENV" | tail -n1 | cut -d= -f2- | tr -d '\r' || true)"
  if [[ -n "$val" ]]; then
    # strip whitespace and surrounding quotes if present
    val="${val#"${val%%[![:space:]]*}"}"
    val="${val%"${val##*[![:space:]]}"}"
    val="${val%\"}"
    val="${val#\"}"
    val="${val%\'}"
    val="${val#\'}"
    echo "$val"
  else
    echo "$default"
  fi
}

is_path_like() {
  local value="$1"
  if [[ -z "$value" ]]; then
    return 1
  fi
  case "$value" in
    /*|./*|../*|~*|?:/*|*/*|*\\*) return 0 ;;
  esac
  return 1
}

resolve_mount_volume_name() {
  local key="$1" default_token="$2" default_dev="$3" default_prod="$4"
  local candidate
  candidate="$(get_env "$key" "$default_token")"
  if is_path_like "$candidate"; then
    echo ""
    return 0
  fi
  if [[ -z "$candidate" ]]; then
    candidate="$default_token"
  fi
  if [[ "$candidate" == "$default_token" ]]; then
    if [[ "$ENV_MODE" == "dev" ]]; then
      echo "$default_dev"
    else
      echo "$default_prod"
    fi
  else
    echo "$candidate"
  fi
}

ensure_shared_volume() {
  local key="$1" default_token="$2" default_dev="$3" default_prod="$4"
  local volume_name
  volume_name="$(resolve_mount_volume_name "$key" "$default_token" "$default_dev" "$default_prod")"
  if [[ -z "$volume_name" ]]; then
    return 0
  fi
  if ! docker volume inspect "$volume_name" >/dev/null 2>&1; then
    log "공유 볼륨 생성: $volume_name"
    docker volume create "$volume_name" >/dev/null
  fi
}

# ensure external network exists (especially in dev)
ensure_network() {
  local net_name
  if [[ "$ENV_MODE" == "dev" ]]; then
    net_name="$(get_env APP_NETWORK_NAME "web_project_webnet-dev")"
  else
    net_name="$(get_env APP_NETWORK_NAME "web_project_webnet")"
  fi
  if ! docker network inspect "$net_name" >/dev/null 2>&1; then
    log "외부 네트워크가 없어 생성합니다: $net_name"
    docker network create "$net_name" >/dev/null
  fi
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
  services=$(compose_app ps --services --status=running 2>/dev/null || true)
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
    container_id=$(compose_app ps -q "$service" 2>/dev/null || true)
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
  if [[ "$ENV_MODE" == "dev" ]]; then
    # Dev: ensure color-matched frontend-<color> (watch builder) is running
    local svc="frontend-${color}"
    log "dev 모드: ${svc} 를 기동하여 dist 볼륨을 갱신합니다."
    compose_app up -d "$svc"
  else
    # Prod: run one-shot sync as a proper service container so it belongs to the stack
    local svc="frontend-${color}"
    log "prod 모드: 프론트엔드 dist 동기화 잡 실행: ${svc}"
    compose_app up -d "$svc"
    # wait for completion and check exit code
    local cid
    cid=$(compose_app ps -q "$svc" 2>/dev/null || true)
    if [[ -n "$cid" ]]; then
      local ec
      ec=$(docker wait "$cid" 2>/dev/null || echo 1)
      if [[ "$ec" != "0" ]]; then
        docker logs "$cid" || true
        echo "프론트엔드 dist 동기화 실패 (exit=$ec)" >&2
        return $ec
      fi
      # remove stopped container to keep stack tidy
      compose_app rm -f "$svc" >/dev/null 2>&1 || true
    else
      echo "프론트엔드 dist 동기화 컨테이너를 찾을 수 없습니다: $svc" >&2
      return 1
    fi
  fi
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
  local cid status
  for ((i=1; i<=retries; i++)); do
    cid=$(compose_gateway ps -q nginx 2>/dev/null || true)
    if [[ -z "$cid" ]]; then
      sleep "$sleep_seconds"; continue
    fi
    status=$(docker inspect -f '{{.State.Health.Status}}' "$cid" 2>/dev/null || echo "")
    if [[ -n "$status" ]]; then
      case "$status" in
        healthy) return 0 ;;
        unhealthy) return 1 ;;
      esac
    else
      # Fallback when no healthcheck is defined
      if compose_gateway exec -T nginx sh -c 'curl -sf http://localhost/healthz >/dev/null'; then
        return 0
      fi
    fi
    sleep "$sleep_seconds"
  done
  return 1
}

stop_backend() {
  local color="$1"
  compose_app stop "backend-${color}" >/dev/null 2>&1 || true
  compose_app rm -f "backend-${color}" >/dev/null 2>&1 || true
}

emit_output() {
  local key="$1" value="$2"
  if [[ -z "${value}" ]]; then
    return 0
  fi
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    printf '%s=%s\n' "$key" "$value" >> "${GITHUB_OUTPUT}"
  else
    printf '%s=%s\n' "$key" "$value"
  fi
}

store_state() {
  mkdir -p "$(dirname "$STATE_FILE")"
  {
    printf 'TARGET_COLOR=%s\n' "$TARGET_COLOR"
    printf 'PREVIOUS_COLOR=%s\n' "$PREVIOUS_COLOR"
    printf 'UPDATED_AT=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  } > "$STATE_FILE"
  chmod 600 "$STATE_FILE" 2>/dev/null || true
}

load_state() {
  STATE_TARGET_COLOR=""
  STATE_PREVIOUS_COLOR=""
  if [[ ! -f "$STATE_FILE" ]]; then
    return 1
  fi
  while IFS='=' read -r key value; do
    case "$key" in
      TARGET_COLOR) STATE_TARGET_COLOR="$value" ;;
      PREVIOUS_COLOR) STATE_PREVIOUS_COLOR="$value" ;;
    esac
  done < "$STATE_FILE"
}

ACTIVE_COLOR=""
TARGET_COLOR=""
PREVIOUS_COLOR=""

phase_prepare() {
  ensure_network
  ensure_shared_volume "FE_DIST_MOUNT" "frontend-dist" "web_project-dev_frontend-dist" "web_project-frontend-dist"
  ensure_shared_volume "NGINX_LOGS_MOUNT" "nginx-logs" "web_project-dev_nginx-logs" "web_project_nginx-logs"

  ACTIVE_COLOR="$(get_active_color)"
  PREVIOUS_COLOR="$ACTIVE_COLOR"

  if [[ -n "$COLOR_OVERRIDE" ]]; then
    TARGET_COLOR="$COLOR_OVERRIDE"
  elif [[ -n "$ACTIVE_COLOR" ]]; then
    TARGET_COLOR="$(opposite_color "$ACTIVE_COLOR")"
  else
    TARGET_COLOR="blue"
  fi

  if [[ "$TARGET_COLOR" != "blue" && "$TARGET_COLOR" != "green" ]]; then
    echo "유효하지 않은 배포 색상입니다: $TARGET_COLOR" >&2
    exit 1
  fi

  if (( RUN_PULL )); then
    log "이미지를 최신 상태로 가져옵니다 (${TARGET_COLOR})."
    compose_app pull "backend-${TARGET_COLOR}" "frontend-${TARGET_COLOR}"
  else
    log "이미지 pull 단계를 건너뜁니다."
  fi

  log "backend-${TARGET_COLOR} 서비스를 기동합니다."
  compose_app up -d "backend-${TARGET_COLOR}"

  wait_for_backend_health "$TARGET_COLOR"
  log "backend-${TARGET_COLOR} 헬스체크 통과."

  log "frontend-${TARGET_COLOR} 잡을 실행하여 dist를 동기화합니다."
  sync_frontend_dist "$TARGET_COLOR"

  update_nginx_backend "$TARGET_COLOR"
  store_state
  emit_output target_color "$TARGET_COLOR"
  emit_output previous_color "$PREVIOUS_COLOR"
}

phase_apply_gateway() {
  if [[ "$PHASE" != "full" ]]; then
    return 0
  fi
  if (( RUN_PULL )); then
    compose_gateway pull nginx || true
  fi
  log "nginx를 재적용합니다."
  compose_gateway up -d nginx

  if verify_nginx; then
    log "nginx 헬스체크 통과."
  else
    log "nginx 헬스체크 실패. 이전 색상으로 롤백합니다."
    if [[ -n "$PREVIOUS_COLOR" && "$PREVIOUS_COLOR" != "$TARGET_COLOR" ]]; then
      update_nginx_backend "$PREVIOUS_COLOR"
      compose_gateway up -d nginx
    fi
    exit 1
  fi
}

ensure_gateway_target() {
  local expected="backend-${TARGET_COLOR}"
  local current
  current=$(grep -E '^NGINX_BACKEND_HOST=' "$NGINX_ENV_FILE" | tail -n1 | cut -d= -f2- || true)
  if [[ "$current" != "$expected" ]]; then
    echo "NGINX_BACKEND_HOST가 ${expected} 로 설정되지 않았습니다 (현재: ${current:-unset})." >&2
    return 1
  fi
  return 0
}

phase_finalize() {
  if [[ -z "$TARGET_COLOR" ]]; then
    load_state
    TARGET_COLOR="${STATE_TARGET_COLOR:-}"
    PREVIOUS_COLOR="${STATE_PREVIOUS_COLOR:-}"
  fi

  if [[ -z "$TARGET_COLOR" ]]; then
    echo "마지막 준비 단계 정보를 찾을 수 없습니다. 먼저 --phase prepare를 실행하세요." >&2
    exit 1
  fi

  emit_output target_color "$TARGET_COLOR"

  if ! ensure_gateway_target; then
    echo "게이트웨이가 아직 backend-${TARGET_COLOR} 로 전환되지 않아 이전 스택을 정리할 수 없습니다." >&2
    exit 1
  fi

  if [[ -z "$PREVIOUS_COLOR" || "$PREVIOUS_COLOR" == "$TARGET_COLOR" ]]; then
    log "정리할 이전 색상이 없어 finalize 단계를 건너뜁니다."
  else
    log "이전 backend-${PREVIOUS_COLOR} 스택을 정리합니다."
    stop_backend "$PREVIOUS_COLOR"
    if [[ "$ENV_MODE" == "dev" ]]; then
      log "이전 색상의 프론트엔드 서비스를 중지 및 제거합니다 (frontend-${PREVIOUS_COLOR})."
      compose_app stop "frontend-${PREVIOUS_COLOR}" >/dev/null 2>&1 || true
      compose_app rm -f "frontend-${PREVIOUS_COLOR}" >/dev/null 2>&1 || true
    fi
  fi

  if [[ "$ENV_MODE" == "prod" ]]; then
    log "프론트엔드 동기화 컨테이너 정리(frontend-blue, frontend-green)."
    compose_app rm -f frontend-blue >/dev/null 2>&1 || true
    compose_app rm -f frontend-green >/dev/null 2>&1 || true
  fi

  log "미사용 이미지를 정리합니다."
  docker image prune --filter "dangling=true" --force >/dev/null 2>&1 || true

  rm -f "$STATE_FILE" 2>/dev/null || true
  log "${TARGET_COLOR} 스택 배포가 완료되었습니다."
}

case "$PHASE" in
  prepare)
    phase_prepare
    ;;
  finalize)
    phase_finalize
    ;;
  full)
    phase_prepare
    phase_apply_gateway
    phase_finalize
    ;;
esac

# cleanup temp env files
cleanup_files=("$MERGED_APP_ENV")
if [[ -n "$MERGED_GATEWAY_ENV" ]]; then
  cleanup_files+=("$MERGED_GATEWAY_ENV")
fi
rm -f "${cleanup_files[@]}" 2>/dev/null || true
