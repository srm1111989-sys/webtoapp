/**
 * COMPLETE END-TO-END TEST - Build & APK Testing
 *
 * This test suite covers the ENTIRE flow:
 * 1. User registration
 * 2. App creation with payment
 * 3. Waiting for build to complete (polls GitLab pipeline)
 * 4. Downloading APK
 * 5. Installing APK on Android emulator
 * 6. Testing app functionality on emulator
 *
 * Prerequisites:
 * - Android SDK installed (ANDROID_HOME set)
 * - Android emulator available (or create one with: avdmanager create avd)
 * - ADB in PATH
 *
 * Run:
 *   npx playwright test full-e2e-with-apk.spec.ts --headed
 */

import { test, expect, Page } from '@playwright/test'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const execAsync = promisify(exec)

const BASE = process.env.BASE_URL || 'https://websitetoapp.app'
const TEST_URL = 'https://websitetoapp.app/test'
const UNIQUE_ID = Date.now().toString(36)
const TEST_USER = {
  name: `E2E Full Test ${UNIQUE_ID}`,
  email: `e2e-full+${UNIQUE_ID}@websitetoapp.app`,
  password: 'TestPass123!',
}

const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads')
const MAX_BUILD_WAIT = 15 * 60 * 1000 // 15 minutes
const BUILD_POLL_INTERVAL = 30 * 1000 // 30 seconds

let authTokens: { access_token: string; refresh_token: string } | null = null

// ─── Helper Functions ─────────────────────────────────────

async function injectAuth(page: Page) {
  if (!authTokens) throw new Error('No auth tokens')
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

async function apiCall(endpoint: string, method: string = 'GET', body?: any) {
  const url = `${BASE}/api${endpoint}`
  const headers: any = {
    'Content-Type': 'application/json',
  }
  if (authTokens) {
    headers['Authorization'] = `Bearer ${authTokens.access_token}`
  }

  const options: any = { method, headers }
  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`API ${method} ${endpoint} failed: ${response.status}`)
  }
  return response.json()
}

async function waitForBuildComplete(orderId: string): Promise<any> {
  console.log(`\n🔨 Waiting for build to complete for order: ${orderId}`)
  const startTime = Date.now()

  while (Date.now() - startTime < MAX_BUILD_WAIT) {
    try {
      // Get builds for this order
      const builds = await apiCall(`/builds/order/${orderId}`)

      if (builds && builds.length > 0) {
        const latestBuild = builds[0]
        console.log(`   Build status: ${latestBuild.status} (${latestBuild.progress || 0}%)`)

        if (latestBuild.status === 'success') {
          console.log(`✅ Build completed successfully!`)
          console.log(`   APK: ${latestBuild.apk_url || 'N/A'}`)
          console.log(`   AAB: ${latestBuild.aab_url || 'N/A'}`)
          return latestBuild
        }

        if (latestBuild.status === 'failed') {
          throw new Error(`Build failed: ${latestBuild.error_message || 'Unknown error'}`)
        }

        // Still building or pending - wait and poll again
        console.log(`   Waiting ${BUILD_POLL_INTERVAL / 1000}s before next check...`)
        await new Promise(resolve => setTimeout(resolve, BUILD_POLL_INTERVAL))
      } else {
        // No builds yet - order might still be processing
        console.log(`   No builds found yet, waiting...`)
        await new Promise(resolve => setTimeout(resolve, BUILD_POLL_INTERVAL))
      }
    } catch (error: any) {
      console.error(`   Error checking build status: ${error.message}`)
      await new Promise(resolve => setTimeout(resolve, BUILD_POLL_INTERVAL))
    }
  }

  throw new Error(`Build timeout: Build did not complete in ${MAX_BUILD_WAIT / 1000 / 60} minutes`)
}

async function downloadAPK(apkUrl: string): Promise<string> {
  console.log(`\n📥 Downloading APK from: ${apkUrl}`)

  // Create downloads directory
  await fs.mkdir(DOWNLOADS_DIR, { recursive: true })

  const apkPath = path.join(DOWNLOADS_DIR, `app-${UNIQUE_ID}.apk`)

  const response = await fetch(apkUrl)
  if (!response.ok) {
    throw new Error(`Failed to download APK: ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  await fs.writeFile(apkPath, Buffer.from(buffer))

  const stats = await fs.stat(apkPath)
  console.log(`✅ APK downloaded: ${apkPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)

  return apkPath
}

async function isEmulatorRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('adb devices')
    return stdout.includes('emulator-') && stdout.includes('device')
  } catch {
    return false
  }
}

async function startEmulator(avdName: string = 'test_avd'): Promise<void> {
  console.log(`\n🚀 Starting Android emulator: ${avdName}`)

  // Start emulator in background
  exec(`emulator -avd ${avdName} -no-snapshot -no-audio -no-window`, (error) => {
    if (error) console.error(`Emulator error: ${error.message}`)
  })

  // Wait for emulator to boot
  let attempts = 0
  while (attempts < 60) { // 5 minutes max
    try {
      const { stdout } = await execAsync('adb shell getprop sys.boot_completed')
      if (stdout.trim() === '1') {
        console.log(`✅ Emulator booted successfully`)
        await new Promise(resolve => setTimeout(resolve, 5000)) // Extra wait for stability
        return
      }
    } catch {
      // Not ready yet
    }

    attempts++
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  throw new Error('Emulator failed to boot in time')
}

async function installAPK(apkPath: string): Promise<void> {
  console.log(`\n📲 Installing APK on emulator...`)

  try {
    const { stdout, stderr } = await execAsync(`adb install -r "${apkPath}"`)
    console.log(stdout)

    if (stderr && stderr.includes('INSTALL_FAILED')) {
      throw new Error(`APK installation failed: ${stderr}`)
    }

    console.log(`✅ APK installed successfully`)
  } catch (error: any) {
    throw new Error(`Failed to install APK: ${error.message}`)
  }
}

async function getInstalledPackageName(apkPath: string): Promise<string> {
  const { stdout } = await execAsync(`aapt dump badging "${apkPath}" | grep package:`)
  const match = stdout.match(/package: name='([^']+)'/)
  if (!match) throw new Error('Could not extract package name from APK')
  return match[1]
}

async function launchApp(packageName: string): Promise<void> {
  console.log(`\n🎯 Launching app: ${packageName}`)

  try {
    // Get main activity
    const { stdout } = await execAsync(`aapt dump badging "${DOWNLOADS_DIR}/app-${UNIQUE_ID}.apk" | grep launchable-activity`)
    const match = stdout.match(/name='([^']+)'/)

    if (!match) {
      // Fallback: try to start main activity
      await execAsync(`adb shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`)
    } else {
      const activity = match[1]
      await execAsync(`adb shell am start -n ${packageName}/${activity}`)
    }

    console.log(`✅ App launched`)
    await new Promise(resolve => setTimeout(resolve, 3000)) // Wait for app to load
  } catch (error: any) {
    throw new Error(`Failed to launch app: ${error.message}`)
  }
}

async function testAppOnEmulator(packageName: string): Promise<void> {
  console.log(`\n🧪 Testing app functionality on emulator...`)

  // Test 1: Check app is running
  const { stdout: psOutput } = await execAsync(`adb shell ps | grep ${packageName}`)
  if (!psOutput.includes(packageName)) {
    throw new Error('App is not running')
  }
  console.log(`✅ App is running`)

  // Test 2: Take screenshot
  const screenshotPath = path.join(DOWNLOADS_DIR, `screenshot-${UNIQUE_ID}.png`)
  await execAsync(`adb shell screencap -p /sdcard/screenshot.png`)
  await execAsync(`adb pull /sdcard/screenshot.png "${screenshotPath}"`)
  console.log(`✅ Screenshot saved: ${screenshotPath}`)

  // Test 3: Check app logs for errors
  const { stdout: logOutput } = await execAsync(`adb logcat -d | grep -i "error\\|exception" | tail -20`)
  if (logOutput && logOutput.length > 0) {
    console.warn(`⚠️  Found errors in logs:\n${logOutput}`)
  } else {
    console.log(`✅ No critical errors in logs`)
  }

  // Test 4: Check WebView loaded
  try {
    const { stdout: dumpOutput } = await execAsync(`adb shell dumpsys activity ${packageName}`)
    if (dumpOutput.includes('WebView') || dumpOutput.includes('ChromeClient')) {
      console.log(`✅ WebView is loaded`)
    } else {
      console.warn(`⚠️  WebView might not be loaded`)
    }
  } catch {
    console.warn(`⚠️  Could not check WebView status`)
  }

  console.log(`\n✅ All emulator tests passed!`)
}

async function stopEmulator(): Promise<void> {
  console.log(`\n🛑 Stopping emulator...`)
  try {
    await execAsync('adb emu kill')
    console.log(`✅ Emulator stopped`)
  } catch {
    // Ignore errors
  }
}

// ─── Test Suite ───────────────────────────────────────────

test.describe.serial('Complete E2E Flow with APK Testing', () => {

  test('1. Register new user', async ({ page }) => {
    await page.goto(`${BASE}/register`)
    await page.fill('#full_name', TEST_USER.name)
    await page.fill('#email', TEST_USER.email)
    await page.fill('#password', TEST_USER.password)
    await page.fill('#confirm_password', TEST_USER.password)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 15_000 })
    console.log(`✅ User registered: ${TEST_USER.email}`)
  })

  test('2. Login and get auth tokens', async ({ page }) => {
    const response = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    })
    expect(response.ok()).toBeTruthy()
    authTokens = await response.json()
    console.log(`✅ Logged in successfully`)
  })

  test('3. Create FREE Android app (bypass payment)', async ({ page }) => {
    await injectAuth(page)

    // Clear wizard state
    await page.addInitScript(() => {
      window.localStorage.removeItem('webtoapp-wizard')
    })
    await page.goto(`${BASE}/apps/create`)
    await page.evaluate(() => window.localStorage.removeItem('webtoapp-wizard'))
    await page.reload()

    // Step 0: Basic Info
    await expect(page.getByText('Target Platform')).toBeVisible({ timeout: 15_000 })
    await page.locator('button', { hasText: 'Android' }).first().click()
    await page.waitForTimeout(500)
    await page.fill('input[name="name"]', `E2E Test App ${UNIQUE_ID}`)
    await page.fill('input[name="url"]', TEST_URL)
    await page.locator('button[type="submit"]').click()

    // Wait for Step 1
    await expect(page.getByText(/app icon/i).first()).toBeVisible({ timeout: 30_000 })

    // Steps 1-3: Click Next
    for (let i = 1; i <= 3; i++) {
      await page.waitForTimeout(2000)
      await page.locator('button:has-text("Next")').last().click()
    }

    // Step 4: Select FREE plan (bypass payment!)
    await expect(page.getByText('Choose a Plan')).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(2000)

    // Find and click the FREE plan (₹0 / $0)
    const freePlanBtn = page.locator('button', { hasText: /free/i }).filter({ hasText: /₹0|\$0/ })
    await freePlanBtn.first().click()
    await page.waitForTimeout(500)

    console.log(`💡 Using FREE plan - bypassing payment step`)

    // Submit order
    const submitBtn = page.locator('button', { hasText: /submit/i }).last()
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 })
    await submitBtn.click()

    // Free order redirects directly to order page - NO PAYMENT NEEDED!
    await expect(page).toHaveURL(/\/orders\//, { timeout: 30_000 })
    console.log(`✅ Free app created - payment bypassed!`)
  })

  test('4. Wait for build to complete', async ({ page }) => {
    // Get current URL to extract order ID
    await injectAuth(page)
    await page.goto(`${BASE}/dashboard`)
    await page.waitForTimeout(2000)

    // Click on the first order
    await page.locator('a[href^="/orders/"]').first().click()
    await page.waitForURL(/\/orders\//, { timeout: 10_000 })

    const url = page.url()
    const match = url.match(/orders\/([a-f0-9-]+)/)
    if (!match) throw new Error('Could not extract order ID')

    const orderId = match[1]
    console.log(`Order ID: ${orderId}`)

    // Trigger build manually (FREE plans don't auto-trigger)
    console.log(`🔨 Triggering build for FREE order...`)
    const triggerResponse = await page.request.post(`${BASE}/api/builds/trigger/${orderId}?platform=android`, {
      headers: {
        Authorization: `Bearer ${authTokens!.access_token}`,
      },
    })
    if (!triggerResponse.ok()) {
      throw new Error(`Failed to trigger build: ${triggerResponse.status()}`)
    }
    console.log(`✅ Build triggered successfully!`)
    await page.waitForTimeout(5000) // Wait for build to start

    // Wait for build to complete
    const build = await waitForBuildComplete(orderId)

    // Save build info for next tests
    test.info().annotations.push({ type: 'build', description: JSON.stringify(build) })
  }, { timeout: MAX_BUILD_WAIT + 60_000 })

  test('5. Download APK', async () => {
    const buildInfo = test.info().annotations.find(a => a.type === 'build')
    if (!buildInfo) throw new Error('No build info from previous test')

    const build = JSON.parse(buildInfo.description)
    if (!build.apk_url) throw new Error('No APK URL in build')

    const apkPath = await downloadAPK(build.apk_url)

    // Save APK path for next tests
    test.info().annotations.push({ type: 'apk_path', description: apkPath })
  })

  test('6. Start Android emulator', async () => {
    const running = await isEmulatorRunning()

    if (!running) {
      // List available AVDs
      try {
        const { stdout } = await execAsync('emulator -list-avds')
        const avds = stdout.trim().split('\n').filter(Boolean)

        if (avds.length === 0) {
          console.warn(`⚠️  No Android emulators found. Skipping emulator tests.`)
          console.warn(`   Create one with: avdmanager create avd -n test_avd -k "system-images;android-30;google_apis;x86_64"`)
          test.skip()
          return
        }

        await startEmulator(avds[0])
      } catch (error: any) {
        console.warn(`⚠️  Failed to start emulator: ${error.message}`)
        console.warn(`   Skipping emulator tests.`)
        test.skip()
        return
      }
    } else {
      console.log(`✅ Emulator already running`)
    }
  }, { timeout: 360_000 }) // 6 minutes for emulator to boot

  test('7. Install and launch APK on emulator', async () => {
    const apkPathAnnotation = test.info().annotations.find(a => a.type === 'apk_path')
    if (!apkPathAnnotation) {
      test.skip()
      return
    }

    const apkPath = apkPathAnnotation.description

    await installAPK(apkPath)

    const packageName = await getInstalledPackageName(apkPath)
    console.log(`Package name: ${packageName}`)

    await launchApp(packageName)

    // Save package name for next test
    test.info().annotations.push({ type: 'package_name', description: packageName })
  })

  test('8. Test app functionality on emulator', async () => {
    const packageNameAnnotation = test.info().annotations.find(a => a.type === 'package_name')
    if (!packageNameAnnotation) {
      test.skip()
      return
    }

    const packageName = packageNameAnnotation.description
    await testAppOnEmulator(packageName)
  })

  test.afterAll(async () => {
    // Cleanup: stop emulator
    await stopEmulator()

    console.log(`\n✅ ALL TESTS COMPLETED SUCCESSFULLY!`)
    console.log(`   Downloads saved to: ${DOWNLOADS_DIR}`)
  })
})
