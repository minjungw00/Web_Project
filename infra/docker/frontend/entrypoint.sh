#!/bin/sh
set -e

APP_USER=${APP_USER:-app}
APP_GROUP=${APP_GROUP:-app}
WORKDIR=${WORKDIR:-/workspace}
PNPM_STORE=${PNPM_STORE_PATH:-/home/app/.pnpm-store}

ensure_path() {
  target="$1"
  if [ -z "$target" ]; then
    return
  fi
  if [ ! -e "$target" ]; then
    mkdir -p "$target"
  fi
  chown -R "${APP_USER}:${APP_GROUP}" "$target" || true
}

ensure_path "$PNPM_STORE"
ensure_path "$WORKDIR/node_modules"

if [ -d "$WORKDIR/.pnpm-store" ]; then
  ensure_path "$WORKDIR/.pnpm-store"
fi

chown "${APP_USER}:${APP_GROUP}" "$WORKDIR" || true

if [ -f "$WORKDIR/pnpm-lock.yaml" ] && [ ! -s "$WORKDIR/pnpm-lock.yaml" ]; then
  rm "$WORKDIR/pnpm-lock.yaml"
fi

cd "$WORKDIR"

if [ "${SKIP_PNPM_INSTALL:-0}" != "1" ]; then
  if ! su-exec "${APP_USER}:${APP_GROUP}" pnpm install --frozen-lockfile; then
    su-exec "${APP_USER}:${APP_GROUP}" pnpm install --no-frozen-lockfile
  fi
fi

exec su-exec "${APP_USER}:${APP_GROUP}" "$@"
