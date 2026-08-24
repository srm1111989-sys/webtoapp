"""
Local build script: fetches app config from web UI backend, generates config.json,
builds APK locally, and installs on emulator.

Replaces the GitLab CI pipeline for local development/testing.

Usage:
  # Start backend + frontend first:
  #   cd webtoapp && docker compose up db redis -d
  #   cd backend && uvicorn app.main:app --port 8000
  #   cd frontend && npm run dev
  #
  # Then create an app via the wizard at http://localhost:5173/create-app
  # and run this script with the app config ID:

  python local_build.py <app_config_id>              # build + install
  python local_build.py <app_config_id> --run         # build + install + launch
  python local_build.py <app_config_id> --export-only  # just write config.json, no build
  python local_build.py --from-json config.json        # build from a manual config file
  python local_build.py --list                         # list all apps in the backend

Prerequisites:
  - Android SDK at ANDROID_HOME (default: C:/Android/sdk)
  - JDK 17 at JAVA_HOME
  - Emulator running (adb devices)
  - Backend running at http://localhost:8000
"""

import argparse
import json
import os
import subprocess
import sys
import time
import requests

# ── Configuration ─────────────────────────────────────────────────────

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
ANDROID_HOME = os.environ.get("ANDROID_HOME", "C:/Android/sdk")
ADB = f"{ANDROID_HOME}/platform-tools/adb.exe"
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(PROJECT_DIR, "app", "src", "main", "assets", "config.json")
APK_PATH = os.path.join(PROJECT_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk")

os.environ.setdefault("ANDROID_HOME", ANDROID_HOME)
os.environ.setdefault("ANDROID_SDK_ROOT", ANDROID_HOME)


# ── Auth helper ───────────────────────────────────────────────────────

def get_auth_token(email: str, password: str) -> str:
    """Login and return JWT access token."""
    resp = requests.post(f"{BACKEND_URL}/api/auth/login", json={
        "email": email,
        "password": password,
    })
    if resp.status_code != 200:
        print(f"Login failed ({resp.status_code}): {resp.text}")
        sys.exit(1)
    return resp.json()["access_token"]


def get_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Fetch app config from backend ────────────────────────────────────

def list_apps(token: str):
    """List all apps from backend."""
    resp = requests.get(f"{BACKEND_URL}/api/apps/", headers=get_headers(token))
    if resp.status_code != 200:
        print(f"Failed to list apps: {resp.status_code}")
        return
    data = resp.json()
    apps = data.get("apps", [])
    if not apps:
        print("No apps found. Create one via the wizard first.")
        return
    print(f"\n{'ID':<40} {'Name':<25} {'URL':<40}")
    print("-" * 105)
    for app in apps:
        print(f"{app['id']:<40} {app['name']:<25} {app['url']:<40}")
    print(f"\nTotal: {len(apps)} app(s)")
    print(f"\nUsage: python local_build.py <app_id>")


def fetch_app_config(app_id: str, token: str) -> dict:
    """Fetch app config from backend API."""
    resp = requests.get(f"{BACKEND_URL}/api/apps/{app_id}", headers=get_headers(token))
    if resp.status_code != 200:
        print(f"Failed to fetch app config ({resp.status_code}): {resp.text}")
        sys.exit(1)
    return resp.json()


def app_config_to_android_config(app_config: dict) -> dict:
    """Convert backend AppConfig response to Android config.json format.

    This replicates what the CI pipeline does in the prepare stage:
    it takes the pipeline variables and writes config.json.
    """
    from urllib.parse import urlparse

    url = app_config.get("url", "https://example.com")
    domain = urlparse(url).netloc or url

    features = app_config.get("features", {})
    # Local dev = no watermark
    features["show_watermark"] = False

    config = {
        "app_name": app_config.get("name", "TestApp"),
        "app_url": url,
        "app_host": domain,
        "primary_color": app_config.get("primary_color", "#2563EB"),
        "secondary_color": app_config.get("secondary_color", "#1E40AF"),
        "status_bar_color": app_config.get("status_bar_color", "#1E3A5F"),
        "features": features,
        "navigation_items": app_config.get("navigation_items", []),
    }

    # AdMob config
    admob = app_config.get("admob_config")
    if admob and admob.get("app_id"):
        config["admob_config"] = admob

    return config


# ── Build helpers ─────────────────────────────────────────────────────

def write_config(config: dict):
    """Write config.json to Android assets."""
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)
    print(f"Config written to: {CONFIG_PATH}")


def build_apk(app_config: dict = None) -> bool:
    """Build debug APK using Gradle."""
    gradlew = os.path.join(PROJECT_DIR, "gradlew.bat" if os.name == "nt" else "gradlew")

    cmd = [gradlew, "assembleDebug", "--no-daemon"]

    # Pass build properties if we have app config
    if app_config:
        from urllib.parse import urlparse
        url = app_config.get("url", "https://example.com")
        domain = urlparse(url).netloc or url
        pkg = app_config.get("package_name") or f"com.webtoapp.{domain.replace('.', '_').replace('-', '_')}"

        cmd.extend([
            f"-PAPP_NAME={app_config.get('name', 'TestApp')}",
            f"-PAPP_URL={url}",
            f"-PAPP_HOST={domain}",
            f"-PAPP_PACKAGE_NAME={pkg}",
            f"-PPRIMARY_COLOR={app_config.get('primary_color', '#2563EB')}",
            f"-PSECONDARY_COLOR={app_config.get('secondary_color', '#1E40AF')}",
            f"-PSTATUS_BAR_COLOR={app_config.get('status_bar_color', '#1E3A5F')}",
        ])

    print(f"Building APK...")
    result = subprocess.run(cmd, cwd=PROJECT_DIR, timeout=600)
    return result.returncode == 0


def install_apk() -> bool:
    """Install APK on emulator."""
    if not os.path.exists(APK_PATH):
        print(f"APK not found: {APK_PATH}")
        return False

    print(f"Installing APK on emulator...")
    result = subprocess.run([ADB, "install", "-r", APK_PATH],
                          capture_output=True, text=True, timeout=30)
    success = "Success" in result.stdout
    if success:
        print("APK installed successfully")
    else:
        print(f"Install failed: {result.stderr}")
    return success


def launch_app(package_name: str = "com.webtoapp.template"):
    """Launch the app on emulator."""
    print(f"Launching {package_name}...")
    subprocess.run([ADB, "shell", "am", "start", "-n",
                   f"{package_name}/.LauncherActivity"],
                  capture_output=True, timeout=10)
    time.sleep(3)

    # Verify launch
    result = subprocess.run([ADB, "shell", "dumpsys", "window"],
                          capture_output=True, text=True, timeout=10)
    if package_name in result.stdout or "WebViewActivity" in result.stdout:
        print("App launched successfully")
    else:
        print("Warning: app may not have launched correctly")


def check_emulator() -> bool:
    """Check if an emulator is connected."""
    result = subprocess.run([ADB, "devices"], capture_output=True, text=True, timeout=5)
    lines = result.stdout.strip().split("\n")
    devices = [l for l in lines[1:] if l.strip() and "device" in l]
    if not devices:
        print("No emulator/device connected. Start an emulator first:")
        print("  emulator -avd <avd_name>")
        return False
    print(f"Device connected: {devices[0].split()[0]}")
    return True


# ── Main ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Local Android build from web UI config")
    parser.add_argument("app_id", nargs="?", help="App config ID from the web UI")
    parser.add_argument("--run", action="store_true", help="Launch app after install")
    parser.add_argument("--export-only", action="store_true", help="Only write config.json, skip build")
    parser.add_argument("--from-json", help="Build from a local config JSON file instead of API")
    parser.add_argument("--list", action="store_true", help="List all apps from backend")
    parser.add_argument("--email", default="admin@webtoapp.dev", help="Login email")
    parser.add_argument("--password", default="admin123", help="Login password")
    parser.add_argument("--backend", default=BACKEND_URL, help="Backend URL")
    args = parser.parse_args()

    global BACKEND_URL
    BACKEND_URL = args.backend

    # Build from local JSON file
    if args.from_json:
        with open(args.from_json) as f:
            config = json.load(f)
        write_config(config)
        if args.export_only:
            return
        if not check_emulator():
            return
        if build_apk():
            if install_apk() and args.run:
                launch_app()
        else:
            print("BUILD FAILED")
            sys.exit(1)
        return

    # Need auth for API calls
    print(f"Connecting to backend at {BACKEND_URL}...")
    token = get_auth_token(args.email, args.password)
    print("Authenticated")

    # List mode
    if args.list:
        list_apps(token)
        return

    # Need app_id for build
    if not args.app_id:
        print("Usage: python local_build.py <app_config_id>")
        print("       python local_build.py --list")
        sys.exit(1)

    # Fetch config from web UI
    print(f"\nFetching app config: {args.app_id}")
    app_config = fetch_app_config(args.app_id, token)
    print(f"  App: {app_config['name']}")
    print(f"  URL: {app_config['url']}")
    print(f"  Features: {sum(1 for v in app_config.get('features', {}).values() if v is True)} enabled")

    # Convert to Android config.json format
    android_config = app_config_to_android_config(app_config)
    write_config(android_config)

    # Print the generated config for inspection
    print(f"\nGenerated config.json:")
    print(json.dumps(android_config, indent=2))

    if args.export_only:
        print("\n--export-only: skipping build")
        return

    # Build and install
    if not check_emulator():
        sys.exit(1)

    print()
    if build_apk(app_config):
        print("\nBuild SUCCESS")
        if install_apk():
            if args.run:
                launch_app(
                    app_config.get("package_name") or "com.webtoapp.template"
                )
            print("\nDone! Test the app on your emulator.")
        else:
            sys.exit(1)
    else:
        print("\nBUILD FAILED")
        sys.exit(1)


if __name__ == "__main__":
    main()
