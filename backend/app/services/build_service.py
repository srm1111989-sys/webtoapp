import uuid
import json
import logging
from datetime import datetime, timezone
from urllib.parse import urlparse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.build import Build
from app.models.order import Order
from app.models.app_config import AppConfig
from app.services.gitlab_service import GitLabService
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("webtoapp.build")


def build_pipeline_variables(app_config: AppConfig, order: Order, platform: str = "android") -> dict:
    """Convert app config to GitLab CI pipeline variables."""
    domain = urlparse(app_config.url).netloc or app_config.url

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
        "PACKAGE_NAME": app_config.package_name or f"com.webtoapp.{domain.replace('.', '_').replace('-', '_')}",
    }

    if app_config.icon_url:
        variables["ICON_URL"] = app_config.icon_url
    if app_config.splash_url:
        variables["SPLASH_URL"] = app_config.splash_url

    # Feature flags
    features = app_config.features or {}
    variables["FEATURES_JSON"] = json.dumps(features)

    # Firebase
    if app_config.firebase_config:
        variables["FIREBASE_ENABLED"] = "true"
        variables["FIREBASE_CONFIG"] = json.dumps(app_config.firebase_config)

    # AdMob
    if app_config.admob_config:
        variables["ADMOB_ENABLED"] = "true"
        variables["ADMOB_CONFIG"] = json.dumps(app_config.admob_config)

    # Navigation
    if app_config.navigation_items:
        variables["NAVIGATION_ITEMS"] = json.dumps(app_config.navigation_items)

    if app_config.custom_user_agent:
        variables["CUSTOM_USER_AGENT"] = app_config.custom_user_agent

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

    variables = build_pipeline_variables(app_config, order, platform)

    build = Build(
        order_id=order.id,
        platform=platform,
        build_type="exe" if platform == "desktop" else "apk",
        status="pending",
        variables=variables,
    )
    db.add(build)
    await db.flush()

    # Trigger GitLab pipeline
    gitlab = GitLabService(platform=platform)
    try:
        pipeline = gitlab.trigger_pipeline(variables)
        build.pipeline_id = pipeline.get("id")
        build.status = "building"
        build.started_at = datetime.now(timezone.utc)
        logger.info(f"Pipeline {build.pipeline_id} triggered for order {order_id} (platform={platform})")
    except Exception as e:
        build.status = "failed"
        build.error_message = str(e)
        logger.error(f"Failed to trigger pipeline for order {order_id}: {e}")

    await db.flush()
    await db.refresh(build)
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
        build.completed_at = now

        # Download artifacts
        gitlab = GitLabService(platform=build.platform)
        try:
            if build.platform == "desktop":
                # Desktop build: download .exe
                exe_url = await gitlab.download_artifact(
                    pipeline_id,
                    "dist/*.exe",
                    f"builds/{build.order_id}",
                )
                if exe_url:
                    build.exe_url = exe_url
            else:
                # Android build: download .apk and .aab
                apk_url = await gitlab.download_artifact(
                    pipeline_id,
                    "app/build/outputs/apk/release/app-release.apk",
                    f"builds/{build.order_id}",
                )
                if apk_url:
                    build.apk_url = apk_url

                aab_url = await gitlab.download_artifact(
                    pipeline_id,
                    "app/build/outputs/bundle/release/app-release.aab",
                    f"builds/{build.order_id}",
                )
                if aab_url:
                    build.aab_url = aab_url
        except Exception as e:
            logger.error(f"Failed to download artifacts for pipeline {pipeline_id}: {e}")

    elif pipeline_status == "failed":
        build.status = "failed"
        build.completed_at = now
        build.error_message = "Pipeline failed. Check GitLab for details."

    elif pipeline_status == "running":
        build.status = "building"
        if not build.started_at:
            build.started_at = now

    logger.info(f"Build {build.id} updated to {build.status} (pipeline {pipeline_id})")
