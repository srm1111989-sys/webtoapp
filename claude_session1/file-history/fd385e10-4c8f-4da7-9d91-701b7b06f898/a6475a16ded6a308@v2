# End-to-End Testing Suite

## Overview

Comprehensive automated E2E tests that cover:
- ✅ User registration & login
- ✅ App creation flow (all steps)
- ✅ **Payment bypassed** (uses FREE plan)
- ✅ Build monitoring (waits for GitLab pipeline)
- ✅ APK download
- ✅ Android emulator installation & testing
- ✅ App functionality verification

**No more manual testing!** 🎉

## Quick Start

### 1. Prerequisites

#### Install Android SDK
```bash
# Windows: Download Android Studio
# https://developer.android.com/studio

# Set environment variable
set ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk

# Add to PATH:
# - %ANDROID_HOME%\platform-tools
# - %ANDROID_HOME%\emulator
# - %ANDROID_HOME%\build-tools\34.0.0
```

#### Verify Installation
```bash
npm run test:android:setup
```

This will check:
- ANDROID_HOME is set
- ADB is available
- Emulator is available
- AAPT is available

### 2. Create Android Emulator (First Time Only)

```bash
# Create default test emulator
npm run test:android:create-avd

# Or manually:
avdmanager create avd -n test_avd -k "system-images;android-30;google_apis;x86_64"
```

### 3. Run Tests

#### Full E2E Test (Recommended)
```bash
# Run complete test including APK download & emulator testing
npm run test:e2e:full
```

This will:
1. Register a new test user
2. Create a FREE Android app (no payment needed!)
3. Wait for build to complete (~5-10 minutes)
4. Download APK
5. Start Android emulator
6. Install APK on emulator
7. Launch app and test functionality
8. Take screenshots
9. Verify app is running correctly

**Total time:** ~15-20 minutes

#### Production E2E Tests (Without APK Testing)
```bash
# Faster tests without emulator (3-5 minutes)
npm run test:e2e:prod
```

#### Local Development Tests
```bash
# Run against localhost:5173
npm run test:e2e

# With UI for debugging
npm run test:e2e:ui
```

## Test Files

### `full-e2e-with-apk.spec.ts`
**Complete end-to-end test with APK testing**

Tests the ENTIRE flow:
- User registration
- App creation (FREE plan - no payment!)
- Build completion (polls GitLab pipeline every 30s)
- APK download
- Emulator testing

**Configuration:**
- `MAX_BUILD_WAIT`: 15 minutes (adjustable)
- `BUILD_POLL_INTERVAL`: 30 seconds
- Uses FREE plan to bypass payment
- Saves APK & screenshots to `e2e/downloads/`

### `production-e2e.spec.ts`
**Fast production tests (no emulator)**

Tests the user flow without waiting for builds:
- Landing page
- Registration
- Login
- App creation (free & paid)
- Dashboard verification

**Time:** 3-5 minutes

### `android-emulator.ts`
**Android emulator utilities**

Helper functions:
- `listAVDs()` - List available emulators
- `startEmulator()` - Start emulator
- `installAPK()` - Install APK
- `launchApp()` - Launch app
- `takeScreenshot()` - Capture screenshot
- `getAppLogs()` - Get app logs
- `isAppRunning()` - Check if app is running

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-full:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v2

      - name: Create Android AVD
        run: |
          echo "no" | avdmanager create avd -n test_avd -k "system-images;android-30;google_apis;x86_64" --force

      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          npx playwright install

      - name: Run E2E tests
        run: cd frontend && npm run test:e2e:full
        env:
          BASE_URL: https://websitetoapp.app

      - name: Upload test artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-artifacts
          path: |
            frontend/e2e/downloads/
            frontend/test-results/
```

## Configuration

### Environment Variables

```bash
# Base URL for tests (default: https://websitetoapp.app)
export BASE_URL=https://websitetoapp.app

# Android SDK location
export ANDROID_HOME=/path/to/android/sdk
```

### Playwright Config

Edit `playwright.config.ts` or `playwright.prod.config.ts`:

```ts
export default defineConfig({
  testDir: './e2e/tests',
  timeout: 1800000, // 30 minutes for full test
  retries: 2, // Retry failed tests
  workers: 1, // Run tests serially
  use: {
    baseURL: 'https://websitetoapp.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
})
```

## Troubleshooting

### Emulator Not Starting

```bash
# List available AVDs
emulator -list-avds

# Start emulator manually
emulator -avd test_avd -no-snapshot -no-audio

# Check if emulator is running
adb devices
```

### ADB Not Found

```bash
# Windows
set PATH=%PATH%;%ANDROID_HOME%\platform-tools

# Verify
adb version
```

### Build Timeout

If builds take longer than 15 minutes, increase timeout in test file:

```ts
const MAX_BUILD_WAIT = 30 * 60 * 1000 // 30 minutes
```

### APK Download Fails

Check if build succeeded:
```bash
# Check order in browser
https://websitetoapp.app/orders/<order-id>
```

The test automatically fetches the APK URL from the build API.

## Test Output

### Downloads Directory

All test artifacts are saved to `e2e/downloads/`:
- `app-{unique-id}.apk` - Downloaded APK
- `screenshot-{unique-id}.png` - App screenshot from emulator

### Logs

Tests output detailed logs:
```
✅ User registered: e2e-full+abc123@websitetoapp.app
✅ Logged in successfully
✅ App created and order placed
🔨 Waiting for build to complete for order: 12345...
   Build status: building (45%)
   Waiting 30s before next check...
✅ Build completed successfully!
📥 Downloading APK from: https://...
✅ APK downloaded: app-abc123.apk (12.5 MB)
🚀 Starting Android emulator: test_avd
✅ Emulator booted successfully
📲 Installing APK on emulator...
✅ APK installed successfully
🎯 Launching app: com.webtoapp.app
✅ App launched
🧪 Testing app functionality on emulator...
✅ App is running
✅ Screenshot saved
✅ No critical errors in logs
✅ WebView is loaded
✅ All emulator tests passed!
```

## Best Practices

1. **Use FREE plan for tests** - Faster and no payment needed
2. **Run tests in CI** - Automate on every push
3. **Keep emulator lightweight** - Use headless mode (`-no-window`)
4. **Clean up** - Tests automatically stop emulator after completion
5. **Parallel testing** - Run multiple test suites in parallel (except emulator tests)
6. **Screenshot on failure** - Playwright automatically captures screenshots

## FAQ

**Q: How long do tests take?**
A: 15-20 minutes for full E2E with APK testing, 3-5 minutes for production tests without emulator.

**Q: Do I need to pay for test apps?**
A: No! Tests use the FREE plan - **payment is bypassed completely**.

**Q: Can I run tests on my local environment?**
A: Yes, change `BASE_URL` to `http://localhost:5173` and run `npm run test:e2e`.

**Q: What if build fails?**
A: Test will fail and show the error message from GitLab pipeline.

**Q: Can I test on real device?**
A: Yes! Connect device via USB, enable USB debugging, and run tests. ADB will detect it automatically.

## Next Steps

- Add more emulator tests (navigation, features, etc.)
- Add performance testing (app launch time, WebView load time)
- Add visual regression testing
- Add network mocking for offline mode testing
- Add accessibility testing

---

**Happy Testing!** 🚀

No more manual testing headaches!
