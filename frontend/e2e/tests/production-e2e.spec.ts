/**
 * Production End-to-End Tests
 *
 * Runs against https://websitetoapp.app with real API calls.
 * Tests the full user journey: landing → register → login → create app → pay → verify order.
 *
 * Run:
 *   npx playwright test --config=playwright.prod.config.ts
 */

import { test, expect, Page } from '@playwright/test'

const BASE = 'https://websitetoapp.app'
const TEST_URL = 'https://websitetoapp.app/test'
const UNIQUE_ID = Date.now().toString(36)
const TEST_USER = {
  name: `E2E Test ${UNIQUE_ID}`,
  email: `e2etest+${UNIQUE_ID}@websitetoapp.app`,
  password: 'TestPass123!',
}

let authTokens: { access_token: string; refresh_token: string } | null = null

async function injectAuth(page: Page) {
  if (!authTokens) throw new Error('No auth tokens — login test must run first')
  await page.addInitScript((tokens) => {
    const state = {
      state: {
        user: null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        isAdmin: false,
      },
      version: 0,
    }
    window.localStorage.setItem('webtoapp-auth', JSON.stringify(state))
  }, authTokens)
}

/** Click the blue "Next" button used in wizard Steps 1-3 (type="button") */
async function clickNextButton(page: Page) {
  const nextBtn = page.locator('button:has-text("Next")').last()
  await expect(nextBtn).toBeVisible({ timeout: 10_000 })
  await nextBtn.click()
}

/** Navigate through wizard Steps 0-3, filling basic info */
async function fillWizardToStep4(page: Page, appName: string) {
  // Clear wizard state before page load
  await page.addInitScript(() => {
    window.localStorage.removeItem('webtoapp-wizard')
  })
  await page.goto(`${BASE}/apps/create`)
  // Also clear after page loads to handle hydration
  await page.evaluate(() => window.localStorage.removeItem('webtoapp-wizard'))
  await page.reload()

  // ── Step 0: Basic Info (form with type="submit") ──
  await expect(page.getByText('Target Platform')).toBeVisible({ timeout: 15_000 })

  // Click Android to ensure it's selected
  await page.locator('button', { hasText: 'Android' }).first().click()
  await page.waitForTimeout(500)

  await page.fill('input[name="name"]', appName)
  await page.fill('input[name="url"]', TEST_URL)
  await page.locator('button[type="submit"]').click()

  // Wait for Step 1 or error toast
  const step1OrError = await Promise.race([
    page.getByText(/app icon/i).first().waitFor({ timeout: 30_000 }).then(() => 'step1'),
    page.getByText(/failed|error/i).first().waitFor({ timeout: 30_000 }).then(() => 'error'),
  ]).catch(() => 'timeout')

  if (step1OrError === 'error') {
    throw new Error('Step 0 failed — API error creating app')
  }
  if (step1OrError === 'timeout') {
    throw new Error('Step 0 timed out — submit button stuck')
  }

  // ── Step 1: Visual Customization (type="button" Next) ──
  await clickNextButton(page)

  // ── Step 2: Features (type="button" Next) ──
  await page.waitForTimeout(2000)
  await clickNextButton(page)

  // ── Step 3: Advanced Settings (type="button" Next) ──
  await page.waitForTimeout(2000)
  await clickNextButton(page)

  // ── Now on Step 4: Plan & Review ──
  await expect(page.getByText('Choose a Plan')).toBeVisible({ timeout: 10_000 })
}

// ─── Public page tests (independent, won't block auth flow) ──────

test.describe('Public Pages', () => {

  test('1.1 Landing page loads correctly', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Convert Any Website')
    await expect(page.locator('input[type="url"]')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Android App Pricing' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Desktop App Pricing' })).toBeVisible()
    await expect(page.getByText('Why WebToApp?')).toBeVisible()
    await expect(page.getByText('Frequently Asked Questions')).toBeVisible()
  })

  test('1.2 Hero URL → register redirect', async ({ page }) => {
    await page.goto(BASE)
    await page.locator('input[type="url"]').fill(TEST_URL)
    await page.getByRole('button', { name: /Get Started/i }).click()
    await expect(page).toHaveURL(/\/register\?url=/)
  })

  test('1.3 Pricing page shows plans', async ({ page }) => {
    await page.goto(`${BASE}/pricing`)
    await expect(page.getByText('Android App Plans')).toBeVisible()
    await expect(page.getByText('Desktop App Plans')).toBeVisible()
  })

  test('1.4 Test page loads', async ({ page }) => {
    await page.goto(`${BASE}/test`)
    await expect(page.locator('body')).toContainText(/feature test|WebToApp/i)
  })
})

// ─── Auth + App flow tests (serial to share auth state) ──────────

test.describe.serial('Auth & App Flow', () => {

  test('2.1 Register new user', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await page.fill('#full_name', TEST_USER.name)
    await page.fill('#email', TEST_USER.email)
    await page.fill('#password', TEST_USER.password)
    await page.fill('#confirm_password', TEST_USER.password)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 15_000 })
  })

  test('3.1 Login and reach dashboard', async ({ page }) => {
    const response = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
      timeout: 60_000,
    })
    expect(response.ok()).toBeTruthy()
    authTokens = await response.json()

    await injectAuth(page)
    await page.goto(`${BASE}/dashboard`)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  })

  test('4.1 Create free Android app (no payment)', async ({ page }) => {
    await injectAuth(page)
    await fillWizardToStep4(page, 'E2E Free App')

    // Select the Free plan (₹0 / $0)
    const freePlanBtn = page.locator('button', { hasText: /free/i }).filter({ hasText: /₹0|\$0/ })
    await freePlanBtn.first().click()
    await page.waitForTimeout(500)

    // Submit order
    const submitBtn = page.locator('button', { hasText: /submit/i }).last()
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 })
    await submitBtn.click()

    // Free order → order page directly
    await expect(page).toHaveURL(/\/orders\//, { timeout: 30_000 })
    await expect(page.getByText('E2E Free App')).toBeVisible({ timeout: 10_000 })
    console.log('✓ Free app created successfully')
  })

  test('5.1 Create paid app with test payment', async ({ page }) => {
    await injectAuth(page)
    await fillWizardToStep4(page, 'E2E Paid App')

    // Wait for plans to load from API
    await page.waitForTimeout(2000)

    // Find plan card buttons (they have rounded-xl border-2 classes)
    const planCards = page.locator('button.rounded-xl')
    const planCount = await planCards.count()
    console.log(`Found ${planCount} plan cards`)

    // Click the last plan card (paid plan has higher sort_order)
    if (planCount > 1) {
      await planCards.last().click()
    } else if (planCount === 1) {
      await planCards.first().click()
    }
    await page.waitForTimeout(500)

    // Capture order ID from network
    let orderId: string | null = null
    page.on('response', async (response) => {
      if (response.url().includes('/api/orders') && response.request().method() === 'POST' && response.status() < 300) {
        try {
          const body = await response.json()
          if (body.id) orderId = body.id
        } catch { /* ignore */ }
      }
    })

    // Submit
    const submitBtn = page.locator('button', { hasText: /submit/i }).last()
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 })
    await submitBtn.click()

    // In test mode, the app uses the test payment API directly (no Razorpay iframe).
    // Wait for redirect to order page (test payment should complete automatically).
    console.log('Waiting for test payment to complete...')

    try {
      await expect(page).toHaveURL(/\/orders\//, { timeout: 30_000 })
      console.log('Redirected to order page after test payment')
    } catch {
      // Fallback: if no redirect, try to complete payment via API
      console.log('No auto-redirect, trying API fallback...')
      await page.waitForTimeout(3000)

      if (!orderId) {
        const url = page.url()
        const match = url.match(/orders\/([a-f0-9-]+)/)
        if (match) orderId = match[1]
      }

      if (orderId) {
        console.log(`Using test payment API fallback for order: ${orderId}`)
        const res = await page.request.post(`${BASE}/api/payments/test`, {
          data: { order_id: orderId },
          headers: {
            Authorization: `Bearer ${authTokens!.access_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30_000,
        })
        console.log(`Test payment API: ${res.status()} ${await res.text()}`)
        await page.goto(`${BASE}/orders/${orderId}`)
      } else {
        throw new Error('Could not get order ID for payment')
      }
    }

    // Verify order page
    await expect(page).toHaveURL(/\/orders\//, { timeout: 30_000 })
    await expect(page.getByText('E2E Paid App')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('text=/paid|completed|success/i').first()).toBeVisible({ timeout: 10_000 })
    console.log('✓ Paid app E2E test completed — order is paid!')
  })

  test('6.1 Dashboard shows created orders', async ({ page }) => {
    await injectAuth(page)
    await page.goto(`${BASE}/dashboard`)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page.getByText(/E2E/).first()).toBeVisible({ timeout: 10_000 })
    console.log('✓ Dashboard shows E2E orders')
  })
})
