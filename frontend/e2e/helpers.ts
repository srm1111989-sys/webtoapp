import { Page } from '@playwright/test'

/** Fake auth state to inject into localStorage so the app treats us as logged in. */
const AUTH_STATE = {
  state: {
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'test@example.com',
      full_name: 'Test User',
      is_active: true,
      is_verified: true,
      created_at: '2025-01-01T00:00:00Z',
    },
    accessToken: 'fake-access-token',
    refreshToken: 'fake-refresh-token',
    isAdmin: false,
  },
  version: 0,
}

/**
 * Set up a fake logged-in session by writing auth state to localStorage
 * before the app hydrates.
 */
export async function loginAsTestUser(page: Page) {
  await page.addInitScript((state) => {
    window.localStorage.setItem('webtoapp-auth', JSON.stringify(state))
  }, AUTH_STATE)
}

// ─── Mock data factories ────────────────────────────────

const USER_ID = '00000000-0000-0000-0000-000000000001'
const SUB_ID = '00000000-0000-0000-0000-000000000010'
const PLAN_ID = '00000000-0000-0000-0000-000000000020'

export function mockActiveSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: SUB_ID,
    user_id: USER_ID,
    plan_id: PLAN_ID,
    gateway: 'razorpay',
    gateway_subscription_id: 'sub_test123',
    status: 'active',
    current_period_start: '2026-02-01T00:00:00Z',
    current_period_end: '2026-03-03T00:00:00Z',
    cancelled_at: null,
    plan_name: 'Pro',
    created_at: '2026-02-01T00:00:00Z',
    ...overrides,
  }
}

export function mockSubscriptionList() {
  return [
    mockActiveSubscription(),
    {
      id: '00000000-0000-0000-0000-000000000011',
      user_id: USER_ID,
      plan_id: PLAN_ID,
      gateway: 'stripe',
      gateway_subscription_id: null,
      status: 'cancelled',
      current_period_start: '2025-12-01T00:00:00Z',
      current_period_end: '2025-12-31T00:00:00Z',
      cancelled_at: '2025-12-20T00:00:00Z',
      plan_name: 'Business',
      created_at: '2025-12-01T00:00:00Z',
    },
  ]
}

export function mockPlans() {
  return [
    {
      id: '00000000-0000-0000-0000-000000000030',
      name: 'Free',
      slug: 'free',
      description: 'Basic app with branding',
      price_inr: 0,
      price_usd: 0,
      billing_type: 'one_time',
      features: {},
      max_apps: 1,
      is_active: true,
      sort_order: 0,
    },
    {
      id: PLAN_ID,
      name: 'Pro',
      slug: 'pro',
      description: 'Monthly plan with all features',
      price_inr: 99900,
      price_usd: 999,
      billing_type: 'monthly',
      features: { push_notifications: true, admob: true, deep_linking: true },
      max_apps: 5,
      is_active: true,
      sort_order: 1,
    },
    {
      id: '00000000-0000-0000-0000-000000000021',
      name: 'Business',
      slug: 'business',
      description: 'Monthly plan with premium features',
      price_inr: 199900,
      price_usd: 1999,
      billing_type: 'monthly',
      features: { push_notifications: true, admob: true, deep_linking: true, biometric_auth: true, offline_mode: true },
      max_apps: 20,
      is_active: true,
      sort_order: 2,
    },
    {
      id: '00000000-0000-0000-0000-000000000022',
      name: 'Starter',
      slug: 'starter',
      description: 'One-time purchase',
      price_inr: 49900,
      price_usd: 499,
      billing_type: 'one_time',
      features: { push_notifications: true },
      max_apps: 1,
      is_active: true,
      sort_order: 3,
    },
  ]
}

export function mockPaymentMode() {
  return {
    test_mode: true,
    environment: 'test',
    gateways: { razorpay: true, stripe: true },
  }
}

export function mockSubscriptionDetail() {
  return {
    ...mockActiveSubscription(),
    payments: [
      {
        id: '00000000-0000-0000-0000-000000000040',
        gateway_payment_id: 'pay_test1',
        amount: 99900,
        currency: 'INR',
        status: 'success',
        paid_at: '2026-02-01T00:00:00Z',
        created_at: '2026-02-01T00:00:00Z',
      },
    ],
  }
}

/**
 * Set up API route mocking for subscription-related endpoints.
 * Call this after loginAsTestUser to intercept API calls.
 */
export async function mockSubscriptionAPIs(
  page: Page,
  opts: {
    hasActive?: boolean
    subscriptions?: unknown[]
  } = {},
) {
  const { hasActive = true, subscriptions } = opts

  const activeSub = hasActive ? mockActiveSubscription() : null
  const allSubs = subscriptions ?? mockSubscriptionList()

  await page.route('**/api/subscriptions/active', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(activeSub) })
  })

  await page.route('**/api/subscriptions/', (route, request) => {
    if (request.method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(allSubs) })
    } else if (request.method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          subscription_id: SUB_ID,
          gateway_subscription_id: 'sub_test_new',
          razorpay_key_id: 'rzp_test_key',
        }),
      })
    } else {
      route.continue()
    }
  })

  // Subscription detail
  await page.route('**/api/subscriptions/*/cancel', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockActiveSubscription({ status: 'cancelled', cancelled_at: new Date().toISOString() })),
    })
  })
}

// ─── Order / Build mock data ────────────────────────────

const ORDER_ID = '00000000-0000-0000-0000-000000000050'
const APP_CONFIG_ID = '00000000-0000-0000-0000-000000000060'
const BUILD_ID = '00000000-0000-0000-0000-000000000070'

export function mockOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_ID,
    user_id: USER_ID,
    app_config_id: APP_CONFIG_ID,
    plan_id: PLAN_ID,
    order_number: 'WTA-TEST1234',
    amount: 49900,
    currency: 'INR',
    status: 'paid',
    payment_gateway: 'razorpay',
    gateway_order_id: 'order_test1',
    plan_name: 'Pro',
    app_name: 'My Desktop App',
    selected_platforms: ['desktop'],
    created_at: '2026-02-20T00:00:00Z',
    updated_at: '2026-02-20T00:00:00Z',
    builds: [],
    ...overrides,
  }
}

export function mockBuild(overrides: Record<string, unknown> = {}) {
  return {
    id: BUILD_ID,
    order_id: ORDER_ID,
    pipeline_id: 12345,
    status: 'building',
    platform: 'desktop',
    build_type: 'release',
    apk_url: null,
    aab_url: null,
    exe_url: null,
    source_url: null,
    error_message: null,
    started_at: '2026-02-20T00:01:00Z',
    completed_at: null,
    created_at: '2026-02-20T00:00:30Z',
    ...overrides,
  }
}

/**
 * Set up API route mocking for order detail + build endpoints.
 */
export async function mockOrderAPIs(
  page: Page,
  opts: {
    order?: Record<string, unknown>
    builds?: unknown[]
    triggerResponse?: Record<string, unknown>
  } = {},
) {
  const order = { ...mockOrder(), ...opts.order }
  const builds = opts.builds ?? []

  // GET /api/orders/:id
  await page.route(`**/api/orders/${order.id}`, (route, request) => {
    if (request.method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...order, builds }),
      })
    } else {
      route.continue()
    }
  })

  // GET /api/builds/order/:id
  await page.route(`**/api/builds/order/${order.id}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(builds),
    })
  })

  // POST /api/builds/trigger/:id
  await page.route(`**/api/builds/trigger/${order.id}**`, (route, request) => {
    if (request.method() === 'POST') {
      const newBuild = opts.triggerResponse ?? mockBuild()
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newBuild),
      })
    } else {
      route.continue()
    }
  })
}

/**
 * Mock the dashboard/shared APIs: orders, apps, payment mode.
 */
export async function mockDashboardAPIs(page: Page) {
  await page.route('**/api/orders/*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ orders: [], total: 0, page: 1, per_page: 20 }),
    })
  })

  await page.route('**/api/apps/*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ apps: [], total: 0 }),
    })
  })

  await page.route('**/api/payments/mode', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPaymentMode()),
    })
  })

  await page.route('**/api/plans/', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPlans()),
    })
  })
}
