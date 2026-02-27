# Payment Proxy Deployment Guide

## 🎯 What This Does

Creates a payment proxy on Vercel (`stark-enterprises-two.vercel.app`) to forward payments from `websitetoapp.app` to Razorpay.

**Flow**: websitetoapp.app → Vercel Proxy → Razorpay ✅

## 📋 Prerequisites

1. Vercel account with access to `stark-enterprises-two` project
2. Razorpay API keys (already configured)
3. Node.js 18+ installed
4. Vercel CLI installed

## 🚀 Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## 🔐 Step 2: Login to Vercel

```bash
vercel login
```

## 📦 Step 3: Deploy Payment Proxy

```bash
cd C:/Projects/Projects-2026/webtoapp/payment-proxy

# Install dependencies
npm install

# Link to existing Vercel project
vercel link

# When prompted:
# - Set up and deploy: Y
# - Which scope: Select your account
# - Link to existing project: Y
# - What's the name of your existing project: stark-enterprises-two
```

## ⚙️ Step 4: Set Environment Variables

```bash
# Live Keys
vercel env add RAZORPAY_KEY_ID production
# Enter: rzp_live_SJBT7Uhme061Lm

vercel env add RAZORPAY_KEY_SECRET production
# Enter: ZWo49BFmgaxdfG3kM2I9btl4

# Test Keys
vercel env add RAZORPAY_TEST_KEY_ID production
# Enter: rzp_test_SJBgkHSwwfVzCK

vercel env add RAZORPAY_TEST_KEY_SECRET production
# Enter: dFHjwxBMDceGPc7vsw8vKDgs
```

**Alternative**: Set via Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Select project: `stark-enterprises-two`
3. Go to **Settings** → **Environment Variables**
4. Add all 4 variables above

## 🌐 Step 5: Deploy to Production

```bash
vercel --prod
```

Wait for deployment to complete (~30 seconds).

## ✅ Step 6: Test the Proxy

### Test 1: Get Public Key
```bash
curl https://stark-enterprises-two.vercel.app/pay/api/razorpay/get-key?test_mode=true
```

Expected response:
```json
{
  "success": true,
  "key": "rzp_test_SJBgkHSwwfVzCK",
  "test_mode": true
}
```

### Test 2: Create Test Order
```bash
curl -X POST https://stark-enterprises-two.vercel.app/pay/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "INR",
    "test_mode": true
  }'
```

Expected response:
```json
{
  "success": true,
  "razorpay_order_id": "order_xxxxx",
  "razorpay_key_id": "rzp_test_xxx",
  "amount": 100,
  "currency": "INR"
}
```

## 🔧 Step 7: Update Frontend to Use Proxy

### Option A: Update CreateApp.tsx (Recommended)

Replace the Razorpay API calls in `frontend/src/pages/user/CreateApp.tsx`:

```typescript
// OLD (calls backend directly)
import { paymentsApi } from '@/api/orders'
const rpRes = await paymentsApi.createRazorpay(order.id)

// NEW (calls Vercel proxy)
import { createRazorpayOrder } from '@/api/razorpay-proxy'
const rpRes = await createRazorpayOrder({
  amount: order.amount,
  currency: order.currency,
  receipt: order.order_number,
  test_mode: paymentMode?.test_mode
})
```

### Option B: Update paymentsApi to Use Proxy

Modify `frontend/src/api/orders.ts` to route through proxy instead of backend.

## 🧪 Step 8: Test Payment Flow

1. Go to https://websitetoapp.app
2. Login as Swapnil Mokashi
3. Create a new app
4. Select a plan
5. Click "Create App & Pay"
6. **Payment should now work** ✅

## 📊 Monitoring

### View Logs
```bash
vercel logs stark-enterprises-two --prod
```

### Vercel Dashboard
https://vercel.com/dashboard → stark-enterprises-two → Logs

## 🛠️ Troubleshooting

### Payment still fails?

1. **Check environment variables are set**:
   ```bash
   vercel env ls
   ```

2. **Check CORS headers**:
   ```bash
   curl -I https://stark-enterprises-two.vercel.app/api/razorpay/get-key
   # Should see: Access-Control-Allow-Origin: https://websitetoapp.app
   ```

3. **Check Razorpay keys are correct**:
   ```bash
   # Test with curl (see Test 2 above)
   ```

4. **Check deployment status**:
   ```bash
   vercel ls
   ```

### Redeploy if needed
```bash
cd payment-proxy
vercel --prod --force
```

## 📱 Production URLs

**Base URL**: `https://stark-enterprises-two.vercel.app/pay`

- **Payment Proxy**: https://stark-enterprises-two.vercel.app/pay
- **Create Order**: https://stark-enterprises-two.vercel.app/pay/api/razorpay/create-order
- **Verify Payment**: https://stark-enterprises-two.vercel.app/pay/api/razorpay/verify-payment
- **Get Key**: https://stark-enterprises-two.vercel.app/pay/api/razorpay/get-key

**Note**: Using `/pay` path to avoid conflicts with main company site.

## 🔒 Security Notes

- ✅ CORS restricted to websitetoapp.app only
- ✅ Environment variables stored securely in Vercel
- ✅ HTTPS only (Vercel handles SSL)
- ✅ Signature verification for payments
- ✅ No secrets exposed to frontend

## 🎉 Success!

Once deployed, your payment flow will be:

```
User clicks "Pay" on websitetoapp.app
    ↓
Frontend calls stark-enterprises-two.vercel.app/pay/api/razorpay/create-order
    ↓
Vercel proxy calls Razorpay API (domain whitelisted ✅)
    ↓
Razorpay accepts and returns order
    ↓
User completes payment
    ↓
Frontend calls stark-enterprises-two.vercel.app/pay/api/razorpay/verify-payment
    ↓
Payment verified ✅
```

**No domain whitelist issues!** 🎊
