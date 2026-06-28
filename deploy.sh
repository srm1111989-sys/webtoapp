#!/bin/bash
set -euo pipefail

APP_ROOT="/opt/webtoapp"
BACKEND_DIR="$APP_ROOT/backend"
FRONTEND_DIR="$APP_ROOT/frontend"
DOPPLER_SERVICE_TOKEN_FILE="/root/.doppler/webtoapp-prd.token"
TMP_ENV="$(mktemp /tmp/webtoapp-env.XXXXXX)"
RUNTIME_ENV="$APP_ROOT/.env.runtime"
BACKEND_RUNTIME_ENV="$BACKEND_DIR/.env.runtime"
BACKEND_NATIVE_ENV="$BACKEND_DIR/.env.native"

cleanup() {
  rm -f "$TMP_ENV"
}

trap cleanup EXIT

cd "$APP_ROOT"
umask 077

if [ ! -s "$DOPPLER_SERVICE_TOKEN_FILE" ]; then
  echo "Missing Doppler service token file: $DOPPLER_SERVICE_TOKEN_FILE"
  exit 1
fi

DOPPLER_TOKEN="$(tr -d '\r\n' < "$DOPPLER_SERVICE_TOKEN_FILE")"
if [ -z "$DOPPLER_TOKEN" ]; then
  echo "Doppler service token file is empty: $DOPPLER_SERVICE_TOKEN_FILE"
  exit 1
fi

echo "=== WebToApp Deploy ==="

echo "[1/6] Syncing git..."
git fetch origin main
git reset --hard origin/main

BUILD_VERSION="$(cat BUILD_VERSION 2>/dev/null | tr -d '[:space:]' || true)"
BUILD_VERSION="${BUILD_VERSION:-$(git rev-parse --short HEAD)}"
export BUILD_VERSION
echo "Build version: $BUILD_VERSION"

echo "[2/6] Downloading runtime secrets..."
DOPPLER_TOKEN="$DOPPLER_TOKEN" doppler secrets download \
  --project webtoapp \
  --config prd \
  --format env-no-quotes \
  --no-file \
  --no-fallback > "$TMP_ENV"

# Native services on this host still reach the Dockerized Postgres/Redis
# containers through localhost port publishing, not via Docker DNS names.
sed -i \
  -e 's#@db:5432/#@127.0.0.1:5434/#g' \
  -e 's#redis://redis:6379/#redis://127.0.0.1:6379/#g' \
  "$TMP_ENV"

install -m 600 "$TMP_ENV" "$RUNTIME_ENV"
install -m 600 "$TMP_ENV" "$BACKEND_RUNTIME_ENV"
install -m 600 "$TMP_ENV" "$BACKEND_NATIVE_ENV"

echo "[3/6] Preparing backend environment..."
BACKEND_PYTHON="$BACKEND_DIR/venv/bin/python"
if [ ! -x "$BACKEND_PYTHON" ]; then
  python3 -m venv "$BACKEND_DIR/venv"
fi
"$BACKEND_PYTHON" -m pip install --upgrade pip setuptools wheel
"$BACKEND_PYTHON" -m pip install -r "$BACKEND_DIR/requirements.txt"
(
  cd "$BACKEND_DIR"
  "$BACKEND_PYTHON" -m alembic upgrade head
)

echo "[4/6] Building frontend..."
(
  cd "$FRONTEND_DIR"
  npm ci --no-audit --no-fund
  BUILD_VERSION="$BUILD_VERSION" npm run build
)

echo "[5/6] Restarting systemd services..."
systemctl restart webtoapp-backend
systemctl restart webtoapp-frontend

echo "[6/6] Verifying..."
sleep 5
BACKEND_STATUS="$(systemctl is-active webtoapp-backend)"
FRONTEND_STATUS="$(systemctl is-active webtoapp-frontend)"
echo "  webtoapp-backend: $BACKEND_STATUS"
echo "  webtoapp-frontend: $FRONTEND_STATUS"

HEALTH="$(curl -fsS http://127.0.0.1:8000/api/health 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('status', '?'))" 2>/dev/null || echo fail)"
echo "  API Health: $HEALTH"

echo "=== Deploy complete ==="
