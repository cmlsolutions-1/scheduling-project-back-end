#!/bin/sh
set -e

echo "Running migrations..."
yarn migration:run:prod

echo "Running seed..."
yarn seed:prod

echo "Starting application..."
exec node dist/main.js