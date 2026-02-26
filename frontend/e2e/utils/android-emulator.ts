/**
 * Android Emulator Utilities
 *
 * Helper functions for managing Android emulators and APK testing
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface EmulatorInfo {
  name: string
  device: string
  path: string
  target: string
  based_on: string
}

export async function listAVDs(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('emulator -list-avds')
    return stdout.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

export async function createTestAVD(name: string = 'webtoapp_test'): Promise<void> {
  console.log(`Creating test AVD: ${name}`)

  // Check if already exists
  const avds = await listAVDs()
  if (avds.includes(name)) {
    console.log(`AVD ${name} already exists`)
    return
  }

  // Download system image if needed
  try {
    await execAsync('sdkmanager --install "system-images;android-30;google_apis;x86_64"')
  } catch (error: any) {
    console.warn(`Failed to download system image: ${error.message}`)
  }

  // Create AVD
  await execAsync(`echo "no" | avdmanager create avd -n ${name} -k "system-images;android-30;google_apis;x86_64" --force`)

  console.log(`✅ AVD ${name} created`)
}

export async function isADBAvailable(): Promise<boolean> {
  try {
    await execAsync('adb version')
    return true
  } catch {
    return false
  }
}

export async function isEmulatorRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('adb devices')
    return stdout.includes('emulator-') && stdout.includes('device')
  } catch {
    return false
  }
}

export async function waitForEmulatorBoot(maxWaitMs: number = 300_000): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const { stdout } = await execAsync('adb shell getprop sys.boot_completed')
      if (stdout.trim() === '1') {
        console.log(`✅ Emulator booted`)
        await new Promise(resolve => setTimeout(resolve, 5000)) // Extra stability wait
        return
      }
    } catch {
      // Not ready
    }

    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  throw new Error('Emulator boot timeout')
}

export async function startEmulator(avdName: string, headless: boolean = true): Promise<void> {
  console.log(`Starting emulator: ${avdName}${headless ? ' (headless)' : ''}`)

  const flags = [
    '-avd', avdName,
    '-no-snapshot',
    '-no-audio',
  ]

  if (headless) {
    flags.push('-no-window')
  }

  exec(`emulator ${flags.join(' ')}`, (error) => {
    if (error) console.error(`Emulator error: ${error.message}`)
  })

  await waitForEmulatorBoot()
}

export async function stopEmulator(): Promise<void> {
  try {
    await execAsync('adb emu kill')
    console.log(`✅ Emulator stopped`)
  } catch {
    // Ignore
  }
}

export async function installAPK(apkPath: string, reinstall: boolean = true): Promise<void> {
  console.log(`Installing APK: ${apkPath}`)

  const flags = reinstall ? '-r' : ''
  const { stdout, stderr } = await execAsync(`adb install ${flags} "${apkPath}"`)

  if (stderr && stderr.includes('INSTALL_FAILED')) {
    throw new Error(`APK installation failed: ${stderr}`)
  }

  console.log(`✅ APK installed`)
}

export async function uninstallApp(packageName: string): Promise<void> {
  try {
    await execAsync(`adb uninstall ${packageName}`)
    console.log(`✅ Uninstalled ${packageName}`)
  } catch {
    // Ignore if not installed
  }
}

export async function getPackageName(apkPath: string): Promise<string> {
  const { stdout } = await execAsync(`aapt dump badging "${apkPath}" | grep package:`)
  const match = stdout.match(/package: name='([^']+)'/)
  if (!match) throw new Error('Could not extract package name')
  return match[1]
}

export async function getMainActivity(apkPath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`aapt dump badging "${apkPath}" | grep launchable-activity`)
    const match = stdout.match(/name='([^']+)'/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export async function launchApp(packageName: string, activity?: string): Promise<void> {
  console.log(`Launching app: ${packageName}`)

  if (activity) {
    await execAsync(`adb shell am start -n ${packageName}/${activity}`)
  } else {
    // Use monkey to launch
    await execAsync(`adb shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`)
  }

  console.log(`✅ App launched`)
  await new Promise(resolve => setTimeout(resolve, 3000))
}

export async function takeScreenshot(outputPath: string): Promise<void> {
  await execAsync(`adb shell screencap -p /sdcard/screenshot.png`)
  await execAsync(`adb pull /sdcard/screenshot.png "${outputPath}"`)
  console.log(`✅ Screenshot: ${outputPath}`)
}

export async function getAppLogs(packageName: string, lines: number = 100): Promise<string> {
  const { stdout } = await execAsync(`adb logcat -d | grep ${packageName} | tail -${lines}`)
  return stdout
}

export async function clearAppData(packageName: string): Promise<void> {
  await execAsync(`adb shell pm clear ${packageName}`)
  console.log(`✅ Cleared app data for ${packageName}`)
}

export async function isAppRunning(packageName: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`adb shell ps | grep ${packageName}`)
    return stdout.includes(packageName)
  } catch {
    return false
  }
}
