#!/usr/bin/env bash

set -euo pipefail

# Synchronize LOCAL_UID and LOCAL_GID into infra/application/.env.application.dev

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "$script_dir/.." && pwd)"
app_dir="$project_root/infra/application"
env_file="$app_dir/.env.application.dev"

to_integer() {
  local val="$1"; local def="$2"
  if [[ "$val" =~ ^[0-9]+$ ]]; then
    echo "$val"
  else
    echo "$def"
  fi
}

determine_uid() {
  if [[ -n "${LOCAL_UID:-}" ]]; then
    to_integer "$LOCAL_UID" 1000
    return
  fi
  if command -v id >/dev/null 2>&1; then
    to_integer "$(id -u)" 1000
    return
  fi
  if [[ -n "${SUDO_UID:-}" ]]; then
    to_integer "$SUDO_UID" 1000
    return
  fi
  echo 1000
}

determine_gid() {
  if [[ -n "${LOCAL_GID:-}" ]]; then
    to_integer "$LOCAL_GID" 1000
    return
  fi
  if command -v id >/dev/null 2>&1; then
    to_integer "$(id -g)" 1000
    return
  fi
  if [[ -n "${SUDO_GID:-}" ]]; then
    to_integer "$SUDO_GID" 1000
    return
  fi
  echo 1000
}

update_env_file() {
  local file_path="$1"; local uid="$2"; local gid="$3"
  mkdir -p "$(dirname "$file_path")"

  if [[ -f "$file_path" ]]; then
    # Update or append LOCAL_UID
    if grep -q '^LOCAL_UID=' "$file_path"; then
      sed -i "s/^LOCAL_UID=.*/LOCAL_UID=${uid}/" "$file_path"
    else
      echo "" >> "$file_path"
      echo "LOCAL_UID=${uid}" >> "$file_path"
    fi

    # Update or append LOCAL_GID
    if grep -q '^LOCAL_GID=' "$file_path"; then
      sed -i "s/^LOCAL_GID=.*/LOCAL_GID=${gid}/" "$file_path"
    else
      echo "LOCAL_GID=${gid}" >> "$file_path"
    fi

    # Optional: compress excessive blank lines (3+ to 2)
    # This uses awk to keep at most two consecutive newlines
    awk 'BEGIN{RS=""; ORS="\n\n"} {gsub(/\n{3,}/,"\n\n"); print}' "$file_path" > "$file_path.tmp" && mv "$file_path.tmp" "$file_path"
  else
    cat > "$file_path" <<EOF
# Docker Compose settings for Application (Development)
# This file is auto-generated and git-ignored

# User ID mappings (auto-updated by sync-local-ids.sh)
LOCAL_UID=${uid}
LOCAL_GID=${gid}

# Docker Compose settings
COMPOSE_PROJECT_NAME=web_project-dev-application
COMPOSE_NETWORK=web_project-dev-webnet

# Network settings
EXTERNAL_NETWORK=web_project-dev-webnet

# MySQL connection (references infrastructure layer)
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DATABASE=appdb
MYSQL_USER=app
MYSQL_PASSWORD=apppassword

# Volume mounts
FE_DIST_MOUNT=web_project-dev-frontend-dist
CERTBOT_MOUNT=web_project-dev-certbot-dev

# Image settings (for production reference)
FRONTEND_IMAGE=ghcr.io/minjungw00/web-project-frontend
BACKEND_IMAGE=ghcr.io/minjungw00/web-project-backend
FE_TAG=latest
BE_TAG=latest
EOF
  fi
}

uid="$(determine_uid)"
gid="$(determine_gid)"

update_env_file "$env_file" "$uid" "$gid"

echo "Updated LOCAL_UID=${uid}, LOCAL_GID=${gid} in ${env_file}"
