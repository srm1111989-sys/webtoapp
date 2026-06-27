#!/bin/bash
set -e
cd /opt/webtoapp
umask 077

DOPPLER_SERVICE_TOKEN_FILE="/root/.doppler/webtoapp-prd.token"
TMP_ENV="/tmp/webtoapp.env"
RUNTIME_ENV="/opt/webtoapp/.env.runtime"
BACKEND_RUNTIME_ENV="/opt/webtoapp/backend/.env.runtime"
trap 'rm -f "$TMP_ENV" "$RUNTIME_ENV" "$BACKEND_RUNTIME_ENV"' EXIT

if [ ! -s "$DOPPLER_SERVICE_TOKEN_FILE" ]; then
  echo "Missing Doppler service token file: $DOPPLER_SERVICE_TOKEN_FILE"
  exit 1
fi

DOPPLER_TOKEN="$(tr -d '\r\n' < "$DOPPLER_SERVICE_TOKEN_FILE")"
if [ -z "$DOPPLER_TOKEN" ]; then
  echo "Doppler service token file is empty: $DOPPLER_SERVICE_TOKEN_FILE"
  exit 1
fi

DOPPLER_TOKEN="$DOPPLER_TOKEN" doppler secrets download --project webtoapp --config prd --format env-no-quotes --no-file --no-fallback > "$TMP_ENV"
cp "$TMP_ENV" "$RUNTIME_ENV"
cp "$TMP_ENV" "$BACKEND_RUNTIME_ENV"

echo "=== WebToApp Deploy ==="

echo "[1/5] Pulling latest..."
git pull origin main

BUILD_VERSION=$(cat BUILD_VERSION 2>/dev/null | tr -d '[:space:]')
export BUILD_VERSION=${BUILD_VERSION:-$(date +%Y%m%d%H%M)}
echo "Build version: $BUILD_VERSION"

echo "[2/5] Building ALL services (no cache for code changes)..."
BUILD_VERSION=$BUILD_VERSION docker compose --env-file "$TMP_ENV" -f docker-compose.yml build backend frontend

echo "[3/5] Restarting services..."
docker compose --env-file "$TMP_ENV" -f docker-compose.yml up -d --force-recreate backend frontend

echo "[4/5] Cleaning old images..."
docker image prune -f --filter "dangling=true" > /dev/null 2>&1 || true

echo "[5/5] Verifying..."
sleep 5
for svc in webtoapp-backend-1 webtoapp-frontend-1 webtoapp-db-1; do
  STATUS=$(docker ps --filter name=$svc --format "{{.Status}}" | head -1)
  echo "  $svc: $STATUS"
done

HEALTH=$(curl -s http://127.0.0.1:8000/api/health 2>/dev/null | python3 -c "import sys,json;print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "fail")
echo "  API Health: $HEALTH"

echo "=== Deploy complete ==="
