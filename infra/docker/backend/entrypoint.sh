#!/bin/sh
set -eu

JAVA_OPTS="${JAVA_OPTS:-}"

exec java ${JAVA_OPTS} -jar /app/app.jar "$@"
