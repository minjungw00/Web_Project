#!/bin/sh
set -euo pipefail

JAVA_OPTS="${JAVA_OPTS:-}"

exec java ${JAVA_OPTS} -jar /app/app.jar "$@"
