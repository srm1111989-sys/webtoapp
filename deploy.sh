#!/bin/bash
set -e

SERVER_IP="157.90.228.171"
SERVER_USER="root"
REMOTE_DIR="/root/webtoapp"

echo "Deploying WebToApp to production server..."

echo "[1/5] Checking dependencies..."
grep -q "razorpay==1.4.2" backend/requirements.txt || echo "razorpay==1.4.2" >> backend/requirements.txt

echo "[2/5] Syncing files to server..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude 'venv' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude '.git' \
  --exclude 'claude_session1' \
  --exclude 'frontend/test-results' \
  --exclude 'frontend/.vite' \
  --exclude 'frontend/dist' \
  --exclude 'backend/*.db' \
  --exclude 'backend/logs' \
  --exclude 'celerybeat-schedule' \
  ./ ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/

echo "[3/5] Building and deploying on server..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /root/webtoapp

if [ -d .git ]; then
  git pull || true
fi

echo "Building containers..."
docker-compose build --no-cache backend
docker-compose up -d

echo "Waiting for services..."
sleep 10

echo "Container status:"
docker-compose ps
ENDSSH

echo "[4/5] Cleaning up Docker on server..."
ssh ${SERVER_USER}@${SERVER_IP} "docker image prune -f && docker builder prune -f --keep-storage=1GB 2>/dev/null && docker volume prune -f 2>/dev/null" > /dev/null 2>&1

echo "[5/5] Disk usage:"
ssh ${SERVER_USER}@${SERVER_IP} "df -h / | tail -1"

echo ""
echo "Deployed! https://websitetoapp.app"
