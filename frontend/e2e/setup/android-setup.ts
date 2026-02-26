/**
 * Android Testing Environment Setup
 *
 * Run this script to set up Android emulator for E2E testing
 *
 * Usage:
 *   npx ts-node e2e/setup/android-setup.ts
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function checkAndroidSDK(): Promise<boolean> {
  if (!process.env.ANDROID_HOME) {
    console.error('❌ ANDROID_HOME environment variable not set')
    console.log('\n📖 Please install Android SDK and set ANDROID_HOME:')
    console.log('   Windows: Download from https://developer.android.com/studio')
    console.log('   Set ANDROID_HOME to SDK location (e.g., C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk)')
    return false
  }

  console.log(`✅ ANDROID_HOME: ${process.env.ANDROID_HOME}`)
  return true
}

async function checkADB(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('adb version')
    console.log(`✅ ADB available: ${stdout.split('\n')[0]}`)
    return true
  } catch {
    console.error('❌ ADB not found in PATH')
    console.log('   Add ANDROID_HOME/platform-tools to your PATH')
    return false
  }
}

async function checkEmulator(): Promise<boolean> {
  try {
    await execAsync('emulator -version')
    console.log(`✅ Emulator command available`)
    return true
  } catch {
    console.error('❌ Emulator command not found')
    console.log('   Add ANDROID_HOME/emulator to your PATH')
    return false
  }
}

async function checkAAPT(): Promise<boolean> {
  try {
    await execAsync('aapt version')
    console.log(`✅ AAPT available`)
    return true
  } catch {
    console.error('❌ AAPT not found')
    console.log('   Add ANDROID_HOME/build-tools/XX.X.X to your PATH')
    return false
  }
}

async function listAVDs(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('emulator -list-avds')
    return stdout.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

async function createDefaultAVD(): Promise<void> {
  const avdName = 'webtoapp_test_avd'
  const systemImage = 'system-images;android-30;google_apis;x86_64'

  console.log(`\n📦 Creating AVD: ${avdName}`)

  // Check if system image is installed
  try {
    const { stdout } = await execAsync('sdkmanager --list_installed')
    if (!stdout.includes(systemImage)) {
      console.log(`   Downloading system image...`)
      await execAsync(`echo "y" | sdkmanager "${systemImage}"`)
    }
  } catch (error: any) {
    console.warn(`   Could not check/install system image: ${error.message}`)
  }

  // Create AVD
  try {
    await execAsync(`echo "no" | avdmanager create avd -n ${avdName} -k "${systemImage}" --force`)
    console.log(`✅ AVD created: ${avdName}`)
  } catch (error: any) {
    console.error(`❌ Failed to create AVD: ${error.message}`)
  }
}

async function main() {
  console.log('🔧 Android E2E Testing Environment Setup\n')

  // Check prerequisites
  const sdkOk = await checkAndroidSDK()
  if (!sdkOk) process.exit(1)

  const adbOk = await checkADB()
  const emulatorOk = await checkEmulator()
  const aaptOk = await checkAAPT()

  if (!adbOk || !emulatorOk || !aaptOk) {
    console.error('\n❌ Setup incomplete - please fix the issues above')
    process.exit(1)
  }

  // List existing AVDs
  console.log('\n📱 Checking Android Virtual Devices...')
  const avds = await listAVDs()

  if (avds.length > 0) {
    console.log(`✅ Found ${avds.length} AVD(s):`)
    avds.forEach(avd => console.log(`   - ${avd}`))
  } else {
    console.log(`⚠️  No AVDs found`)
    const create = process.argv.includes('--create-avd')

    if (create) {
      await createDefaultAVD()
    } else {
      console.log('\n💡 To create a default test AVD, run:')
      console.log('   npx ts-node e2e/setup/android-setup.ts --create-avd')
    }
  }

  console.log('\n✅ Setup complete! You can now run E2E tests with APK testing.')
  console.log('\n🚀 Run tests with:')
  console.log('   npm run test:e2e:full')
}

main().catch(console.error)
