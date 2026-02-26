#!/bin/bash
set -e

# Production server details
SERVER_IP="157.90.228.171"
SERVER_USER="root"
REMOTE_DIR="/root/webtoapp"

echo "🚀 Deploying WebToApp to production server..."

# Update backend requirements to ensure razorpay is listed
echo "📦 Checking dependencies..."
grep -q "razorpay==1.4.2" backend/requirements.txt || echo "razorpay==1.4.2" >> backend/requirements.txt

# Create deployment package (exclude unnecessary files)
echo "📦 Creating deployment package..."
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

# Deploy on server
echo "🔧 Deploying on server..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /root/webtoapp

# Pull latest changes if git repo exists
if [ -d .git ]; then
  git pull || true
fi

# Stop containers
echo "⏹️  Stopping containers..."
docker-compose down || true

# Update .env if needed
echo "🔑 Updating environment variables..."

# Build and start containers
echo "🏗️  Building and starting containers..."
docker-compose build --no-cache backend
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check container status
echo "📊 Container status:"
docker-compose ps

# Show backend logs
echo "📋 Recent backend logs:"
docker-compose logs --tail=50 backend

echo "✅ Deployment complete!"
echo "🌐 Your application should be available at: http://157.90.228.171:3000"
echo "🔧 API endpoint: http://157.90.228.171:8000"
ENDSSH

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📍 Production URLs:"
echo "   Frontend: http://157.90.228.171:3000"
echo "   Backend API: http://157.90.228.171:8000"
echo "   API Docs: http://157.90.228.171:8000/docs"
echo ""
echo "💡 To check logs:"
echo "   ssh root@157.90.228.171 'cd /root/webtoapp && docker-compose logs -f backend'"
