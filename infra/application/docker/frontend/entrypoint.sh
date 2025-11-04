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
ensure_path "$WORKDIR/dist"

if [ -d "$WORKDIR/.pnpm-store" ]; then
  ensure_path "$WORKDIR/.pnpm-store"
fi

chown "${APP_USER}:${APP_GROUP}" "$WORKDIR" || true

if [ -f "$WORKDIR/pnpm-lock.yaml" ] && [ ! -s "$WORKDIR/pnpm-lock.yaml" ]; then
  rm "$WORKDIR/pnpm-lock.yaml"
fi

cd "$WORKDIR"

# Force pnpm to use a stable store outside bind mounts and avoid hardlinks on overlayfs
su-exec "${APP_USER}:${APP_GROUP}" pnpm config set store-dir "$PNPM_STORE" >/dev/null 2>&1 || true
su-exec "${APP_USER}:${APP_GROUP}" pnpm config set package-import-method copy >/dev/null 2>&1 || true

# Optional: if a local store exists inside the workspace, it can cause overlay issues; ignore it
if [ -d "$WORKDIR/.pnpm-store" ] && [ "${KEEP_LOCAL_PNPM_STORE:-0}" != "1" ]; then
  rm -rf "$WORKDIR/.pnpm-store" || true
fi

if [ "${SKIP_PNPM_INSTALL:-0}" != "1" ]; then
  # Clean up partial installs that can cause ENOTEMPTY/ENOENT after abrupt exits
  find "$WORKDIR/node_modules/.pnpm" -maxdepth 1 -type d -name "*_tmp_*" -exec rm -rf {} + 2>/dev/null || true
  if ! su-exec "${APP_USER}:${APP_GROUP}" pnpm install --frozen-lockfile; then
    su-exec "${APP_USER}:${APP_GROUP}" pnpm install --no-frozen-lockfile
  fi
fi

exec su-exec "${APP_USER}:${APP_GROUP}" "$@"
