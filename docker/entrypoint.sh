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

export HOSTNAME="${HOSTNAME:-${APP_HOST:-0.0.0.0}}"
export PORT="${PORT:-${APP_PORT:-3000}}"

exec node server.js
