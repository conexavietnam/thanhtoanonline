#!/bin/bash

# One-shot runner: build images and start Postgres + backend + frontend.
# Paths are relative to this repo: backend/, discfe/
# Usage examples:
#   ./docker-run.sh
#   ./docker-run.sh --env-file .env.local --dump backups/users_only.sql --drop
#   ./docker-run.sh --backend-port 8083 --frontend-port 5174 --db-port 5433

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./docker-run.sh [options]

Options:
  --env-file PATH        Source env file before running (default: .env if exists)
  --dump FILE            SQL dump to restore into Postgres after it starts
  --drop                 Drop & recreate DB before restore (use with --dump)
  --backend-port PORT    Host port to expose backend (default: 8083)
  --frontend-port PORT   Host port to expose frontend (default: 5174)
  --db-port PORT         Host port for Postgres (default: 5433)
  --help                 Show this help
EOF
}

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE=""
DUMP_FILE=""
DROP_DB=false
BACKEND_HOST_PORT="${BACKEND_HOST_PORT:-8083}"
FRONTEND_HOST_PORT="${FRONTEND_HOST_PORT:-5174}"
DB_HOST_PORT="${DB_HOST_PORT:-5433}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --dump) DUMP_FILE="$2"; shift 2 ;;
    --drop) DROP_DB=true; shift 1 ;;
    --backend-port) BACKEND_HOST_PORT="$2"; shift 2 ;;
    --frontend-port) FRONTEND_HOST_PORT="$2"; shift 2 ;;
    --db-port) DB_HOST_PORT="$2"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

# Load env file if provided or default exists
if [[ -z "$ENV_FILE" && -f "$ROOT_DIR/.env" ]]; then
  ENV_FILE="$ROOT_DIR/.env"
elif [[ -n "$ENV_FILE" && ! -f "$ENV_FILE" ]]; then
  echo "❌ Env file '$ENV_FILE' not found" >&2
  exit 1
fi

if [[ -n "$ENV_FILE" ]]; then
  echo "📄 Loading environment from $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

# Defaults aligned with backend/src/main/resources/application.yml
POSTGRES_DB=${POSTGRES_DB:-appdb}
POSTGRES_USER=${POSTGRES_USER:-appuser}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-apppass}

SERVER_PORT=8083

APP_BASE_URL=${APP_BASE_URL:-http://localhost:$FRONTEND_HOST_PORT}
APP_CORS_ALLOWED_ORIGINS=${APP_CORS_ALLOWED_ORIGINS:-http://localhost:$FRONTEND_HOST_PORT,http://127.0.0.1:$FRONTEND_HOST_PORT,http://localhost:4174,http://127.0.0.1:4174}

JWT_SECRET=${JWT_SECRET:-change-me-change-me-change-me-32}
JWT_EXPIRATION_MS=${JWT_EXPIRATION_MS:-86400000}
JWT_REFRESH_EXPIRATION_MS=${JWT_REFRESH_EXPIRATION_MS:-1209600000}
JWT_ISSUER=${JWT_ISSUER:-discwake-app}

# Quoc Tri: reuse the old Postgres volume automatically so local data survives the rename.
LEGACY_PGDATA_VOLUME="disccuong_pgdata"
DEFAULT_PGDATA_VOLUME="discwake_pgdata"
if [[ -n "${PGDATA_VOLUME:-}" ]]; then
  ACTIVE_PGDATA_VOLUME="$PGDATA_VOLUME"
elif docker volume inspect "$DEFAULT_PGDATA_VOLUME" >/dev/null 2>&1; then
  ACTIVE_PGDATA_VOLUME="$DEFAULT_PGDATA_VOLUME"
elif docker volume inspect "$LEGACY_PGDATA_VOLUME" >/dev/null 2>&1; then
  ACTIVE_PGDATA_VOLUME="$LEGACY_PGDATA_VOLUME"
else
  ACTIVE_PGDATA_VOLUME="$DEFAULT_PGDATA_VOLUME"
fi

AUTH_VERIFY_EXPIRE_MIN=${AUTH_VERIFY_EXPIRE_MIN:-1440}
AUTH_RESET_EXPIRE_MIN=${AUTH_RESET_EXPIRE_MIN:-60}

MAIL_HOST=${MAIL_HOST:-}
MAIL_PORT=${MAIL_PORT:-587}
MAIL_USERNAME=${MAIL_USERNAME:-}
MAIL_PASSWORD=${MAIL_PASSWORD:-}
MAIL_SMTP_AUTH=${MAIL_SMTP_AUTH:-true}
MAIL_SMTP_STARTTLS_ENABLE=${MAIL_SMTP_STARTTLS_ENABLE:-true}
APP_MAIL_FROM=${APP_MAIL_FROM:-no-reply@disc.local}

VITE_API_BASE_URL=${VITE_API_BASE_URL:-/api}

if [[ -n "$DUMP_FILE" && ! -f "$DUMP_FILE" ]]; then
  echo "❌ Dump file '$DUMP_FILE' not found" >&2
  exit 1
fi

echo "🚀 Building and starting stack..."

# Network
docker network create discwake-network 2>/dev/null || true

# Stop old containers
docker stop discwake-backend discwake-frontend 2>/dev/null || true
docker rm discwake-backend discwake-frontend 2>/dev/null || true

# Build backend image
echo "🔨 Building backend image..."
cd "$ROOT_DIR/backend"
docker build -t discwake-backend:latest .

# Build frontend image
echo "🔨 Building frontend image with VITE_API_BASE_URL=$VITE_API_BASE_URL ..."
cd "$ROOT_DIR/discfe"
docker build --build-arg VITE_API_BASE_URL="$VITE_API_BASE_URL" -t discwake-frontend:latest .

cd "$ROOT_DIR"

# Start / reuse Postgres
if docker ps -a --format '{{.Names}}' | grep -q '^discwake-postgres$'; then
  if docker ps --format '{{.Names}}' | grep -q '^discwake-postgres$'; then
    echo "🗄️  Reusing running Postgres container"
  else
    echo "🗄️  Starting existing Postgres container"
    docker start discwake-postgres
  fi
else
  echo "🗄️  Creating Postgres container on host port $DB_HOST_PORT"
  docker run -d --name discwake-postgres \
    --network discwake-network \
    -e POSTGRES_DB="$POSTGRES_DB" \
    -e POSTGRES_USER="$POSTGRES_USER" \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -v "$ACTIVE_PGDATA_VOLUME":/var/lib/postgresql/data \
    -p "$DB_HOST_PORT":5432 \
    --health-cmd="pg_isready -U $POSTGRES_USER -d $POSTGRES_DB" \
    --health-interval=10s \
    --health-timeout=5s \
    --health-retries=5 \
    postgres:16-alpine
fi

# Wait for Postgres healthy
echo "⏳ Waiting for Postgres..."
for _ in {1..12}; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' discwake-postgres 2>/dev/null || echo starting)
  [[ "$STATUS" == "healthy" ]] && break
  echo "   → status: $STATUS"
  sleep 5
done
[[ "$STATUS" == "healthy" ]] || { echo "❌ Postgres not healthy"; exit 1; }
echo "✅ Postgres healthy"

# Optional restore
if [[ -n "$DUMP_FILE" ]]; then
  echo "💾 Restoring $DUMP_FILE ..."
  BASENAME=$(basename "$DUMP_FILE")
  docker cp "$DUMP_FILE" discwake-postgres:/tmp/"$BASENAME"
  if $DROP_DB; then
    docker exec discwake-postgres psql -U "$POSTGRES_USER" -d postgres \
      -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();"
    docker exec discwake-postgres dropdb --if-exists -U "$POSTGRES_USER" "$POSTGRES_DB"
    docker exec discwake-postgres createdb -U "$POSTGRES_USER" "$POSTGRES_DB"
  fi
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" discwake-postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/"$BASENAME"
  docker exec discwake-postgres rm -f /tmp/"$BASENAME"
  echo "✅ Restore done"
fi

# Start backend
echo "🔧 Starting backend on host port $BACKEND_HOST_PORT ..."
docker run -d \
  --name discwake-backend \
  --network discwake-network \
  --network-alias backend \
  -e DB_URL="jdbc:postgresql://discwake-postgres:5432/$POSTGRES_DB" \
  -e DB_USER="$POSTGRES_USER" \
  -e DB_PASSWORD="$POSTGRES_PASSWORD" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e JWT_EXPIRATION_MS="$JWT_EXPIRATION_MS" \
  -e JWT_REFRESH_EXPIRATION_MS="$JWT_REFRESH_EXPIRATION_MS" \
  -e JWT_ISSUER="$JWT_ISSUER" \
  -e APP_BASE_URL="$APP_BASE_URL" \
  -e APP_CORS_ALLOWED_ORIGINS="$APP_CORS_ALLOWED_ORIGINS" \
  -e AUTH_VERIFY_EXPIRE_MIN="$AUTH_VERIFY_EXPIRE_MIN" \
  -e AUTH_RESET_EXPIRE_MIN="$AUTH_RESET_EXPIRE_MIN" \
  -e MAIL_HOST="$MAIL_HOST" \
  -e MAIL_PORT="$MAIL_PORT" \
  -e MAIL_USERNAME="$MAIL_USERNAME" \
  -e MAIL_PASSWORD="$MAIL_PASSWORD" \
  -e MAIL_SMTP_AUTH="$MAIL_SMTP_AUTH" \
  -e MAIL_SMTP_STARTTLS_ENABLE="$MAIL_SMTP_STARTTLS_ENABLE" \
  -e APP_MAIL_FROM="$APP_MAIL_FROM" \
  -e SPRING_FLYWAY_BASELINE_ON_MIGRATE=true \
  -p "$BACKEND_HOST_PORT":$SERVER_PORT \
  --health-cmd="wget --no-verbose --tries=1 --spider http://localhost:$SERVER_PORT/api/actuator/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  --health-start-period=60s \
  discwake-backend:latest

# Start frontend
echo "🎨 Starting frontend on host port $FRONTEND_HOST_PORT ..."
docker run -d \
  --name discwake-frontend \
  --network discwake-network \
  -p "$FRONTEND_HOST_PORT":80 \
  --health-cmd="wget --no-verbose --tries=1 --spider http://localhost || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  discwake-frontend:latest

echo ""
echo "✅ Services up:"
echo "   Frontend  http://localhost:$FRONTEND_HOST_PORT"
echo "   Backend   http://localhost:$BACKEND_HOST_PORT/api"
echo "   Postgres  localhost:$DB_HOST_PORT  db=$POSTGRES_DB user=$POSTGRES_USER"
echo "   Data      Docker volume: $ACTIVE_PGDATA_VOLUME"
echo ""
echo "🛑 Stop: docker stop discwake-frontend discwake-backend discwake-postgres"
