/**
 * Vercel Serverless Function: Create Razorpay Order
 * Endpoint: POST /api/razorpay/create-order
 */

const Razorpay = require('razorpay');
const RAZORPAY_PRODUCT_KEY = 'webtoapp';

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, receipt, notes, test_mode } = req.body;

    // Validate required fields
    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        error: 'Amount and currency are required'
      });
    }

    // Select appropriate keys based on test_mode
    const keyId = test_mode
      ? process.env.RAZORPAY_TEST_KEY_ID
      : process.env.RAZORPAY_KEY_ID;

    const keySecret = test_mode
      ? process.env.RAZORPAY_TEST_KEY_SECRET
      : process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({
        success: false,
        error: 'Razorpay credentials not configured'
      });
    }

    // Initialize Razorpay client
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Create order
    const order = await razorpay.orders.create({
      amount: amount, // Amount in smallest currency unit (paise for INR)
      currency: currency,
      receipt: receipt || `order_${Date.now()}`,
      notes: {
        ...(notes || {}),
        product: (notes && notes.product) || RAZORPAY_PRODUCT_KEY,
      },
    });

    // Return success response
    return res.status(200).json({
      success: true,
      razorpay_order_id: order.id,
      razorpay_key_id: keyId,
      amount: order.amount,
      currency: order.currency,
      order: order,
    });

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Razorpay order',
    });
  }
};
