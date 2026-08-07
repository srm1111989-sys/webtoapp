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


def _is_artifact_quota_failure(log: str) -> bool:
    """True when a GitHub run 'failed' only because the upload-artifact step hit
    the account's artifact-storage quota — the app actually built fine, so the
    build should be rerouted to another provider, not reported as a failure.
    GitHub emits 'Artifact storage quota has been hit' / 'Failed to CreateArtifact'
    at the Upload step while gradle already reported BUILD SUCCESSFUL."""
    if not log:
        return False
    l = log.lower()
    return (
        "artifact storage quota has been hit" in l
        or "failed to createartifact" in l
        or ("createartifact" in l and "quota" in l)
    )


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


def _generate_app_keystore(app_config: AppConfig) -> tuple[str, str, str]:
    """Generate a UNIQUE Android signing keystore for one app (PKCS12), save it to the
    artifacts store, and return (public_url, password, alias). Pure-Python via
    `cryptography` (the server has no keytool). Each app gets its own random key +
    password so no two apps share a signing identity — this is the fix for the shared
    master-keystore exposure. Once generated it is reused for every future build of the
    app so Play Store updates keep the same signing identity. AGP auto-detects PKCS12,
    which is exactly what modern keytool produces too, so CI signs with it unchanged."""
    import secrets
    import datetime as _dt
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.serialization import pkcs12, BestAvailableEncryption
    from cryptography import x509
    from cryptography.x509.oid import NameOID

    password = secrets.token_urlsafe(24)
    alias = "upload"
    cn = (app_config.name or "WebsiteToApp")[:60]

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, cn)])
    now = _dt.datetime.utcnow()
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(subject)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - _dt.timedelta(days=1))
        # Play requires the signing cert to remain valid far into the future; 30y matches keytool defaults.
        .not_valid_after(now + _dt.timedelta(days=365 * 30))
        .sign(key, hashes.SHA256())
    )
    blob = pkcs12.serialize_key_and_certificates(
        name=alias.encode(),
        key=key,
        cert=cert,
        cas=None,
        encryption_algorithm=BestAvailableEncryption(password.encode()),
    )
    dest = Path("/app/storage/artifacts/keystores/auto")
    dest.mkdir(parents=True, exist_ok=True)
    path = dest / f"{app_config.id}.jks"
    path.write_bytes(blob)
    try:
        os.chmod(path, 0o640)
    except OSError:
        pass
    url = f"{settings.app_url}/api/artifacts/keystores/auto/{app_config.id}.jks"
    logger.info(f"Generated per-app keystore for app {app_config.id} ({cn})")
    return url, password, alias


async def _ensure_app_keystore(app_config: AppConfig, order: Order, db: AsyncSession, platform: str) -> None:
    """Ensure a PAID Android app is signed with its OWN keystore, not the shared master.

    Forward-safe: never re-keys an app that has already shipped a keystore (that would
    break its published Play listing) — those are left on master and logged for manual
    per-app migration. New paid apps get a unique keystore that is persisted and reused
    for all their future builds."""
    if platform != "android":
        return
    is_free = order.amount == 0 and not (order.order_metadata or {}).get("force_premium")
    if is_free:
        return  # free builds don't ship a delivered keystore
    if app_config.custom_keystore_url:
        return  # already has its own keystore (user-uploaded or previously auto-generated)

    # Safety: if this app already delivered a (master-signed) keystore in a past build,
    # it may be published — switching its key now would break Play updates. Keep master.
    prior = await db.execute(
        select(Build.id)
        .join(Order, Build.order_id == Order.id)
        .where(Order.app_config_id == app_config.id, Build.keystore_url.isnot(None))
        .limit(1)
    )
    if prior.first():
        logger.warning(
            f"App {app_config.id} already delivered a master-signed keystore — keeping master to "
            f"preserve its Play signing identity; needs manual per-app keystore migration."
        )
        return

    url, password, alias = _generate_app_keystore(app_config)
    app_config.custom_keystore_url = url
    app_config.custom_keystore_password = password
    app_config.custom_keystore_alias = alias
    app_config.custom_keystore_private_password = password
    db.add(app_config)
    await db.flush()


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

    # Custom notification small-icon (optional): validated here, then carried INSIDE
    # FEATURES_JSON (not a separate CI variable) because GitHub workflow_dispatch caps
    # inputs at 25 and we're already at the limit. CI extracts the URL from FEATURES_JSON,
    # drops it at res/drawable/ic_stat_notification.png; FCMService resolves it at runtime.
    notif_icon_url = None
    if app_config.notification_icon_url:
        candidate = app_config.notification_icon_url.replace("http://localhost:8000", settings.app_url)
        if await _validate_image_url(candidate):
            notif_icon_url = candidate
        else:
            logger.warning(f"Invalid notification icon URL for {app_config.name}: {candidate} — skipping")

    # Feature flags
    features = dict(app_config.features or {})
    features["show_watermark"] = show_watermark
    features["trial_days"] = trial_days
    features["purchase_url"] = purchase_url
    if notif_icon_url:
        features["notification_icon_url"] = notif_icon_url
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
        # The config may be stored either as the raw google-services.json (project_info +
        # client at the top level) OR, as the wizard saves it, wrapped as
        # {"google_services_json": "<json string>", "server_key": ...}. Accept both and
        # always pass the raw google-services.json content to CI (it writes it to
        # app/google-services.json). server_key is legacy/ignored.
        gs = None
        if isinstance(fc, dict):
            if "project_info" in fc and "client" in fc:
                gs = fc
            elif fc.get("google_services_json"):
                raw = fc["google_services_json"]
                try:
                    parsed = json.loads(raw) if isinstance(raw, str) else raw
                    if isinstance(parsed, dict) and "project_info" in parsed and "client" in parsed:
                        gs = parsed
                except (json.JSONDecodeError, TypeError):
                    gs = None
        if gs:
            variables["FIREBASE_ENABLED"] = "true"
            variables["FIREBASE_CONFIG"] = json.dumps(gs)
        else:
            logger.warning(
                f"Skipping Firebase for {app_config.name}: firebase_config has no valid google-services.json "
                f"(missing project_info/client — user likely pasted the web SDK snippet)"
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
        # Trim the credentials: a stray trailing space / non-breaking space pasted
        # into the password or alias makes CI fail signing with a misleading
        # "keystore password was incorrect" at packageRelease (writersplaza.com /
        # WTA-83FADB2F, 2026-08-07 — stored pw was 18 chars incl. a trailing
        # whitespace char; the trimmed value signs fine). Passwords never
        # legitimately begin/end with whitespace.
        _ks_pw = (app_config.custom_keystore_password or "").strip()
        _ks_priv = (app_config.custom_keystore_private_password or "").strip()
        variables["CUSTOM_KEYSTORE_PASSWORD"] = _ks_pw
        variables["CUSTOM_KEYSTORE_ALIAS"] = (app_config.custom_keystore_alias or "upload-key").strip()
        variables["CUSTOM_KEYSTORE_PRIVATE_PASSWORD"] = _ks_priv or _ks_pw
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

    # Give each paid app its own signing keystore (never the shared master) before we
    # compute the pipeline variables, so the existing custom-keystore path picks it up.
    await _ensure_app_keystore(app_config, order, db, platform)

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

    # Idempotency guard. sync_active_builds polls every minute and selects rows
    # still marked "building"; the success path below then spends MINUTES
    # downloading artifacts before anything is committed. The next tick therefore
    # picked up the same row and ran the whole path again — which is why
    # customers received duplicate "ready to download" emails seconds apart
    # (Ali got ~20 for one app and told us to stop). A CI webhook racing the
    # poller causes the same thing. Once a build is terminal, never re-process it.
    if build.status in ("success", "failed"):
        logger.info(
            f"Build {build.id} (pipeline {pipeline_id}) already {build.status} — "
            f"ignoring duplicate {pipeline_status} notification"
        )
        return

    if pipeline_status == "success":
        build.status = "success"
        build.progress = 100
        build.completed_at = now
        # Claim the row BEFORE the slow artifact download so a concurrent poll
        # tick sees a terminal status and skips it.
        await db.commit()

        # Download artifacts and save build log
        provider = (build.variables or {}).get("_build_provider", "gitlab")
        if provider in ("github", "github1"):
            service = GitHubService(platform=build.platform, account=1)
            is_github = True
        elif provider == "github2":
            service = GitHubService(platform=build.platform, account=2)
            is_github = True
        elif provider == "github3":
            service = GitHubService(platform=build.platform, account=3)
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

        # After the artifacts are safely on our server, delete them from GitHub to
        # free the account's ~500 MB artifact storage (otherwise later builds fail
        # at the Upload step on a full account — see the GH-fallback2 quota alert).
        if is_github and (build.apk_url or build.aab_url or build.exe_url):
            try:
                await service.delete_run_artifacts(pipeline_id)
            except Exception as e:
                logger.warning(f"Post-download artifact cleanup failed for pipeline {pipeline_id}: {e}")

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
        # Same reason as the success path: claim the row before the slow log
        # fetch so a concurrent poll tick cannot re-send the failure email.
        await db.commit()

        # Fetch pipeline job logs for failure analysis (same provider routing as the success path)
        provider = (build.variables or {}).get("_build_provider", "gitlab")
        if provider in ("github", "github1"):
            service = GitHubService(platform=build.platform, account=1)
        elif provider == "github2":
            service = GitHubService(platform=build.platform, account=2)
        elif provider == "github3":
            service = GitHubService(platform=build.platform, account=3)
        else:
            service = GitLabService(platform=build.platform)
            
        full_log = await _fetch_pipeline_logs(service, pipeline_id)
        build.log = full_log

        # Self-heal: a GitHub *artifact-storage quota* failure means the app
        # actually built — only the Upload step failed because that account's
        # artifact storage is full. Requeue on a provider we haven't tried yet
        # (mirrors the GitLab ci_quota retry in cron.sync_active_builds), bounded
        # by _failed_providers so we never ping-pong forever. Root cause 2026-07-20:
        # github1 storage filled and silently failed a paid customer build with no
        # reroute — only GitLab quota was self-healed before.
        if provider in ("github", "github1", "github2", "github3") and _is_artifact_quota_failure(full_log):
            v = dict(build.variables or {})
            failed = set(v.get("_failed_providers", []))
            failed.add("github1" if provider == "github" else provider)
            remaining = {"gitlab", "github1", "github2", "github3"} - failed
            if build.platform == "ios":
                remaining -= {"gitlab"}  # iOS never builds on GitLab
            if remaining:
                v["_failed_providers"] = sorted(failed)
                v.pop("_build_provider", None)
                build.variables = v
                build.status = "pending"
                build.pipeline_id = None
                build.started_at = None
                build.completed_at = None
                build.error_message = None
                _save_build_log(str(build.id), full_log)
                logger.warning(
                    f"Build {build.id}: {provider} hit artifact-storage quota (app built OK) — "
                    f"requeuing; remaining providers {sorted(remaining)}"
                )
                logger.info(f"Build {build.id} updated to {build.status} (pipeline {pipeline_id})")
                return
            logger.error(
                f"Build {build.id}: {provider} artifact-storage quota but no untried "
                f"providers left ({sorted(failed)}) — marking failed"
            )

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
