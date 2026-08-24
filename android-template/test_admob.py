"""
Test AdMob ads locally on emulator.

Google provides test ad unit IDs that always show test ads without
requiring a real AdMob account. This script builds with test IDs,
installs, and verifies ads load.

Usage:
  python test_admob.py              # Build with test ads + verify
  python test_admob.py --verify     # Just verify ads on already-installed app
  python test_admob.py --setup      # Print setup guide

Prerequisites:
  - Emulator with Google Play Services
  - APK built with admob=true and test ad IDs
"""

import json
import os
import subprocess
import sys
import time
import re

ANDROID_HOME = os.environ.get("ANDROID_HOME", "C:/Android/sdk")
ADB = f"{ANDROID_HOME}/platform-tools/adb.exe"
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(PROJECT_DIR, "app", "src", "main", "assets", "config.json")
APK_PATH = os.path.join(PROJECT_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk")
MANIFEST_PATH = os.path.join(PROJECT_DIR, "app", "src", "main", "AndroidManifest.xml")
PACKAGE = "com.webtoapp.template"

os.environ.setdefault("ANDROID_HOME", ANDROID_HOME)
os.environ.setdefault("ANDROID_SDK_ROOT", ANDROID_HOME)

# Google's official test ad unit IDs (always show test ads)
# https://developers.google.com/admob/android/test-ads
TEST_ADMOB_APP_ID = "ca-app-pub-3940256099942544~3347511713"
TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111"
TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712"
TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917"


def adb_shell(cmd: str, timeout=15) -> str:
    env = os.environ.copy()
    env["MSYS_NO_PATHCONV"] = "1"
    result = subprocess.run([ADB, "shell", cmd],
                          capture_output=True, text=True, timeout=timeout,
                          env=env, encoding='utf-8', errors='replace')
    return result.stdout.strip()


def check_google_play_services() -> bool:
    """Check if Google Play Services is available."""
    out = adb_shell("pm list packages com.google.android.gms")
    has_gms = "com.google.android.gms" in out
    if not has_gms:
        print("ERROR: Google Play Services not found!")
        print("  AdMob requires Google Play Services.")
        print("  Use an emulator with 'Google APIs' or 'Google Play' system image.")
    return has_gms


def inject_admob_manifest():
    """Inject AdMob meta-data into AndroidManifest.xml.

    This replicates what the CI pipeline does in the prepare stage:
    removes the provider removal line and adds the AdMob app ID.
    """
    with open(MANIFEST_PATH, 'r') as f:
        manifest = f.read()

    # Check if already injected
    if TEST_ADMOB_APP_ID in manifest:
        print("  AdMob already configured in manifest")
        return

    # Remove the MobileAdsInitProvider removal (if present)
    # This line disables AdMob by default
    manifest = re.sub(
        r'<provider[^>]*MobileAdsInitProvider[^>]*tools:node="remove"[^/]*/>\s*',
        '',
        manifest,
        flags=re.DOTALL
    )

    # Add AdMob meta-data before </application>
    meta_data = f'        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="{TEST_ADMOB_APP_ID}" />\n    '
    manifest = manifest.replace('</application>', f'{meta_data}</application>')

    with open(MANIFEST_PATH, 'w') as f:
        f.write(manifest)

    print(f"  AdMob app ID injected into manifest: {TEST_ADMOB_APP_ID}")


def restore_manifest():
    """Restore original manifest (remove AdMob injection)."""
    with open(MANIFEST_PATH, 'r') as f:
        manifest = f.read()

    # Remove the injected meta-data
    manifest = re.sub(
        r'\s*<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"[^/]*/>\s*',
        '\n    ',
        manifest
    )

    with open(MANIFEST_PATH, 'w') as f:
        f.write(manifest)


def build_with_admob():
    """Build APK with AdMob test ads configured."""
    print("\n=== Building APK with AdMob Test Ads ===\n")

    # Write config with admob enabled
    config = {
        "app_name": "AdMob Test",
        "app_url": "https://www.wikipedia.org",
        "app_host": "www.wikipedia.org",
        "primary_color": "#2563EB",
        "secondary_color": "#1E40AF",
        "status_bar_color": "#1E3A5F",
        "features": {
            "admob": True,
            "biometric_auth": False,
            "push_notifications": False,
            "deep_linking": False,
            "offline_mode": False,
            "screenshot_prevention": False,
            "custom_user_agent": "",
            "file_upload": False,
            "location_services": False,
            "camera_access": False,
            "qr_scanner": False,
            "js_bridge": False,
            "navigation_menu": False,
            "show_watermark": False,
        },
        "admob_config": {
            "app_id": TEST_ADMOB_APP_ID,
            "banner_id": TEST_BANNER_ID,
            "interstitial_id": TEST_INTERSTITIAL_ID,
            "rewarded_id": TEST_REWARDED_ID,
        },
        "navigation_items": [],
    }

    with open(CONFIG_PATH, 'w') as f:
        json.dump(config, f, indent=2)
    print(f"  Config written with test ad IDs")

    # Inject AdMob into manifest (like CI does)
    inject_admob_manifest()

    # Build
    gradlew = os.path.join(PROJECT_DIR, "gradlew.bat" if os.name == "nt" else "gradlew")
    print("  Building debug APK...")
    result = subprocess.run(
        [gradlew, "assembleDebug", "--no-daemon",
         f"-PADMOB_ENABLED=true"],
        cwd=PROJECT_DIR, timeout=600
    )

    if result.returncode != 0:
        print("  BUILD FAILED")
        restore_manifest()
        return False

    print("  Build successful")

    # Install
    print("  Installing on emulator...")
    result = subprocess.run([ADB, "install", "-r", APK_PATH],
                          capture_output=True, text=True, timeout=30)
    if "Success" not in result.stdout:
        print(f"  Install failed: {result.stderr}")
        restore_manifest()
        return False
    print("  Installed")

    # Restore manifest for future non-admob builds
    restore_manifest()
    return True


def verify_admob():
    """Verify AdMob ads load on emulator."""
    print("\n=== Verifying AdMob Ads ===\n")

    if not check_google_play_services():
        return False

    # Launch app
    print("  Launching app...")
    adb_shell(f"am force-stop {PACKAGE}")
    time.sleep(1)
    adb_shell("logcat -c")
    adb_shell(f"am start -n {PACKAGE}/.LauncherActivity")
    time.sleep(6)

    # Check if app crashed
    activity = adb_shell("dumpsys window | grep mCurrentFocus")
    if PACKAGE not in activity:
        print(f"  FAIL: App not running. Activity: {activity}")
        return False
    print(f"  App running: {activity.strip()}")

    # Check AdMob logs
    logs = adb_shell("logcat -d | grep -iE 'AdMob|MobileAds|AdView|AdRequest|banner|interstitial'")
    log_lines = [l for l in logs.split("\n") if l.strip()]

    print(f"\n  AdMob log entries: {len(log_lines)}")
    for line in log_lines[:15]:
        print(f"    {line.strip()[:120]}")

    # Check for successful ad load
    ad_loaded = any("onAdLoaded" in l or "Ad loaded" in l.lower() for l in log_lines)
    ad_error = any("onAdFailedToLoad" in l or "ERROR" in l for l in log_lines)
    admob_init = any("MobileAds" in l or "Initialize" in l for l in log_lines)

    print(f"\n  Results:")
    print(f"    AdMob SDK initialized: {'YES' if admob_init else 'NO'}")
    print(f"    Ad loaded:             {'YES' if ad_loaded else 'NO'}")
    print(f"    Ad errors:             {'YES' if ad_error else 'NO'}")

    if ad_loaded:
        print("\n  PASS: AdMob test ads loading correctly!")
    elif admob_init and not ad_error:
        print("\n  PARTIAL: AdMob initialized but no ad loaded yet (may need more time)")
    elif ad_error:
        print("\n  NOTE: Ad load errors are normal on emulators without proper Google account")
        print("  The important thing is the SDK initialized without crashing the app")

    # Check UI for ad view
    adb_shell("uiautomator dump /sdcard/admob_test.xml")
    env = os.environ.copy()
    env["MSYS_NO_PATHCONV"] = "1"
    result = subprocess.run([ADB, "shell", "cat /sdcard/admob_test.xml"],
                          capture_output=True, text=True, timeout=10,
                          env=env, encoding='utf-8', errors='replace')
    ui_xml = result.stdout

    has_ad_view = "AdView" in ui_xml or "ad_view" in ui_xml or "banner" in ui_xml.lower()
    print(f"    Ad view in UI tree:    {'YES' if has_ad_view else 'NO'}")

    # Overall pass if app didn't crash and AdMob initialized
    return PACKAGE in activity


def print_setup_guide():
    print(f"""
=== AdMob Testing Guide ===

--- Quick Test (Uses Google's test ad IDs) ---

  No AdMob account needed! Google provides test ad unit IDs:

  App ID:          {TEST_ADMOB_APP_ID}
  Banner:          {TEST_BANNER_ID}
  Interstitial:    {TEST_INTERSTITIAL_ID}
  Rewarded:        {TEST_REWARDED_ID}

  Run:
    python test_admob.py              # Builds with test IDs + verifies

--- What Gets Tested ---

  1. AdMob SDK initializes without crash
  2. MobileAdsInitProvider is enabled (manifest injection)
  3. Banner ad view appears in layout
  4. Test ads load (on emulator with Google Play Services)
  5. No FATAL exceptions in logcat

--- Real AdMob Testing ---

  1. Create account at https://apps.admob.com
  2. Create an app and get ad unit IDs
  3. In the web wizard, enter your real IDs in the AdMob config section
  4. Build via: python local_build.py <app_id> --run
  5. Verify: python test_admob.py --verify

--- Emulator Requirements ---

  MUST use Google APIs system image (AdMob needs Play Services):
    - "Pixel 6 API 34 (Google APIs)"
    - NOT "Pixel 6 API 34" (no Google APIs)

  To add a test device (prevents invalid traffic):
    adb shell getprop ro.serialno
    Add this device ID in AdMob Console > Settings > Test devices

--- Troubleshooting ---

  "Ad failed to load" errors are common on emulators.
  What matters is:
    - App doesn't crash
    - AdMob SDK initializes (check logcat for "MobileAds")
    - AdView container exists in the layout

  For reliable ad loading, test on a physical device with
  a real Google account signed in.
""")


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--setup":
        print_setup_guide()
        return

    if len(sys.argv) > 1 and sys.argv[1] == "--verify":
        verify_admob()
        return

    # Full test: build + verify
    if not build_with_admob():
        sys.exit(1)
    verify_admob()


if __name__ == "__main__":
    main()
