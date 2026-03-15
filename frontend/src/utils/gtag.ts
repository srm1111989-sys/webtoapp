// Google Ads conversion tracking utility
// Google Ads ID: AW-949605203
//
// HOW TO SET UP:
// 1. Go to Google Ads > Tools > Conversions > + New conversion action > Website
// 2. Create 3 conversions: Purchase, Registration, Free App Build
// 3. Copy each conversion label (format: AW-949605203/xxxxxx)
// 4. Replace the labels below
// 5. Deploy

const CONVERSION_LABELS = {
  purchase: 'AW-949605203/PURCHASE_LABEL',       // Replace after creating in Google Ads
  registration: 'AW-949605203/REGISTRATION_LABEL', // Replace after creating in Google Ads
  freeAppBuild: 'AW-949605203/FREE_BUILD_LABEL',   // Replace after creating in Google Ads
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

function gtag(...args: any[]) {
  if (typeof window.gtag === 'function') {
    window.gtag(...args)
  }
}

// Track paid purchase (Rs.2,499 / $29.99)
export function trackPurchase(value: number, currency: string, transactionId: string) {
  // Google Ads conversion
  gtag('event', 'conversion', {
    send_to: CONVERSION_LABELS.purchase,
    value,
    currency: currency.toUpperCase(),
    transaction_id: transactionId,
  })

  // GA4 purchase event
  gtag('event', 'purchase', {
    value,
    currency: currency.toUpperCase(),
    transaction_id: transactionId,
  })
}

// Track email registration
export function trackRegistration() {
  gtag('event', 'conversion', {
    send_to: CONVERSION_LABELS.registration,
  })

  gtag('event', 'sign_up', {
    method: 'email',
  })
}

// Track Google OAuth registration
export function trackGoogleSignUp() {
  gtag('event', 'conversion', {
    send_to: CONVERSION_LABELS.registration,
  })

  gtag('event', 'sign_up', {
    method: 'google',
  })
}

// Track free plan app build (micro-conversion)
export function trackFreeAppBuild(appName: string) {
  gtag('event', 'conversion', {
    send_to: CONVERSION_LABELS.freeAppBuild,
  })

  gtag('event', 'generate_lead', {
    value: 500,
    currency: 'INR',
    event_label: appName,
  })
}

// Track begin checkout (pre-payment)
export function trackBeginCheckout(value: number, currency: string) {
  gtag('event', 'begin_checkout', {
    value,
    currency: currency.toUpperCase(),
  })
}

// Track app creation step
export function trackAppCreated(appName: string, platform: string) {
  gtag('event', 'add_to_cart', {
    value: 0,
    currency: 'INR',
    items: [{
      item_name: appName,
      item_category: platform,
    }],
  })
}

// Track pricing page view
export function trackViewPricing() {
  gtag('event', 'view_item_list', {
    item_list_name: 'pricing_plans',
  })
}
