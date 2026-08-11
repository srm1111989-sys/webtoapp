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

BUILD_VERSION="$(git rev-parse --short HEAD)"
export BUILD_VERSION
echo "Build version: $BUILD_VERSION"

echo "[2/6] Downloading runtime secrets..."
DOPPLER_TOKEN="$DOPPLER_TOKEN" doppler secrets download \
  --project webtoapp \
  --config prd \
  --format env-no-quotes \
  --no-file \
  --no-fallback > "$TMP_ENV"

# Alias Doppler secret name to code-expected name
sed -i "s/^CLAUDE_API=/CLAUDE_API_KEY=/" "$TMP_ENV"

# Native services on this host still reach the Dockerized Postgres/Redis
# containers through localhost port publishing, not via Docker DNS names.
sed -i \
  -e 's#@db:5432/#@127.0.0.1:5434/#g' \
  -e 's#redis://redis:6379/#redis://127.0.0.1:6379/#g' \
  "$TMP_ENV"

# Host-local secrets the read-only Doppler service token cannot store
# (e.g. MASTER_KEYSTORE_PASSWORD). Kept root-only at /root/.webtoapp-local.env;
# appended after the Doppler download so deploys never wipe them
# (incident 2026-07-16: a deploy dropped the master keystore password and
# every paid-build payment verify 500'd).
LOCAL_ENV=/root/.webtoapp-local.env
if [ -s "$LOCAL_ENV" ]; then
  { echo ""; cat "$LOCAL_ENV"; } >> "$TMP_ENV"
fi

install -m 600 "$TMP_ENV" "$RUNTIME_ENV"
install -m 600 "$TMP_ENV" "$BACKEND_RUNTIME_ENV"
install -m 600 "$TMP_ENV" "$BACKEND_NATIVE_ENV"

echo "[3/6] Preparing backend environment..."
BACKEND_PYTHON="$BACKEND_DIR/venv/bin/python"
if [ ! -x "$BACKEND_PYTHON" ]; then
  python3 -m venv "$BACKEND_DIR/venv"
fi

# Alembic only needs the database URLs from the native runtime env.
export DATABASE_URL="$(grep '^DATABASE_URL=' "$BACKEND_NATIVE_ENV" | cut -d= -f2-)"
export DATABASE_URL_SYNC="$(grep '^DATABASE_URL_SYNC=' "$BACKEND_NATIVE_ENV" | cut -d= -f2-)"

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
  VITE_ASK_AI_ENABLED=true BUILD_VERSION="$BUILD_VERSION" npm run build
)

echo "[4b/6] Preserving previous hashed assets..."
# Every build replaces dist/ and PURGES the old hashed css/js. Two victims:
# (1) a user who loaded index.html seconds before the deploy fetches a css
#     that no longer exists -> unstyled page; (2) Microsoft Clarity replays
#     fetch the recorded asset URLs, so every pre-deploy session replays
#     blank (t91, 2026-07-26). Keep the last 30 days of hashed assets around.
ASSET_KEEP="/opt/webtoapp/frontend/dist-asset-archive"
mkdir -p "$ASSET_KEEP"
cp -n "$FRONTEND_DIR/dist/assets/"* "$ASSET_KEEP/" 2>/dev/null || true
find "$ASSET_KEEP" -type f -mtime +30 -delete
cp -n "$ASSET_KEEP/"* "$FRONTEND_DIR/dist/assets/" 2>/dev/null || true

python3 - <<PY
from pathlib import Path
import re

version = "${BUILD_VERSION}"
root = Path("/opt/webtoapp/frontend/dist")
# Only version-stamp STATIC ASSET references (js/css/images/fonts). The old
# pattern matched every root-relative src/href, which appended ?v=<hash> to
# internal PAGE links (<a href="/blog/...">) in the prerendered HTML — crawlers
# then indexed ?v= duplicates of every page and split citation signals (t147).
pattern = re.compile(r'(?P<attr>\b(?:src|href))=(?P<q>["\'])/(?P<path>(?!/)[^"\']+?\.(?:js|mjs|css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf))(?:\?v=[^"\']*)?(?P=q)')

for html in root.rglob("*.html"):
    text = html.read_text()
    updated = pattern.sub(lambda m: f'{m.group("attr")}={m.group("q")}/{m.group("path")}?v={version}{m.group("q")}', text)
    if updated != text:
        html.write_text(updated)
PY

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
