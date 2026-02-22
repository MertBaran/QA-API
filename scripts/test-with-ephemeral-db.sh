#!/usr/bin/env bash
# Ephemeral PostgreSQL ile Jest testleri - her çalıştırmada temiz DB
set -e
cd "$(dirname "$0")/.."
COMPOSE_FILE="docker-compose.test.yml"

echo "🐳 Starting ephemeral PostgreSQL..."
docker-compose -f "$COMPOSE_FILE" up -d postgres-test
trap "echo '🐳 Stopping ephemeral PostgreSQL...'; docker-compose -f $COMPOSE_FILE down -v" EXIT

echo "⏳ Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
  if docker-compose -f "$COMPOSE_FILE" exec -T postgres-test pg_isready -U postgres 2>/dev/null; then
    echo "✅ PostgreSQL ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ PostgreSQL failed to start"
    exit 1
  fi
  sleep 1
done

echo "📦 Running migrations..."
CONFIG_FILE=config.env.test.ephemeral npx prisma migrate deploy

echo "🧪 Running tests..."
CONFIG_FILE=config.env.test.ephemeral jest --runInBand "$@"
