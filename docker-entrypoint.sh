#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding permissions and roles..."
node dist/scripts/database-cli.js seed

echo "🚀 Starting application..."
exec "$@"
