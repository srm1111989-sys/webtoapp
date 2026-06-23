#!/bin/bash
set -e
cd /opt/webtoapp

echo "=== WebToApp Deploy ==="

echo "[1/5] Pulling latest..."
git pull origin main

# Restore prod env from git copy — backend/.env.production is the committed source of truth.
if [ -f backend/.env.production ]; then
  cp backend/.env.production backend/.env
  cp backend/.env.production .env
  echo "  Restored backend/.env and .env from git (.env.production)"
fi

BUILD_VERSION=$(cat BUILD_VERSION 2>/dev/null | tr -d '[:space:]')
export BUILD_VERSION=${BUILD_VERSION:-$(date +%Y%m%d%H%M)}
echo "Build version: $BUILD_VERSION"

echo "[2/5] Building ALL services (no cache for code changes)..."
BUILD_VERSION=$BUILD_VERSION docker compose -f docker-compose.yml build backend frontend

echo "[3/5] Restarting services..."
docker compose -f docker-compose.yml up -d --force-recreate backend frontend

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
