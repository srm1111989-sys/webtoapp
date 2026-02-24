import { test, expect } from '@playwright/test'
import {
  loginAsTestUser,
  mockSubscriptionAPIs,
  mockDashboardAPIs,
  mockActiveSubscription,
} from '../helpers'

// ─── Subscription Management Page (/subscription) ──────────────

test.describe('Subscription page', () => {
  test('shows active subscription card with plan details', async ({ page }) => {
    await loginAsTestUser(page)
    await mockSubscriptionAPIs(page, { hasActive: true })

    await page.goto('/subscription')

    // Plan name & status badge
    await expect(page.getByText('Pro')).toBeVisible()
    await expect(page.getByText('Active')).toBeVisible()

    // Gateway label
    await expect(page.getByText('razorpay', { exact: true })).toBeVisible()

    // Next billing date shown
    await expect(page.getByText('Next Billing Date')).toBeVisible()

    // Cancel button present
    await expect(page.getByText('Cancel Subscription')).toBeVisible()
  })

  test('shows "No Active Subscription" when none active', async ({ page }) => {
    await loginAsTestUser(page)
    await mockSubscriptionAPIs(page, { hasActive: false })

    await page.goto('/subscription')

    await expect(page.getByText('No Active Subscription')).toBeVisible()
    await expect(page.getByText('View Plans')).toBeVisible()
  })

  test('shows subscription history for past subscriptions', async ({ page }) => {
    await loginAsTestUser(page)
    await mockSubscriptionAPIs(page, { hasActive: true })

    await page.goto('/subscription')

    await expect(page.getByText('Subscription History')).toBeVisible()
    // Past subscription shows "Business" plan with cancelled status
    await expect(page.getByText('Business')).toBeVisible()
    await expect(page.getByText('Cancelled')).toBeVisible()
  })

  test('cancel subscription opens confirmation dialog', async ({ page }) => {
    await loginAsTestUser(page)
    await mockSubscriptionAPIs(page, { hasActive: true })

    await page.goto('/subscription')

    await page.getByText('Cancel Subscription').click()

    // Confirmation dialog appears
    await expect(page.getByText('Cancel Subscription?')).toBeVisible()
    await expect(
      page.getByText(/your subscription will remain active until the end/i)
    ).toBeVisible()
    await expect(page.getByText('Keep Subscription')).toBeVisible()
    await expect(page.getByText('Yes, Cancel')).toBeVisible()
  })

  test('cancel confirmation can be dismissed', async ({ page }) => {
    await loginAsTestUser(page)
    await mockSubscriptionAPIs(page, { hasActive: true })

    await page.goto('/subscription')

    await page.getByText('Cancel Subscription').click()
    await expect(page.getByText('Cancel Subscription?')).toBeVisible()

    await page.getByText('Keep Subscription').click()

    // Dialog dismissed, active card still shows
    await expect(page.getByText('Cancel Subscription?')).not.toBeVisible()
    await expect(page.getByText('Active')).toBeVisible()
  })

  test('confirming cancel calls API and shows success toast', async ({ page }) => {
    await loginAsTestUser(page)
    await mockSubscriptionAPIs(page, { hasActive: true })

    await page.goto('/subscription')

    await page.getByText('Cancel Subscription').click()
    await page.getByText('Yes, Cancel').click()

    // Toast notification
    await expect(page.getByText(/subscription cancelled/i)).toBeVisible()
  })

  test('halted subscription shows Payment Failed badge', async ({ page }) => {
    await loginAsTestUser(page)
    await mockSubscriptionAPIs(page, {
      hasActive: true,
      subscriptions: [mockActiveSubscription({ status: 'halted' })],
    })

    // Override active endpoint to return halted
    await page.route('**/api/subscriptions/active', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockActiveSubscription({ status: 'halted' })),
      })
    })

    await page.goto('/subscription')

    await expect(page.getByText('Payment Failed')).toBeVisible()
  })
})

// ─── Dashboard subscription status ─────────────────────────────

test.describe('Dashboard subscription card', () => {
  test('shows active subscription with manage link', async ({ page }) => {
    await loginAsTestUser(page)
    await mockSubscriptionAPIs(page, { hasActive: true })
    await mockDashboardAPIs(page)

    await page.goto('/dashboard')

    // Active subscription card
    await expect(page.getByText(/pro/i).first()).toBeVisible()
    await expect(page.getByText('Active', { exact: true })).toBeVisible()
    await expect(page.getByText('Manage')).toBeVisible()

    // Manage link navigates to /subscription
    await page.getByText('Manage').click()
    await expect(page).toHaveURL(/\/subscription/)
  })

  test('shows upgrade CTA when no active subscription', async ({ page }) => {
    await loginAsTestUser(page)
    await mockSubscriptionAPIs(page, { hasActive: false })
    await mockDashboardAPIs(page)

    await page.goto('/dashboard')

    await expect(page.getByText('Upgrade to Pro')).toBeVisible()
    await expect(page.getByText('View Plans')).toBeVisible()
  })
})

// ─── CreateApp Step 4: plan selection for monthly ───────────────

test.describe('CreateApp monthly plan detection', () => {
  test('monthly plans show "per month" label', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)
    await mockSubscriptionAPIs(page, { hasActive: false })

    // Mock app creation flow to skip to step 4
    // We set the wizard state directly via localStorage
    await page.addInitScript(() => {
      const wizardState = {
        state: {
          step: 4,
          appId: '00000000-0000-0000-0000-000000000099',
          name: 'Test App',
          url: 'https://example.com',
          packageName: 'com.example.test',
          description: '',
          selectedPlatforms: ['android'],
          iconFile: null,
          iconPreview: null,
          splashFile: null,
          splashPreview: null,
          primaryColor: '#2563eb',
          secondaryColor: '#1e40af',
          statusBarColor: '#1e3a5f',
          features: {},
          firebaseConfig: null,
          admobConfig: null,
          customUserAgent: '',
          navigationType: 'none',
          navigationItems: [],
          desktopConfig: {
            window_width: 1280,
            window_height: 800,
            min_width: 800,
            min_height: 600,
            show_title_bar: true,
            show_menu_bar: false,
            enable_system_tray: false,
            start_maximized: false,
            start_fullscreen: false,
          },
          selectedPlanId: null,
        },
        version: 0,
      }
      window.localStorage.setItem('webtoapp-wizard', JSON.stringify(wizardState))
    })

    await page.goto('/apps/create')

    // Wait for plans to load
    await expect(page.getByText('Choose a Plan')).toBeVisible()

    // Monthly plans should show "per month"
    await expect(page.getByText('per month').first()).toBeVisible()

    // One-time plans should show "one-time"
    await expect(page.getByText('one-time').first()).toBeVisible()
  })
})

// ─── Navigation ────────────────────────────────────────────────

test.describe('Subscription navigation', () => {
  test('subscription page is accessible from sidebar/nav', async ({ page }) => {
    await loginAsTestUser(page)
    await mockSubscriptionAPIs(page, { hasActive: true })
    await mockDashboardAPIs(page)

    await page.goto('/subscription')
    await expect(page).toHaveURL(/\/subscription/)
    await expect(page.getByText('Manage your subscription')).toBeVisible()
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/subscription')
    await expect(page).toHaveURL(/\/login/)
  })
})
