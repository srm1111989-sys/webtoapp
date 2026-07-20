import os
import re
import uuid
import json
import logging
import httpx
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.build import Build
from app.models.order import Order
from app.models.app_config import AppConfig
from app.services.gitlab_service import GitLabService
from app.services.github_service import GitHubService
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("webtoapp.build")

LOG_DIR = Path("/app/logs/builds")
LOG_DIR.mkdir(parents=True, exist_ok=True)


def _save_build_log(build_id: str, content: str, suffix: str = ""):
    """Save build log to persistent file."""
    filename = f"{build_id}{suffix}.log"
    filepath = LOG_DIR / filename
    try:
        filepath.write_text(content, encoding="utf-8")
        logger.info(f"Build log saved: {filepath}")
    except Exception as e:
        logger.error(f"Failed to save build log {filepath}: {e}")


async def _fetch_pipeline_logs(service, pipeline_id: int) -> str:
    """Fetch all job logs from a GitLab/GitHub pipeline."""
    try:
        jobs = service.get_pipeline_jobs(pipeline_id)
        logs = []
        for job in jobs:
            job_name = job.get("name", "unknown")
            job_status = job.get("status", "unknown")
            logs.append(f"=== Job: {job_name} (status: {job_status}) ===")
            try:
                job_log = service.get_job_log(job["id"])
                logs.append(job_log)
            except Exception as e:
                logs.append(f"[Failed to fetch log: {e}]")
            logs.append("")
        return "\n".join(logs)
    except Exception as e:
        logger.error(f"Failed to fetch pipeline logs for {pipeline_id}: {e}")
        return f"[Failed to fetch pipeline logs: {e}]"


async def _validate_image_url(url: str) -> bool:
    """Check if an image URL is reachable and returns a valid image."""
    if not url or not url.startswith("http"):
        return False
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.head(url)
            if resp.status_code != 200:
                return False
            content_type = resp.headers.get("content-type", "")
            if content_type and not any(t in content_type for t in ["image/", "application/octet-stream"]):
                return False
            return True
    except Exception:
        return False


def _sanitize_package_name(raw: str) -> str:
    """Ensure Android package name is valid: lowercase, no leading digits per segment."""
    import re
    # Replace invalid chars with underscore
    name = re.sub(r'[^a-zA-Z0-9._]', '_', raw.lower())
    # Each segment between dots must not start with a digit
    parts = name.split('.')
    sanitized = []
    for part in parts:
        if not part:
            continue
        if part[0].isdigit():
            part = 'app' + part  # Prefix digit-starting segments with 'app'
        sanitized.append(part)
    return '.'.join(sanitized) if sanitized else 'com.webtoapp.app'


async def build_pipeline_variables(app_config: AppConfig, order: Order, platform: str = "android") -> dict:
    """Convert app config to GitLab CI pipeline variables."""
    domain = urlparse(app_config.url).netloc or app_config.url

    # Determine watermark and trial: free plans (amount=0) get watermark + trial.
    # order_metadata.force_premium (set by admin rebuild) overrides — used to grant
    # premium builds for $0 (e.g. share-for-upgrade rewards) without a fake payment.
    is_free = order.amount == 0 and not (order.order_metadata or {}).get("force_premium")
    show_watermark = is_free
    trial_days = 15 if is_free else 0
    purchase_url = f"{settings.app_url}/pricing" if is_free else ""

    variables = {
        "APP_NAME": app_config.name,
        "APP_URL": app_config.url,
        "APP_HOST": domain,
        "PRIMARY_COLOR": app_config.primary_color,
        "SECONDARY_COLOR": app_config.secondary_color,
        "STATUS_BAR_COLOR": app_config.status_bar_color,
        "NAVIGATION_TYPE": app_config.navigation_type,
        "ORDER_ID": str(order.id),
        "PLATFORM": platform,
        "PACKAGE_NAME": _sanitize_package_name(app_config.package_name or f"com.webtoapp.{domain.replace('.', '_').replace('-', '_')}"),
        "VERSION_CODE": str(app_config.version_code) if app_config.version_code else "1",
    }

    if app_config.icon_url:
        # Replace localhost with public app_url — GitLab CI can't reach localhost
        icon_url = app_config.icon_url.replace("http://localhost:8000", settings.app_url)
        icon_valid = await _validate_image_url(icon_url)
        if icon_valid:
            variables["ICON_URL"] = icon_url
        else:
            logger.warning(f"Invalid icon URL for {app_config.name}: {icon_url} — will use default icon")
    if app_config.splash_url:
        splash_url = app_config.splash_url.replace("http://localhost:8000", settings.app_url)
        splash_valid = await _validate_image_url(splash_url)
        if splash_valid:
            variables["SPLASH_URL"] = splash_url
        else:
            logger.warning(f"Invalid splash URL for {app_config.name}: {app_config.splash_url} — skipping")

    # Feature flags
    features = dict(app_config.features or {})
    features["show_watermark"] = show_watermark
    features["trial_days"] = trial_days
    features["purchase_url"] = purchase_url
    # Free apps only: carry the order id so the app can send an anonymous
    # 'app_open' analytics ping and check its paid entitlement at launch
    # (paid apps omit it and never phone home).
    if is_free:
        features["order_id"] = str(order.id)
        features["entitlement_url"] = f"{settings.app_url}/api/apps/entitlement" 
    variables["FEATURES_JSON"] = json.dumps(features)

    # Trial and purchase variables for template
    variables["TRIAL_DAYS"] = str(trial_days)
    variables["PURCHASE_URL"] = purchase_url

    # Firebase — only pass if it's a valid google-services.json (must have project_info + client).
    # Users sometimes paste the Firebase web SDK config object instead; that format is missing
    # project_info and causes processReleaseGoogleServices to fail with "Missing project_info object".
    if app_config.firebase_config:
        fc = app_config.firebase_config
        if isinstance(fc, dict) and "project_info" in fc and "client" in fc:
            variables["FIREBASE_ENABLED"] = "true"
            variables["FIREBASE_CONFIG"] = json.dumps(fc)
        else:
            logger.warning(
                f"Skipping Firebase for {app_config.name}: firebase_config missing project_info/client "
                f"(user likely pasted the web SDK snippet instead of google-services.json)"
            )

    # AdMob
    if app_config.admob_config:
        variables["ADMOB_ENABLED"] = "true"
        variables["ADMOB_CONFIG"] = json.dumps(app_config.admob_config)

    # Navigation
    if app_config.navigation_items:
        variables["NAVIGATION_ITEMS"] = json.dumps(app_config.navigation_items)

    if app_config.custom_user_agent:
        variables["CUSTOM_USER_AGENT"] = app_config.custom_user_agent

    # Custom Keystore Configuration
    if app_config.custom_keystore_url:
        keystore_url = app_config.custom_keystore_url.replace("http://localhost:8000", settings.app_url)
        variables["CUSTOM_KEYSTORE_URL"] = keystore_url
        variables["CUSTOM_KEYSTORE_PASSWORD"] = app_config.custom_keystore_password or ""
        variables["CUSTOM_KEYSTORE_ALIAS"] = app_config.custom_keystore_alias or "upload-key"
        variables["CUSTOM_KEYSTORE_PRIVATE_PASSWORD"] = (
            app_config.custom_keystore_private_password or app_config.custom_keystore_password or ""
        )
    elif not is_free and platform == "android":
        # Paid builds without a custom keystore use the WebToApp master keystore.
        # Guard: dispatching without the keystore provisioned burns the customer's
        # build attempts on a guaranteed CI failure (incident 2026-07-16).
        master_path = Path("/app/storage/artifacts/master/webtoapp-master.jks")
        if not settings.master_keystore_password or not master_path.exists():
            raise RuntimeError(
                "Master keystore not configured (file or MASTER_KEYSTORE_PASSWORD missing) — "
                "cannot sign a paid build. Provision /app/storage/artifacts/master/webtoapp-master.jks "
                "and set MASTER_KEYSTORE_PASSWORD in .env.native."
            )
        variables["CUSTOM_KEYSTORE_URL"] = f"{settings.app_url}/api/artifacts/master/webtoapp-master.jks"
        variables["CUSTOM_KEYSTORE_PASSWORD"] = settings.master_keystore_password
        variables["CUSTOM_KEYSTORE_ALIAS"] = settings.master_keystore_alias
    elif platform == "android":
        # Free builds: auto-generated keystore with fixed standard credentials
        variables["KEYSTORE_PASSWORD"] = "WebToApp2025!"
        variables["KEY_ALIAS"] = "upload-key"

    # Watermark for desktop builds
    variables["SHOW_WATERMARK"] = "true" if show_watermark else "false"

    # Every Android build gets an AAB alongside the APK (policy change
    # 2026-07-13: free plans included — AAB questions were the #1 support
    # driver and the watermark/trial already differentiates free builds).
    if platform == "android":
        variables["BUILD_AAB"] = "true"

    # Desktop-specific variables
    if platform == "desktop":
        dc = app_config.desktop_config or {}
        variables["WINDOW_WIDTH"] = str(dc.get("window_width", 1280))
        variables["WINDOW_HEIGHT"] = str(dc.get("window_height", 800))
        variables["MIN_WIDTH"] = str(dc.get("min_width", 800))
        variables["MIN_HEIGHT"] = str(dc.get("min_height", 600))
        variables["SHOW_TITLE_BAR"] = str(dc.get("show_title_bar", True)).lower()
        variables["SHOW_MENU_BAR"] = str(dc.get("show_menu_bar", False)).lower()
        variables["ENABLE_SYSTEM_TRAY"] = str(dc.get("enable_system_tray", False)).lower()
        variables["START_MAXIMIZED"] = str(dc.get("start_maximized", False)).lower()
        variables["START_FULLSCREEN"] = str(dc.get("start_fullscreen", False)).lower()

    return variables


async def trigger_build(order_id: uuid.UUID, db: AsyncSession, platform: str = "android") -> Build:
    """Trigger a GitLab CI pipeline for the given order."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise ValueError(f"Order {order_id} not found")

    result = await db.execute(select(AppConfig).where(AppConfig.id == order.app_config_id))
    app_config = result.scalar_one_or_none()
    if not app_config:
        raise ValueError(f"App config for order {order_id} not found")

    variables = await build_pipeline_variables(app_config, order, platform)

    build = Build(
        order_id=order.id,
        platform=platform,
        build_type="exe" if platform == "desktop" else "apk",
        status="pending",
        variables=variables,
    )
    db.add(build)
    await db.flush()
    await db.refresh(build)
    
    logger.info(f"Build {build.id} queued (status=pending) for order {order_id} (platform={platform})")
    
    return build


async def handle_build_webhook(pipeline_id: int, pipeline_status: str, payload: dict, db: AsyncSession):
    """Handle GitLab pipeline webhook."""
    result = await db.execute(select(Build).where(Build.pipeline_id == pipeline_id))
    build = result.scalar_one_or_none()
    if not build:
        logger.warning(f"No build found for pipeline {pipeline_id}")
        return

    now = datetime.now(timezone.utc)

    if pipeline_status == "success":
        build.status = "success"
        build.progress = 100
        build.completed_at = now

        # Download artifacts and save build log
        provider = (build.variables or {}).get("_build_provider", "gitlab")
        if provider in ("github", "github1"):
            service = GitHubService(platform=build.platform, account=1)
            is_github = True
        elif provider == "github2":
            service = GitHubService(platform=build.platform, account=2)
            is_github = True
        else:
            service = GitLabService(platform=build.platform)
            is_github = False

        # Save success log for reference
        try:
            full_log = await _fetch_pipeline_logs(service, pipeline_id)
            build.log = full_log
            _save_build_log(str(build.id), full_log)
        except Exception as e:
            logger.warning(f"Could not save success log for build {build.id}: {e}")

        folder = f"builds/{build.order_id}"
        try:
            if build.platform == "desktop":
                exe_url = await service.download_artifact(
                    pipeline_id,
                    "desktop-exe" if is_github else "dist/*.exe",
                    folder,
                )
                if exe_url:
                    build.exe_url = exe_url
            elif build.platform == "ios":
                # iOS is GitHub-only. We ship an unsigned IPA (test in a simulator)
                # plus the full Xcode source so the user can sign & publish under
                # their own Apple account. apk_url reuses the "primary download".
                ipa_url = await service.download_artifact(pipeline_id, "ios-ipa", folder)
                if ipa_url:
                    build.ipa_url = ipa_url
                    build.apk_url = ipa_url  # primary download link in UI/email
                source_url = await service.download_artifact(pipeline_id, "ios-source", folder)
                if source_url:
                    build.source_url = source_url
            else:
                apk_url = await service.download_artifact(
                    pipeline_id,
                    "android-apk" if is_github else "app/build/outputs/apk/release/app-release.apk",
                    folder,
                )
                if apk_url:
                    build.apk_url = apk_url

                aab_url = await service.download_artifact(
                    pipeline_id,
                    "android-aab" if is_github else "app/build/outputs/bundle/release/app-release.aab",
                    folder,
                )
                if aab_url:
                    build.aab_url = aab_url

                result = await db.execute(select(Order).where(Order.id == build.order_id))
                order = result.scalar_one_or_none()
                is_free = order and order.amount == 0 and not (order.order_metadata or {}).get("force_premium")
                if not is_free:
                    keystore_url = await service.download_artifact(
                        pipeline_id,
                        "keystore" if is_github else "keystore.jks",
                        folder,
                    )
                    if keystore_url:
                        build.keystore_url = keystore_url
        except Exception as e:
            logger.error(f"Failed to download artifacts for pipeline {pipeline_id}: {e}")

        # Mark app as active and send build completion email
        try:
            from app.utils.email import send_build_complete_email
            result = await db.execute(select(Order).where(Order.id == build.order_id))
            order = result.scalar_one_or_none()
            if order:
                from app.models.user import User
                from app.models.app_config import AppConfig as AC
                user_result = await db.execute(select(User).where(User.id == order.user_id))
                user = user_result.scalar_one_or_none()
                app_result = await db.execute(select(AC).where(AC.id == order.app_config_id))
                app = app_result.scalar_one_or_none()
                if app:
                    app.status = "active"
                if user and app:
                    def _pub(url: str | None) -> str:
                        if not url:
                            return ""
                        return url.replace("http://localhost:8000", settings.app_url)
                    download_url = _pub(build.apk_url or build.exe_url) or f"{settings.app_url}/apps"
                    platform_name = "Desktop" if build.platform == "desktop" else "Android"
                    send_build_complete_email(
                        user.email, app.name, order.order_number, download_url, platform_name,
                        aab_url=_pub(build.aab_url), keystore_url=_pub(build.keystore_url),
                    )
                    logger.info(f"Build complete email sent to {user.email} for {app.name}")
        except Exception as e:
            logger.warning(f"Failed to send build complete email: {e}")

    elif pipeline_status == "failed":
        build.status = "failed"
        build.progress = 0
        build.completed_at = now

        # Fetch pipeline job logs for failure analysis (same provider routing as the success path)
        provider = (build.variables or {}).get("_build_provider", "gitlab")
        if provider in ("github", "github1"):
            service = GitHubService(platform=build.platform, account=1)
        elif provider == "github2":
            service = GitHubService(platform=build.platform, account=2)
        else:
            service = GitLabService(platform=build.platform)
            
        full_log = await _fetch_pipeline_logs(service, pipeline_id)
        build.log = full_log

        # Extract error summary from log, stripping internal CI references
        _ci_skip = re.compile(
            r'github\.com|gitlab\.com|gitHub|gitLab|pipeline|workflow|actions/'
            r'|runner|job\s+#\d+|artifact|token|glpat-|github_pat_',
            re.IGNORECASE,
        )
        error_lines = []
        for line in full_log.split("\n"):
            ll = line.lower()
            if any(kw in ll for kw in ["error:", "fatal:", "failure", "exception", "failed"]):
                cleaned = line.strip()
                if not _ci_skip.search(cleaned):
                    error_lines.append(cleaned)
        if error_lines:
            build.error_message = "\n".join(error_lines[-10:])
        else:
            build.error_message = "Build failed. Please contact support@websitetoapp.app with your order number."

        # Save log to persistent file
        _save_build_log(str(build.id), full_log)
        logger.info(f"Build {build.id} failed — log saved ({len(full_log)} chars)")

        # NO customer email on failure (operator decision 2026-07-20): failed
        # builds are auto-requeued on fallback CI providers and almost always
        # succeed minutes later — customers were getting a scary raw-CI-error
        # mail followed by "your app is ready" (Lovasecond, 07-19). Failures
        # stay visible internally via logs + the admin failed_builds check;
        # terminal cases are handled by support with the saved build log.
        logger.info(f"Build {build.id} failed — customer email suppressed (auto-requeue expected)")

    elif pipeline_status == "running":
        build.status = "building"
        if not build.started_at:
            build.started_at = now

        # Calculate progress based on pipeline duration (estimated 5 minutes total)
        # Progress: 10% (started) -> 90% (running) based on elapsed time
        if build.started_at:
            elapsed = (now - build.started_at).total_seconds()
            estimated_total = 300  # 5 minutes
            progress = min(10 + int((elapsed / estimated_total) * 80), 90)
            build.progress = progress
        else:
            build.progress = 10

    logger.info(f"Build {build.id} updated to {build.status} (pipeline {pipeline_id})")
