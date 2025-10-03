#!/bin/sh
set -eu

APP_USER=${APP_USER:-app}
APP_GROUP=${APP_GROUP:-app}
WORKDIR=${WORKDIR:-/workspace}

# Ensure the app user owns the entire workspace to avoid permission issues
if [ -d "$WORKDIR" ]; then
  chown -R "${APP_USER}:${APP_GROUP}" "$WORKDIR" || true
fi

exec su -s /bin/sh "${APP_USER}" -c "$*"
