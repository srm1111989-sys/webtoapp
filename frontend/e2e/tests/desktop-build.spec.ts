import { test, expect } from '@playwright/test'
import {
  loginAsTestUser,
  mockDashboardAPIs,
  mockOrderAPIs,
  mockOrder,
  mockBuild,
} from '../helpers'

const ORDER_ID = '00000000-0000-0000-0000-000000000050'

// ─── Platform-specific build buttons ────────────────────────────

test.describe('Order detail - platform build buttons', () => {
  test('desktop-only order shows only Build Windows button', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)
    await mockOrderAPIs(page, {
      order: { selected_platforms: ['desktop'] },
    })

    await page.goto(`/orders/${ORDER_ID}`)

    await expect(page.getByText('Build Windows')).toBeVisible()
    await expect(page.getByText('Build Android')).not.toBeVisible()
  })

  test('android-only order shows only Build Android button', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)
    await mockOrderAPIs(page, {
      order: { selected_platforms: ['android'] },
    })

    await page.goto(`/orders/${ORDER_ID}`)

    await expect(page.getByText('Build Android')).toBeVisible()
    await expect(page.getByText('Build Windows')).not.toBeVisible()
  })

  test('dual-platform order shows both build buttons', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)
    await mockOrderAPIs(page, {
      order: { selected_platforms: ['android', 'desktop'] },
    })

    await page.goto(`/orders/${ORDER_ID}`)

    await expect(page.getByText('Build Android')).toBeVisible()
    await expect(page.getByText('Build Windows')).toBeVisible()
  })

  test('order with no selected_platforms defaults to android only', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)
    await mockOrderAPIs(page, {
      order: { selected_platforms: undefined },
    })

    await page.goto(`/orders/${ORDER_ID}`)

    await expect(page.getByText('Build Android')).toBeVisible()
    await expect(page.getByText('Build Windows')).not.toBeVisible()
  })
})

// ─── Desktop build trigger ──────────────────────────────────────

test.describe('Desktop build trigger', () => {
  test('clicking Build Windows triggers desktop build', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)

    const desktopBuild = mockBuild({ status: 'building', platform: 'desktop' })
    const order = { ...mockOrder(), selected_platforms: ['desktop'] }

    // Use a counter so first builds fetch returns empty (button enabled),
    // and subsequent fetches (after trigger) return the building build.
    let buildsFetchCount = 0

    await page.route(`**/api/orders/${ORDER_ID}`, (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...order, builds: [] }),
        })
      } else {
        route.continue()
      }
    })

    await page.route(`**/api/builds/order/${ORDER_ID}`, (route) => {
      buildsFetchCount++
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildsFetchCount > 1 ? [desktopBuild] : []),
      })
    })

    await page.route(`**/api/builds/trigger/${ORDER_ID}**`, (route, request) => {
      if (request.method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(desktopBuild),
        })
      } else {
        route.continue()
      }
    })

    await page.goto(`/orders/${ORDER_ID}`)

    // Button should be enabled (no builds yet)
    const buildBtn = page.getByRole('button', { name: 'Build Windows' })
    await expect(buildBtn).toBeEnabled()

    // Click Build Windows
    await buildBtn.click()

    // After trigger succeeds, React Query refetches and shows the building build
    await expect(page.locator('.rounded-full').getByText('building')).toBeVisible()
    await expect(page.locator('.rounded-full').getByText('Windows')).toBeVisible()
    await expect(page.getByText('Building...')).toBeVisible()
  })
})

// ─── Desktop build states ───────────────────────────────────────

test.describe('Desktop build status display', () => {
  test('successful desktop build shows Download .exe button', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)

    const successBuild = mockBuild({
      status: 'success',
      platform: 'desktop',
      exe_url: 'https://example.com/app.exe',
      completed_at: '2026-02-20T00:10:00Z',
    })

    await mockOrderAPIs(page, {
      order: { selected_platforms: ['desktop'] },
      builds: [successBuild],
    })

    await page.goto(`/orders/${ORDER_ID}`)

    // Build card shows success status and Windows platform badge
    await expect(page.locator('.rounded-full').getByText('success')).toBeVisible()
    await expect(page.locator('.rounded-full').getByText('Windows')).toBeVisible()

    // Download .exe button is present
    const exeLink = page.getByRole('link', { name: 'Download .exe' })
    await expect(exeLink).toBeVisible()
    await expect(exeLink).toHaveAttribute('href', 'https://example.com/app.exe')
  })

  test('failed desktop build shows error message', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)

    const failedBuild = mockBuild({
      status: 'failed',
      platform: 'desktop',
      error_message: 'Electron packaging failed: missing icon.ico',
      completed_at: '2026-02-20T00:05:00Z',
    })

    await mockOrderAPIs(page, {
      order: { selected_platforms: ['desktop'] },
      builds: [failedBuild],
    })

    await page.goto(`/orders/${ORDER_ID}`)

    // Build card shows failed status and Windows platform badge
    await expect(page.locator('.rounded-full').getByText('failed')).toBeVisible()
    await expect(page.locator('.rounded-full').getByText('Windows')).toBeVisible()

    // Error message
    await expect(page.getByText('Build failed')).toBeVisible()
    await expect(
      page.getByText('Electron packaging failed: missing icon.ico')
    ).toBeVisible()
  })

  test('pending desktop build shows pending badge', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)

    const pendingBuild = mockBuild({
      status: 'pending',
      platform: 'desktop',
    })

    await mockOrderAPIs(page, {
      order: { selected_platforms: ['desktop'] },
      builds: [pendingBuild],
    })

    await page.goto(`/orders/${ORDER_ID}`)

    await expect(page.locator('.rounded-full').getByText('pending')).toBeVisible()
    await expect(page.locator('.rounded-full').getByText('Windows')).toBeVisible()
  })
})

// ─── No builds message ─────────────────────────────────────────

test.describe('No builds message', () => {
  test('desktop-only order shows Windows EXE in hint text', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)
    await mockOrderAPIs(page, {
      order: { selected_platforms: ['desktop'] },
      builds: [],
    })

    await page.goto(`/orders/${ORDER_ID}`)

    await expect(page.getByText('No builds yet.')).toBeVisible()
    await expect(page.getByText(/Windows EXE/)).toBeVisible()
  })

  test('dual-platform order shows APK, AAB, and EXE in hint text', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)
    await mockOrderAPIs(page, {
      order: { selected_platforms: ['android', 'desktop'] },
      builds: [],
    })

    await page.goto(`/orders/${ORDER_ID}`)

    await expect(page.getByText('No builds yet.')).toBeVisible()
    await expect(page.getByText(/APK, AAB, and EXE/)).toBeVisible()
  })

  test('android-only order shows APK and AAB in hint text', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)
    await mockOrderAPIs(page, {
      order: { selected_platforms: ['android'] },
      builds: [],
    })

    await page.goto(`/orders/${ORDER_ID}`)

    await expect(page.getByText('No builds yet.')).toBeVisible()
    await expect(page.getByText(/APK and AAB/)).toBeVisible()
  })
})

// ─── Build button disabled states ───────────────────────────────

test.describe('Build button disabled states', () => {
  test('Build Windows disabled while a build is in progress', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)

    const activeBuild = mockBuild({ status: 'building', platform: 'desktop' })
    await mockOrderAPIs(page, {
      order: { selected_platforms: ['desktop'] },
      builds: [activeBuild],
    })

    await page.goto(`/orders/${ORDER_ID}`)

    const buildBtn = page.getByRole('button', { name: 'Build Windows' })
    await expect(buildBtn).toBeDisabled()
  })

  test('Build Windows enabled after build completes', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)

    const completedBuild = mockBuild({
      status: 'success',
      platform: 'desktop',
      exe_url: 'https://example.com/app.exe',
      completed_at: '2026-02-20T00:10:00Z',
    })
    await mockOrderAPIs(page, {
      order: { selected_platforms: ['desktop'] },
      builds: [completedBuild],
    })

    await page.goto(`/orders/${ORDER_ID}`)

    const buildBtn = page.getByRole('button', { name: 'Build Windows' })
    await expect(buildBtn).toBeEnabled()
  })

  test('unpaid order hides build buttons', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)
    await mockOrderAPIs(page, {
      order: { selected_platforms: ['desktop'], status: 'pending' },
      builds: [],
    })

    await page.goto(`/orders/${ORDER_ID}`)

    await expect(page.getByText('Build Windows')).not.toBeVisible()
    await expect(page.getByText(/Complete payment/)).toBeVisible()
  })
})

// ─── Multiple builds history ────────────────────────────────────

test.describe('Multiple builds', () => {
  test('shows both android and desktop builds in history', async ({ page }) => {
    await loginAsTestUser(page)
    await mockDashboardAPIs(page)

    const androidBuild = mockBuild({
      id: '00000000-0000-0000-0000-000000000071',
      status: 'success',
      platform: 'android',
      apk_url: 'https://example.com/app.apk',
      aab_url: 'https://example.com/app.aab',
      completed_at: '2026-02-20T00:10:00Z',
    })
    const desktopBuild = mockBuild({
      id: '00000000-0000-0000-0000-000000000072',
      status: 'success',
      platform: 'desktop',
      exe_url: 'https://example.com/app.exe',
      completed_at: '2026-02-20T00:12:00Z',
    })

    await mockOrderAPIs(page, {
      order: { selected_platforms: ['android', 'desktop'] },
      builds: [desktopBuild, androidBuild],
    })

    await page.goto(`/orders/${ORDER_ID}`)

    // Both platform badge labels visible in build cards
    await expect(page.locator('.rounded-full').getByText('Windows')).toBeVisible()
    await expect(page.locator('.rounded-full').getByText('Android')).toBeVisible()

    // All download buttons present
    await expect(page.getByRole('link', { name: 'Download APK' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Download AAB' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Download .exe' })).toBeVisible()
  })
})
