"""
Test script: builds APK with various feature configs and installs on emulator.
Run from android-template directory.
"""
import json
import subprocess
import sys
import os
import time

ANDROID_HOME = "C:/Android/sdk"
ADB = f"{ANDROID_HOME}/platform-tools/adb.exe"
PROJECT_DIR = "C:/Projects/Projects-2026/webtoapp/android-template"
CONFIG_PATH = f"{PROJECT_DIR}/app/src/main/assets/config.json"
PKG_PREFIX = "com.test.feat"

def sanitize_pkg(name):
    """Make test name safe for Android package name (no leading digits)."""
    # Remove leading digits and underscores from each segment
    parts = name.split('_')
    # Strip leading digits from the first part
    cleaned = ''.join(c for c in name if c.isalpha() or c == '_')
    # Remove consecutive underscores and leading/trailing underscores
    while '__' in cleaned:
        cleaned = cleaned.replace('__', '_')
    return cleaned.strip('_')

os.environ["ANDROID_HOME"] = ANDROID_HOME
os.environ["ANDROID_SDK_ROOT"] = ANDROID_HOME

BASE_CONFIG = {
    "app_name": "Test",
    "app_url": "https://www.google.com",
    "app_host": "www.google.com",
    "primary_color": "#2563EB",
    "secondary_color": "#1E40AF",
    "status_bar_color": "#1E3A5F",
    "features": {
        "biometric_auth": False,
        "push_notifications": False,
        "admob": False,
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
        "onboarding_screen": False,
        "app_shortcut": False,
        "secondary_navigation": False,
        "social_login": False,
        "in_app_update": False,
        "background_location": False,
        "facebook_app_events": False,
        "in_app_purchases": False,
        "in_app_review": False,
        "background_service": False,
        "native_contacts": False,
        "appsflyer": False,
        "custom_media_player": False,
        "offer_card": False,
        "intercom": False,
        "dynamic_app_icon": False,
        "bluetooth_connectivity": False,
        "download_file_manager": False,
        "floating_action_menu": False,
        "revenue_cat": False,
        "native_datastore": False,
        "passcode_lock": False,
        "app_auto_launch": False,
        "advanced_bottom_navigation": False,
        "firebase_notification": False,
        "tap_to_pay": False,
    },
    "admob_config": {"app_id": "", "banner_id": "", "interstitial_id": "", "rewarded_id": ""},
    "navigation_items": []
}

# Test scenarios
TESTS = [
    {
        "name": "biometric_only",
        "features": {"biometric_auth": True},
    },
    {
        "name": "screenshot_prevention",
        "features": {"screenshot_prevention": True},
    },
    {
        "name": "offline_mode",
        "features": {"offline_mode": True},
    },
    {
        "name": "deep_linking",
        "features": {"deep_linking": True},
    },
    {
        "name": "js_bridge",
        "features": {"js_bridge": True},
    },
    {
        "name": "qr_scanner",
        "features": {"qr_scanner": True},
    },
    {
        "name": "location_services",
        "features": {"location_services": True},
    },
    {
        "name": "camera_access",
        "features": {"camera_access": True},
    },
    {
        "name": "file_upload",
        "features": {"file_upload": True},
    },
    {
        "name": "custom_user_agent",
        "features": {"custom_user_agent": "TestApp/2.0 Android"},
    },
    {
        "name": "nav_menu_with_items",
        "features": {"navigation_menu": True},
        "navigation_items": [
            {"title": "Home", "url": "https://www.google.com", "icon": "home"},
            {"title": "News", "url": "https://news.google.com", "icon": "news"}
        ]
    },
    {
        "name": "nav_menu_empty_items",
        "features": {"navigation_menu": True},
        "navigation_items": []
    },
    {
        "name": "twa_mode",
        "features": {"twa_mode": True},
    },
    # ---------- New add-on features (build + launch tests) ----------
    {
        "name": "onboarding_screen",
        "features": {"onboarding_screen": True},
    },
    {
        "name": "app_shortcut",
        "features": {"app_shortcut": True},
    },
    {
        "name": "secondary_navigation",
        "features": {"secondary_navigation": True},
    },
    {
        "name": "social_login",
        "features": {"social_login": True},
    },
    {
        "name": "in_app_update",
        "features": {"in_app_update": True},
    },
    {
        "name": "background_location",
        "features": {"background_location": True},
    },
    {
        "name": "facebook_app_events",
        "features": {"facebook_app_events": True},
    },
    {
        "name": "in_app_purchases",
        "features": {"in_app_purchases": True},
    },
    {
        "name": "in_app_review",
        "features": {"in_app_review": True},
    },
    {
        "name": "background_service",
        "features": {"background_service": True},
    },
    {
        "name": "native_contacts",
        "features": {"native_contacts": True},
    },
    {
        "name": "appsflyer",
        "features": {"appsflyer": True},
    },
    {
        "name": "custom_media_player",
        "features": {"custom_media_player": True},
    },
    {
        "name": "offer_card",
        "features": {"offer_card": True},
    },
    {
        "name": "intercom",
        "features": {"intercom": True},
    },
    {
        "name": "dynamic_app_icon",
        "features": {"dynamic_app_icon": True},
    },
    {
        "name": "bluetooth_connectivity",
        "features": {"bluetooth_connectivity": True},
    },
    {
        "name": "download_file_manager",
        "features": {"download_file_manager": True},
    },
    {
        "name": "floating_action_menu",
        "features": {"floating_action_menu": True},
    },
    {
        "name": "revenue_cat",
        "features": {"revenue_cat": True},
    },
    {
        "name": "native_datastore",
        "features": {"native_datastore": True},
    },
    {
        "name": "passcode_lock",
        "features": {"passcode_lock": True},
    },
    {
        "name": "app_auto_launch",
        "features": {"app_auto_launch": True},
    },
    {
        "name": "advanced_bottom_navigation",
        "features": {"advanced_bottom_navigation": True},
    },
    {
        "name": "firebase_notification",
        "features": {"firebase_notification": True},
    },
    {
        "name": "tap_to_pay",
        "features": {"tap_to_pay": True},
    },
    # ---------- Combined tests ----------
    {
        "name": "all_features",
        "features": {
            "biometric_auth": True,
            "deep_linking": True,
            "offline_mode": True,
            "screenshot_prevention": True,
            "file_upload": True,
            "location_services": True,
            "camera_access": True,
            "qr_scanner": True,
            "js_bridge": True,
            "navigation_menu": True,
            "custom_user_agent": "FullTest/1.0",
            "onboarding_screen": True,
            "app_shortcut": True,
            "secondary_navigation": True,
            "social_login": True,
            "in_app_update": True,
            "background_location": True,
            "facebook_app_events": True,
            "in_app_purchases": True,
            "in_app_review": True,
            "background_service": True,
            "native_contacts": True,
            "appsflyer": True,
            "custom_media_player": True,
            "offer_card": True,
            "intercom": True,
            "dynamic_app_icon": True,
            "bluetooth_connectivity": True,
            "download_file_manager": True,
            "floating_action_menu": True,
            "revenue_cat": True,
            "native_datastore": True,
            "passcode_lock": True,
            "app_auto_launch": True,
            "advanced_bottom_navigation": True,
            "firebase_notification": True,
            "tap_to_pay": True,
        },
        "navigation_items": [
            {"title": "Tab1", "url": "https://www.google.com", "icon": "home"},
            {"title": "Tab2", "url": "https://maps.google.com", "icon": "map"},
            {"title": "Tab3", "url": "https://images.google.com", "icon": "image"}
        ]
    },
    {
        "name": "firebase_no_json",
        "features": {"push_notifications": True},
        "extra": {"firebase_config": {"server_key": "fake-key"}}
    },
]


def write_config(test):
    config = json.loads(json.dumps(BASE_CONFIG))
    for k, v in test.get("features", {}).items():
        config["features"][k] = v
    if "navigation_items" in test:
        config["navigation_items"] = test["navigation_items"]
    if "extra" in test:
        config.update(test["extra"])
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)


def build(test_name):
    pkg = f"{PKG_PREFIX}.{sanitize_pkg(test_name)}"
    result = subprocess.run(
        [f"{PROJECT_DIR}/gradlew.bat", "assembleDebug",
         f"-PAPP_NAME={test_name}", "-PAPP_URL=https://www.google.com",
         "-PAPP_HOST=www.google.com", f"-PAPP_PACKAGE_NAME={pkg}",
         "-PPRIMARY_COLOR=#2563EB", "-PSECONDARY_COLOR=#1E40AF",
         "-PSTATUS_BAR_COLOR=#1E3A5F", "--no-daemon"],
        cwd=PROJECT_DIR, capture_output=True, text=True, timeout=600
    )
    return result.returncode == 0, result.stderr[-500:] if result.returncode != 0 else ""


def install_and_test(test_name):
    pkg = f"{PKG_PREFIX}.{sanitize_pkg(test_name)}"
    apk = f"{PROJECT_DIR}/app/build/outputs/apk/debug/app-debug.apk"

    # Uninstall previous
    subprocess.run([ADB, "uninstall", pkg], capture_output=True, timeout=10)

    # Install
    result = subprocess.run([ADB, "install", apk], capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        return False, f"Install failed: {result.stderr}"

    # Clear logcat and launch
    subprocess.run([ADB, "logcat", "-c"], capture_output=True, timeout=5)
    subprocess.run([ADB, "shell", "monkey", "-p", pkg, "-c",
                    "android.intent.category.LAUNCHER", "1"],
                   capture_output=True, timeout=10)

    time.sleep(5)

    # Check for crashes
    result = subprocess.run(
        [ADB, "logcat", "-d"],
        capture_output=True, text=True, timeout=10
    )

    crashes = [l for l in result.stdout.split("\n")
               if "FATAL" in l or ("AndroidRuntime" in l and "Exception" in l)]

    # Cleanup
    subprocess.run([ADB, "uninstall", pkg], capture_output=True, timeout=10)

    if crashes:
        return False, "\n".join(crashes[:5])
    return True, ""


def main():
    results = []
    for i, test in enumerate(TESTS):
        name = test["name"]
        print(f"\n{'='*60}")
        print(f"Test {i+1}/{len(TESTS)}: {name}")
        print(f"{'='*60}")

        # Write config
        write_config(test)

        # Build
        print(f"  Building...", end=" ", flush=True)
        build_ok, build_err = build(name)
        if not build_ok:
            print(f"BUILD FAILED")
            print(f"  Error: {build_err}")
            results.append((name, "BUILD_FAIL", build_err))
            continue
        print(f"OK")

        # Install and test
        print(f"  Installing & launching...", end=" ", flush=True)
        launch_ok, launch_err = install_and_test(name)
        if not launch_ok:
            print(f"CRASH")
            print(f"  Error: {launch_err}")
            results.append((name, "CRASH", launch_err))
        else:
            print(f"OK")
            results.append((name, "PASS", ""))

    # Summary
    print(f"\n{'='*60}")
    print(f"RESULTS SUMMARY")
    print(f"{'='*60}")
    passed = 0
    failed = 0
    for name, status, err in results:
        icon = "PASS" if status == "PASS" else "FAIL"
        print(f"  [{icon}] {name}: {status}")
        if err:
            print(f"         {err[:200]}")
        if status == "PASS":
            passed += 1
        else:
            failed += 1
    print(f"\nTotal: {passed} passed, {failed} failed out of {len(results)}")

    # Restore default config
    with open(CONFIG_PATH, "w") as f:
        json.dump(BASE_CONFIG, f, indent=2)

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
