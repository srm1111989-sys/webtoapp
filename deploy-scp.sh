#!/bin/bash
set -e

SERVER_IP="157.90.228.171"
SERVER_USER="root"
REMOTE_DIR="/root/webtoapp"

echo "Deploying WebToApp (scp method)..."

echo "[1/4] Creating archive..."
tar czf deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='venv' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.git' \
  --exclude='claude_session1' \
  --exclude='frontend/test-results' \
  --exclude='frontend/.vite' \
  --exclude='backend/*.db' \
  --exclude='backend/logs' \
  --exclude='celerybeat-schedule' \
  --exclude='deploy.tar.gz' \
  .

echo "[2/4] Uploading and deploying..."
scp deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /root/webtoapp
tar xzf deploy.tar.gz
rm deploy.tar.gz

docker-compose build --no-cache frontend backend
docker-compose up -d

sleep 15
docker-compose ps
ENDSSH

rm deploy.tar.gz

echo "[3/4] Cleaning up Docker..."
ssh ${SERVER_USER}@${SERVER_IP} "docker image prune -f && docker builder prune -f --keep-storage=1GB 2>/dev/null" > /dev/null 2>&1

echo "[4/4] Disk usage:"
ssh ${SERVER_USER}@${SERVER_IP} "df -h / | tail -1"

echo "Deployed! https://websitetoapp.app"
