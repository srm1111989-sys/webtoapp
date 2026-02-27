#!/bin/bash
# Deploy Payment Proxy to Vercel

set -e

echo "🚀 Deploying WebToApp Payment Proxy to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to production
echo "🌐 Deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Your payment proxy is now live at:"
echo "   https://stark-enterprises-two.vercel.app"
echo ""
echo "🔧 API Endpoints:"
echo "   POST /api/razorpay/create-order"
echo "   POST /api/razorpay/verify-payment"
echo "   GET  /api/razorpay/get-key"
echo ""
echo "⚙️  Don't forget to set environment variables in Vercel Dashboard!"
echo "   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_TEST_KEY_ID, RAZORPAY_TEST_KEY_SECRET"
