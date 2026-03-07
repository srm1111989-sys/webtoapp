#!/bin/bash
set -e

SERVER_IP="157.90.228.171"
SERVER_USER="root"
REMOTE_DIR="/root/webtoapp"

echo "🚀 Creating deployment archive..."

# Create tar archive excluding unnecessary files
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

echo "📤 Uploading to server..."
scp deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/

echo "🔧 Deploying on server..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /root/webtoapp
echo "📦 Extracting files..."
tar xzf deploy.tar.gz
rm deploy.tar.gz

echo "⏹️  Stopping containers..."
docker-compose down || true

echo "🏗️  Building and starting containers..."
docker-compose build --no-cache frontend backend
docker-compose up -d

echo "⏳ Waiting for services..."
sleep 15

echo "📊 Container status:"
docker-compose ps

echo "✅ Deployment complete!"
ENDSSH

rm deploy.tar.gz
echo ""
echo "✅ Deployment completed successfully!"
echo "📍 Frontend: http://157.90.228.171:3000"
echo "📍 Backend: http://157.90.228.171:8000"
