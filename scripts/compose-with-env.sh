#!/usr/bin/env bash

# Merge multiple dotenv files into a temporary file and run `docker compose` with it.
# Usage:
#   scripts/compose-with-env.sh --env <file> [--env <file> ...] -- docker compose <args>
#
# Notes:
# - Later --env files override earlier ones on duplicate keys.
# - Missing files are skipped with a warning.

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/compose-with-env.sh --env <file> [--env <file> ...] -- docker compose <args>

Examples:
  scripts/compose-with-env.sh --env .env --env .env.local -- docker compose up -d
USAGE
}

env_files=()

# Parse until "--"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      if [[ $# -lt 2 ]]; then
        echo "[compose-with-env] --env requires a file path" >&2
        usage
        exit 2
      fi
      env_files+=("$2")
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    *)
      shift
      ;;
  esac
done

if [[ $# -lt 2 || "$1" != "docker" || "$2" != "compose" ]]; then
  echo "[compose-with-env] Usage error: expected 'docker compose' after --" >&2
  usage
  exit 2
fi

# Remaining args after 'docker compose'
shift 2
compose_args=("$@")

tmp_dir=$(mktemp -d -t compose-env-XXXXXX)
merged_path="$tmp_dir/.env.merged"
trap 'rm -rf "$tmp_dir"' EXIT

# Filter existing env files and warn for missing
existing_files=()
for f in "${env_files[@]:-}"; do
  if [[ -f "$f" ]]; then
    existing_files+=("$f")
  else
    echo "[compose-with-env] Skip missing env file: $f" >&2
  fi
done

# Merge with last-wins semantics (later files override earlier ones)
if [[ ${#existing_files[@]} -gt 0 ]]; then
  awk '
    /^[[:space:]]*(#|$)/ { next }
    {
      line=$0
      pos=index(line,"=")
      if (pos <= 1) next
      key=substr(line,1,pos-1)
      val=substr(line,pos+1)
      sub(/^[[:space:]]+/, "", key)
      sub(/[[:space:]]+$/, "", key)
      kv[key]=val
    }
    END {
      for (k in kv) {
        printf "%s=%s\n", k, kv[k]
      }
    }
  ' "${existing_files[@]}" > "$merged_path"
else
  : > "$merged_path"
fi

# Execute docker compose with the merged env file
exec docker compose --env-file "$merged_path" "${compose_args[@]}"
