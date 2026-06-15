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

exec node server.js
