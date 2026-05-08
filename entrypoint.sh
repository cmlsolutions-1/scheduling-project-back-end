#!/bin/sh
set -e

echo "Running migrations..."
npm run migration:run:prod

echo "Running seed..."
npm run seed:prod

echo "Starting application..."
exec node dist/main.js
