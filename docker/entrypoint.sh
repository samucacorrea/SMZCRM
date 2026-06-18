#!/bin/sh
set -eu

if [ "${SERVICE_MODE:-app}" = "worker" ]; then
  exec npm run worker
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  npm run db:migrate
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  npm run db:seed
fi

export HOSTNAME="${APP_HOST:-0.0.0.0}"
export PORT="${APP_PORT:-3000}"

echo "[entrypoint] SERVICE_MODE=${SERVICE_MODE:-app}"
echo "[entrypoint] RUN_MIGRATIONS=${RUN_MIGRATIONS:-true}"
echo "[entrypoint] HOSTNAME=${HOSTNAME}"
echo "[entrypoint] PORT=${PORT}"

exec node server.js
