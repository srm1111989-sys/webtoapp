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

set -a
. "$TMP_ENV"
set +a

echo "[2/5] Building backend image..."
BUILD_VERSION=$BUILD_VERSION docker compose --env-file "$TMP_ENV" -f docker-compose.yml build backend

echo "[3/5] Building frontend static bundle..."
(
  cd frontend
  npm install
  BUILD_VERSION=$BUILD_VERSION npm run build
)

echo "[4/5] Restarting services..."
docker compose --env-file "$TMP_ENV" -f docker-compose.yml stop frontend >/dev/null 2>&1 || true
docker rm -f webtoapp-frontend-1 >/dev/null 2>&1 || true
docker compose --env-file "$TMP_ENV" -f docker-compose.yml up -d --force-recreate backend

if pm2 describe webtoapp-frontend >/dev/null 2>&1; then
  pm2 restart webtoapp-frontend --update-env
else
  PORT=3000 HOST=127.0.0.1 pm2 start serve-static.mjs --name webtoapp-frontend --cwd /opt/webtoapp/frontend --update-env
fi
pm2 save >/dev/null 2>&1 || true

echo "[5/6] Cleaning old images..."
docker image prune -f --filter "dangling=true" > /dev/null 2>&1 || true

echo "[6/6] Verifying..."
sleep 5
for svc in webtoapp-backend-1 webtoapp-db-1; do
  STATUS=$(docker ps --filter name=$svc --format "{{.Status}}" | head -1)
  echo "  $svc: $STATUS"
done

if pm2 describe webtoapp-frontend >/dev/null 2>&1; then
  FRONTEND_STATUS="running"
else
  FRONTEND_STATUS="missing"
fi
echo "  webtoapp-frontend: $FRONTEND_STATUS"

HEALTH=$(curl -s http://127.0.0.1:8000/api/health 2>/dev/null | python3 -c "import sys,json;print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "fail")
echo "  API Health: $HEALTH"

echo "=== Deploy complete ==="
