#!/bin/bash
# Quick deployment script for blog/SEO content

set -e

echo "🚀 Deploying WebsiteToApp Blog System..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Run this from the webtoapp root directory"
    exit 1
fi

echo ""
echo "📋 Step 1: Installing backend dependencies..."
cd backend
pip install -r requirements.txt

echo ""
echo "📋 Step 2: Restarting backend service..."
cd ..

# Kill existing backend if running
pkill -f "uvicorn app.main:app" || true

# Start backend in background
cd backend
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "✅ Backend started (PID: $BACKEND_PID)"
echo "📝 Logs: tail -f logs/backend.log"

echo ""
echo "📋 Step 3: Testing API endpoints..."
sleep 3  # Give backend time to start

# Test blog API
if curl -s http://localhost:8000/api/blog/posts > /dev/null; then
    echo "✅ Blog API working"
else
    echo "❌ Blog API not responding"
    exit 1
fi

# Test sitemap
if curl -s http://localhost:8000/sitemap.xml > /dev/null; then
    echo "✅ Sitemap working"
else
    echo "❌ Sitemap not responding"
    exit 1
fi

echo ""
echo "📋 Step 4: Checking published content..."
PUBLISHED_COUNT=$(curl -s http://localhost:8000/api/blog/schedule | grep -o '"published":[0-9]*' | grep -o '[0-9]*' || echo "0")
UPCOMING_COUNT=$(curl -s http://localhost:8000/api/blog/schedule | grep -o '"upcoming":[0-9]*' | grep -o '[0-9]*' || echo "0")

echo "✅ Published posts: $PUBLISHED_COUNT"
echo "⏳ Upcoming posts: $UPCOMING_COUNT"

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📊 API Endpoints:"
echo "   - Blog posts: http://localhost:8000/api/blog/posts"
echo "   - Schedule: http://localhost:8000/api/blog/schedule"
echo "   - Sitemap: http://localhost:8000/sitemap.xml"
echo "   - Robots: http://localhost:8000/robots.txt"
echo ""
echo "🌐 Frontend: http://localhost:5173/blog"
echo ""
echo "📝 Logs:"
echo "   - Backend: tail -f logs/backend.log"
echo "   - Frontend: cd frontend && npm run dev"
echo ""
echo "⏹️  To stop backend: kill $BACKEND_PID"
echo ""
