/**
 * Vercel Serverless Function: Get Razorpay Public Key
 * Endpoint: GET /api/razorpay/get-key?test_mode=true
 */

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { test_mode } = req.query;
    const isTestMode = test_mode === 'true' || test_mode === '1';

    // Select appropriate key based on mode
    const keyId = isTestMode
      ? process.env.RAZORPAY_TEST_KEY_ID
      : process.env.RAZORPAY_KEY_ID;

    if (!keyId) {
      return res.status(500).json({
        success: false,
        error: 'Razorpay key not configured',
      });
    }

    return res.status(200).json({
      success: true,
      key: keyId,
      test_mode: isTestMode,
    });

  } catch (error) {
    console.error('Get key error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Razorpay key',
    });
  }
};
