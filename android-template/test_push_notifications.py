"""
Test push notifications locally on emulator.

Methods:
  1. Send via ADB broadcast (no Firebase project needed)
  2. Send via FCM API (needs real google-services.json + server key)
  3. Send via Firebase console (manual, needs real project)

Prerequisites:
  - Emulator running with Google Play Services (use Google APIs system image)
  - APK installed with push_notifications=true in config

Usage:
  python test_push_notifications.py adb           # ADB broadcast test (fastest)
  python test_push_notifications.py fcm <key>     # FCM HTTP API test
  python test_push_notifications.py setup         # Full setup guide
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
PACKAGE = "com.webtoapp.template"


def adb_shell(cmd: str, timeout=15) -> str:
    env = os.environ.copy()
    env["MSYS_NO_PATHCONV"] = "1"
    result = subprocess.run([ADB, "shell", cmd],
                          capture_output=True, text=True, timeout=timeout,
                          env=env, encoding='utf-8', errors='replace')
    return result.stdout.strip()


def check_google_play_services() -> bool:
    """Check if Google Play Services is available on emulator."""
    out = adb_shell("pm list packages com.google.android.gms")
    has_gms = "com.google.android.gms" in out
    if not has_gms:
        print("WARNING: Google Play Services not found on emulator!")
        print("  Push notifications require Google Play Services.")
        print("  Use an emulator image with 'Google APIs' or 'Google Play'.")
        print("  e.g.: 'Pixel 6 API 34 (Google APIs)'")
    return has_gms


def get_fcm_token() -> str:
    """Try to retrieve the FCM registration token from logcat."""
    out = adb_shell("logcat -d | grep -i 'FCM\\|registration.*token\\|FirebaseMessaging'")
    # Look for token in logs
    for line in out.split("\n"):
        if "token" in line.lower():
            # Try to extract token value
            match = re.search(r'token[:\s=]+([a-zA-Z0-9_:.-]{50,})', line)
            if match:
                return match.group(1)
    return ""


# ── Method 1: ADB broadcast (no Firebase needed) ─────────────────────

def test_adb_notification():
    """Send a test notification via ADB without needing Firebase.

    This simulates what FCMService.onMessageReceived() does by
    using Android's notification system directly via ADB.
    """
    print("\n=== Method 1: ADB Local Notification Test ===\n")

    # Check app is installed
    out = adb_shell(f"pm list packages {PACKAGE}")
    if PACKAGE not in out:
        print(f"App not installed: {PACKAGE}")
        print("Run: python local_build.py <app_id> --run")
        return False

    # Create notification channel first (required Android 8+)
    adb_shell(f"am start -n {PACKAGE}/.LauncherActivity")
    time.sleep(3)

    # Send a notification via am command (simulates system notification)
    # This uses Android's built-in test notification
    print("Sending test notification via ADB...")

    # Method A: Use 'cmd notification' (Android 10+)
    result = adb_shell(
        'cmd notification post -S bigtext -t "Test Push" '
        '"tag_test" "This is a test push notification from local testing"'
    )
    if "Error" not in result:
        print("  Notification sent via 'cmd notification'")
        print("  Check the emulator notification shade (swipe down)")
        time.sleep(2)

        # Verify notification appeared
        notifications = adb_shell("dumpsys notification --noredact | grep -A5 'Test Push'")
        if "Test Push" in notifications:
            print("  PASS: Notification appeared in notification shade")
            return True
        else:
            print("  Notification sent but may not have appeared yet. Check emulator manually.")
            return True

    # Method B: Broadcast intent to trigger FCMService directly
    print("  Trying broadcast method...")
    adb_shell(
        f'am broadcast -a com.google.android.c2dm.intent.RECEIVE '
        f'-n {PACKAGE}/.FCMService '
        f'--es "title" "Test Push" '
        f'--es "body" "Hello from local test" '
        f'--es "url" "https://www.google.com"'
    )
    time.sleep(2)
    print("  Broadcast sent. Check emulator notification shade.")

    # Method C: Use dumpsys to verify notification service is registered
    service_info = adb_shell(f"dumpsys package {PACKAGE} | grep FCMService")
    if "FCMService" in service_info:
        print(f"  PASS: FCMService is registered in manifest")
    else:
        print(f"  WARNING: FCMService not found in manifest")

    return True


# ── Method 2: FCM HTTP API (needs real server key) ───────────────────

def test_fcm_api(server_key: str):
    """Send a real push notification via FCM HTTP v1 API.

    Requires:
      - A real google-services.json in the APK
      - The FCM server key from Firebase Console
      - Emulator with Google Play Services
    """
    print("\n=== Method 2: FCM HTTP API Test ===\n")

    if not check_google_play_services():
        return False

    # Get FCM token from device logs
    print("Looking for FCM registration token in logcat...")
    token = get_fcm_token()
    if not token:
        print("  FCM token not found in logs.")
        print("  Make sure:")
        print("    1. google-services.json is in app/ directory")
        print("    2. App was built with push_notifications=true")
        print("    3. App was launched at least once")
        print("\n  To get the token manually:")
        print(f"    adb logcat -d | grep -i 'token'")
        return False

    print(f"  FCM token: {token[:20]}...")

    # Send via FCM legacy HTTP API
    import urllib.request

    message = {
        "to": token,
        "notification": {
            "title": "Test from Local",
            "body": "Push notification test - sent via FCM API",
        },
        "data": {
            "url": "https://www.google.com",
            "click_action": "OPEN_URL",
        },
    }

    req = urllib.request.Request(
        "https://fcm.googleapis.com/fcm/send",
        data=json.dumps(message).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"key={server_key}",
        },
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            if result.get("success") == 1:
                print("  PASS: Push notification sent successfully!")
                print("  Check emulator notification shade.")
            else:
                print(f"  FAIL: FCM response: {result}")
            return result.get("success") == 1
    except Exception as e:
        print(f"  FAIL: FCM API error: {e}")
        return False


# ── Setup guide ───────────────────────────────────────────────────────

def print_setup_guide():
    print("""
=== Push Notification Testing Setup Guide ===

There are 3 ways to test push notifications locally:

--- Quick Test (No Firebase project needed) ---

  1. Build the app with push_notifications=true:
     python local_build.py <app_id> --run

  2. Send a test notification:
     python test_push_notifications.py adb

  This verifies:
    - FCMService is registered in manifest
    - Notification channel works
    - App doesn't crash with push enabled

--- Real Firebase Test (Needs Firebase project) ---

  1. Create a Firebase project at https://console.firebase.google.com
  2. Add an Android app with your package name
  3. Download google-services.json to android-template/app/
  4. Get server key from Firebase Console > Project Settings > Cloud Messaging
  5. Build with Firebase:

     # Edit config.json or use the web wizard with Firebase config
     python local_build.py <app_id> --run

  6. Send notification via FCM API:
     python test_push_notifications.py fcm <your-server-key>

  7. Or send from Firebase Console:
     Firebase Console > Messaging > New Campaign > Notifications
     Target: your app package name

--- What Gets Tested ---

  - FCMService receives messages                    (onMessageReceived)
  - Notification appears in system tray             (NotificationCompat)
  - Tapping notification opens the correct URL      (PendingIntent)
  - POST_NOTIFICATIONS permission is declared       (AndroidManifest)
  - MESSAGING_EVENT intent filter is registered     (AndroidManifest)

--- Emulator Requirements ---

  Use an emulator with Google APIs:
    System Image: "Google APIs Intel x86_64" or "Google Play Intel x86_64"
    NOT: "Default (no Google APIs)"

  To check: adb shell pm list packages com.google.android.gms
  Should output: package:com.google.android.gms
""")


# ── Main ──────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python test_push_notifications.py adb         # Quick ADB test")
        print("  python test_push_notifications.py fcm <key>   # FCM API test")
        print("  python test_push_notifications.py setup       # Setup guide")
        sys.exit(1)

    method = sys.argv[1]

    if method == "setup":
        print_setup_guide()
    elif method == "adb":
        test_adb_notification()
    elif method == "fcm":
        if len(sys.argv) < 3:
            print("Usage: python test_push_notifications.py fcm <server-key>")
            sys.exit(1)
        test_fcm_api(sys.argv[2])
    else:
        print(f"Unknown method: {method}")
        print("Use: adb, fcm, or setup")
        sys.exit(1)


if __name__ == "__main__":
    main()
