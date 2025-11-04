#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/detect-docker-cidr.sh --network <docker_network_name> [--env-file <path>] [--var <ENV_VAR_NAME>]

Examples:
  scripts/detect-docker-cidr.sh --network web_project_webnet-dev
  scripts/detect-docker-cidr.sh --network web_project_webnet \
    --env-file infra/gateway/nginx/.env.production --var NGINX_MONITORING_INTERNAL_CIDR
USAGE
}

network=""
env_file=""
var_name="NGINX_MONITORING_INTERNAL_CIDR"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --network)
      network=${2:-}
      shift 2
      ;;
    --env-file)
      env_file=${2:-}
      shift 2
      ;;
    --var)
      var_name=${2:-}
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [[ -z "$network" ]]; then
  usage
  exit 2
fi

# Detect the subnet (CIDR) for the given Docker network
if ! subnet=$(docker network inspect "$network" --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}' 2>/dev/null | tr -d '\n'); then
  echo "[detect-docker-cidr] Failed to inspect network: $network" >&2
  exit 1
fi

if [[ -z "$subnet" ]]; then
  echo "[detect-docker-cidr] No subnet found for network: $network" >&2
  exit 1
fi

echo "$subnet"

# Optionally update an env file with the detected subnet
if [[ -n "$env_file" ]]; then
  # If the file exists and contains the key, replace it; otherwise append
  if [[ -f "$env_file" ]] && grep -q "^${var_name}=" "$env_file"; then
    sed -i "s/^${var_name}=.*$/${var_name}=${subnet}/" "$env_file"
  else
    # Ensure file exists
    touch "$env_file"
    # Ensure ends with a newline before appending
    # shellcheck disable=SC1003
    if [[ -s "$env_file" ]] && [[ $(tail -c1 "$env_file" | wc -c) -ne 1 ]]; then
      echo >> "$env_file"
    fi
    echo "${var_name}=${subnet}" >> "$env_file"
  fi
  echo "[detect-docker-cidr] Updated ${var_name} in ${env_file} => ${subnet}" >&2
fi
